"""NextPass intro jingle: an original, upbeat-but-easy tune synthesised from scratch (no samples).
Writes audio/intro-jingle.mp3 (and a .wav in /tmp), timed to the intro video (intro.js): a soft arpeggio with the logo,
a light groove under the tour, a quiet chime at each new part, and a final chord on the end card.
Run: python3 tools/jingle.py  (needs numpy, scipy and ffmpeg)"""
import numpy as np, wave, os, subprocess
from scipy.signal import lfilter

SR = 44100
DUR = 42.6                                   # INTRO_DURATION in intro.js
SCENES = [0, 4.6, 11.4, 18.2, 24.6, 31.0, 37.8]
BPM = 98; BEAT = 60 / BPM; BAR = BEAT * 4
GROOVE_FROM = 2.45                           # the beat comes in after the opening
END = SCENES[-1]
N = int(SR * DUR)
mix = np.zeros((N, 2))
rng = np.random.default_rng(7)

def note_hz(n):                              # MIDI note number -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)

def env(n, a=.005, d=.1, s=.6, r=.12, length=None):
    length = length or n / SR
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((length - t) / r, 0, 1)
    return e * rel

def lowpass(x, cutoff):
    # simple one-pole low-pass, good enough to soften saw/square tones
    a = np.exp(-2 * np.pi * cutoff / SR)
    return lfilter([1 - a], [1, -a], x)

def put(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i:i + len(sig), 0] += sig * l * 1.41
    mix[i:i + len(sig), 1] += sig * r * 1.41

def tone(n, length, kind="pluck"):
    m = int(SR * length); t = np.arange(m) / SR; f = note_hz(n)
    if kind == "pluck":       # bright, short synth pluck
        x = 2 * ((t * f) % 1) - 1
        x = lowpass(x, 2600) * env(m, .003, .18, .0, .05, length)
    elif kind == "keys":      # soft electric-piano tone: rounded attack, gentle decay
        x = np.sin(2 * np.pi * f * t) + .22 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + .05 * np.sin(6 * np.pi * f * t) * np.exp(-t * 6)
        x = lowpass(x, 3000) * np.exp(-t * 1.6) * env(m, .012, .1, 1, .25, length)
    elif kind == "bell":      # soft FM bell for the chimes
        mod = np.sin(2 * np.pi * f * 2 * t) * .7 * np.exp(-t * 5)
        x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 3.2) * env(m, .002, .05, 1, .08, length)
    elif kind == "bass":
        x = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) + .12 * (2 * ((t * f) % 1) - 1)
        x = x * env(m, .004, .12, .55, .05, length)
    elif kind == "pad":
        x = sum(np.sin(2 * np.pi * f * (1 + d) * t) for d in (-.004, 0, .004)) / 3
        x = lowpass(x + .3 * (2 * ((t * f) % 1) - 1), 1500) * env(m, .35, .3, .8, .6, length)
    return x

def kick(gain=1):
    m = int(SR * .32); t = np.arange(m) / SR
    f = 48 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * gain

def clap(gain=1):
    m = int(SR * .22); t = np.arange(m) / SR
    n = rng.standard_normal(m); n = n - lowpass(n, 900)
    burst = np.exp(-t * 26) + .5 * np.exp(-np.maximum(t - .012, 0) * 30) * (t > .012)
    return n * burst * .5 * gain

def hat(gain=1, open_=False):
    m = int(SR * (.16 if open_ else .05)); t = np.arange(m) / SR
    n = rng.standard_normal(m); n = n - lowpass(n, 6000)
    return n * np.exp(-t * (18 if open_ else 70)) * .22 * gain

def snap():          # a soft finger-snap / rim sound
    m = int(SR * .12); t = np.arange(m) / SR
    n = rng.standard_normal(m); n = lowpass(n - lowpass(n, 1800), 7000)
    return (n * np.exp(-t * 45) * .5 + .25 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60))

def shaker(gain=1):  # a gentle shaker on the eighths
    m = int(SR * .09); t = np.arange(m) / SR
    n = rng.standard_normal(m); n = lowpass(n - lowpass(n, 4000), 9000)
    e = np.minimum(t / .012, 1) * np.exp(-t * 38)
    return n * e * .2 * gain

# a warm progression: Cmaj7 – Am7 – Fmaj7 – G (one bar each), as MIDI notes
CHORDS = [(48, 55, 64, 71), (45, 52, 60, 67), (41, 48, 57, 64), (43, 50, 60, 62)]
ROOTS = [36, 33, 29, 31]
# an original, bouncy melody over 4 bars (beat offset, MIDI note, length in beats)
MELODY = [(0, 72, .5), (.5, 74, .5), (1, 76, 1), (2.5, 79, .5), (3, 76, 1),
          (4, 74, .5), (4.5, 76, .5), (5, 77, .5), (5.5, 76, .5), (6, 74, 1.5),
          (8, 72, .5), (8.5, 74, .5), (9, 76, 1), (10.5, 79, .5), (11, 81, 1),
          (12, 79, .5), (12.5, 77, .5), (13, 76, .5), (13.5, 74, .5), (14, 72, 1.5)]

# 1) opening: a slow, soft arpeggio as the logo appears
for i, n in enumerate([60, 64, 67, 71, 72]):
    put(tone(n, 2.6, "keys"), .25 + i * .32, pan=-.2 + i * .1, gain=.2)
put(sum(tone(n, 3.4, "pad") for n in (48, 55, 64, 71)), 0.0, gain=.07)

# 2) the bed under the tour: pad, syncopated keys, a walking bass and a light, soft beat
t0 = GROOVE_FROM
bar = 0
while t0 + bar * BAR < END - .1:
    start = t0 + bar * BAR
    ch, root = CHORDS[bar % 4], ROOTS[bar % 4]
    left = min(BAR, END - start)
    put(sum(tone(n, left + .4, "pad") for n in ch), start, gain=.045)
    # bass: root, root, fifth, octave on a gentle syncopation
    for ob, iv, ln in [(0, 0, 1.2), (1.5, 0, .45), (2, 7, .9), (3, 12, .45), (3.5, 7, .45)]:
        tb = start + ob * BEAT
        if tb < END - .1: put(tone(root + 12 + iv, ln * BEAT, "bass"), tb, gain=.19)
    for b in range(4):
        tb = start + b * BEAT
        if tb >= END - .1: break
        if b in (0, 2): put(kick(.55 if b == 0 else .4), tb, gain=.3)
        if b in (1, 3): put(snap(), tb, pan=.08, gain=.16)
        for e in range(2): put(shaker(1 if e else .6), tb + e * BEAT / 2, pan=.3, gain=.11)
    # keys: soft chord stabs on the "and" of each beat
    for ob in (.5, 1.5, 2.5, 3.25):
        tb = start + ob * BEAT
        if tb < END - .15:
            for k, n in enumerate(ch[1:]):
                put(tone(n + 12, BEAT * .7, "keys"), tb + k * .005, pan=-.25 + k * .25, gain=.05)
    if 1 <= bar <= 4 or 7 <= bar <= 10 or 12 <= bar <= 13:  # melody, with a little space between phrases
        k = (bar - 1) if bar <= 4 else (bar - 7) if bar <= 10 else (bar - 12)
        for ob, n, ln in MELODY:
            tm = start + ob * BEAT - k * BAR
            if start <= tm < start + BAR and tm < END - .3:
                put(tone(n, ln * BEAT + .4, "keys"), tm, pan=.1, gain=.14)
    bar += 1

# 3) a quiet single chime as each new part of the tour starts
for i, s0 in enumerate(SCENES[1:-1]):
    put(tone(84 if i % 2 == 0 else 83, 1.6, "bell"), s0, pan=.3 if i % 2 else -.3, gain=.035)

# 4) the end card: a warm final chord and a slow rising arpeggio, then a long fade
put(kick(.6), END, gain=.25)
put(sum(tone(n, 4.8, "pad") for n in (48, 55, 64, 67, 72)), END, gain=.075)
put(tone(36, 3.5, "bass"), END, gain=.24)
for i, n in enumerate([60, 64, 67, 72]):
    put(tone(n, 3.6, "keys"), END + .15 + i * .3, pan=-.2 + i * .13, gain=.17)

# master: gentle compression, fade out, normalise to -1 dBFS
fade = np.clip((DUR - np.arange(N) / SR) / 2.5, 0, 1)
mix *= fade[:, None]
mix *= 10 ** (-3 / 20) / np.max(np.abs(mix))
out = os.path.join(os.path.dirname(__file__), "..", "audio")
os.makedirs(out, exist_ok=True)
wav = "/tmp/intro-jingle.wav"
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
mp3 = os.path.normpath(os.path.join(out, "intro-jingle.mp3"))
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "128k", mp3], check=True)
print("wrote", mp3, f"{DUR}s (and {wav} for video editing)")
