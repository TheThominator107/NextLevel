"""NextPass intro jingle: an original upbeat tune, synthesised from scratch (no samples).
Writes audio/intro-jingle.mp3 (and a .wav in /tmp), timed to the intro video (intro.js): a rising sting with the logo,
a light groove under the tour, a soft chime at each new part, and a final cadence on the end card.
Run: python3 tools/jingle.py  (needs numpy, scipy and ffmpeg)"""
import numpy as np, wave, os, subprocess
from scipy.signal import lfilter

SR = 44100
DUR = 42.6                                   # INTRO_DURATION in intro.js
SCENES = [0, 4.6, 11.4, 18.2, 24.6, 31.0, 37.8]
BPM = 116; BEAT = 60 / BPM; BAR = BEAT * 4
GROOVE_FROM = 2 * BEAT * 2                   # drums enter after the sting
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
    elif kind == "bell":      # soft FM bell for the melody and chimes
        mod = np.sin(2 * np.pi * f * 3.5 * t) * 1.6 * np.exp(-t * 6)
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

# chords: C – G – Am – F (one bar each), as MIDI notes
CHORDS = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]
ROOTS = [36, 43, 45, 41]
# an original 4-bar melody (beat offset, MIDI note, length in beats)
MELODY = [(0, 72, .5), (.5, 74, .5), (1, 76, 1), (2, 79, .5), (2.5, 76, 1.5),
          (4, 74, .5), (4.5, 76, .5), (5, 79, 1), (6, 81, .75), (6.75, 79, 1.25),
          (8, 76, .5), (8.5, 77, .5), (9, 76, .5), (9.5, 74, .5), (10, 72, 1), (11, 76, 1),
          (12, 74, .5), (12.5, 72, .5), (13, 74, 1), (14, 79, 2)]

# 1) the sting: rising arpeggio as the logo pops in
for i, n in enumerate([60, 64, 67, 72, 76]):
    put(tone(n, 1.4, "bell"), .18 + i * .13, pan=-.3 + i * .15, gain=.34)
put(tone(48, 2.2, "pad") + tone(55, 2.2, "pad") + tone(64, 2.2, "pad"), 0.0, gain=.12)

# 2) the groove under the tour
t0 = GROOVE_FROM
bar = 0
while t0 + bar * BAR < END - .05:
    start = t0 + bar * BAR
    ch, root = CHORDS[bar % 4], ROOTS[bar % 4]
    for b in range(4):
        tb = start + b * BEAT
        if tb >= END - .05: break
        put(kick(.8 if b % 2 == 0 else .45), tb, gain=.5)
        if b % 2 == 1: put(clap(), tb, pan=.05, gain=.42)
        put(hat(), tb + BEAT / 2, pan=.35, gain=.3)
        for e in range(2):                               # bass on eighths
            te = tb + e * BEAT / 2
            if te < END - .05: put(tone(root + (12 if e and b == 3 else 0), BEAT / 2 * .9, "bass"), te, gain=.32)
        for k, n in enumerate(ch):                       # offbeat chord plucks
            put(tone(n + 12, .3, "pluck"), tb + BEAT / 2 + k * .006, pan=-.25 + k * .25, gain=.075)
    if bar % 8 in (0, 1, 2, 3) and bar < 14:             # melody, then a breather
        for ob, n, ln in MELODY:
            tm = start + ob * BEAT - (bar % 4) * BAR
            if start <= tm < start + BAR and tm < END - .3:
                put(tone(n, ln * BEAT * 1.1 + .2, "bell"), tm, pan=.1, gain=.15)
    bar += 1

# 3) a soft chime as each new part of the tour starts
for i, s in enumerate(SCENES[1:-1]):
    for k, n in enumerate([84, 88]):
        put(tone(n + (2 if i % 2 else 0), .9, "bell"), s + k * .07, pan=.4 - k * .8, gain=.1)

# 4) the end card: a little drum fill, then the cadence and the sting again
for k in range(4):
    put(clap(.6 + k * .15), END - .5 + k * .12, gain=.3)
put(kick(1), END, gain=.6)
for n in (48, 55, 60, 64, 67):
    put(tone(n, 4.2, "pad"), END, gain=.11)
put(tone(36, 1.6, "bass"), END, gain=.38)
for i, n in enumerate([67, 72, 76, 79, 84]):
    put(tone(n, 2.6, "bell"), END + .1 + i * .11, pan=-.3 + i * .15, gain=.26)

# master: gentle compression, fade out, normalise to -1 dBFS
fade = np.clip((DUR - np.arange(N) / SR) / 1.6, 0, 1)
mix *= fade[:, None]
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
mix *= 10 ** (-1.5 / 20) / np.max(np.abs(mix))
out = os.path.join(os.path.dirname(__file__), "..", "audio")
os.makedirs(out, exist_ok=True)
wav = "/tmp/intro-jingle.wav"
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
mp3 = os.path.normpath(os.path.join(out, "intro-jingle.mp3"))
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "128k", mp3], check=True)
print("wrote", mp3, f"{DUR}s (and {wav} for video editing)")
