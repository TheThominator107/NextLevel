/* NextPass team drill library (rebuilt Nov 2026, 128 drills): academy-style practices for a coach to run with a team.
   These are well-known coaching games, written up in our own words, with a note on the
   publicly documented method each one comes from. They are not any club's own curriculum. */

/* the methods behind the drills, as published by the clubs and federations that use them */
export const METHODS = {
  rondo: {name:"Rondo", from:"A keep-away game that Johan Cruyff made central to training at FC Barcelona, carrying over Ajax's possession-based methods. It is still a daily staple at both academies. Cruyff said everything in a match except shooting can be practised in a rondo."},
  tips: {name:"Ajax TIPS", from:"Ajax's academy assesses and develops players on four qualities: Technique, Insight, Personality and Speed (including speed of thought). Drills here are tagged with the qualities they train."},
  positional: {name:"Positional play", from:"Possession games with fixed zones and neutral players, in the style of the juego de posición developed at Barcelona and Ajax. Players learn to create passing angles and find the free player."},
  dutch4v4: {name:"Dutch 4v4", from:"The KNVB (Dutch federation) has built youth development around 4v4 games since the 1980s, from ideas led by Rinus Michels: small teams, lots of touches, and the game as the teacher."},
  funino: {name:"Funino", from:"A 3v3 game on four small goals created by German coach Horst Wein, now piloted by the German federation (DFB). It rewards switching play and quick decisions."},
  fifa11: {name:"FIFA 11+", from:"A 20-minute injury prevention warm-up developed by FIFA's medical research centre (F-MARC): running, strength and balance, then speed and cutting. Studies found fewer injuries in teams that used it regularly. Designed for ages 14+, it works for younger players at the easier level."},
  ppp: {name:"Play-Practice-Play", from:"U.S. Soccer's grassroots session model: players start by playing a game, then practise a focused activity, then play a game again to use what they learned."},
  wave: {name:"Overload attacks", from:"Attacking waves with more attackers than defenders (2v1, 3v2) are used by academies across Europe to teach when to pass and when to dribble."},
  pressing: {name:"Pressing & counter-pressing", from:"Pressing as a unit and winning the ball back straight after losing it, popularised in Germany as Gegenpressing and used across modern academies."},
  finishing: {name:"Finishing patterns", from:"Combination play ending in a shot, so strikers practise finishing at match speed after a pass, not from a standing ball."},
  play: {name:"Playground games", from:"Simple games where every child has a ball and gets lots of touches without waiting in lines, the approach recommended by grassroots programmes from the KNVB to U.S. Soccer."},
  setpieces: {name:"Set-piece practice", from:"A large share of goals at every level come from set pieces, so professional and academy teams rehearse who runs where and who marks whom."},
  conditioning: {name:"Fitness with the ball", from:"Short, intense small-sided games are widely used by academies to build match fitness with the ball, so players train fitness and decisions together instead of running laps."},
  defending: {name:"Defending principles", from:"The classic principles taught by most federations: pressure, cover and balance. The nearest player presses and the next covers behind."}
};

export const PHASES = ["Warm-up","Technical","Possession","Finishing","Defending","Transition","Game","Cool-down"];
export const PHASE_NOTE = {
  "Warm-up":"Gets bodies ready and touches on the ball. 10 to 20 minutes.",
  "Technical":"Unopposed or lightly opposed technique: passing patterns, receiving, finishing.",
  "Possession":"Keep the ball under pressure: rondos and positional games.",
  "Finishing":"Every practice that ends in a shot on goal: finishing patterns, overloads, crossing, counter-attacks and games built around scoring.",
  "Defending":"Pressure, cover and balance; 1v1 and small-group defending.",
  "Transition":"The moments just after the ball changes team: counter-attacks and counter-pressing.",
  "Game":"A small-sided or full game with a condition that brings out the session's focus.",
  "Cool-down":"Easy movement, stretching and a short chat about what the team learned."
};

/* d(...) makes a drill. diagram: {w, h, items}; coordinates in yards, x across, y down.
   items: ["A",x,y] attacker, ["D",x,y] defender, ["N",x,y] neutral, ["K",x,y] keeper, ["b",x,y] ball, ["c",x,y] cone,
   ["mg",x,y,"h"|"v"] mini goal, ["G",x,y,"top"|"bottom"] full goal, ["z",x,y,w,h] zone line,
   ["p",x1,y1,x2,y2] pass, ["r",x1,y1,x2,y2,bend] run, ["d",x1,y1,x2,y2] dribble, ["s",x1,y1,x2,y2] shot */
const D = [];
function d(o){ D.push(o); }

/* ---------------- warm-ups ---------------- */
d({id:"t-dynamic-warmup", title:"Dynamic warm-up lines", phase:"Warm-up", level:"Beginner", minutes:10, minAge:6, players:"Whole team", area:"20 × 5 yd lanes", equipment:"10 cones",
  skills:["physicality","handling_speed"], tips:["S"], method:"fifa11",
  summary:"Moving warm-up in lanes that gets every muscle ready before the ball comes out.",
  setup:"Two rows of 5 cones, 20 yards long and 5 yards apart. Players line up in pairs at one end.",
  how:["Jog to the far cone and back.","Then high knees, heel flicks, side shuffles both ways and backward jogging.","Then walking lunges, leg swings to open and close the hip, and skips for height.","Finish with two build-up runs: half speed, then three-quarter speed."],
  points:["Land softly on the balls of your feet.","Arms drive in rhythm with the legs.","Keep it quality, not a race: the aim is to get warm."],
  progress:"Add a ball for each pair: pass across the lanes between movements.",
  regress:"Fewer movements, and walk back between each one.",
  diagram:{w:24, h:9, items:[["c",2,2],["c",7,2],["c",12,2],["c",17,2],["c",22,2],["c",2,7],["c",7,7],["c",12,7],["c",17,7],["c",22,7],["A",3,2],["A",3,7],["r",4,2,21,2,0],["r",4,7,21,7,0]]}});

d({id:"t-gates-dribble", title:"Dribble through the gates", phase:"Warm-up", level:"Beginner", minutes:10, minAge:6, players:"Whole team, a ball each", area:"20 × 20 yd", equipment:"16 cones, a ball each",
  skills:["dribbling","first_touch"], tips:["T"], method:"play",
  summary:"Everyone dribbles at once, finding open gates: lots of touches, heads up.",
  setup:"Scatter 8 gates, 2 yards wide, around a 20-yard square. Every player has a ball.",
  how:["Players dribble through as many gates as they can in 60 seconds.","They can't go through the same gate twice in a row.","On the coach's call, switch to only the left foot, then only the right foot.","Count gates and try to beat your score."],
  points:["Look up to find the next open gate before you get there.","Small touches in traffic, big touches into space.","Use both feet and every surface."],
  progress:"Add two defenders without a ball who can close gates by standing in them.",
  regress:"Bigger gates and a slower count.",
  diagram:{w:20, h:20, items:[["c",3,4],["c",5,4],["c",12,3],["c",12,5],["c",16,10],["c",18,10],["c",4,15],["c",6,15],["c",11,16],["c",11,18],["A",8,8],["A",14,13],["A",7,12],["b",9,8.6],["b",15,13.6],["d",8,8,4,4.2]]}});

d({id:"t-sharks", title:"Sharks and minnows", phase:"Warm-up", level:"Beginner", minutes:10, minAge:6, players:"8 to 16", area:"25 × 20 yd", equipment:"4 cones, a ball for most players, bibs",
  skills:["dribbling","physicality"], tips:["T","S"], method:"play",
  summary:"Minnows dribble across the pond while sharks try to kick their balls out.",
  setup:"A 25 × 20 yard pond. All minnows start on one end line with a ball. Two sharks without a ball start in the middle.",
  how:["On the coach's call, minnows dribble across to the far end line.","Sharks try to win a ball and kick it out of the area.","A minnow who loses the ball becomes a shark.","Play until two or three minnows are left; they are the winners."],
  points:["Keep the ball close when a shark is near, push it into space when the way is clear.","Shield the ball with your body.","Change speed and direction to get past."],
  progress:"Minnows must stop the ball on the far line with the sole.",
  regress:"One shark only, or a wider pond.",
  diagram:{w:25, h:20, items:[["A",4,1.5],["A",10,1.5],["A",16,1.5],["A",21,1.5],["b",4,2.6],["b",10,2.6],["b",16,2.6],["b",21,2.6],["D",9,10],["D",16,11],["d",10,2.6,12,17],["d",21,2.6,22,17]]}});

d({id:"t-red-light", title:"Red light, green light", phase:"Warm-up", level:"Beginner", minutes:8, minAge:5, players:"Whole team, a ball each", area:"20 × 15 yd", equipment:"4 cones, a ball each",
  skills:["dribbling","first_touch"], tips:["T"], method:"play",
  summary:"Dribble on green, stop the ball dead on red: close control and listening.",
  setup:"A 20 × 15 yard area. Players start on one end line with a ball. The coach stands at the far end.",
  how:["Green: dribble toward the coach.","Red: stop the ball with the sole, foot on top.","Yellow: dribble slowly with small touches.","Anyone whose ball is still moving on red goes back five steps. First to reach the coach wins."],
  points:["Keep the ball within a step so you can stop it quickly.","Sole on top of the ball to stop.","Eyes up to see the coach's signal."],
  progress:"Add colours for skills: blue for a turn, purple for a step-over.",
  regress:"Walk instead of jog on green.",
  diagram:{w:20, h:15, items:[["N",10,14],["A",3,1.5],["A",8,1.5],["A",13,1.5],["A",17,1.5],["b",3,2.6],["b",8,2.6],["b",13,2.6],["b",17,2.6],["d",8,2.6,9,9]]}});

d({id:"t-four-corner", title:"Four-corner passing", phase:"Warm-up", level:"Beginner", minutes:12, minAge:8, players:"8 to 12", area:"15 × 15 yd", equipment:"4 cones, 2 balls",
  skills:["passing","first_touch","communication"], tips:["T"], method:"tips",
  summary:"Pass and follow round a square: crisp passes, receiving on the move and talking.",
  setup:"A cone at each corner of a 15-yard square with 2 or 3 players at each. Two balls start at opposite corners.",
  how:["Pass to the next corner clockwise and follow your pass.","The receiver takes a touch out of their feet and passes on.","After 2 minutes, switch to anticlockwise so both feet work.","Then add a one-two with the next corner before passing on."],
  points:["Call the receiver's name before you pass.","Open your body and take the first touch toward the next corner.","Pass firmly along the ground to the receiver's front foot."],
  progress:"One touch, or add a third ball.",
  regress:"A smaller square and two touches.",
  diagram:{w:18, h:18, items:[["c",2,2],["c",16,2],["c",16,16],["c",2,16],["A",2,2],["A",16,2],["A",16,16],["A",2,16],["b",2.9,2.6],["b",15.1,15.4],["p",2,2,16,2],["p",16,16,2,16],["r",3,3,15,3,0.2]]}});

d({id:"t-rondo-4v1", title:"Rondo 4v1", phase:"Warm-up", level:"Beginner", minutes:10, minAge:8, players:"5 per grid", area:"8 × 8 yd", equipment:"4 cones, 1 ball, bibs",
  skills:["passing","first_touch","positional_awareness"], tips:["T","I"], method:"rondo",
  summary:"Four keep the ball from one: the first rondo every player should learn.",
  setup:"An 8-yard square with one attacker on each side and one defender in the middle.",
  how:["Attackers pass around and across the square, moving along their side.","The defender tries to touch the ball.","If the defender touches it, the player who lost it swaps in.","Ten passes in a row scores a point."],
  points:["Move along your side so the passer always has two options.","Open your body to see the next pass before the ball arrives.","Pass to the foot away from the defender."],
  progress:"Two touches, then one touch.",
  regress:"3v1 in a bigger square with free touches.",
  diagram:{w:10, h:10, items:[["c",1,1],["c",9,1],["c",1,9],["c",9,9],["A",5,1],["A",9,5],["A",5,9],["A",1,5],["D",5.6,4.6],["b",5.5,1.7],["p",5,1,9,5],["p",9,5,1,5]]}});

d({id:"t-fifa11", title:"Injury-prevention warm-up", phase:"Warm-up", level:"Intermediate", minutes:15, minAge:10, players:"Any number", area:"Two lines of 6 cones, 10 yd long", equipment:"12 cones",
  skills:["physicality","separation_speed"], tips:["S"], method:"fifa11",
  summary:"Running, strength and balance work based on FIFA 11+ to cut down knee and ankle injuries.",
  setup:"Two parallel lines of 6 cones, 10 yards long and 5 yards apart. Players work in pairs, one in each lane.",
  how:["Running: straight, hip out, hip in, around a partner, shoulder contact, quick forward and back.","Strength and balance: plank, side plank, Nordic lean, single-leg stance passing a ball, squats.","Plyometrics: jumps across the lane, lateral hops, box jumps on the spot.","Running again: across the pitch at 75 % and with bounding and plant-and-cut."],
  points:["Knees over the toes on every landing; they never fall inward.","Land softly and quietly.","Do it twice a week and it works: it's a habit, not a one-off."],
  progress:"Harder levels: single-leg squats, partner-pushed balance.",
  regress:"Fewer exercises and more rest between sets.",
  diagram:{w:14, h:9, items:[["c",2,2],["c",4,2],["c",6,2],["c",8,2],["c",10,2],["c",12,2],["c",2,7],["c",4,7],["c",6,7],["c",8,7],["c",10,7],["c",12,7],["A",1,2],["A",1,7],["r",2,2.8,12,2.8,0.2],["r",2,6.2,12,6.2,-0.2]]}});

d({id:"t-partner-technique", title:"Partner technique series", phase:"Warm-up", level:"Intermediate", minutes:12, minAge:9, players:"Pairs, a ball per pair", area:"5 yd between partners", equipment:"A ball per pair",
  skills:["passing","first_touch","weak_foot"], tips:["T"], method:"tips",
  summary:"Ten-touch sets in pairs that run through every pass and control a player needs.",
  setup:"Partners stand 5 yards apart, one ball between them. One feeds, one works, then swap.",
  how:["10 passes with the right foot, then 10 with the left.","10 alternating feet, then 10 inside-foot volleys from a hand feed, each foot.","10 thigh-to-volley, then 10 headers back to the feeder's hands.","Finish with 10 laces volleys and 10 chest-control and pass."],
  points:["Lock the ankle on every pass and volley.","Soft first touch, firm second touch.","Same number of reps with each foot."],
  progress:"Increase to 10 yards apart and work one-touch.",
  regress:"Fewer reps of each and catch the ball between volleys.",
  diagram:{w:12, h:8, items:[["A",3,4],["N",9,4],["b",4,4.5],["p",3,4,9,4],["p",9,4.6,3,4.6]]}});

d({id:"t-shuttle-passing", title:"Shuttle passing", phase:"Warm-up", level:"Intermediate", minutes:12, minAge:9, players:"4 to 6 per line", area:"10 yd between lines", equipment:"2 cones, 1 ball per group",
  skills:["passing","first_touch","communication"], tips:["T"], method:"tips",
  summary:"Two facing lines pass and follow: a fast technical warm-up with lots of repetitions.",
  setup:"Two lines facing each other 10 yards apart, 2 or 3 players in each line, one ball.",
  how:["Pass to the first player opposite and follow your pass to the back of that line.","Round 1: two touches. Round 2: one touch.","Round 3: one-two with the opposite player, then pass and follow.","Round 4: receive across the body and pass with the other foot."],
  points:["Check toward the ball as it comes.","First touch out of your feet and to the side.","Call for the ball early."],
  progress:"Lengthen to 15 yards and add a lofted pass round.",
  regress:"Shorten to 6 yards and allow stops.",
  diagram:{w:14, h:6, items:[["c",2,3],["c",12,3],["A",2,3],["A",0.6,3],["A",12,3],["A",13.4,3],["b",3,3.5],["p",2,3,12,3],["r",2.5,2,11.5,2,0.2]]}});

d({id:"t-pass-pressure", title:"Pass and pressure", phase:"Warm-up", level:"Intermediate", minutes:12, minAge:10, players:"Groups of 3", area:"15 × 10 yd", equipment:"4 cones, 1 ball per group",
  skills:["first_touch","passing","decision_making"], tips:["T","I"], method:"tips",
  summary:"The passer chases their pass, so the receiver must take the first touch away from pressure.",
  setup:"Three players in a line, 10 yards apart. The middle player is the receiver.",
  how:["An end player passes to the middle player and sprints at them.","The receiver opens up and takes the first touch away from the pressure.","They pass to the far player, who becomes the next passer.","Rotate the middle player every 6 reps."],
  points:["Check over your shoulder before the ball arrives.","Touch away from the side the pressure comes from.","Pass with your second touch."],
  progress:"The presser may tackle.",
  regress:"The presser jogs and stops 2 yards away.",
  diagram:{w:24, h:8, items:[["A",2,4],["A",12,4],["A",22,4],["D",4,4],["b",11,4.6],["p",2,4,12,4],["r",3,3,10.5,3,0.2],["d",12,4,14,6],["p",14,6,22,4]]}});

d({id:"t-ladder-to-ball", title:"Footwork into passing", phase:"Warm-up", level:"Intermediate", minutes:12, minAge:10, players:"8 to 12", area:"20 × 10 yd", equipment:"Agility ladder or 10 cones, 6 cones, 2 balls",
  skills:["handling_speed","separation_speed","passing"], tips:["S","T"], method:"fifa11",
  summary:"Quick feet through a ladder, then a sprint and a pass: speed with the ball at the end.",
  setup:"A ladder (or cones a foot apart), then a zig-zag of 3 cones 5 yards apart, then a server with balls.",
  how:["Run the ladder: one foot in each, two feet, side-on, in-and-out.","Sprint the zig-zag, planting off the outside foot.","Receive a pass from the server and play it back first time.","Jog back and switch the ladder pattern each round."],
  points:["Quick, light steps; arms working.","Low hips through the cuts.","Arrive balanced for the pass."],
  progress:"The server plays the ball at different heights.",
  regress:"Walk through the ladder patterns first.",
  diagram:{w:22, h:10, items:[["c",2,4],["c",3,4],["c",4,4],["c",5,4],["c",6,4],["c",10,2],["c",14,6],["c",18,2],["A",1,4],["N",21,5],["b",20.2,5.4],["r",6,4,10,2,0],["r",10,2,14,6,0],["r",14,6,18,2,0],["p",21,5,18.5,3]]}});

d({id:"t-colour-passing", title:"Three-colour passing", phase:"Warm-up", level:"Intermediate", minutes:12, minAge:10, players:"12 (3 colours of 4)", area:"20 × 20 yd", equipment:"4 cones, 3 bib colours, 2 balls",
  skills:["passing","vision","communication"], tips:["I","T"], method:"tips",
  summary:"Pass to a different colour every time: scanning and moving into open space.",
  setup:"Three teams of 4 in different bibs move freely in a 20-yard square. Two balls in play.",
  how:["Pass to a player in a different colour from yours.","After passing, move into space.","Then a set order: red to blue, blue to yellow, yellow to red.","On the coach's call, one colour defends and tries to win a ball."],
  points:["Know where the next colour is before you receive.","Receive on the half-turn.","Pass and move: never stand still."],
  progress:"Two touches, then call the defending colour every 30 seconds.",
  regress:"One ball and free touches.",
  diagram:{w:20, h:20, items:[["c",0,0],["c",20,0],["c",0,20],["c",20,20],["A",4,5],["A",14,4],["D",9,10],["D",16,15],["N",5,15],["N",12,17],["b",4.8,5.6],["p",4,5,9,10],["p",9,10,5,15]]}});

d({id:"t-press-tag", title:"Pressing tag", phase:"Warm-up", level:"Advanced", minutes:10, minAge:12, players:"12 to 16", area:"20 × 20 yd", equipment:"4 cones, bibs, a ball for each dribbler",
  skills:["defending","separation_speed","communication"], tips:["I","S"], method:"pressing",
  summary:"Taggers may only tag with a correct pressing approach: a warm-up that teaches the press.",
  setup:"Three pairs of taggers in bibs. Everyone else dribbles a ball in a 20-yard square.",
  how:["Taggers work in pairs: one presses the dribbler, one covers behind.","A tag only counts if the presser curved the run to show the dribbler toward a line.","A tagged player swaps bibs with the presser.","Play 90-second rounds; count tags per pair."],
  points:["Curve your run: block one side and show the other.","Sprint to close, slow down for the last two steps.","The cover player stays a few yards behind and to the side."],
  progress:"Dribblers score a point by dribbling out through a side the pair left open.",
  regress:"Taggers work alone and tag freely.",
  diagram:{w:20, h:20, items:[["c",0,0],["c",20,0],["c",0,20],["c",20,20],["A",10,10],["b",10.8,10.6],["D",14,6],["D",16,9],["r",14,6,11,9,0.4],["A",4,15],["A",15,16],["A",5,4]]}});

d({id:"t-prematch", title:"Pre-match warm-up: move, pass, keep it", phase:"Warm-up", level:"Advanced", minutes:20, minAge:12, players:"Whole squad", area:"Lanes, then 25 × 20 yd", equipment:"12 cones, balls, bibs",
  skills:["passing","first_touch","communication"], tips:["T","P"], method:"ppp",
  summary:"The same three-part routine before every game: dynamic movement, passing in lanes, then possession.",
  setup:"Two or three lanes of cones 15 yards apart, then a 25 × 20 yard grid. Players wear bibs inside-out to split teams quickly.",
  how:["5 minutes: dynamic movement in the lanes (jog, skips, side steps, lunges, sprints).","6 minutes: pairs pass across the lanes: two-touch, one-touch, driven, lofted and headers.","6 minutes: possession in the grid, 2-touch, with a neutral.","3 minutes: three short sprints and team talk."],
  points:["Same routine every game so players can lead it themselves.","Sharpness, not fatigue: short bursts and quality passes.","Leaders call the time and keep the group together."],
  progress:"Captains run the whole warm-up without the coach.",
  regress:"Two parts only: movement and passing.",
  diagram:{w:26, h:20, items:[["c",1,2],["c",16,2],["c",1,6],["c",16,6],["A",1,2],["A",16,2],["p",1,2,16,2],["z",1,9,24,10],["A",6,12],["A",12,15],["D",9,13],["D",17,12],["N",20,16],["b",6.8,12.6]]}});
/* ---------------- technical ---------------- */
d({id:"t-ball-mastery-grid", title:"Ball mastery grid", phase:"Technical", level:"Beginner", minutes:10, minAge:6, players:"Whole team, a ball each", area:"15 × 15 yd", equipment:"4 cones, a ball each",
  skills:["dribbling","first_touch","weak_foot"], tips:["T"], method:"tips",
  summary:"Every player on a ball doing the core foot skills: toe taps, tick-tocks, sole rolls, L and V shapes.",
  setup:"Players spread out in a 15-yard square, each with a ball, facing the coach.",
  how:["30 seconds of each skill: toe taps, tick-tocks, sole rolls, sole roll and stop.","Then L shapes and V shapes, 30 seconds on each foot.","Then dribble freely and do the called skill whenever the coach claps.","Finish with a 60-second touch count: who can do the most clean touches?"],
  points:["Light touches on the balls of the feet.","Same number of reps on both feet.","Glance up between touches."],
  progress:"Combine two skills in a row, then add a sprint out of the move.",
  regress:"Slower, with a stop between each touch.",
  diagram:{w:15, h:15, items:[["c",0,0],["c",15,0],["c",0,15],["c",15,15],["N",7.5,1],["A",4,5],["A",11,5],["A",4,11],["A",11,11],["b",4.6,5.6],["b",11.6,5.6],["b",4.6,11.6],["b",11.6,11.6]]}});

d({id:"t-pairs-gates", title:"Pass through the gates in pairs", phase:"Technical", level:"Beginner", minutes:12, minAge:7, players:"Pairs, a ball per pair", area:"25 × 25 yd", equipment:"16 cones, a ball per pair",
  skills:["passing","first_touch","communication"], tips:["T","I"], method:"tips",
  summary:"Pairs move around the area passing through as many gates as they can.",
  setup:"8 gates, 2 yards wide, scattered in a 25-yard square. Pairs share a ball.",
  how:["Pairs pass through a gate to each other, then find a new gate.","Count gates in 60 seconds.","Round 2: the receiver must control and dribble through the next gate before passing.","Round 3: one-touch passes only through the gate."],
  points:["Talk: call which gate you're going to.","Receive across your body so you can move on.","Weight the pass so your partner can run onto it."],
  progress:"Smaller gates, or add a pair of defenders who block gates.",
  regress:"Bigger gates and two touches.",
  diagram:{w:25, h:25, items:[["c",5,5],["c",5,7],["c",18,4],["c",20,4],["c",12,12],["c",12,14],["c",4,19],["c",6,19],["c",19,18],["c",19,20],["A",3,6],["A",8,6],["b",3.8,6.4],["p",3,6,8,6],["A",15,13],["A",10,13]]}});

d({id:"t-turn-moves", title:"Turns at the cone", phase:"Technical", level:"Beginner", minutes:12, minAge:6, players:"4 lines of 3 or 4", area:"20 × 20 yd", equipment:"5 cones, a ball each",
  skills:["dribbling","skill_moves","first_touch"], tips:["T"], method:"tips",
  summary:"Dribble to a central cone, turn with a named move, and dribble back: inside hook, outside hook, drag and Cruyff.",
  setup:"One cone in the middle of a 20-yard square and a line of players at each corner, each with a ball.",
  how:["The first player in each line dribbles to the middle cone.","They turn with the move the coach calls and dribble back.","Next player goes when the previous one turns.","Work through inside hook, outside hook, drag back and Cruyff turn on both feet."],
  points:["Slow down just before the turn, explode out of it.","Keep the ball close as you turn.","Look up before you drive away."],
  progress:"Add a passive defender at the middle cone.",
  regress:"Walk through each turn first.",
  diagram:{w:20, h:20, items:[["c",10,10],["A",2,2],["A",18,2],["A",2,18],["A",18,18],["b",2.8,2.8],["d",2.8,2.8,9,9],["r",9,9,3,4,0.5]]}});

d({id:"t-dribble-stations", title:"Three dribbling stations", phase:"Technical", level:"Beginner", minutes:12, minAge:6, players:"3 groups", area:"30 × 20 yd", equipment:"15 cones, a ball each",
  skills:["dribbling","handling_speed","separation_speed"], tips:["T","S"], method:"tips",
  summary:"Three short stations: close control through cones, a zig-zag, then a speed dribble.",
  setup:"Station A: 6 cones a yard apart in a line. Station B: 5 cones in a zig-zag 3 yards apart. Station C: two cones 15 yards apart.",
  how:["Station A: weave through with the surface the coach calls (inside, outside, sole).","Station B: cut around each cone with the outside of the foot.","Station C: dribble at top speed to the far cone and stop the ball dead.","Rotate every 3 minutes."],
  points:["Touch every step in tight spaces.","Plant and cut on the outside foot.","Push the ball further ahead when there's open space."],
  progress:"Time each station and try to beat it.",
  regress:"Wider cones and walking pace first.",
  diagram:{w:30, h:20, items:[["c",3,3],["c",5,3],["c",7,3],["c",9,3],["c",11,3],["c",4,10],["c",7,13],["c",10,10],["c",13,13],["c",3,17],["c",18,17],["A",1,3],["A",2,10],["A",1,17],["d",1,17,17,17]]}});

d({id:"t-passing-circle", title:"Passing circle with floaters", phase:"Technical", level:"Beginner", minutes:12, minAge:7, players:"8 to 12", area:"20-yd circle", equipment:"8 cones, 4 balls, bibs",
  skills:["passing","first_touch","vision"], tips:["T","I"], method:"tips",
  summary:"Outside players feed floaters in the middle, who play a one-two and pass out again.",
  setup:"Players around a 20-yard circle, half with a ball. Two or three floaters in bibs move inside.",
  how:["An outside player calls a floater's name and passes in.","The floater plays it back, then the outside player passes across to someone without a ball.","Swap floaters every 2 minutes.","Then floaters must turn and pass to a different outside player."],
  points:["Head up and name the player before you pass.","Floaters check away, then come to the ball.","Pass to the foot that lets the receiver play on."],
  progress:"Floaters one-touch only.",
  regress:"One floater and fewer balls.",
  diagram:{w:20, h:20, items:[["c",10,0.5],["c",19.5,10],["c",10,19.5],["c",0.5,10],["A",10,1],["A",19,10],["A",10,19],["A",1,10],["N",8,8],["N",12,12],["b",10,1.8],["p",10,1,8,8],["p",8,8,1,10]]}});

d({id:"t-y-passing", title:"Y passing pattern", phase:"Technical", level:"Intermediate", minutes:15, minAge:11, players:"6 to 10", area:"25 × 20 yd", equipment:"5 cones, 2 balls",
  skills:["passing","first_touch","positional_awareness"], tips:["T","I"], method:"tips",
  summary:"A passing pattern shaped like a Y that copies how a defender, a midfielder and wingers combine.",
  setup:"A start cone, a middle cone 10 yards up, and two cones 8 yards beyond it, one left and one right.",
  how:["The start player passes to the middle player and follows the pass.","The middle player sets it back, then spins to receive the return pass.","They play wide to the left or right cone and follow.","The wide player dribbles back to the start. Alternate sides each rep."],
  points:["Check away before you come to the ball.","The set-back pass goes to the passer's front foot.","Open your hips on the half-turn so you can see the wide player."],
  progress:"One-touch on every pass, or add an overlap from the wide player.",
  regress:"Two touches and no set-back.",
  diagram:{w:20, h:24, items:[["c",10,22],["c",10,12],["c",4,4],["c",16,4],["A",10,22],["A",10,12],["A",4,4],["A",16,4],["b",10,21],["p",10,22,10,12],["p",10,12,10,17],["p",10,17,4,4],["r",11,21,11,13,0]]}});

d({id:"t-diamond-combos", title:"Diamond passing combinations", phase:"Technical", level:"Intermediate", minutes:15, minAge:10, players:"8 to 12", area:"15 × 15 yd diamond", equipment:"4 cones, 2 balls",
  skills:["passing","first_touch","communication"], tips:["T","I"], method:"tips",
  summary:"A diamond of four cones and three set combinations: pass and follow, one-two, and third-man.",
  setup:"Four cones in a diamond, 12 yards across. Players split evenly behind the cones; a ball at the bottom cone.",
  how:["Combination 1: pass up to the top cone and follow.","Combination 2: pass to the side cone, get it back, then play up to the top.","Combination 3: pass to the top, who sets to the side player, who plays the starter running through.","Run each combination for 3 minutes, then switch direction."],
  points:["Firm passes; the ball shouldn't stop.","Move off the cone to make an angle before receiving.","Time your run so you receive on the move."],
  progress:"One-touch, or start a second ball from the top cone.",
  regress:"Two touches and only combinations 1 and 2.",
  diagram:{w:16, h:16, items:[["c",8,14],["c",2,8],["c",14,8],["c",8,2],["A",8,14],["A",2,8],["A",14,8],["A",8,2],["b",8,13],["p",8,14,2,8],["p",2,8,8,9],["p",8,9,8,2],["r",9,13,9,4,0.2]]}});

d({id:"t-zigzag", title:"Zig-zag one-twos", phase:"Technical", level:"Intermediate", minutes:12, minAge:9, players:"7 to 10", area:"25 × 15 yd", equipment:"6 cones, 2 balls",
  skills:["passing","first_touch","separation_speed"], tips:["T"], method:"tips",
  summary:"Play a one-two with each player down a zig-zag of cones, then join the end.",
  setup:"Four cones in a zig-zag, 7 yards apart, with a player on each. The rest start in line with balls.",
  how:["The first player passes diagonally to cone 1 and runs to support.","Cone 1 plays it back for a one-two, then the runner passes to cone 2 and repeats.","After the last one-two, the runner takes over cone 4; everyone moves up one.","Start the next ball when the first runner reaches cone 2."],
  points:["Look up to check the path is clear before you pass.","Check away, then check to the ball.","Pass in front of the runner, not behind."],
  progress:"Every pass one-touch.",
  regress:"Walk the pattern first and allow a stop.",
  diagram:{w:24, h:14, items:[["c",2,7],["c",8,2],["c",13,12],["c",18,2],["c",23,12],["A",2,7],["A",8,2],["A",13,12],["A",18,2],["b",3,7.4],["p",2,7,8,2],["p",8,2,8,7],["p",8,7,13,12]]}});

d({id:"t-box-combos", title:"Box passing combinations", phase:"Technical", level:"Intermediate", minutes:15, minAge:11, players:"10 to 12", area:"20 × 20 yd", equipment:"8 cones, 2 balls",
  skills:["passing","first_touch","positional_awareness"], tips:["T","I"], method:"positional",
  summary:"Corner players feed middle players, who receive on the turn and switch the ball across the box.",
  setup:"A 20-yard square with a player on each corner and four cones in a smaller middle square, each with a player.",
  how:["A corner player passes to the nearest middle player.","The middle player opens up and plays diagonally to the far middle player.","That player bounces it out to a corner on the far side.","Rotate positions every 2 minutes; change direction on the coach's call."],
  points:["Middle players receive on the half-turn with their back foot.","Pass to the correct foot so the next player can play forward.","Talk: call 'turn' or 'man on' for your teammate."],
  progress:"Add one defender in the middle who tries to intercept.",
  regress:"Two touches for middle players.",
  diagram:{w:20, h:20, items:[["A",1,1],["A",19,1],["A",1,19],["A",19,19],["A",7,7],["A",13,7],["A",7,13],["A",13,13],["b",1.8,1.8],["p",1,1,7,7],["p",7,7,13,13],["p",13,13,19,19]]}});

d({id:"t-receive-turn", title:"Receive and turn in threes", phase:"Technical", level:"Intermediate", minutes:12, minAge:9, players:"Groups of 3", area:"20 × 10 yd", equipment:"2 cones, 1 ball per group",
  skills:["first_touch","dribbling","positional_awareness"], tips:["T","I"], method:"tips",
  summary:"The middle player receives from one end, turns and plays to the other end.",
  setup:"Three players in a line, the end players 20 yards apart. The middle player works between them.",
  how:["An end player passes to the middle player.","The middle player checks their shoulder, opens up and turns with the first touch.","They pass to the far end player, then turn to receive from them.","Change the middle player every minute."],
  points:["Check your shoulder before the ball arrives.","Open your hips and receive with the back foot.","Turn in one touch when there's no pressure."],
  progress:"Add a passive defender behind the middle player.",
  regress:"Allow a stop-touch before turning.",
  diagram:{w:22, h:8, items:[["A",1,4],["A",11,4],["A",21,4],["b",2,4.4],["p",1,4,11,4],["d",11,4,12.5,5.5],["p",12.5,5.5,21,4]]}});

d({id:"t-first-touch-control", title:"First-touch control: inside, outside, across", phase:"Technical", level:"Intermediate", minutes:12, minAge:9, players:"8 (4 pairs)", area:"20 × 20 yd", equipment:"4 cones, 4 balls",
  skills:["first_touch","weak_foot","positional_awareness"], tips:["T"], method:"tips",
  summary:"Outside players feed inside players, who take a named first touch before passing back.",
  setup:"Four outside players on the edges of a 20-yard square, each with a ball. Four inside players face them.",
  how:["The outside player passes to the inside player facing them.","The inside player takes the called first touch: inside right, outside right, inside left, outside left, or across the body.","They pass back with their second touch and spin to face a new outside player.","Swap inside and outside every 2 minutes."],
  points:["Decide the touch before the ball arrives.","Cushion the ball into space, a step away from your body.","Same reps on each foot."],
  progress:"Outside players throw the ball for thigh and chest control.",
  regress:"Only inside-foot touches.",
  diagram:{w:20, h:20, items:[["A",10,1],["A",19,10],["A",10,19],["A",1,10],["N",10,6],["N",14,10],["N",10,14],["N",6,10],["b",10,1.8],["p",10,1,10,6],["d",10,6,12,7]]}});

d({id:"t-long-switch", title:"Long passing between boxes", phase:"Technical", level:"Intermediate", minutes:15, minAge:11, players:"8 (two groups of 4)", area:"Two 10 × 10 yd boxes, 30 yd apart", equipment:"8 cones, 2 balls",
  skills:["passing","first_touch","vision"], tips:["T"], method:"tips",
  summary:"Play long, driven and lofted passes into a box and control them inside it.",
  setup:"Two 10-yard boxes 30 yards apart with 2 players in each. Two players wait outside each box.",
  how:["A player in one box sets the ball for a teammate, who hits a long pass into the far box.","A player in the far box must control it inside the box with one touch.","They set it for their partner, who plays it back long.","Rotate in the waiting players every 4 passes."],
  points:["Approach at an angle and plant beside the ball.","Strike through the lower half for height, through the middle for a driven pass.","Receivers move their feet early to get behind the ball."],
  progress:"Move the boxes to 40 yards, or the receiver must control and switch in two touches.",
  regress:"20 yards apart and a bounce allowed before control.",
  diagram:{w:14, h:44, items:[["z",2,1,10,10],["z",2,33,10,10],["A",5,5],["A",9,6],["A",5,37],["A",9,38],["b",5.8,5.6],["p",5,5,9,38]]}});

d({id:"t-shield-turn", title:"Turning with your back to pressure", phase:"Technical", level:"Intermediate", minutes:15, minAge:10, players:"Groups of 3", area:"20 × 15 yd", equipment:"4 cones, 1 ball per group",
  skills:["first_touch","dribbling","physicality"], tips:["T","P"], method:"tips",
  summary:"Receive with a defender close behind, feel where they are, and turn away from them.",
  setup:"A passer, an attacker in a 3-yard gate in the middle, and a defender 3 steps behind the attacker. A line or small goal behind the defender.",
  how:["The attacker checks into the gate and the passer plays into their feet.","The defender runs around either side to pressure.","The attacker reads which side the pressure comes from and turns the other way to dribble over the line.","If the turn isn't on, they shield and lay it back to the passer."],
  points:["Feel the defender with an arm, then turn away from the contact.","Receive on the back foot, side-on.","If you can't turn, protect the ball and play back."],
  progress:"The defender starts right behind the attacker and can tackle at once.",
  regress:"The defender walks and only shadows.",
  diagram:{w:15, h:20, items:[["c",6,10],["c",9,10],["A",7.5,18],["A",7.5,10],["D",7.5,7],["b",7.5,17],["p",7.5,18,7.5,10.6],["r",7.5,7,10,9.5,0.4],["d",7.5,10,4,3],["c",2,1],["c",13,1]]}});

d({id:"t-takeovers", title:"Box dribbling and takeovers", phase:"Technical", level:"Intermediate", minutes:12, minAge:8, players:"9 (3 inside, 6 outside)", area:"20 × 20 yd", equipment:"4 cones, 3 balls",
  skills:["dribbling","passing","communication"], tips:["T","I"], method:"tips",
  summary:"Inside players dribble, combine with outside players and swap places with a takeover.",
  setup:"Six players spread round a 20-yard square, three inside with a ball.",
  how:["Inside players dribble and pass to an outside player, who returns it first time.","Next, inside players dribble straight at an outside player and leave the ball for them: a takeover.","The outside player takes it and becomes an inside player.","Finish with a wall pass: dribble at an outside player, play it, and run past for the return."],
  points:["Eyes up while you dribble so you don't collide.","Takeovers: the dribbler leaves it with the sole, the receiver takes it on the move.","Use the inside of the foot for short passes and the laces when dribbling at speed."],
  progress:"Only weak foot in the second round.",
  regress:"Fewer inside players and more space.",
  diagram:{w:20, h:20, items:[["A",10,1],["A",19,7],["A",19,14],["A",10,19],["A",1,14],["A",1,7],["N",8,8],["N",13,12],["N",8,14],["b",8.8,8.6],["d",8,8,16,7],["p",16,7,19,7]]}});

d({id:"t-heading-game", title:"Heading pairs and throw-head-catch", phase:"Technical", level:"Intermediate", minutes:12, minAge:10, players:"Pairs, then two teams", area:"25 × 20 yd", equipment:"4 cones, a soft ball per pair, 2 small goals",
  skills:["physicality","first_touch","communication"], tips:["T","P"], method:"tips",
  summary:"Safe heading technique in pairs, then a throw-head-catch game. Keep numbers of headers low.",
  setup:"Pairs 5 yards apart with a soft, under-inflated ball. Then two teams in a 25 × 20 yard area with small goals.",
  how:["Pairs: one throws underarm, the other heads back to their hands; 6 headers each, then swap.","Game: a player throws to a teammate, who must head it to a third teammate, who catches.","The sequence repeats; a goal counts only from a header.","If the ball drops or is intercepted, the other team restarts."],
  points:["Eyes open, mouth closed, use the forehead.","Attack the ball; don't let it hit you.","Arms out for balance and protection."],
  progress:"Defenders may block headers with their own head.",
  regress:"Catch instead of head in the game.",
  diagram:{w:25, h:20, items:[["mg",0.5,10,"v"],["mg",24.5,10,"v"],["A",6,8],["A",11,11],["A",16,8],["D",9,6],["D",14,13],["b",6.8,8.4],["p",6,8,11,11],["p",11,11,16,8]]}});

d({id:"t-third-man", title:"Third-man pattern", phase:"Technical", level:"Advanced", minutes:15, minAge:12, players:"5 to 8", area:"25 × 15 yd", equipment:"5 cones, 2 balls",
  skills:["passing","positional_awareness","vision"], tips:["I","T"], method:"positional",
  summary:"The ball goes in to one player and comes out to a third player running forward.",
  setup:"Two end cones 20 yards apart and two central cones 5 yards apart. A player on each cone, extras at the start.",
  how:["The starter passes into the first central player.","That player lays it off to the second central player.","The second player plays forward into the path of the starter, who has run on.","Rotate one position each rep; run both directions."],
  points:["The third player starts the run as the first pass is made.","Lay-offs are one-touch and weighted into stride.","Look before you receive so you know who is free."],
  progress:"Add one defender who tries to block the forward pass.",
  regress:"Two touches and walk the runs.",
  diagram:{w:24, h:15, items:[["c",2,8],["c",22,8],["c",10,5],["c",14,10],["A",2,8],["A",10,5],["A",14,10],["A",22,8],["b",3,8.4],["p",2,8,10,5],["p",10,5,14,10],["r",3,9,15,13,0.3],["p",14,10,16,13]]}});

d({id:"t-check-play-forward", title:"Check, receive, play forward", phase:"Technical", level:"Advanced", minutes:15, minAge:12, players:"8", area:"30 × 20 yd", equipment:"8 cones, 2 balls",
  skills:["passing","first_touch","positional_awareness"], tips:["T","I"], method:"positional",
  summary:"Midfielders check deep, receive from wide, and turn to play the next line, as in a game.",
  setup:"Two wide players halfway up each side, two central midfielders, and an end player at each end of a 30-yard channel.",
  how:["An end player passes to the wide player on their side.","A central midfielder checks deep and receives from the wide player.","They play forward into the second central midfielder, who turns and plays the far end player.","The far end player starts it back the other way; rotate every 3 minutes."],
  points:["Check away before you check to the ball.","Play to the correct side so the receiver can turn.","Open your body to the player you're passing to next."],
  progress:"One-touch for the wide players and a 10-second limit end to end.",
  regress:"Two touches everywhere.",
  diagram:{w:20, h:30, items:[["A",10,1],["A",2,10],["A",18,20],["A",10,12],["A",10,18],["A",10,29],["b",10,2],["p",10,1,2,10],["p",2,10,10,12],["p",10,12,10,18],["p",10,18,10,29]]}});

d({id:"t-buildout-pattern", title:"Build-out patterns, unopposed", phase:"Technical", level:"Advanced", minutes:15, minAge:12, players:"7 to 11", area:"Half field", equipment:"Goal, cones, balls",
  skills:["passing","positional_awareness","tactical_understanding"], tips:["I","T"], method:"positional",
  summary:"The keeper and back line rehearse two or three passing routes out from a goal kick before any pressure is added.",
  setup:"The keeper, back four and a holding midfielder in their starting spots. Cones mark the target zones wide and through the middle.",
  how:["Centre-backs split wide to the edge of the box; full-backs push up the sidelines.","Route 1: keeper to centre-back, to full-back, forward to the winger zone.","Route 2: keeper to centre-back, into the holding midfielder, who turns and plays out wide.","Route 3: keeper to one centre-back, back to keeper, switch to the other side."],
  points:["Width and depth first: make the field big before the first pass.","Open body shape so you can see forward.","Calm passing: every pass helps the next player play forward."],
  progress:"Add two passive forwards, then make them press for real.",
  regress:"Only Route 1, walked through first.",
  diagram:{w:44, h:36, items:[["G",22,0,"top"],["K",22,2],["A",12,6],["A",32,6],["A",3,16],["A",41,16],["A",22,14],["b",22,3],["p",22,2,12,6],["p",12,6,3,16],["p",22,2,32,6]]}});

d({id:"t-switch-pattern", title:"Change the point of attack", phase:"Technical", level:"Advanced", minutes:15, minAge:12, players:"8 to 10", area:"50 × 40 yd", equipment:"Cones, balls",
  skills:["passing","vision","positional_awareness"], tips:["I","T"], method:"positional",
  summary:"A passing pattern that moves the ball from one side to the other through the midfield, to create a 2v1 on the far side.",
  setup:"A centre-back, a full-back and winger on each side, and two central midfielders, in a 50 × 40 yard area.",
  how:["The centre-back plays to the near full-back, who draws the (imaginary) pressure.","The ball comes back inside to a central midfielder, who sets it for the other midfielder.","That midfielder switches long to the far full-back.","The far full-back and winger combine with an overlap to finish at a target."],
  points:["Move the ball quickly; the switch only works if it's fast.","The midfielder receiving the set faces the far side.","The far winger stays wide until the switch is played."],
  progress:"Add two defenders who shift across as the ball moves.",
  regress:"Shorter switch and two touches.",
  diagram:{w:50, h:40, items:[["A",25,36],["A",5,28],["A",45,28],["A",20,20],["A",30,20],["A",5,10],["A",45,10],["b",25,35],["p",25,36,5,28],["p",5,28,20,20],["p",20,20,30,20],["p",30,20,45,28]]}});

d({id:"t-gk-distribution", title:"Keeper distribution under pressure", phase:"Technical", level:"Advanced", minutes:15, minAge:12, players:"Keepers + 6", area:"Half field", equipment:"Goal, 6 cones, balls",
  skills:["gk_distribution","gk_decision_making","passing"], tips:["T","I"], method:"tips",
  summary:"Keepers pick the right pass, roll or kick to targets while a forward tries to block.",
  setup:"A keeper in goal with balls. Three target zones: near full-back, holding midfielder and far winger. One forward presses.",
  how:["A server shoots or crosses; the keeper saves or catches.","The forward sprints to block the easy pass.","The keeper chooses the open target: roll, throw, side-volley or drop kick.","A pass that reaches the target zone scores a point."],
  points:["Look up as soon as the ball is in your hands.","Fast and short when the forward is far, long when they block short.","Use both feet when the ball is on the ground."],
  progress:"Add a second forward and a 6-second limit.",
  regress:"No forward; just accuracy to the targets.",
  diagram:{w:44, h:36, items:[["G",22,0,"top"],["K",22,2],["D",16,8],["z",2,12,8,8],["z",18,18,8,8],["z",34,28,8,8],["A",6,16],["A",22,22],["A",38,32],["b",22,2.8],["p",22,2,38,32]]}});
/* ---------------- possession ---------------- */
d({id:"t-rondo-5v1", title:"Rondo 5v1, count the passes", phase:"Possession", level:"Beginner", minutes:10, minAge:7, players:"6 per grid", area:"10 × 10 yd", equipment:"4 cones, 1 ball, bibs",
  skills:["passing","first_touch","communication"], tips:["T"], method:"rondo",
  summary:"Five keep it from one and count out loud: an easy, high-success rondo for younger teams.",
  setup:"A 10-yard square with five players spread round the edge and one defender inside.",
  how:["The five pass around and across the square; the group counts each pass out loud.","If the defender touches the ball, the player who lost it swaps in.","Beat your record for passes in a row.","After 2 minutes, change the defender anyway."],
  points:["Pass and move along the line to open a new angle.","First touch away from the defender.","Pass firmly so the defender can't get there."],
  progress:"Two touches, or a 4v1 in the same space.",
  regress:"A bigger square and the defender walks.",
  diagram:{w:12, h:12, items:[["c",1,1],["c",11,1],["c",1,11],["c",11,11],["A",4,1],["A",9,1],["A",11,7],["A",6,11],["A",1,7],["D",6,6],["b",4.6,1.7],["p",4,1,11,7]]}});

d({id:"t-gates-possession", title:"Possession through the gates", phase:"Possession", level:"Beginner", minutes:15, minAge:8, players:"8 to 12 (two teams)", area:"30 × 25 yd", equipment:"12 cones, balls, bibs",
  skills:["passing","dribbling","decision_making"], tips:["I","T"], method:"dutch4v4",
  summary:"Two teams keep the ball and score by passing or dribbling through any of six gates.",
  setup:"Six gates, 2 yards wide, spread around a 30 × 25 yard area. Two teams of 4 to 6.",
  how:["The team with the ball scores a point for each gate it passes or dribbles through to a teammate.","They can't use the same gate twice in a row.","If the other team wins the ball, they attack the gates.","Play 4-minute games."],
  points:["Spread out so there's always space to find.","Look for the gate the defenders aren't guarding.","Move to the far side of the gate to receive."],
  progress:"Points only for a pass through the gate, not a dribble.",
  regress:"Add a neutral player who plays for the team with the ball.",
  diagram:{w:30, h:25, items:[["c",5,5],["c",7,5],["c",20,4],["c",22,4],["c",14,12],["c",16,12],["c",4,20],["c",6,20],["c",24,19],["c",26,19],["A",8,9],["A",13,8],["A",18,15],["D",10,13],["D",20,10],["b",8.8,9.6],["p",8,9,15,13]]}});

d({id:"t-3v3-neutral", title:"3v3 plus a neutral", phase:"Possession", level:"Beginner", minutes:12, minAge:8, players:"7", area:"20 × 20 yd", equipment:"4 cones, balls, bibs",
  skills:["passing","positional_awareness","communication"], tips:["I","T"], method:"positional",
  summary:"The team with the ball gets the neutral player: 4v3 keep-away that rewards spreading out.",
  setup:"A 20-yard square with two teams of 3 and one neutral in a different bib.",
  how:["The coach plays a ball in; the team that has it plays with the neutral.","Six passes in a row scores a point.","If the ball is lost, the other team gets the neutral.","Rotate the neutral every 3 minutes."],
  points:["Make the field big: wide and apart.","Always give the player on the ball two passing options.","The neutral looks for the free player."],
  progress:"The neutral is one-touch only.",
  regress:"Four passes for a point.",
  diagram:{w:20, h:20, items:[["c",0,0],["c",20,0],["c",0,20],["c",20,20],["A",4,4],["A",16,6],["A",8,16],["D",9,8],["D",13,12],["D",5,11],["N",15,15],["b",4.7,4.6],["p",4,4,16,6],["p",16,6,15,15]]}});

d({id:"t-rondo-4v2", title:"Rondo 4v2", phase:"Possession", level:"Intermediate", minutes:12, minAge:10, players:"6 per grid", area:"10 × 10 yd", equipment:"4 cones, 1 ball, bibs",
  skills:["passing","first_touch","decision_making"], tips:["T","I"], method:"rondo",
  summary:"Four keep the ball from two: split passes between the defenders score double.",
  setup:"A 10-yard square, one attacker on each side and two defenders inside.",
  how:["Attackers move along their side and keep the ball.","A pass between the two defenders counts as two passes.","If a defender wins it, the attacker who lost it and their partner swap in.","Defenders swap after 90 seconds either way."],
  points:["First touch away from pressure.","The pass that splits the defenders is the target; be patient for it.","Defenders press together: one presses, one cuts the split pass."],
  progress:"Two touches maximum.",
  regress:"A bigger square, or 5v2.",
  diagram:{w:12, h:12, items:[["c",1,1],["c",11,1],["c",1,11],["c",11,11],["A",6,1],["A",11,6],["A",6,11],["A",1,6],["D",5,5],["D",7,7],["b",6.6,1.7],["p",6,1,6,11]]}});

d({id:"t-rondo-5v2", title:"Rondo 5v2", phase:"Possession", level:"Intermediate", minutes:15, minAge:10, players:"7 per grid", area:"10 × 10 yd", equipment:"4 cones, 1 ball, bibs",
  skills:["passing","first_touch","communication"], tips:["T","I"], method:"rondo",
  summary:"Five against two with a time challenge: how many passes in 60 seconds?",
  setup:"A 10-yard square, five attackers on the outside and two defenders inside.",
  how:["Attackers pass around and across the square, one or two touches.","Defenders press together to win it.","When they win it, they pass out of the square and the two attackers who lost it go in.","Keep a running count of passes; reset to zero when the ball is lost."],
  points:["Sharp passes with information: the pass tells the receiver what to do.","Receive across your body to play on.","Defenders: one presses the ball, one blocks the split."],
  progress:"One touch only, or a 6v3 in a slightly bigger square.",
  regress:"Unlimited touches and a 12-yard square.",
  diagram:{w:12, h:12, items:[["c",1,1],["c",11,1],["c",1,11],["c",11,11],["A",4,1],["A",9,1],["A",11,7],["A",6,11],["A",1,7],["D",5,5],["D",7,6],["b",4.6,1.7],["p",4,1,11,7]]}});

d({id:"t-rondo-6v3", title:"Rondo 6v3", phase:"Possession", level:"Intermediate", minutes:15, minAge:11, players:"9 per grid", area:"15 × 15 yd", equipment:"4 cones, balls, bibs",
  skills:["passing","decision_making","communication"], tips:["T","I"], method:"rondo",
  summary:"Six keep the ball from three for 60 seconds: the defenders must work as a unit.",
  setup:"A 15-yard square, six attackers (one can be inside) and three defenders.",
  how:["Attackers keep the ball with one or two touches for 60 seconds.","Count passes; a turnover resets the count.","Defenders rotate in every 60 seconds.","Best team score of the round wins."],
  points:["Attackers: create triangles; the inside player gives a central option.","Pass early, before the pressure arrives.","Defenders: press in a wave, with the cover close behind."],
  progress:"A split pass through two defenders counts as three.",
  regress:"Two defenders, or a bigger square.",
  diagram:{w:16, h:16, items:[["c",1,1],["c",15,1],["c",1,15],["c",15,15],["A",5,1],["A",12,1],["A",15,8],["A",9,15],["A",1,9],["A",8,8],["D",6,5],["D",10,6],["D",8,11],["b",5.6,1.7],["p",5,1,8,8],["p",8,8,15,8]]}});

d({id:"t-four-box", title:"Four-box 4v1: win it and transfer", phase:"Possession", level:"Intermediate", minutes:15, minAge:11, players:"16 to 20", area:"Four 10 × 10 yd boxes", equipment:"16 cones, balls, bibs",
  skills:["passing","decision_making","separation_speed"], tips:["I","S"], method:"rondo",
  summary:"4v1 in four boxes: when a defender wins it, they must pass to a teammate in another box.",
  setup:"Four 10-yard boxes side by side with a 4v1 in each. The defenders are one team.",
  how:["Attackers keep the ball; 8 passes in a row is a point.","When a defender wins the ball, they must pass it into another box to a fellow defender.","If the pass connects, that box's attackers become defenders and rush to press.","Play 3-minute rounds."],
  points:["Connect the first pass after winning it.","Attackers: sharp passes; first touch away from pressure.","Recognise the moment the ball is won and react straight away."],
  progress:"Two defenders per box.",
  regress:"Boxes 12 yards and no transfer pass needed.",
  diagram:{w:22, h:22, items:[["z",0,0,10,10],["z",12,0,10,10],["z",0,12,10,10],["z",12,12,10,10],["A",5,0.5],["A",9.5,5],["A",5,9.5],["A",0.5,5],["D",5,5],["D",17,17],["p",5,5,17,17]]}});

d({id:"t-4v2-zones", title:"4v2 in two zones", phase:"Possession", level:"Intermediate", minutes:15, minAge:11, players:"9", area:"20 × 20 yd, split in two", equipment:"6 cones, balls, bibs",
  skills:["passing","vision","positional_awareness"], tips:["I","T"], method:"positional",
  summary:"Keep it 4v2 in one half, then use the middle player to switch play into the other half.",
  setup:"A 20-yard square split into two halves. Four attackers and a middle player in one half against two defenders.",
  how:["The four attackers keep the ball in their half.","After 5 passes they may switch through the middle player into the other half.","Their teammates sprint across; two new defenders enter the new half.","If the defenders win it, they pass to the coach and swap with the attackers who lost it."],
  points:["Two-touch to attract the defenders before switching.","Play on different lines so the switch is open.","Make the space: players in the new half spread wide early."],
  progress:"The switch must be one-touch through the middle player.",
  regress:"3 passes before a switch.",
  diagram:{w:20, h:20, items:[["z",0,0,20,10],["z",0,10,20,10],["A",2,2],["A",18,2],["A",3,8],["A",17,8],["N",10,10],["D",8,5],["D",12,4],["b",2.7,2.6],["p",2,2,10,10],["p",10,10,15,16]]}});

d({id:"t-three-team-possession", title:"Three-team possession", phase:"Possession", level:"Intermediate", minutes:15, minAge:10, players:"12 to 15 (three teams)", area:"25 × 20 yd", equipment:"4 cones, balls, 3 bib colours",
  skills:["passing","positional_awareness","defending"], tips:["I","P"], method:"rondo",
  summary:"Two teams keep the ball against the third; whoever loses it becomes the defending team.",
  setup:"Three teams of 4 or 5 in a 25 × 20 yard area. Two teams in possession together.",
  how:["Two teams combine to keep the ball against the third.","If the defenders win it, the team that lost it becomes the defenders.","Count passes; 10 in a row scores a point for both possessing teams.","Play 6-minute games and total the points."],
  points:["React straight away when the ball is lost: you're now defending.","Spread out to make the area big.","Defenders press together and cut lanes."],
  progress:"Two touches, or only passes to the other colour count.",
  regress:"A bigger area.",
  diagram:{w:25, h:20, items:[["c",0,0],["c",25,0],["c",0,20],["c",25,20],["A",4,4],["A",20,5],["A",12,17],["N",6,14],["N",21,15],["N",13,3],["D",10,9],["D",15,11],["D",12,6],["b",4.7,4.6],["p",4,4,13,3],["p",13,3,20,5]]}});

d({id:"t-7v3-switch", title:"7v3: attract and switch", phase:"Possession", level:"Intermediate", minutes:15, minAge:12, players:"10", area:"30 × 30 yd", equipment:"4 cones, balls, bibs",
  skills:["passing","vision","decision_making"], tips:["I","T"], method:"positional",
  summary:"Seven keep the ball against three, drawing them to one side and switching with a diagonal pass.",
  setup:"A 30-yard square. Seven attackers spread around the area, three defenders.",
  how:["Attackers keep possession; a point for a diagonal switch from one side to the other.","Defenders score by winning it and dribbling out of the square.","Rotate defenders every 2 minutes.","Then: attackers must make 5 passes on one side before the switch counts."],
  points:["Stay calm; move the ball to move the defenders.","Open body shape so you can see the switch.","Receivers on the far side stay wide and ready."],
  progress:"6v3 and two touches.",
  regress:"7v2.",
  diagram:{w:30, h:30, items:[["c",0,0],["c",30,0],["c",0,30],["c",30,30],["A",3,5],["A",10,3],["A",5,14],["A",15,15],["A",26,8],["A",27,22],["A",14,27],["D",8,8],["D",11,10],["D",16,20],["b",3.7,5.6],["p",3,5,27,22]]}});

d({id:"t-3v3-targets", title:"3v3 to targets", phase:"Possession", level:"Intermediate", minutes:15, minAge:11, players:"10 (3v3 + 4 targets)", area:"20 × 20 yd", equipment:"4 cones, balls, bibs",
  skills:["passing","positional_awareness","first_touch"], tips:["I","T"], method:"positional",
  summary:"Teams keep the ball and play a wall pass with a target at one end, then work it to the other end.",
  setup:"A 20-yard square with 3v3 inside and a target player on each end line for each team.",
  how:["The coach plays a ball in.","A team scores by completing a wall pass with a target, then doing the same with the target at the opposite end.","Targets play one or two touches.","Rotate targets every 4 minutes."],
  points:["Create an angle so the target can see you.","Receive on the half-turn to play forward.","After the wall pass, switch the focus to the other end at once."],
  progress:"Targets one-touch only.",
  regress:"Any target pass counts as a point.",
  diagram:{w:20, h:20, items:[["N",10,0.5],["N",10,19.5],["A",6,6],["A",14,8],["A",9,13],["D",8,9],["D",12,12],["D",5,15],["b",6.7,6.6],["p",6,6,10,0.5],["p",10,0.5,14,8]]}});

d({id:"t-2v2-1-targets", title:"2v2+1 to targets", phase:"Possession", level:"Intermediate", minutes:12, minAge:10, players:"7 (2v2 + 1 + 2 targets)", area:"20 × 15 yd", equipment:"4 cones, balls, bibs",
  skills:["passing","positional_awareness","decision_making"], tips:["I","T"], method:"positional",
  summary:"A 2v2 with a free player and a target at each end: move to make a 3v2 and play through.",
  setup:"A 20 × 15 yard grid with a target on each end line, 2v2 inside, and one neutral who plays for the team in possession.",
  how:["A team keeps the ball with the neutral and tries to play into the target they attack.","A pass into the target scores; the target plays it back to the same team, who now attack the other way.","If the ball is lost, the other team attacks.","Play 2-minute rounds and rotate."],
  points:["Rotate: if a teammate drops, you push on.","Use the free player to make 3v2 near the ball.","Play forward the moment the lane opens."],
  progress:"The neutral is one-touch.",
  regress:"3v2 with a fixed extra attacker.",
  diagram:{w:15, h:20, items:[["N",7.5,0.5],["N",7.5,19.5],["A",5,8],["A",10,12],["D",7,10],["D",11,7],["N",4,14],["b",5.7,8.6],["p",5,8,7.5,0.5]]}});

d({id:"t-rondo-transition", title:"Double rondo with transition", phase:"Possession", level:"Advanced", minutes:15, minAge:12, players:"12", area:"Two 10 × 10 yd squares, 5 yd apart", equipment:"8 cones, balls, bibs",
  skills:["passing","defending","separation_speed"], tips:["I","S"], method:"rondo",
  summary:"4v2 in two squares: the defenders who win it pass to the other square and their team becomes attackers.",
  setup:"Two 10-yard squares 5 yards apart. Each has 4 attackers and 2 defenders; teams are split across both squares.",
  how:["Each square plays 4v2.","When defenders win the ball, they pass to their team in the other square.","The team that lost it sends two players sprinting into the other square to defend.","Points for 8 passes in a row and for each successful transfer pass."],
  points:["React within two seconds of losing it.","After winning it, the first pass goes to the other square, fast.","Attackers keep the ball moving to stop the press."],
  progress:"Two touches maximum.",
  regress:"5v2 in each square.",
  diagram:{w:25, h:12, items:[["z",0,1,10,10],["z",15,1,10,10],["A",5,1.5],["A",9.5,6],["A",5,10.5],["A",0.5,6],["D",4,5],["D",6,7],["A",20,1.5],["A",24.5,6],["D",19,5],["D",21,7],["p",6,7,20,1.5],["r",5,10,18,6,0.3]]}});

d({id:"t-positional-4v4-3", title:"Positional game 4v4 + 3", phase:"Possession", level:"Advanced", minutes:20, minAge:13, players:"11", area:"30 × 20 yd", equipment:"4 cones, balls, 3 bib colours",
  skills:["passing","positional_awareness","decision_making"], tips:["I","T"], method:"positional",
  summary:"Two teams of 4 plus 3 neutrals: positional play with width, depth and a player between the lines.",
  setup:"A 30 × 20 yard area with neutrals on each end line and one in the middle. Two teams of 4.",
  how:["The team in possession plays 7v4 with the neutrals.","Score by playing from one end neutral to the other through the middle neutral.","Neutrals have two touches; the middle one should face forward.","If the defenders win it, they become the team in possession at once."],
  points:["Width and depth: always someone wide, someone deep, someone in between.","Find the middle player between the lines.","When the ball is lost, press straight away."],
  progress:"Neutrals one-touch; 8 passes before a goal counts.",
  regress:"Score by any end-to-end pass.",
  diagram:{w:30, h:20, items:[["N",15,0.5],["N",15,19.5],["N",15,10],["A",4,4],["A",26,4],["A",5,16],["A",25,15],["D",10,6],["D",20,7],["D",11,13],["D",19,13],["b",15,1.3],["p",15,0.5,15,10],["p",15,10,15,19.5]]}});

d({id:"t-three-zone", title:"Three-zone build-up game", phase:"Possession", level:"Advanced", minutes:20, minAge:13, players:"14 to 18", area:"50 × 35 yd, three zones", equipment:"Cones, balls, bibs, goal",
  skills:["passing","positional_awareness","tactical_understanding"], tips:["I","T"], method:"positional",
  summary:"The ball must go through all three zones before a team can score: build-up, midfield and attack.",
  setup:"A 50 × 35 yard field split into three zones with a goal at one end and an end zone at the other.",
  how:["One team builds from the back zone, through midfield, to the final zone.","They must complete a pass in every zone before shooting.","If the defending team wins it, they score by dribbling into the end zone.","Swap roles every 6 minutes."],
  points:["Speed of play: the ball moves faster than the defence.","Body shape to receive facing forward.","Provide width in every zone."],
  progress:"No passes back into a zone once you've left it.",
  regress:"The keeper joins the build-up as an extra player.",
  diagram:{w:35, h:50, items:[["G",17.5,0,"top"],["K",17.5,2],["z",0,0,35,16],["z",0,16,35,18],["z",0,34,35,16],["A",8,44],["A",27,44],["A",17,26],["A",6,24],["A",29,26],["A",17,9],["D",15,30],["D",20,22],["D",12,12],["b",8.7,44.6],["p",8,44,17,26],["p",17,26,29,26],["p",29,26,17,9]]}});

d({id:"t-between-lines", title:"Receive between the lines 4v2 + 2", phase:"Possession", level:"Advanced", minutes:15, minAge:13, players:"8", area:"20 × 20 yd", equipment:"4 cones, balls, bibs",
  skills:["first_touch","positional_awareness","vision"], tips:["I","T"], method:"positional",
  summary:"Four outside players and two inside players find the gap between two defenders.",
  setup:"A 20-yard square. Four attackers on the edges, two attackers inside, and two defenders.",
  how:["Outside players keep the ball and look to pass into an inside player between the defenders.","The inside player must turn and play out to a different side.","Each successful 'in-turn-out' scores a point.","Defenders who win it swap with the player who lost it."],
  points:["Inside players: move into the gap the moment it opens.","Scan before receiving so you know which way to turn.","Outside players: be patient and wait for the lane."],
  progress:"Inside players must turn with one touch.",
  regress:"One defender only.",
  diagram:{w:20, h:20, items:[["A",10,0.5],["A",19.5,10],["A",10,19.5],["A",0.5,10],["N",8,10],["N",12,10],["D",7,7],["D",13,13],["b",10,1.3],["p",10,0.5,12,10],["p",12,10,19.5,10]]}});

d({id:"t-switch-6v6", title:"Switch-play game 6v6 + 2", phase:"Possession", level:"Advanced", minutes:20, minAge:13, players:"14", area:"40 × 30 yd", equipment:"Cones, balls, bibs",
  skills:["passing","vision","tactical_understanding"], tips:["I","T"], method:"positional",
  summary:"Two neutral wingers play for the team with the ball; switching from one winger to the other scores.",
  setup:"A 40 × 30 yard area with a 5-yard channel down each side. A neutral winger in each channel; 6v6 inside.",
  how:["The team in possession uses both wingers.","A pass that goes from one winger to the other (through any players) scores a point.","Wingers have two touches and can't be tackled in their channel.","Play 5-minute games."],
  points:["Draw the defence to one side, then switch quickly.","Move the ball in two or three passes, not ten.","The far-side players stay wide until the switch."],
  progress:"Wingers one-touch, or a direct winger-to-winger pass counts double.",
  regress:"5v5 + 2.",
  diagram:{w:40, h:30, items:[["z",0,0,5,30],["z",35,0,5,30],["N",2.5,15],["N",37.5,15],["A",12,8],["A",20,15],["A",28,22],["D",15,12],["D",24,18],["D",22,9],["b",3.3,15.6],["p",2.5,15,20,15],["p",20,15,37.5,15]]}});

d({id:"t-midfield-rotations", title:"Midfield rotations: 3v3 to targets", phase:"Possession", level:"Advanced", minutes:15, minAge:14, players:"10", area:"30 × 30 yd", equipment:"Cones, balls, bibs",
  skills:["positional_awareness","tactical_understanding","communication"], tips:["I","T"], method:"positional",
  summary:"A midfield three rotates to get free from a marking three and play into a target at the far end.",
  setup:"A 30-yard square. 3v3 in the middle and two targets on each end line (like centre-backs and forwards).",
  how:["A target starts the ball into the midfield three.","They rotate positions to escape their markers and play into the far targets.","A successful forward pass scores; the far target restarts the other way.","If the ball is lost, the other three attack."],
  points:["The closest midfielder to the ball decides the movement; the others react.","If one drops, another pushes on.","Third-man movement: the free player is often the one not looking for the ball."],
  progress:"Add one extra defender to make it 3v4.",
  regress:"Add a neutral to make it 4v3.",
  diagram:{w:30, h:30, items:[["N",10,0.5],["N",20,0.5],["N",10,29.5],["N",20,29.5],["A",10,20],["A",20,18],["A",15,12],["D",12,16],["D",18,13],["D",15,22],["b",10.7,20.6],["r",15,12,22,11,0.3],["p",10,20,22,11],["p",22,11,20,0.5]]}});

d({id:"t-8v4-box", title:"8v4 box", phase:"Possession", level:"Advanced", minutes:15, minAge:12, players:"12 (three teams of 4)", area:"15 × 15 yd", equipment:"4 cones, balls, 3 bib colours",
  skills:["passing","first_touch","defending"], tips:["T","I"], method:"rondo",
  summary:"Two teams keep the ball in a tight box against four defenders who press at full intensity.",
  setup:"A 15-yard square. One team of 4 on the edges, one team of 4 inside, and 4 defenders.",
  how:["The 8 attackers keep the ball under heavy pressure.","Inside players must be used: a pass that goes edge-inside-edge scores.","Defenders score by winning it and passing to the coach.","Rotate the three teams every 90 seconds."],
  points:["Quick decisions: know your next pass before receiving.","Inside players stay apart so the defenders can't mark two at once.","Defenders: press as a group and squeeze the space."],
  progress:"Two touches for all.",
  regress:"A 20-yard box.",
  diagram:{w:16, h:16, items:[["c",0,0],["c",16,0],["c",0,16],["c",16,16],["A",5,0.5],["A",15.5,6],["A",10,15.5],["A",0.5,10],["N",6,6],["N",10,10],["N",6,11],["N",10,5],["D",8,8],["D",4,9],["D",12,7],["D",8,13],["p",5,0.5,6,6],["p",6,6,15.5,6]]}});

d({id:"t-break-lines", title:"Break the lines: four-zone game", phase:"Possession", level:"Advanced", minutes:20, minAge:13, players:"14 to 16", area:"40 × 28 yd, four zones", equipment:"Cones, balls, bibs, 2 goals",
  skills:["passing","positional_awareness","tactical_understanding"], tips:["I","T"], method:"positional",
  summary:"Players are locked in zones, like a table-football team, so every pass forward has to break a line.",
  setup:"A 40 × 28 yard field split into four zones across. Each team has players in alternate zones: defence, midfield, attack. Keepers in goals.",
  how:["Players must stay in their zone.","A team scores only after the ball has been passed through every one of its zones.","Line-breaking passes (skipping a zone) count double if they lead to a goal.","After 5 minutes, one player per team may move one zone forward."],
  points:["Find the gap between the opposing line's players.","Receive side-on so you can play forward first time.","Defending lines stay compact to block passes through."],
  progress:"One touch in the final zone.",
  regress:"An extra player in the midfield zone for the team with the ball.",
  diagram:{w:28, h:40, items:[["G",14,0,"top"],["G",14,40,"bottom"],["z",0,0,28,10],["z",0,10,28,10],["z",0,20,28,10],["z",0,30,28,10],["A",8,35],["A",20,35],["A",9,15],["A",19,15],["D",8,25],["D",20,25],["D",14,5],["b",8.7,35.6],["p",8,35,14,15]]}});
/* ---------------- finishing ---------------- */
d({id:"t-shoot-two-lines", title:"Dribble and shoot, two lines", phase:"Finishing", level:"Beginner", minutes:12, minAge:6, players:"6 to 12", area:"25 × 20 yd", equipment:"Goal, 4 cones, balls",
  skills:["shooting","dribbling"], tips:["T"], method:"finishing",
  summary:"Two lines take turns to dribble in and shoot: simple, lots of shots, both feet.",
  setup:"A goal (with a keeper if you have one). Two lines 20 yards out, one left and one right, each with balls.",
  how:["The first player in a line dribbles in and shoots before a cone 10 yards out.","The lines alternate.","Players fetch their ball and join the other line, so they shoot with both feet.","Then add a skill move at a cone before the shot."],
  points:["Look up to see the goal and the keeper before shooting.","Plant foot beside the ball, toe pointing at the target.","Strike with the laces, ankle locked."],
  progress:"Shoot with the first touch after a pass from the coach.",
  regress:"Shoot from closer with a big goal and no keeper.",
  diagram:{w:24, h:24, items:[["G",12,0,"top"],["K",12,1.6],["c",5,22],["c",19,22],["c",5,12],["c",19,12],["A",5,22],["A",19,22],["b",5,21],["d",5,21,8,12],["s",8,12,10,1]]}});

d({id:"t-1v1-attack", title:"1v1 to a goal", phase:"Finishing", level:"Beginner", minutes:12, minAge:7, players:"6 to 12", area:"20 × 15 yd", equipment:"2 small goals or a goal, cones, balls",
  skills:["dribbling","shooting","skill_moves"], tips:["T","P"], method:"wave",
  summary:"Attacker against defender to a goal: be brave, take players on and finish.",
  setup:"A 20 × 15 yard area with a goal at one end. Attackers line up at the far end; defenders beside the goal with the balls.",
  how:["The defender passes to the attacker and runs out to defend.","The attacker tries to beat them and score.","If the defender wins it, they can score by dribbling over the far line.","Swap lines after each go."],
  points:["Attack the defender at speed; make them commit.","Use a move, then change pace.","Shoot early if there's a gap."],
  progress:"Limit to 6 seconds to score.",
  regress:"The defender starts further away.",
  diagram:{w:15, h:20, items:[["G",7.5,0,"top"],["A",7.5,18],["D",7.5,4],["b",7.5,17],["p",7.5,4,7.5,17],["d",7.5,17,10,9],["s",10,9,8.5,1]]}});

d({id:"t-2v1-goal", title:"2v1 to goal", phase:"Finishing", level:"Beginner", minutes:15, minAge:8, players:"9 to 12", area:"25 × 20 yd", equipment:"Goal, cones, balls, bibs",
  skills:["passing","dribbling","decision_making"], tips:["I","T"], method:"wave",
  summary:"Two attackers against one defender: learn when to dribble and when to pass.",
  setup:"A goal with a keeper. Pairs of attackers start 25 yards out; a defender starts 10 yards from goal.",
  how:["The pair attacks the goal at speed.","They can dribble, pass or play a one-two to get past the defender.","The defender tries to win it and pass to the coach.","Rotate: attackers become the next defenders."],
  points:["Draw the defender toward you, then pass.","Supporting player: stay level or slightly ahead, and wide.","If the defender doesn't come, keep dribbling and shoot."],
  progress:"Limit to 8 seconds, or a second defender chases from behind.",
  regress:"The defender only shadows.",
  diagram:{w:20, h:25, items:[["G",10,0,"top"],["K",10,1.6],["A",6,22],["A",14,22],["D",10,10],["b",6.7,21.4],["d",6,22,8,13],["p",8,13,14,11],["s",14,11,11,1]]}});

d({id:"t-turn-shoot-4goals", title:"Turn and shoot, four goals", phase:"Finishing", level:"Beginner", minutes:12, minAge:8, players:"8 to 12", area:"30 × 30 yd", equipment:"4 small goals, cones, balls",
  skills:["first_touch","dribbling","shooting"], tips:["T"], method:"finishing",
  summary:"Players dribble into a middle box, turn and shoot at one of four goals.",
  setup:"A 30-yard square with a small goal in the middle of each side and a 10-yard box in the centre. A line of players next to each goal.",
  how:["One player from each line dribbles into the middle box.","They turn with the move the coach calls and shoot at any goal except their own.","They collect the ball and join the line at the goal they shot at.","Change the turn every round."],
  points:["Head up as you leave the box to pick a goal.","Turn sharply and accelerate out.","Strike low and hard into the goal."],
  progress:"A defender in the box tries to block.",
  regress:"No box: dribble and shoot.",
  diagram:{w:30, h:30, items:[["mg",15,0.5,"h"],["mg",15,29.5,"h"],["mg",0.5,15,"v"],["mg",29.5,15,"v"],["z",10,10,10,10],["A",11,2],["A",28,11],["A",19,28],["A",2,19],["d",11,2,13,12],["s",13,12,28.5,15]]}});

d({id:"t-close-goal-4v4", title:"4v4 close-goal shooting game", phase:"Finishing", level:"Beginner", minutes:15, minAge:8, players:"8 to 12", area:"30 × 20 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["shooting","first_touch","decision_making"], tips:["T","P"], method:"finishing",
  summary:"A short, wide pitch so players can shoot from anywhere: lots of shots and rebounds.",
  setup:"A 30-yard wide, 20-yard long pitch with a goal and keeper at each end. 4v4, with a team waiting to rotate in.",
  how:["Play a normal game.","Shots from your own half count double.","Every rebound must be followed in.","Rotate teams every 3 minutes."],
  points:["Shoot at the first chance: don't overplay.","Hit the target; keepers spill shots.","Follow every shot for the rebound."],
  progress:"Goals only count from a first-time shot.",
  regress:"No keepers and bigger goals.",
  diagram:{w:30, h:20, items:[["G",15,0,"top"],["G",15,20,"bottom"],["K",15,1.4],["K",15,18.6],["A",8,12],["A",20,14],["D",12,8],["D",22,6],["b",8.7,12.5],["s",8,12,14,1]]}});

d({id:"t-shooting-activation", title:"Shooting activation in pairs", phase:"Finishing", level:"Intermediate", minutes:12, minAge:9, players:"Pairs", area:"20 × 20 yd", equipment:"Cones, balls",
  skills:["shooting","first_touch","passing"], tips:["T"], method:"finishing",
  summary:"Partners strike to each other through a cone gate: preparation touch, then a clean strike.",
  setup:"Pairs 15 yards apart with a 2-yard cone gate halfway between them.",
  how:["Player 1 strikes the ball through the gate with the laces.","Player 2 receives with a preparation touch to the side and strikes back.","Round 2: inside of the foot. Round 3: first-time strikes.","Swap feet every 5 strikes."],
  points:["Look up before you strike.","Toe points at the target, ankle locked.","Preparation touch sets the ball a step in front, slightly to the side."],
  progress:"A smaller gate or 20 yards apart.",
  regress:"A bigger gate and 10 yards apart.",
  diagram:{w:20, h:8, items:[["c",10,3],["c",10,5],["A",2,4],["A",18,4],["b",3,4],["s",2,4,18,4]]}});

d({id:"t-three-line-finishing", title:"Three-line finishing", phase:"Finishing", level:"Intermediate", minutes:15, minAge:10, players:"9 to 12", area:"Edge of the box", equipment:"Goal, 3 cones, balls",
  skills:["shooting","first_touch","decision_making"], tips:["T"], method:"finishing",
  summary:"Three lines, three different finishes: a long shot, a one-two finish and a wide cut-in.",
  setup:"A goal and keeper. Three cones 20 to 25 yards out: left, centre and right. A line at each with balls.",
  how:["Centre line: dribble and shoot from outside the box.","Left line: one-two with the centre player and finish first time.","Right line: dribble in from wide, cut inside and curl at the far post.","Rotate lines every 4 minutes."],
  points:["Pick your spot before you strike.","Keep the shot low and on target.","Follow in for rebounds."],
  progress:"Add a defender who closes down from the edge of the box.",
  regress:"Shoot from 14 yards.",
  diagram:{w:40, h:30, items:[["G",20,0,"top"],["K",20,1.6],["c",8,26],["c",20,26],["c",32,26],["A",8,26],["A",20,26],["A",32,26],["d",20,26,20,18],["s",20,18,17,1],["d",32,26,26,14],["s",26,14,16,1]]}});

d({id:"t-3v2-waves", title:"3v2 attacking waves", phase:"Finishing", level:"Intermediate", minutes:15, minAge:10, players:"12 to 15", area:"40 × 30 yd", equipment:"Goal, cones, balls, bibs",
  skills:["passing","decision_making","positional_awareness"], tips:["I","T"], method:"wave",
  summary:"Three attackers against two defenders in waves: width, depth and when to penetrate.",
  setup:"A goal and keeper. Attackers in threes at halfway; defenders in pairs by the post.",
  how:["The first attacker passes to the second, who plays the third. The three attack at speed.","Two defenders run out to defend the goal.","Attackers have 12 seconds to score.","The next three go as soon as the wave ends."],
  points:["One player gives width on each side; one gives depth.","Attack space at speed with and without the ball.","Penetrate when it's on; keep it when it isn't."],
  progress:"A third defender recovers from behind after 3 seconds.",
  regress:"3v1.",
  diagram:{w:30, h:40, items:[["G",15,0,"top"],["K",15,1.6],["A",5,30],["A",15,32],["A",25,30],["D",11,12],["D",19,12],["b",15.7,31.4],["p",15,32,5,30],["r",25,30,27,16,0.2],["p",5,30,15,18],["s",15,18,13,1]]}});

d({id:"t-finishing-combo", title:"Combination and finish", phase:"Finishing", level:"Intermediate", minutes:15, minAge:10, players:"10 to 12", area:"30 × 30 yd", equipment:"Goal, cones, balls",
  skills:["passing","shooting","positional_awareness"], tips:["T","I"], method:"finishing",
  summary:"A set passing pattern that ends in a first-time shot, so finishing happens after movement.",
  setup:"A goal and keeper. A starting line 30 yards out, a 'wall' player at the top of the box and a wide player.",
  how:["The starter passes into the wall player and runs.","The wall player lays it wide; the wide player plays it into the box.","The starter finishes first time.","Rotate positions after each go; run it from both sides."],
  points:["Time your run to arrive as the ball does.","Lay-offs weighted into stride.","Finish across the keeper, low."],
  progress:"Add a defender who tracks the runner.",
  regress:"Allow a touch before the shot.",
  diagram:{w:30, h:30, items:[["G",15,0,"top"],["K",15,1.6],["A",15,28],["A",15,16],["A",26,14],["b",15.7,27.4],["p",15,28,15,16],["p",15,16,26,14],["r",16,27,19,8,0.3],["p",26,14,19,8],["s",19,8,14,1]]}});

d({id:"t-cross-finish", title:"Wide play, cross and finish", phase:"Finishing", level:"Intermediate", minutes:20, minAge:11, players:"10 to 14", area:"Half field", equipment:"Goal, cones, balls",
  skills:["passing","shooting","positional_awareness"], tips:["T","I"], method:"finishing",
  summary:"A winger receives, beats a cone and crosses for two runners attacking near and far post.",
  setup:"A goal and keeper. A winger on each side, two lines of strikers 25 yards out, and a server in the middle.",
  how:["The server passes wide to the winger.","The winger dribbles to the byline area and crosses.","Two strikers attack the near post and far post.","Alternate sides; rotate wingers and strikers."],
  points:["Cross early or from the byline: don't let the ball stand still.","Strikers arrive late and at pace, one near and one far.","Attack the ball; don't wait for it."],
  progress:"Add two defenders in the box.",
  regress:"Cross from a stationary ball.",
  diagram:{w:44, h:32, items:[["G",22,0,"top"],["K",22,1.6],["A",22,28],["A",4,18],["A",18,22],["A",26,22],["b",22,27],["p",22,28,4,18],["d",4,18,4,5],["p",4,5,19,5],["r",18,22,19,6,0.2],["r",26,22,28,7,-0.2]]}});

d({id:"t-turn-shoot", title:"Turn and shoot with a defender", phase:"Finishing", level:"Intermediate", minutes:15, minAge:11, players:"8 to 10", area:"25 × 30 yd", equipment:"Goal, cones, balls, bibs",
  skills:["first_touch","shooting","physicality"], tips:["T","P"], method:"finishing",
  summary:"A striker receives with their back to goal, a defender tight behind, and must turn and score.",
  setup:"A goal and keeper. A striker at the top of the box with a defender behind them; a midfielder 20 yards out with balls.",
  how:["The midfielder passes into the striker's feet.","The striker turns (or lays it back for the midfielder to shoot).","The defender may tackle from the first touch.","The striker has 8 seconds to get a shot away."],
  points:["Feel the defender before the ball arrives.","Turn away from the pressure.","If the turn isn't on, lay it off and spin for the return."],
  progress:"The defender starts goal-side and can step in front.",
  regress:"The defender is passive until the turn.",
  diagram:{w:30, h:30, items:[["G",15,0,"top"],["K",15,1.6],["A",15,26],["A",15,12],["D",15,9.5],["b",15.6,25.4],["p",15,26,15,12.6],["d",15,12,19,10],["s",19,10,17,1]]}});

d({id:"t-overlap-2v1-wing", title:"Overlap 2v1 down the wing", phase:"Finishing", level:"Intermediate", minutes:15, minAge:11, players:"10 to 14", area:"Half field", equipment:"Goal, cones, balls, bibs",
  skills:["passing","separation_speed","communication"], tips:["I","S"], method:"wave",
  summary:"A winger and an overlapping full-back beat a defender on the wing and cross for a striker.",
  setup:"A goal and keeper. A winger with a ball, a full-back behind them, a defender facing them, and a striker in the middle.",
  how:["The winger dribbles at the defender.","The full-back overlaps around the outside, calling for it.","The winger passes into the overlap or cuts inside if the defender follows the runner.","The ball is crossed or cut back for the striker."],
  points:["Call 'overlap' loud and early.","The winger drives inside to pull the defender before passing.","Cross before the defender recovers."],
  progress:"Add a second defender against the striker.",
  regress:"The defender is passive.",
  diagram:{w:40, h:34, items:[["G",20,0,"top"],["K",20,1.6],["A",7,22],["A",5,30],["D",9,16],["A",20,18],["b",7.7,21.4],["d",7,22,10,17],["r",5,30,3,10,-0.3],["p",10,17,4,10],["p",4,6,18,6]]}});

d({id:"t-3v2-small-goals", title:"3v2 to small goals", phase:"Finishing", level:"Intermediate", minutes:15, minAge:9, players:"10 to 15", area:"30 × 20 yd", equipment:"3 small goals, cones, balls, bibs",
  skills:["decision_making","passing","dribbling"], tips:["I","T"], method:"wave",
  summary:"Three attack two with three small goals to choose from: read the defence and attack the open goal.",
  setup:"A 30 × 20 yard area with three small goals on one end line. Attackers start at the other end; defenders by the goals.",
  how:["The coach passes to the attackers; two defenders run out.","Attackers can score in any of the three goals.","Defenders score by passing into the coach.","New groups go every 30 seconds."],
  points:["Look up: which goal is the defence leaving open?","Overload one side, then switch.","Shoot as soon as the goal is open."],
  progress:"Only one goal counts, called by the coach as the attack starts.",
  regress:"3v1.",
  diagram:{w:30, h:20, items:[["mg",5,0.5,"h"],["mg",15,0.5,"h"],["mg",25,0.5,"h"],["A",8,17],["A",15,18],["A",22,17],["D",12,7],["D",18,7],["b",15.7,17.4],["p",15,18,22,17],["d",22,17,24,6],["s",24,6,25,1]]}});

d({id:"t-1v1-back-to-goal", title:"1v1 back to goal", phase:"Finishing", level:"Intermediate", minutes:15, minAge:11, players:"6 to 10", area:"45 × 40 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["first_touch","dribbling","shooting"], tips:["T","P"], method:"wave",
  summary:"Receive with your back to goal and a defender behind, then beat them and get a shot away.",
  setup:"Two goals with keepers, offset on opposite ends. Attackers start 20 yards from goal facing away; the server is behind the far goal.",
  how:["The server plays to the attacker's feet.","The defender closes in from behind.","The attacker turns or uses the defender's momentum to escape, and shoots.","Lines rotate: attacker to defender to server."],
  points:["Check away, then come short to receive.","First touch sets up the turn.","Shoot the moment you're past."],
  progress:"Six seconds to shoot.",
  regress:"The defender starts 3 yards back.",
  diagram:{w:40, h:45, items:[["G",12,0,"top"],["G",28,45,"bottom"],["K",12,1.6],["K",28,43.4],["A",12,20],["D",12,23],["N",28,40],["b",27,39.4],["p",28,40,12,20.6],["d",12,20,16,11],["s",16,11,13,1]]}});

d({id:"t-corners", title:"Set pieces: corners", phase:"Finishing", level:"Intermediate", minutes:20, minAge:11, players:"12 to 18", area:"Penalty area", equipment:"Goal, balls, bibs",
  skills:["shooting","positional_awareness","communication"], tips:["I","P"], method:"setpieces",
  summary:"Rehearse attacking and defending corners: who runs where, who marks whom, who takes it.",
  setup:"A goal and keeper. Attackers and defenders in the box; a taker at each corner.",
  how:["Walk through two corner routines: near-post flick and far-post run.","Practise each 5 times against passive defenders.","Then live: the defending team marks; a goal or a clearance ends the rep.","Swap roles after 10 corners."],
  points:["Each attacker knows their starting spot and their run.","Time runs to arrive with the ball, not before it.","Defenders: body between your player and the goal; attack the ball."],
  progress:"Add a short-corner option.",
  regress:"Throw the ball in instead of kicking it.",
  diagram:{w:44, h:20, items:[["G",22,0,"top"],["K",22,1.6],["A",44,0.5],["A",18,12],["A",26,13],["A",22,16],["D",19,9],["D",25,10],["D",22,5],["p",44,0.5,19,4],["r",18,12,18,5,0.2],["r",26,13,27,5,-0.2]]}});

d({id:"t-gk-shooting", title:"Shooting from three angles", phase:"Finishing", level:"Intermediate", minutes:15, minAge:10, players:"Keepers + 8 to 12", area:"Edge of the box", equipment:"Goal, coloured cones, balls",
  skills:["shooting","gk_shot_stopping","gk_positioning"], tips:["T"], method:"finishing",
  summary:"The coach calls a colour and players shoot from that angle: keepers adjust their position for every shot.",
  setup:"A goal and keeper. Three coloured cone areas 16 to 20 yards out: left, centre, right.",
  how:["The coach calls a colour; the next shooter dribbles to that area and shoots.","The keeper shuffles to the right position for the angle.","Shooters collect their ball and join the line.","Change keepers every 10 shots."],
  points:["Shooters: low and to the corners.","Keepers: set your feet before the strike, on the line between ball and centre of goal.","Keepers: catch or parry wide, never back into the middle."],
  progress:"A second shooter follows in for rebounds.",
  regress:"Two angles only.",
  diagram:{w:40, h:26, items:[["G",20,0,"top"],["K",20,1.6],["c",8,18],["c",20,20],["c",32,18],["A",8,24],["A",20,24],["A",32,24],["d",32,24,30,18],["s",30,18,21,1]]}});

d({id:"t-2v2-shooting", title:"2v2 shooting game: 10 seconds", phase:"Finishing", level:"Intermediate", minutes:15, minAge:9, players:"8 to 12", area:"30 × 20 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["shooting","decision_making","separation_speed"], tips:["S","P"], method:"finishing",
  summary:"The coach plays a ball into a corner and 2v2 has 10 seconds to get a shot on goal.",
  setup:"A 30 × 20 yard area with a goal and keeper at each end. Teams of 2 wait at the corners.",
  how:["The coach plays a ball into a corner; a pair from each team sprints on.","Whoever wins it has 10 seconds to shoot.","The other pair defends; if they win it, they attack the other goal with 10 seconds.","New pairs every 30 seconds."],
  points:["Off-the-ball player: find space wide and apart from your partner.","Player on the ball: shoot if you see the goal, pass if you don't.","React fast when the ball changes hands."],
  progress:"Six seconds to shoot.",
  regress:"No time limit.",
  diagram:{w:30, h:20, items:[["G",15,0,"top"],["G",15,20,"bottom"],["K",15,1.4],["K",15,18.6],["N",30,10],["A",22,13],["A",12,14],["D",18,8],["D",10,6],["b",22.7,12.5],["p",30,10,22,13],["s",22,13,16,1]]}});

d({id:"t-final-third", title:"Final-third combinations 4v3", phase:"Finishing", level:"Advanced", minutes:20, minAge:13, players:"8 to 12", area:"35 × 30 yd", equipment:"Goal, cones, balls, bibs",
  skills:["passing","decision_making","tactical_understanding"], tips:["I","T"], method:"finishing",
  summary:"A striker, a number 10 and two wingers break down three defenders with set and run combinations.",
  setup:"A goal and keeper. A 35 × 30 yard area at the top of the box. Four attackers against three defenders.",
  how:["The coach plays into the striker, whose movement triggers the pass.","The attackers combine: lay-off to the 10, third-man run, overlap or switch.","Twelve seconds to score; defenders score by countering through a gate at halfway.","Run 6 attacks, then swap the defenders."],
  points:["The striker's movement opens the space for others.","Move the ball quickly in the final third: two touches.","Someone is always running beyond the ball."],
  progress:"A fourth defender joins after 4 seconds.",
  regress:"4v2.",
  diagram:{w:35, h:30, items:[["G",17.5,0,"top"],["K",17.5,1.6],["A",17,10],["A",17,20],["A",5,14],["A",30,14],["D",14,8],["D",21,8],["D",17,14],["b",17,19],["p",17,20,17,10.6],["p",17,10,15,15],["r",5,14,10,5,-0.2]]}});

d({id:"t-cross-angles", title:"Crossing from different angles", phase:"Finishing", level:"Advanced", minutes:20, minAge:13, players:"10 to 14", area:"Final third", equipment:"Goal, coloured cones, balls",
  skills:["passing","shooting","positional_awareness"], tips:["T","I"], method:"finishing",
  summary:"Crossers numbered 1 to 4 deliver from different spots; strikers read each cross and attack the right zone.",
  setup:"A goal and keeper. Four crossers: two deep at the byline, two early from the edge of the box. Strikers start at the top of the box.",
  how:["The coach calls a number; that crosser receives and delivers.","Strikers attack near post, far post and the penalty spot.","Byline crosses: cut-back or near-post. Early crosses: in behind the defence.","Add two defenders after 8 crosses."],
  points:["Crossers: look up before you cross; aim for space, not players.","Strikers arrive late and fast, across the defender's front.","Keep one striker for the cut-back."],
  progress:"Defenders are fully live.",
  regress:"No defenders.",
  diagram:{w:44, h:30, items:[["G",22,0,"top"],["K",22,1.6],["A",3,2],["A",41,2],["A",5,16],["A",39,16],["A",18,20],["A",26,20],["A",22,24],["p",3,2,17,6],["r",18,20,17,6,0.2],["r",26,20,28,6,-0.2],["r",22,24,22,12,0]]}});

d({id:"t-second-ball", title:"Second balls and rebounds", phase:"Finishing", level:"Advanced", minutes:15, minAge:12, players:"10", area:"Penalty area", equipment:"Goal, balls, bibs",
  skills:["shooting","separation_speed","physicality"], tips:["S","P"], method:"finishing",
  summary:"The coach shoots from distance; three attackers and two defenders fight for the rebound or save.",
  setup:"A goal and keeper. The coach 20 yards out with balls. Three attackers and two defenders in the box.",
  how:["The coach shoots; everyone reacts to the keeper's save or the rebound.","Attackers have 6 seconds to score.","Defenders clear the ball out of the box.","Rotate roles every 5 reps."],
  points:["Attack the space in front of the keeper: expect every shot to be saved.","Stay on your toes after the shot.","Defenders: get goal-side and block the rebound."],
  progress:"The coach also crosses or chips without warning.",
  regress:"No defenders.",
  diagram:{w:40, h:22, items:[["G",20,0,"top"],["K",20,1.6],["N",20,20],["A",15,10],["A",22,9],["A",27,12],["D",18,7],["D",24,6],["s",20,20,21,1],["r",15,10,18,4,0.2],["r",22,9,21,4,0]]}});

d({id:"t-cutback-zones", title:"Cutback zones", phase:"Finishing", level:"Advanced", minutes:20, minAge:13, players:"10 to 14", area:"Final third", equipment:"Goal, cones, balls, bibs",
  skills:["passing","positional_awareness","shooting"], tips:["I","T"], method:"finishing",
  summary:"A wide player reaches the byline and cuts the ball back to runners in three marked zones.",
  setup:"A goal and keeper. Mark three zones: near post, penalty spot and the edge of the box. Two wide players and three runners.",
  how:["A wide player is played in behind and drives to the byline.","Three runners fill the three zones, arriving as the cut-back comes.","Score double for a goal from the penalty-spot zone.","Add two recovering defenders after 6 reps."],
  points:["Runners stagger their runs so all three zones are filled.","The wide player looks up before cutting back.","Finish first time, low."],
  progress:"Defenders start level with the runners.",
  regress:"No defenders; the wide player starts at the byline.",
  diagram:{w:44, h:26, items:[["G",22,0,"top"],["K",22,1.6],["z",15,2,7,5],["z",19,9,7,5],["z",17,16,9,5],["A",40,3],["A",16,22],["A",24,23],["A",30,24],["b",39.3,3.5],["p",40,3,22,11],["r",16,22,18,4,0.2],["r",24,23,22,11,0],["r",30,24,22,18,-0.2]]}});

d({id:"t-target-striker", title:"3v3 plus a target striker", phase:"Finishing", level:"Advanced", minutes:20, minAge:12, players:"10 to 12", area:"36 × 30 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["passing","first_touch","shooting"], tips:["I","T"], method:"finishing",
  summary:"Each team has a target striker who holds the ball up and lays it off for runners to finish.",
  setup:"A 36 × 30 yard field with goals and keepers. 3v3 in the middle; each team has a target striker who stays in the attacking half.",
  how:["Teams try to play into their target striker.","The striker holds it up and sets it for a runner to shoot.","A goal from a set-and-shoot combination counts double.","Rotate the strikers every 4 minutes."],
  points:["Striker: show for the ball and protect it with your body.","Runners: arrive at an angle to the set, not straight at it.","Shoot first time from the set."],
  progress:"Targets have one touch.",
  regress:"Strikers can't be tackled.",
  diagram:{w:30, h:36, items:[["G",15,0,"top"],["G",15,36,"bottom"],["K",15,1.4],["K",15,34.6],["A",15,9],["D",15,27],["A",10,20],["A",21,19],["D",12,14],["D",19,24],["b",10.7,20.6],["p",10,20,15,9.6],["p",15,9,19,12],["s",19,12,16,1]]}});
/* ---------------- defending ---------------- */
d({id:"t-1v1-defend", title:"1v1 defending channel", phase:"Defending", level:"Beginner", minutes:12, minAge:8, players:"6 to 12", area:"20 × 10 yd channel", equipment:"4 cones, balls, bibs",
  skills:["defending","physicality"], tips:["T","P"], method:"defending",
  summary:"The defender passes to the attacker, closes them down and stops them dribbling over the line.",
  setup:"A 20 × 10 yard channel. Defenders with balls on one end line, attackers on the other.",
  how:["The defender passes to the attacker and sprints out.","The attacker tries to dribble over the defender's line.","The defender tries to win it or push the attacker out of the channel.","Swap lines after each go."],
  points:["Sprint to close, then slow down with short steps.","Side-on, knees bent, on your toes.","Watch the ball, not the attacker's feet tricks."],
  progress:"The attacker scores in one of two small goals instead of over a line.",
  regress:"A narrower channel.",
  diagram:{w:12, h:20, items:[["c",1,1],["c",11,1],["c",1,19],["c",11,19],["D",6,1.5],["A",6,18.5],["b",6,17.6],["r",6,2,6,12,0],["d",6,18,8,13]]}});

d({id:"t-defend-gate", title:"Guard the gate 1v1", phase:"Defending", level:"Beginner", minutes:12, minAge:7, players:"Pairs", area:"20 × 20 yd", equipment:"Cones for 6 gates, a ball per pair",
  skills:["defending","dribbling"], tips:["T","P"], method:"defending",
  summary:"In pairs, one dribbles and tries to score through any gate; the partner defends.",
  setup:"Six gates, 2 yards wide, around a 20-yard square. Pairs share a ball.",
  how:["The attacker dribbles and tries to score by dribbling through a gate.","The defender tries to stop them and win the ball.","If the defender wins it, roles swap.","Count goals in 90 seconds, then swap anyway."],
  points:["Stay between the attacker and the gate.","Be patient; tackle when the ball is away from their foot.","Recover quickly if you get beaten."],
  progress:"Only two gates count, called by the coach.",
  regress:"Smaller gates, so they are easier to guard.",
  diagram:{w:20, h:20, items:[["c",3,4],["c",5,4],["c",15,3],["c",17,3],["c",9,10],["c",11,10],["c",3,16],["c",5,16],["c",15,17],["c",17,17],["A",8,6],["D",9,8],["b",8.7,5.6],["d",8,6,4,4]]}});

d({id:"t-recovery-chase", title:"Recovery run 1v1", phase:"Defending", level:"Beginner", minutes:12, minAge:9, players:"6 to 12", area:"30 × 20 yd", equipment:"Goal, cones, balls, bibs",
  skills:["defending","separation_speed","sprint_speed"], tips:["S","P"], method:"defending",
  summary:"The defender starts behind the attacker and must sprint back goal-side before stopping them.",
  setup:"A goal with a keeper. The attacker starts 25 yards out with the ball; the defender starts 3 yards behind them.",
  how:["On the coach's call, the attacker dribbles at goal.","The defender sprints to get back between the attacker and the goal.","Once goal-side, the defender turns and defends.","Attacker gets one shot. Swap roles."],
  points:["Sprint on the line to the near post, not to the ball.","Get goal-side first, then tackle.","Don't dive in from behind."],
  progress:"A second attacker joins for a 2v1.",
  regress:"The defender starts level with the attacker.",
  diagram:{w:20, h:30, items:[["G",10,0,"top"],["K",10,1.6],["A",10,25],["D",12,28],["b",10,24],["d",10,24,11,12],["r",12,28,9,8,0.3]]}});

d({id:"t-2v2-cover", title:"2v2 pressure and cover", phase:"Defending", level:"Intermediate", minutes:15, minAge:10, players:"8 to 12", area:"20 × 15 yd", equipment:"2 small goals, cones, balls, bibs",
  skills:["defending","communication","positional_awareness"], tips:["I","P"], method:"defending",
  summary:"Two defenders learn to work as a pair: one presses the ball, the other covers.",
  setup:"A 20 × 15 yard area with two small goals at each end. Pairs of attackers and defenders.",
  how:["Defenders pass to the attackers and come out together.","The nearest defender presses the ball; the partner covers at an angle behind.","When the ball is passed, the defenders swap roles.","Attackers score in either goal; defenders score by countering."],
  points:["Pressure: close down fast, then slow and side-on.","Cover: a few yards behind and to the side, ready to step in.","Talk: 'I've got ball', 'I'm covering'."],
  progress:"3v2 for the attackers.",
  regress:"Attackers must take two touches before passing.",
  diagram:{w:15, h:20, items:[["mg",4,0.5,"h"],["mg",11,0.5,"h"],["mg",4,19.5,"h"],["mg",11,19.5,"h"],["A",5,15],["A",11,13],["D",6,11],["D",9,8],["b",5.6,14.4],["r",9,8,10,10,0]]}});

d({id:"t-3v3-pcb", title:"3v3 pressure, cover, balance", phase:"Defending", level:"Intermediate", minutes:15, minAge:11, players:"12", area:"30 × 20 yd", equipment:"Cones, balls, bibs",
  skills:["defending","positional_awareness","communication"], tips:["I","P"], method:"defending",
  summary:"A midfield three defends a line: pressure on the ball, cover behind, balance on the far side.",
  setup:"A 30 × 20 yard area. Three attackers at one end, three defenders in the middle and three receivers on the far end line.",
  how:["The coach passes to the attackers.","They try to pass through or around the three defenders to a receiver.","Defenders win a point by winning the ball and passing to the coach.","Rotate the three groups every 4 minutes."],
  points:["Pressure: first defender closes the ball and blocks the forward pass.","Cover: second defender behind and inside.","Balance: third defender narrows to protect the middle."],
  progress:"The attackers get a fourth player.",
  regress:"Attackers must pass, no dribbling.",
  diagram:{w:30, h:20, items:[["A",8,18],["A",15,18],["A",22,18],["D",8,12],["D",13,9],["D",19,9],["N",8,1],["N",15,1],["N",22,1],["b",8.7,17.4],["r",8,12,8,15,0]]}});

d({id:"t-make-predictable", title:"1v1: make play predictable", phase:"Defending", level:"Intermediate", minutes:15, minAge:10, players:"6 to 12", area:"Two 20 × 15 yd grids", equipment:"Cones, small goals, balls, bibs",
  skills:["defending","positional_awareness"], tips:["T","I"], method:"defending",
  summary:"The defender's approach angle forces the attacker one way, toward a cone or a teammate.",
  setup:"A 20 × 15 yard grid with two small goals at the end, one marked 'open' and one 'closed'. Attackers start at the far end.",
  how:["The defender passes to the attacker and closes them down.","The defender must curve the run to show the attacker away from the 'open' goal.","Attackers score double in the open goal.","Progress to 1v2: a second defender waits where the first is pushing play."],
  points:["Curve your run so one side is blocked.","Side-on stance with the front foot showing the way.","Push play toward the help."],
  progress:"The attacker chooses either goal; the defender must read them.",
  regress:"The attacker can only use one goal.",
  diagram:{w:15, h:20, items:[["mg",4,0.5,"h"],["mg",11,0.5,"h"],["A",7.5,18],["D",7.5,4],["b",7.5,17],["r",7.5,4,9.5,13,0.4],["d",7.5,17,4,8]]}});

d({id:"t-block-lane", title:"Block the passing lane", phase:"Defending", level:"Intermediate", minutes:15, minAge:10, players:"8", area:"15 × 15 yd", equipment:"4 small goals, cones, balls, bibs",
  skills:["defending","positional_awareness","decision_making"], tips:["I"], method:"defending",
  summary:"Diagonal 1v1 games with goals in the corners: the defender blocks the pass before tackling.",
  setup:"A 15-yard square with a small goal in each corner and two players behind each.",
  how:["Players from opposite corners come out for a 1v1: one attacks, one defends.","The attacker can pass to a teammate behind a goal for a one-two.","The defender must position to block the pass first, then press.","Swap after each goal or turnover."],
  points:["Stand where you block the pass and still pressure the ball.","Curve your run to cut off the passing option.","Patience: win it when they take a heavy touch."],
  progress:"Attackers have two teammates to pass to.",
  regress:"No passes allowed.",
  diagram:{w:15, h:15, items:[["mg",1,1,"h"],["mg",14,1,"h"],["mg",1,14,"h"],["mg",14,14,"h"],["A",4,11],["D",8,7],["N",14.5,12],["b",4.6,10.4],["r",8,7,7,10,0.3]]}});

d({id:"t-3v1-press", title:"3v1 pressing boxes", phase:"Defending", level:"Intermediate", minutes:12, minAge:10, players:"8 (two boxes)", area:"Two 8 × 8 yd boxes", equipment:"8 cones, 2 balls, bibs",
  skills:["defending","separation_speed","decision_making"], tips:["S","I"], method:"pressing",
  summary:"One defender presses three: practise the angle of approach and pressing cues.",
  setup:"Two 8-yard boxes, each with 3 attackers on the outside and 1 defender inside.",
  how:["Attackers pass around the box with two touches.","The defender presses and tries to touch the ball or force a bad pass.","A bad touch, a back pass or a slow pass is the cue to sprint.","Swap the defender every 45 seconds; count turnovers."],
  points:["Curve your approach so you cut off one pass.","Press on the cue: bad touch, back pass, slow ball.","Make yourself big as you arrive, but stay on your feet."],
  progress:"Attackers one-touch.",
  regress:"Attackers must take two touches.",
  diagram:{w:20, h:10, items:[["z",0,1,8,8],["z",12,1,8,8],["A",4,1.3],["A",7.7,8],["A",0.3,8],["D",4,5],["A",16,1.3],["A",19.7,8],["A",12.3,8],["D",16,5],["r",4,5,6,6.5,0.3]]}});

d({id:"t-4v4-shape", title:"4v4 defensive line", phase:"Defending", level:"Intermediate", minutes:15, minAge:11, players:"12 to 16", area:"40 × 30 yd", equipment:"Cones, balls, bibs",
  skills:["defending","positional_awareness","communication"], tips:["I","P"], method:"defending",
  summary:"Four defenders keep their shape and distances to stop four attackers passing through their line.",
  setup:"A 40 × 30 yard area. Four attackers at one end, four defenders in the middle, four receivers on the far end line.",
  how:["The coach passes to the attackers.","Attackers try to pass through the defenders' line to a receiver.","Defenders move as one line, shifting toward the ball and keeping gaps small.","Swap groups every 4 minutes."],
  points:["Shift together: when the ball moves, the whole line moves.","Distances of about 8 to 10 yards between defenders.","Pressure the ball, cover inside, keep the far player tucked in."],
  progress:"Attackers get a fifth player.",
  regress:"Attackers can't dribble past the halfway line.",
  diagram:{w:40, h:30, items:[["A",6,27],["A",16,28],["A",24,28],["A",34,27],["D",8,18],["D",16,16],["D",24,16],["D",32,18],["N",10,1],["N",30,1],["b",6.7,26.4],["r",8,18,7,22,0]]}});

d({id:"t-box-1v1", title:"1v1 defending in the box", phase:"Defending", level:"Intermediate", minutes:15, minAge:12, players:"6 to 10", area:"Penalty area", equipment:"Goal, cones, balls, bibs",
  skills:["defending","physicality","positional_awareness"], tips:["T","P"], method:"defending",
  summary:"Defend 1v1 inside the box, where a mistake means a goal: footwork, body shape and no diving in.",
  setup:"A goal and keeper. The penalty area split into four channels. An attacker and a defender in each channel take turns.",
  how:["The coach passes to an attacker on the edge of the box.","The defender closes down and keeps the attacker outside, or away from goal.","The attacker tries to shoot or cross; the defender blocks.","Rotate channels each rep."],
  points:["Stay on your feet; a foul in the box is a penalty.","Body side-on, showing the attacker away from the middle.","Block shots with your body, arms behind you."],
  progress:"2v2 in two channels.",
  regress:"The attacker may only dribble, not shoot early.",
  diagram:{w:44, h:18, items:[["G",22,0,"top"],["K",22,1.6],["z",0,0,11,18],["z",11,0,11,18],["z",22,0,11,18],["z",33,0,11,18],["A",16,16],["D",16,9],["b",16.6,15.4],["r",16,9,16,12,0]]}});

d({id:"t-2v2v2-gate", title:"2v2v2 defend the gate", phase:"Defending", level:"Intermediate", minutes:12, minAge:10, players:"6", area:"24 × 20 yd", equipment:"Cones, balls, 3 bib colours",
  skills:["defending","communication","positional_awareness"], tips:["I","P"], method:"defending",
  summary:"A pair in the middle stops two end pairs passing through their gates to each other.",
  setup:"A 24 × 20 yard area with two gates in the middle zone. Pairs at each end and a defending pair in the middle.",
  how:["An end pair tries to pass through a gate to the pair at the other end.","The middle pair works together to block the gates and intercept.","If they win it, the pair that lost it goes into the middle.","Count completed passes for each end pair."],
  points:["One defender blocks the ball's side, the other covers the second gate.","Move together as the ball moves.","Talk the whole time."],
  progress:"One more gate.",
  regress:"One gate only.",
  diagram:{w:20, h:24, items:[["c",4,12],["c",8,12],["c",12,12],["c",16,12],["A",6,2],["A",14,3],["N",6,22],["N",14,21],["D",7,10],["D",13,14],["b",6.7,2.6],["p",6,2,14,21]]}});

d({id:"t-delay", title:"Delay until help arrives 2v3", phase:"Defending", level:"Intermediate", minutes:15, minAge:11, players:"10 to 12", area:"30 × 25 yd", equipment:"Goal, cones, balls, bibs",
  skills:["defending","decision_making","communication"], tips:["I","P"], method:"defending",
  summary:"Two defenders are outnumbered by three and must delay until a third defender recovers.",
  setup:"A goal and keeper. Three attackers start 25 yards out; two defenders face them; a third defender starts on the halfway line.",
  how:["Attackers attack the goal.","The two defenders delay: no diving in, just slow the attack down.","After 4 seconds, the third defender sprints back to join.","Defenders win a point for any attack that takes more than 10 seconds or doesn't end in a shot."],
  points:["Delay, don't dive: buy time for the help.","Show the ball wide, away from the goal.","Recovering defender sprints goal-side, then helps."],
  progress:"The third defender joins only after 6 seconds.",
  regress:"The third defender joins after 2 seconds.",
  diagram:{w:25, h:30, items:[["G",12.5,0,"top"],["K",12.5,1.6],["A",5,25],["A",12,26],["A",20,25],["D",9,14],["D",16,14],["D",12.5,29.5],["r",12.5,29.5,12,18,0.4],["b",12.7,25.4]]}});

d({id:"t-defend-crosses", title:"Defending crosses 4v4 in the box", phase:"Defending", level:"Intermediate", minutes:20, minAge:12, players:"10 to 12", area:"Penalty area", equipment:"Goal, balls, bibs",
  skills:["defending","physicality","positional_awareness"], tips:["I","P"], method:"defending",
  summary:"Defenders mark runners, attack the cross and clear the ball out of the box.",
  setup:"A goal and keeper. Four attackers and four defenders in the box. A crosser on each wing with balls.",
  how:["The crosser delivers from one side; attackers make runs.","Defenders track their runners, attack the ball and clear high and wide.","After a clearance, the attackers have one chance at a second ball.","Alternate wings; swap roles after 8 crosses."],
  points:["See the ball and your player at the same time.","Attack the ball at its highest point.","Clear height, distance and width."],
  progress:"Add a fifth attacker arriving late at the edge of the box.",
  regress:"Crosses thrown in by hand.",
  diagram:{w:44, h:22, items:[["G",22,0,"top"],["K",22,1.6],["A",2,4],["A",17,12],["A",22,14],["A",27,12],["D",18,8],["D",23,9],["D",28,8],["p",2,4,22,6],["r",22,14,22,7,0]]}});

d({id:"t-unit-shift", title:"Back four shift", phase:"Defending", level:"Advanced", minutes:20, minAge:13, players:"10 to 12", area:"50 × 30 yd", equipment:"Goal, cones, balls, bibs",
  skills:["defending","tactical_understanding","communication"], tips:["I","P"], method:"defending",
  summary:"A back four shifts across the pitch as the ball moves between six attackers, keeping compact.",
  setup:"A goal and keeper. A back four in front of goal. Six attackers spread across the field 30 yards out with the ball.",
  how:["Attackers pass across the field; the back four shifts with each pass.","On the coach's call, attackers try to play through or in behind.","The back four steps up together when the ball goes back, drops when the ball carrier can play forward.","Swap groups every 6 minutes."],
  points:["Ball side: the nearest defender presses, the others shift and tuck in.","The line moves together on one call.","Step up on a back pass; drop when the passer has time."],
  progress:"Add a striker running in behind.",
  regress:"Attackers pass slowly and the coach calls every shift.",
  diagram:{w:50, h:32, items:[["G",25,0,"top"],["K",25,1.6],["D",12,10],["D",21,9],["D",29,9],["D",38,10],["A",5,28],["A",15,30],["A",25,30],["A",35,30],["A",45,28],["b",5.7,27.4],["r",12,10,9,13,0],["r",21,9,18,11,0]]}});

d({id:"t-press-sideline", title:"Pressing trap on the sideline", phase:"Defending", level:"Advanced", minutes:20, minAge:13, players:"12 to 14", area:"40 × 40 yd", equipment:"Cones, balls, bibs, targets",
  skills:["defending","tactical_understanding","communication"], tips:["I","S"], method:"pressing",
  summary:"Force the build-up toward the sideline, then trap the ball there with numbers.",
  setup:"A 40 × 40 yard area. Six attackers try to reach a target at the far end; six defenders start compact in the middle.",
  how:["Defenders let the first pass go wide, then trap.","The wide defender cuts off the inside pass; the nearest midfielder blocks back; another presses from the front.","A turnover in the wide zone scores 2 points.","Attackers score by reaching the target."],
  points:["Start narrow and compact; let them go wide.","The sideline is your extra defender.","Press together on the trigger: a pass to the full-back."],
  progress:"Attackers have a neutral player who joins them.",
  regress:"5v6 for the attackers.",
  diagram:{w:40, h:40, items:[["N",20,1],["A",4,30],["A",14,36],["A",26,36],["A",36,30],["A",10,20],["D",8,24],["D",14,26],["D",12,30],["D",22,24],["D",28,22],["b",4.7,30.6],["r",8,24,6,28,0],["r",14,26,8,30,0]]}});

d({id:"t-press-trigger", title:"Pressing game 6v4", phase:"Defending", level:"Advanced", minutes:20, minAge:12, players:"10", area:"35 × 30 yd", equipment:"Cones, balls, bibs, 2 small goals",
  skills:["defending","separation_speed","tactical_understanding"], tips:["I","S"], method:"pressing",
  summary:"Four defenders press six attackers on a trigger and try to win it and score quickly.",
  setup:"A 35 × 30 yard area. Six attackers keep the ball; four defenders with two small goals to score in.",
  how:["Attackers keep the ball; 10 passes scores a point.","Defenders press as a group when a trigger happens: a back pass, a bad touch, a pass to the sideline.","When they win it, they have 6 seconds to score in a small goal.","Rotate defenders every 3 minutes."],
  points:["Wait, then press together: one presser is easy to beat.","Close the nearest passing options as the presser goes.","Win it and attack the goal at once."],
  progress:"5v4.",
  regress:"7v4.",
  diagram:{w:35, h:30, items:[["mg",12,0.5,"h"],["mg",23,0.5,"h"],["A",4,15],["A",12,25],["A",23,25],["A",31,15],["A",12,8],["A",23,8],["D",10,15],["D",17,12],["D",24,15],["D",17,20],["b",4.7,15.6],["r",10,15,6,15,0]]}});

d({id:"t-high-press", title:"High press against the build-out 8v6", phase:"Defending", level:"Advanced", minutes:20, minAge:14, players:"14 + keeper", area:"Half field", equipment:"Goal, 2 small goals, cones, balls, bibs",
  skills:["defending","tactical_understanding","communication"], tips:["I","S"], method:"pressing",
  summary:"Six pressers lock the opponent's build-out to one side and win the ball near their goal.",
  setup:"A half field. The keeper and seven build-up players try to play into two small goals at halfway. Six pressers start high.",
  how:["The keeper starts every rep with the ball.","The striker curves the press to cut one centre-back off and force play to one side.","The other pressers shift and block the inside passes.","Pressers win a point for a turnover and score in the big goal; build-up team scores in the small goals."],
  points:["The striker's angle decides where the press goes.","Compact behind the first presser: deny the middle.","Win it, then finish fast."],
  progress:"The build-up team gets an extra midfielder.",
  regress:"The keeper can't be pressed.",
  diagram:{w:50, h:40, items:[["G",25,0,"top"],["K",25,1.6],["mg",12,39.5,"h"],["mg",38,39.5,"h"],["A",15,6],["A",35,6],["A",4,16],["A",46,16],["A",25,14],["D",28,8],["D",20,12],["D",30,16],["D",38,14],["D",10,18],["r",28,8,33,7,0.3]]}});

d({id:"t-deny-central", title:"Deny central penetration 6v6", phase:"Defending", level:"Advanced", minutes:20, minAge:13, players:"12 + keepers", area:"45 × 35 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["defending","positional_awareness","tactical_understanding"], tips:["I","P"], method:"defending",
  summary:"A central channel is marked out; the defending team stays compact so the ball can't go through the middle.",
  setup:"A 45 × 35 yard field with goals and keepers, and a central channel marked with cones.",
  how:["Play 6v6.","A goal after a pass through the central channel counts double for the attacking team.","Defenders score double for a turnover inside the central channel.","Play 6-minute games."],
  points:["Stay narrow; let them have the sides.","Midfielders screen the passes into the middle.","Press the ball when it goes wide, with cover inside."],
  progress:"5v6 for the defending team.",
  regress:"A wider central channel so it's easier to protect.",
  diagram:{w:35, h:45, items:[["G",17.5,0,"top"],["G",17.5,45,"bottom"],["K",17.5,1.4],["K",17.5,43.6],["z",11,0,13,45],["D",13,14],["D",21,14],["D",17,20],["A",4,26],["A",17,30],["A",30,26],["b",4.7,26.6],["p",4,26,17,30]]}});

d({id:"t-midfield-three", title:"Midfield three shape", phase:"Defending", level:"Advanced", minutes:15, minAge:12, players:"7", area:"18 × 16 yd", equipment:"4 cones, balls, bibs",
  skills:["defending","positional_awareness","communication"], tips:["I","P"], method:"defending",
  summary:"Four outside players pass around a midfield three, who keep their triangle and block passes through.",
  setup:"An 18 × 16 yard area. Four attackers on the edges; three defenders inside in a triangle.",
  how:["Attackers pass around the outside, trying to pass through the middle to the opposite side.","Defenders keep their shape: one presses, two cover the lanes.","A pass through the middle scores for the attackers; an interception scores for the defenders.","Rotate after 2 minutes."],
  points:["Pressure, cover, cover: the triangle moves with the ball.","Cut the passing lanes, not just the ball.","Use your shape to choose where the outside players pass."],
  progress:"Attackers get one player inside.",
  regress:"Attackers must take two touches.",
  diagram:{w:18, h:16, items:[["A",9,0.5],["A",17.5,8],["A",9,15.5],["A",0.5,8],["D",9,5],["D",6,10],["D",12,10],["b",9,1.3],["r",9,5,9,3,0]]}});

d({id:"t-defend-box-six", title:"Defending the box: back four and a holding midfielder", phase:"Defending", level:"Advanced", minutes:20, minAge:14, players:"12 to 16", area:"36 × 44 yd", equipment:"Goal, cones, balls, bibs",
  skills:["defending","positional_awareness","communication"], tips:["I","P"], method:"defending",
  summary:"The back four and a holding midfielder protect the penalty area against central play and wide service.",
  setup:"A goal and keeper. A back four and a holding midfielder defend; five attackers plus two wide servers attack.",
  how:["Attackers try to break through the middle or play wide to a server.","Servers cross or cut the ball back into the box.","Defenders stay compact, track runners and clear.","Defenders score by clearing to a target at halfway."],
  points:["The holding midfielder screens the edge of the box.","Full-backs stay tucked in when the ball is on the other side.","Clear first, then step out together."],
  progress:"Add a sixth attacker arriving late.",
  regress:"Only one wide server.",
  diagram:{w:44, h:36, items:[["G",22,0,"top"],["K",22,1.6],["D",12,8],["D",19,7],["D",25,7],["D",32,8],["D",22,14],["A",4,16],["A",40,16],["A",16,22],["A",22,24],["A",28,22],["b",22.6,23.4],["p",22,24,40,16]]}});
/* ---------------- transition ---------------- */
d({id:"t-race-2v2", title:"2v2 race and attack", phase:"Transition", level:"Beginner", minutes:12, minAge:8, players:"8 to 12", area:"30 × 25 yd", equipment:"Goal, 2 poles or cones, balls, bibs",
  skills:["separation_speed","decision_making","shooting"], tips:["S","P"], method:"wave",
  summary:"Two pairs race round a pole for a ball the coach plays in; whoever gets there first attacks.",
  setup:"A goal with a keeper. Two teams in opposite corners at halfway, each with a pole to run round. The coach stands behind the goal with balls.",
  how:["The coach plays a ball into the middle.","A pair from each team sprints round their pole and goes for it.","The pair that wins it attacks the goal; the other pair defends.","If the defenders win it, they score by dribbling over the halfway line."],
  points:["React to the coach's pass, not the other team.","Be ruthless: shoot when the chance comes.","Switch to defending the second you lose it."],
  progress:"3v3 races.",
  regress:"Start the pairs closer to the ball.",
  diagram:{w:30, h:25, items:[["G",15,0,"top"],["K",15,1.6],["c",3,23],["c",27,23],["A",2,24],["A",4,24],["D",26,24],["D",28,24],["N",22,0.8],["b",15,13],["p",22,0.8,15.5,12.5],["r",4,24,13,14,0.3]]}});

d({id:"t-1v1-2v1-3v2", title:"1v1, then 2v1, then 3v2", phase:"Transition", level:"Intermediate", minutes:20, minAge:10, players:"12 to 16", area:"40 × 30 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["decision_making","separation_speed","defending"], tips:["I","S"], method:"wave",
  summary:"Each attack adds one player: 1v1, then 2v1 the other way, then 3v2. Transition after every finish.",
  setup:"A 40 × 30 yard field with goals and keepers. Two lines beside each goal.",
  how:["A player passes diagonally across and defends: 1v1.","When the attack ends, the defender and a new teammate attack the other way: 2v1.","Then three attack two.","Keep it flowing; reset after the 3v2."],
  points:["Attack at speed: the advantage disappears fast.","React the moment the attack ends.","Combine when you have the numbers."],
  progress:"Time limits on each phase.",
  regress:"Pause briefly between phases.",
  diagram:{w:30, h:40, items:[["G",15,0,"top"],["G",15,40,"bottom"],["K",15,1.4],["K",15,38.6],["A",4,34],["A",26,36],["D",13,26],["A",16,18],["b",15,18],["d",16,18,14,6]]}});

d({id:"t-transition-3v3", title:"3v3 waves: attack, then defend", phase:"Transition", level:"Intermediate", minutes:15, minAge:10, players:"9 to 15", area:"40 × 25 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["decision_making","defending","separation_speed"], tips:["I","S"], method:"wave",
  summary:"Three attack three to one goal; when the attack ends, the defenders break the other way against a new three.",
  setup:"A 40 × 25 yard field with goals and keepers. Three teams of 3; one team waits at each end.",
  how:["Team A attacks Team B.","When the attack ends, Team B attacks the other goal against Team C, who come on.","Team A leaves and waits.","Play continuously for 4 minutes."],
  points:["Switch from defending to attacking in one second.","First pass after winning it goes forward.","Recover fast when you lose it."],
  progress:"10 seconds per attack.",
  regress:"A neutral player helps the attackers.",
  diagram:{w:25, h:40, items:[["G",12.5,0,"top"],["G",12.5,40,"bottom"],["K",12.5,1.4],["K",12.5,38.6],["A",6,14],["A",12,16],["A",19,14],["D",8,9],["D",14,8],["D",18,10],["N",6,39],["N",19,39]]}});

d({id:"t-4v4-wide-goals", title:"4v4 to two wide goals", phase:"Transition", level:"Intermediate", minutes:15, minAge:10, players:"8 to 10", area:"40 × 30 yd", equipment:"4 small goals, cones, balls, bibs",
  skills:["decision_making","defending","passing"], tips:["I"], method:"funino",
  summary:"Each team defends two wide goals: switching play and quick transitions win games.",
  setup:"A 40 × 30 yard field with two small goals in each corner of each end line. Two teams of 4.",
  how:["Teams score in either of the two goals they attack.","Goals can be passed or dribbled in.","A goal scored within 5 seconds of winning the ball counts double.","Play 4-minute games."],
  points:["Draw them to one goal, then switch to the other.","When you win it, look for the open goal straight away.","When you lose it, protect the nearest goal first."],
  progress:"Two touches.",
  regress:"Add a neutral player.",
  diagram:{w:30, h:40, items:[["mg",5,0.5,"h"],["mg",25,0.5,"h"],["mg",5,39.5,"h"],["mg",25,39.5,"h"],["A",8,22],["A",15,26],["A",22,20],["A",15,32],["D",10,14],["D",20,14],["D",15,18],["D",15,8],["b",8.7,22.6],["p",8,22,22,20]]}});

d({id:"t-6v3-counter", title:"6v3 box with counter goals", phase:"Transition", level:"Intermediate", minutes:15, minAge:11, players:"9", area:"20 × 20 yd", equipment:"4 cones, 2 small goals, balls, bibs",
  skills:["passing","defending","separation_speed"], tips:["I","S"], method:"rondo",
  summary:"Six keep the ball from three; if the three win it, they counter into a small goal, and the six must stop them.",
  setup:"A 20-yard square with two small goals just outside two sides.",
  how:["Six attackers keep the ball; 8 passes scores a point.","If the three win it, they try to score in either small goal.","The six press straight away to stop the counter.","Rotate the three every 3 minutes."],
  points:["Lose it, press it: the nearest two go at once.","Sharp passes to keep the three chasing.","When you win it, go to goal fast."],
  progress:"Two touches for the six.",
  regress:"Counters only to one goal.",
  diagram:{w:20, h:20, items:[["mg",10,-0.5,"h"],["mg",20.5,10,"v"],["A",3,3],["A",17,3],["A",17,17],["A",3,17],["A",10,4],["A",4,10],["D",9,9],["D",12,11],["D",8,13],["b",3.7,3.6],["d",12,11,18,10]]}});

d({id:"t-box-game", title:"Box game: four phases", phase:"Transition", level:"Intermediate", minutes:15, minAge:11, players:"8 to 12", area:"25 × 20 yd", equipment:"4 small goals, cones, balls, bibs",
  skills:["decision_making","positional_awareness","defending"], tips:["I","S"], method:"funino",
  summary:"A 2v2 plus a neutral with a goal on every side: players live through attacking, defending and both transitions.",
  setup:"A 25 × 20 yard box with a small goal in the middle of each side. 2v2 with one neutral inside; extra players wait outside.",
  how:["Each team attacks two opposite goals and defends the other two.","The neutral plays for the team with the ball.","After a goal or 45 seconds, the waiting pair comes in.","Name the phases as they happen: attack, lose it, defend, win it."],
  points:["Know which phase you're in at every moment.","When you win it, attack the goal you're facing.","When you lose it, protect the nearest goal."],
  progress:"No neutral: straight 2v2.",
  regress:"Two neutrals.",
  diagram:{w:25, h:20, items:[["mg",12.5,0.5,"h"],["mg",12.5,19.5,"h"],["mg",0.5,10,"v"],["mg",24.5,10,"v"],["A",8,12],["A",16,8],["D",11,9],["D",15,13],["N",12,15],["b",8.7,12.6]]}});

d({id:"t-counterpress", title:"Five-second counter-press", phase:"Transition", level:"Advanced", minutes:15, minAge:12, players:"12 to 14", area:"40 × 30 yd", equipment:"Cones, balls, bibs, 4 small goals",
  skills:["defending","separation_speed","tactical_understanding"], tips:["I","S"], method:"pressing",
  summary:"When you lose the ball, you have five seconds to win it back before dropping into shape.",
  setup:"A 40 × 30 yard field, 6v6, with two small goals at each end.",
  how:["Play 6v6.","When a team loses the ball, it presses at full speed for five seconds.","A regain in those five seconds scores a bonus point.","If they can't win it, they drop back into a compact shape."],
  points:["The nearest player presses the ball; the next two close the passing options.","Five seconds of all-out effort, then organise.","Win it back high and attack straight away."],
  progress:"Three seconds instead of five.",
  regress:"Add a neutral for the team in possession.",
  diagram:{w:30, h:40, items:[["mg",8,0.5,"h"],["mg",22,0.5,"h"],["mg",8,39.5,"h"],["mg",22,39.5,"h"],["A",15,20],["D",13,17],["D",18,22],["D",11,23],["A",7,14],["A",24,12],["b",15.6,20.6],["r",13,17,14.5,19,0]]}});

d({id:"t-three-teams", title:"Three-team transition 4v4 + 4", phase:"Transition", level:"Advanced", minutes:15, minAge:12, players:"12", area:"30 × 25 yd", equipment:"Cones, balls, 3 bib colours",
  skills:["passing","defending","decision_making"], tips:["I","S"], method:"rondo",
  summary:"Two teams keep it together against a third; whoever loses the ball defends next. No rest.",
  setup:"A 30 × 25 yard area. Three teams of 4. Two teams combine to keep the ball.",
  how:["Two teams keep the ball against the third.","If a team loses it, they become the defenders immediately.","8 passes in a row scores a point for both teams in possession.","Play 5-minute rounds."],
  points:["The moment you lose it, you're defending: no complaining, just press.","When your team wins it, find the free colour.","Spread out to make the area big."],
  progress:"Two touches.",
  regress:"Defenders must win it twice before swapping.",
  diagram:{w:30, h:25, items:[["c",0,0],["c",30,0],["c",0,25],["c",30,25],["A",5,5],["A",25,6],["N",6,20],["N",24,19],["D",12,11],["D",18,13],["D",15,9],["D",14,16],["p",5,5,25,6],["p",25,6,24,19]]}});

d({id:"t-counter-5v4", title:"Counter-attack 5v4 after a regain", phase:"Transition", level:"Advanced", minutes:20, minAge:13, players:"14 to 16", area:"Half to two-thirds field", equipment:"2 goals, cones, balls, bibs",
  skills:["passing","separation_speed","decision_making"], tips:["I","S"], method:"wave",
  summary:"After winning the ball in midfield, five counter against four retreating defenders before they can set up.",
  setup:"Goals and keepers at both ends. A midfield zone where a 3v3 battle starts each rep. Two attackers wait wide.",
  how:["The coach plays into the midfield 3v3.","The team that wins it breaks with its two wide players: 5v4 to goal.","The other team recovers to defend.","They have 10 seconds to score."],
  points:["First look forward: the earliest pass is the best one.","Wide players sprint wide to stretch the defence.","Defenders retreat to the box, then delay."],
  progress:"8 seconds.",
  regress:"5v3.",
  diagram:{w:40, h:56, items:[["G",20,0,"top"],["G",20,56,"bottom"],["K",20,1.6],["K",20,54.4],["z",0,24,40,10],["A",16,28],["A",22,30],["A",20,26],["D",18,31],["D",24,27],["A",5,20],["A",35,20],["D",14,12],["D",26,12],["b",16.6,27.4],["p",16,28,5,20],["r",35,20,30,8,0]]}});

d({id:"t-counter-4v3", title:"Win it and counter 4v3", phase:"Transition", level:"Advanced", minutes:15, minAge:12, players:"10 to 12", area:"40 × 35 yd", equipment:"Goal, 2 small goals, cones, balls, bibs",
  skills:["defending","passing","separation_speed"], tips:["I","S"], method:"pressing",
  summary:"Four defenders press six attackers; when they win it, they counter 4v3 to the big goal.",
  setup:"A goal and keeper at one end; two small goals at the other. Six attackers build toward the small goals; four defenders press.",
  how:["Attackers try to score in the small goals.","The four defenders press to win the ball.","On a regain, three attackers drop to defend and the four counter to the big goal.","Counters must finish within 8 seconds."],
  points:["Press as a unit; win it in a crowd.","After the regain, the first pass goes forward or wide.","Attack the space before the defence settles."],
  progress:"6 seconds to finish.",
  regress:"4v2 counters.",
  diagram:{w:35, h:40, items:[["G",17.5,0,"top"],["K",17.5,1.6],["mg",10,39.5,"h"],["mg",25,39.5,"h"],["A",8,28],["A",17,32],["A",27,28],["D",12,25],["D",22,25],["D",17,22],["D",17,15],["b",17.6,31.4]]}});

d({id:"t-break-line-6v5", title:"Win it and break the line 6v5", phase:"Transition", level:"Advanced", minutes:20, minAge:14, players:"11 to 13", area:"45 × 50 yd", equipment:"Goal, cones, balls, bibs",
  skills:["defending","decision_making","tactical_understanding"], tips:["I","S"], method:"pressing",
  summary:"The focus team defends six attackers, wins the ball and exploits gaps in their line to score in an end zone.",
  setup:"A 45 × 50 yard field with a goal at one end and an end zone at the other. The focus team of 5 defends the goal against 6.",
  how:["The six attack the goal.","When the five win it, they try to dribble or pass into the end zone behind the six.","The six try to win it straight back.","Swap roles every 6 minutes."],
  points:["Win it in a compact block, then go forward at once.","Look for the gap left by the player who just lost the ball.","Run beyond the ball to give a pass into the end zone."],
  progress:"6 seconds to reach the end zone.",
  regress:"An extra player for the focus team.",
  diagram:{w:45, h:50, items:[["G",22.5,0,"top"],["K",22.5,1.6],["z",0,44,45,6],["A",8,22],["A",16,26],["A",29,26],["A",37,22],["A",22,18],["A",22,32],["D",12,14],["D",20,10],["D",26,10],["D",33,14],["D",22,22],["r",20,10,18,40,0.2]]}});

d({id:"t-rest-defence", title:"Rest-defence game 7v7", phase:"Transition", level:"Advanced", minutes:20, minAge:14, players:"14 + keepers", area:"Half to two-thirds field", equipment:"2 goals, cones, balls, bibs",
  skills:["tactical_understanding","positional_awareness","defending"], tips:["I"], method:"pressing",
  summary:"The attacking team must always keep two players behind the ball to stop the counter.",
  setup:"A 7v7 game on a half to two-thirds field with goals and keepers.",
  how:["Play 7v7.","The team in possession must keep two players behind the ball at all times.","If the ball is lost while fewer than two are back, the counter-attacking team's goal counts double.","Play 6-minute games."],
  points:["Rest defenders position to stop the first counter pass, not the shot.","They talk to the attack: 'I'm back', 'I need help'.","If you lose it high, press; if you can't, the rest defence delays."],
  progress:"Rest defenders must stay in the opponent's half.",
  regress:"Three players must stay back.",
  diagram:{w:45, h:60, items:[["G",22.5,0,"top"],["G",22.5,60,"bottom"],["K",22.5,1.4],["K",22.5,58.6],["A",10,16],["A",22,12],["A",35,16],["A",15,24],["A",30,24],["A",16,38],["A",29,38],["D",12,10],["D",28,9],["D",22,30]]}});

/* ---------------- games ---------------- */
d({id:"t-dutch-4v4", title:"Dutch 4v4", phase:"Game", level:"Beginner", minutes:20, minAge:6, players:"8", area:"30 × 20 yd", equipment:"2 small goals, cones, balls, bibs",
  skills:["passing","dribbling","decision_making"], tips:["T","I"], method:"dutch4v4",
  summary:"The classic 4v4 in a diamond shape: lots of touches, every player attacks and defends.",
  setup:"A 30 × 20 yard field with a small goal at each end. Two teams of 4 in a diamond: one back, two sides, one front.",
  how:["Play a normal game with kick-ins instead of throw-ins.","Teams keep their diamond shape when attacking.","Rotate positions inside the diamond every game.","Play 4 games of 4 minutes."],
  points:["Width: the two side players stay wide.","Depth: the front player stays high, the back player stays back.","Pass and move into a new triangle."],
  progress:"A goal counts double if every player touched the ball.",
  regress:"Add a neutral player.",
  diagram:{w:20, h:30, items:[["mg",10,0.5,"h"],["mg",10,29.5,"h"],["A",10,25],["A",3,18],["A",17,18],["A",10,10],["D",10,5],["D",4,12],["D",16,12],["D",10,20],["b",10.6,24.4],["p",10,25,3,18]]}});

d({id:"t-funino", title:"Funino 3v3, four goals", phase:"Game", level:"Beginner", minutes:20, minAge:6, players:"6 to 8", area:"25 × 20 yd", equipment:"4 small goals, cones, balls, bibs",
  skills:["dribbling","decision_making","passing"], tips:["I","T"], method:"funino",
  summary:"3v3 with two small goals at each end and a scoring zone: switching play and quick decisions.",
  setup:"A 25 × 20 yard field with two small goals at each end, set wide apart. A 6-yard scoring zone in front of each end line.",
  how:["Play 3v3; a team can score in either of the two goals it attacks.","Shots must be taken from inside the scoring zone.","After a goal, the other team restarts by dribbling in from its end line.","Rotate one player in every 3 minutes."],
  points:["If one goal is crowded, the other is open: switch.","Get into the scoring zone with a dribble or a pass.","Everyone attacks and everyone defends."],
  progress:"Goals from a switch count double.",
  regress:"No scoring zone.",
  diagram:{w:20, h:25, items:[["mg",4,0.5,"h"],["mg",16,0.5,"h"],["mg",4,24.5,"h"],["mg",16,24.5,"h"],["z",0,0,20,6],["z",0,19,20,6],["A",6,16],["A",14,14],["A",10,10],["D",8,8],["D",13,7],["D",10,18],["b",6.6,15.4],["p",6,16,14,14]]}});

d({id:"t-line-soccer", title:"3v3 line soccer", phase:"Game", level:"Beginner", minutes:15, minAge:6, players:"6 to 8", area:"25 × 20 yd", equipment:"4 cones, balls, bibs",
  skills:["dribbling","decision_making","separation_speed"], tips:["T","P"], method:"play",
  summary:"Score by stopping the ball on the other team's end line: rewards running with the ball.",
  setup:"A 25 × 20 yard field. Each team defends a whole end line. 3v3.",
  how:["A goal is scored by dribbling the ball over the opponent's end line and stopping it with the sole.","Kick-ins restart play from the sidelines.","After a goal, the team that conceded restarts from its own line.","Play 3-minute games and rotate."],
  points:["Run with the ball into space.","Change speed to get past.","Stop the ball on the line under control."],
  progress:"A pass to a teammate on the line also counts.",
  regress:"Score by dribbling over any part of the line without stopping.",
  diagram:{w:20, h:25, items:[["A",6,16],["A",14,18],["A",10,12],["D",8,9],["D",13,8],["D",10,4],["b",6.6,15.4],["d",6,16,4,1]]}});

d({id:"t-3v3-dribble-goals", title:"3v3 dribble-through goals", phase:"Game", level:"Beginner", minutes:15, minAge:7, players:"6 to 8", area:"30 × 20 yd", equipment:"4 cones for 2 gates, balls, bibs",
  skills:["dribbling","decision_making","communication"], tips:["T","I"], method:"play",
  summary:"A goal only counts if a player dribbles through the gate: encourages taking players on.",
  setup:"A 30 × 20 yard field with a 3-yard cone gate in the middle of each end line. 3v3. The coach has the balls on the sideline.",
  how:["The coach plays a ball into the field.","Teams score by dribbling through the opponent's gate.","When a goal is scored or the ball goes out, the coach plays a new ball.","Rotate teams every 3 minutes."],
  points:["Off the ball: move into space so your teammate can pass to you.","On the ball: drive at the defender and use a move.","Talk to each other."],
  progress:"Gate goals must follow a pass.",
  regress:"Bigger gates.",
  diagram:{w:20, h:30, items:[["c",8.5,0.5],["c",11.5,0.5],["c",8.5,29.5],["c",11.5,29.5],["A",6,20],["A",14,22],["A",10,15],["D",8,12],["D",13,10],["D",10,6],["b",10.6,14.4],["d",10,15,10,1]]}});

d({id:"t-free-play", title:"Free play with guided questions", phase:"Game", level:"Beginner", minutes:15, minAge:5, players:"8 to 16", area:"Two 36 × 22 yd fields", equipment:"4 small goals, cones, balls, bibs",
  skills:["decision_making","dribbling","communication"], tips:["I","P"], method:"ppp",
  summary:"Players arrive and play straight away; the coach asks a few questions that point to the session topic.",
  setup:"Two small fields side by side with small goals. Teams of 3 to 4.",
  how:["Players play as soon as they arrive; no lines.","After a few minutes, the coach pauses briefly and asks one question about the topic (for example, 'How can you get past a defender?').","Players go back to playing and try the answers.","Mix teams after 6 minutes."],
  points:["Keep stoppages short: 20 seconds at most.","Questions, not lectures: let players find answers.","Praise players who try what was talked about."],
  progress:"Add a rule that matches the topic (for example, goals count double after a dribble).",
  regress:"Smaller teams, more balls in play.",
  diagram:{w:36, h:22, items:[["mg",0.5,11,"v"],["mg",35.5,11,"v"],["A",10,8],["A",18,15],["A",24,6],["D",14,11],["D",22,10],["D",28,15],["b",10.7,8.6]]}});

d({id:"t-ssg-5v5-gk", title:"5v5 with keepers", phase:"Game", level:"Intermediate", minutes:20, minAge:9, players:"10 + 2 keepers", area:"40 × 30 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["passing","decision_making","positional_awareness"], tips:["I","T"], method:"dutch4v4",
  summary:"A small-sided game with keepers that brings in team shape and building from the back.",
  setup:"A 40 × 30 yard field with full-size small goals and keepers. 5v5.",
  how:["Play a normal game; keepers restart with a roll or throw.","Teams set up in a shape: two at the back, two in midfield, one up front.","Every 5 minutes, add the session's condition (for example, two-touch).","Play 4 games of 5 minutes."],
  points:["Keepers start the attack with a quick, accurate pass.","Stay spread out when you have the ball.","Get compact when you don't."],
  progress:"The keeper may not kick long; build from the back.",
  regress:"Add a neutral player.",
  diagram:{w:30, h:40, items:[["G",15,0,"top"],["G",15,40,"bottom"],["K",15,1.4],["K",15,38.6],["A",8,32],["A",22,32],["A",9,22],["A",21,22],["A",15,12],["D",8,8],["D",22,8],["D",10,18],["D",20,18],["D",15,28],["b",15.6,37.8],["p",15,38.6,8,32]]}});

d({id:"t-endzone", title:"4v4 to end zones", phase:"Game", level:"Intermediate", minutes:20, minAge:9, players:"8 to 10", area:"30 × 20 yd + 4 yd end zones", equipment:"Cones, balls, bibs",
  skills:["passing","positional_awareness","decision_making"], tips:["I"], method:"dutch4v4",
  summary:"Score by receiving the ball inside the end zone: movement off the ball and timing of runs.",
  setup:"A 30 × 20 yard field with a 4-yard end zone at each end. 4v4.",
  how:["A team scores when a player receives a pass inside the end zone they attack.","Players can't wait inside the end zone; they must run in.","After a score, the same team attacks the other way.","Play 4-minute games."],
  points:["Time the run into the end zone with the pass.","Make the field big: wide and long.","Keep numbers behind the ball so a turnover isn't fatal."],
  progress:"Only a dribble into the end zone counts, then only a pass.",
  regress:"End zones 6 yards deep.",
  diagram:{w:20, h:38, items:[["z",0,0,20,4],["z",0,34,20,4],["A",6,26],["A",14,28],["A",10,20],["A",16,14],["D",8,18],["D",13,22],["D",10,10],["D",4,14],["b",6.6,25.4],["p",6,26,16,6],["r",16,14,16,3,0]]}});

d({id:"t-scrimmage-condition", title:"Conditioned scrimmage", phase:"Game", level:"Intermediate", minutes:25, minAge:9, players:"Whole team", area:"Two-thirds field", equipment:"2 goals, balls, bibs",
  skills:["decision_making","positional_awareness","tactical_understanding"], tips:["I","P"], method:"ppp",
  summary:"A full game with one rule that brings out the session topic, then a free game to finish.",
  setup:"A game at your team's format (7v7, 9v9 or 11v11) on a shortened field.",
  how:["Pick one condition that matches the session: for example, three passes before a shot, or goals count double after a switch.","Play 10 minutes with the condition.","Take it away and play 10 minutes free.","Notice whether players still do it without the rule."],
  points:["One condition at a time, linked to the topic.","Coach in the flow with short comments, not long stops.","Praise the behaviour you're looking for."],
  progress:"Two conditions.",
  regress:"Freeze play once to show the moment.",
  diagram:{w:50, h:60, items:[["G",25,0,"top"],["G",25,60,"bottom"],["K",25,1.4],["K",25,58.6],["A",10,40],["A",40,40],["A",25,30],["A",18,20],["A",32,20],["D",12,26],["D",38,26],["D",25,14],["D",25,44]]}});

d({id:"t-4v4-2-goals", title:"4v4 + 2 to goals", phase:"Game", level:"Intermediate", minutes:20, minAge:10, players:"10 + keepers", area:"30 × 30 yd", equipment:"2 goals, cones, balls, 3 bib colours",
  skills:["passing","decision_making","shooting"], tips:["I","T"], method:"positional",
  summary:"Two neutrals join whoever has the ball, so the attacking team always has 6 against 4.",
  setup:"A 30-yard square with a goal and keeper at each end. 4v4 plus 2 neutrals.",
  how:["Neutrals play for the team with the ball.","Teams must make 4 passes before shooting.","Neutrals can't score.","Rotate the neutrals every 5 minutes."],
  points:["Use the extra players: find the free one.","Move the ball quickly to open a shooting chance.","When you lose it, press before they find the neutrals."],
  progress:"Neutrals one-touch.",
  regress:"Shoot any time.",
  diagram:{w:30, h:30, items:[["G",15,0,"top"],["G",15,30,"bottom"],["K",15,1.4],["K",15,28.6],["A",8,20],["A",22,22],["A",15,14],["A",10,8],["D",13,18],["D",19,12],["D",9,12],["D",20,6],["N",3,15],["N",27,15],["b",8.7,20.6],["p",8,20,3,15]]}});

d({id:"t-ssg-intervals", title:"3v3 intensity intervals", phase:"Game", level:"Intermediate", minutes:20, minAge:12, players:"12 (four teams of 3)", area:"25 × 20 yd", equipment:"2 small goals, cones, balls, bibs",
  skills:["stamina","physicality","decision_making"], tips:["S","P"], method:"conditioning",
  summary:"Short, all-out 3v3 games with rest between: match fitness with the ball.",
  setup:"A 25 × 20 yard field with small goals. Four teams of 3: two play, two rest and keep balls in play from the sides.",
  how:["Play 2 minutes flat out.","Swap with the resting teams for 2 minutes.","Do 4 rounds per team.","Resting players feed balls in quickly so the game never stops."],
  points:["Full effort for the whole 2 minutes.","Press immediately when you lose it.","Recover actively: walk, breathe, drink."],
  progress:"90 seconds on, 90 off.",
  regress:"2 minutes on, 3 minutes off.",
  diagram:{w:25, h:20, items:[["mg",0.5,10,"v"],["mg",24.5,10,"v"],["A",8,8],["A",14,13],["A",18,6],["D",11,10],["D",16,9],["D",6,13],["N",12,0],["N",12,20],["b",8.7,8.6]]}});

d({id:"t-gate-entry-game", title:"Sprint through the gate game", phase:"Game", level:"Intermediate", minutes:20, minAge:11, players:"10 to 16", area:"40 × 30 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["stamina","separation_speed","decision_making"], tips:["S","P"], method:"conditioning",
  summary:"The coach calls a number and that many players from each team sprint through an entry gate to play.",
  setup:"A 40 × 30 yard field with goals. Two teams line up behind an entry gate at halfway on the sideline.",
  how:["The coach calls a number (1 to 4) and plays a ball in.","That many players from each team sprint through the gate and play until a goal or the ball goes out.","When play stops, they sprint round the field back to their line.","The coach calls the next number straight away."],
  points:["React to the call: first there usually wins.","Attack quickly: the game is short.","Sprint back so your team is ready for the next call."],
  progress:"Call two numbers in a row for overlapping games.",
  regress:"Players walk back instead of sprinting.",
  diagram:{w:30, h:40, items:[["G",15,0,"top"],["G",15,40,"bottom"],["c",0,19],["c",0,21],["A",0.8,18],["D",0.8,22],["N",2,25],["b",15,20],["r",0,19,12,18,0.2],["r",0,21,14,22,-0.2]]}});

d({id:"t-three-zone-8v8", title:"Three-zone game 8v8 + 1", phase:"Game", level:"Advanced", minutes:25, minAge:13, players:"17", area:"60 × 45 yd, three zones", equipment:"2 goals, cones, balls, 3 bib colours",
  skills:["passing","tactical_understanding","positional_awareness"], tips:["I","T"], method:"positional",
  summary:"The ball must go through every zone before a team can score; a neutral helps the team with the ball.",
  setup:"A 60 × 45 yard field split into three zones, goals and keepers at each end, 8v8 plus a neutral.",
  how:["Teams must complete a pass in each zone before shooting.","The neutral plays for the team in possession.","The keeper can join in to help keep the ball.","After 8 minutes, remove the zone rule and play free."],
  points:["Speed of play through the zones.","Width in every zone.","Movement to create an extra player near the ball."],
  progress:"Two-touch in the middle zone.",
  regress:"Only two zones must be used.",
  diagram:{w:45, h:60, items:[["G",22.5,0,"top"],["G",22.5,60,"bottom"],["K",22.5,1.4],["K",22.5,58.6],["z",0,0,45,20],["z",0,20,45,20],["z",0,40,45,20],["A",10,50],["A",35,50],["A",22,30],["A",8,28],["A",37,28],["A",22,12],["N",30,34],["D",15,34],["D",28,26],["D",20,8],["b",10.7,50.6],["p",10,50,22,30],["p",22,30,37,28],["p",37,28,22,12]]}});

d({id:"t-compact-7v7", title:"Compact team game 7v7 with offside lines", phase:"Game", level:"Advanced", minutes:25, minAge:13, players:"14 + keepers", area:"60 × 45 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["defending","tactical_understanding","communication"], tips:["I","P"], method:"defending",
  summary:"Offside lines 15 yards from each goal teach a team to defend compactly and step up together.",
  setup:"A 60 × 45 yard field with goals and keepers, and a cone line 15 yards from each goal for offside.",
  how:["Play 7v7 with offside from the cone line.","A goal scored while the defending team is spread over more than 30 yards counts double.","The coach calls 'step' to test the line.","Play two 10-minute halves."],
  points:["Stay within about 30 yards from front to back.","Step up together when the ball goes backward.","Squeeze toward the ball side."],
  progress:"Offside from halfway.",
  regress:"No offside, just a compactness rule.",
  diagram:{w:45, h:60, items:[["G",22.5,0,"top"],["G",22.5,60,"bottom"],["K",22.5,1.4],["K",22.5,58.6],["z",0,15,45,30],["D",12,20],["D",22,18],["D",33,20],["D",17,28],["D",28,28],["A",10,34],["A",35,34],["A",22,38],["b",22.6,37.4]]}});

d({id:"t-attacking-half", title:"Attacking half game 7v7", phase:"Game", level:"Advanced", minutes:25, minAge:13, players:"14 + keeper", area:"Half field", equipment:"Goal, 3 small goals, cones, balls, bibs",
  skills:["tactical_understanding","positional_awareness","passing"], tips:["I","T"], method:"positional",
  summary:"An attacking team works on positions and patterns in the opponent's half; the defending team counters to small goals.",
  setup:"A half field with a goal and keeper, and three small goals at halfway. Seven attackers (midfielders, wingers, striker) against seven defenders.",
  how:["Attackers must keep at least one winger wide on each side.","They score in the big goal.","Defenders score by countering into a small goal.","Swap roles after 10 minutes."],
  points:["Width, depth and someone between the lines.","Rotate positions without leaving a zone empty.","Recover fast after losing it: the counter goals are close."],
  progress:"Goals from crosses or cut-backs count double.",
  regress:"An extra attacker.",
  diagram:{w:50, h:40, items:[["G",25,0,"top"],["K",25,1.6],["mg",10,39.5,"h"],["mg",25,39.5,"h"],["mg",40,39.5,"h"],["A",4,16],["A",46,16],["A",25,8],["A",18,22],["A",32,22],["D",15,10],["D",25,13],["D",35,10],["D",25,24],["b",18.7,22.6]]}});

d({id:"t-wide-neutrals", title:"7v7 plus two wide neutrals", phase:"Game", level:"Advanced", minutes:25, minAge:13, players:"16 + keepers", area:"Two-thirds field", equipment:"2 goals, cones, balls, 3 bib colours",
  skills:["positional_awareness","tactical_understanding","passing"], tips:["I","T"], method:"positional",
  summary:"Players stay in their zones and two free wingers play for the team in possession: learn how width creates space.",
  setup:"A two-thirds field with goals and keepers. Wide channels on each side for two neutral wingers. Players stay in their lines.",
  how:["Defenders stay deep, midfielders central, strikers high.","The two neutral wingers are unopposed in their channels and play for whoever has the ball.","A goal after a winger's cross or pass counts double.","Lift the zone rule for the last 5 minutes."],
  points:["Use the width to drag the defence apart.","Midfielders find the gaps the width creates.","Strikers time runs to the winger's delivery."],
  progress:"Wingers have two touches.",
  regress:"Wingers can dribble inside.",
  diagram:{w:50, h:70, items:[["G",25,0,"top"],["G",25,70,"bottom"],["K",25,1.4],["K",25,68.6],["z",0,0,6,70],["z",44,0,6,70],["N",3,30],["N",47,40],["A",18,48],["A",32,48],["A",25,38],["A",25,20],["D",18,20],["D",32,20],["D",25,30],["b",3.8,30.6],["p",3,30,25,20]]}});

d({id:"t-press-8v8", title:"8v8 pressing game", phase:"Game", level:"Advanced", minutes:25, minAge:14, players:"16 including keepers", area:"40 × 35 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["defending","tactical_understanding","communication"], tips:["I","S"], method:"pressing",
  summary:"Every restart begins with the keeper, so the other team practises pressing the build-out as a full unit.",
  setup:"A 40 × 35 yard field with goals and keepers. 8v8 including keepers.",
  how:["Every restart starts with a keeper.","The pressing team sets a trigger as a group (for example, a pass to the full-back).","A regain in the opponent's third scores a bonus point.","Swap which team presses every 6 minutes."],
  points:["Front, middle and back lines press together: no one presses alone.","Close the inside pass first.","Win it high and finish fast."],
  progress:"The build-up team gets an extra player.",
  regress:"The build-up team can't pass back to the keeper.",
  diagram:{w:35, h:40, items:[["G",17.5,0,"top"],["G",17.5,40,"bottom"],["K",17.5,1.4],["K",17.5,38.6],["A",8,6],["A",27,6],["A",17,12],["A",4,16],["D",14,8],["D",22,10],["D",17,16],["D",8,18],["r",14,8,10,7,0.3]]}});

/* ---------------- cool-downs ---------------- */
d({id:"t-cooldown", title:"Cool-down and reflection", phase:"Cool-down", level:"Beginner", minutes:8, minAge:5, players:"Whole team", area:"Centre circle", equipment:"None",
  skills:["coachability","communication"], tips:["P"], method:"ppp",
  summary:"Easy jogging, a few stretches and a short chat: what did we learn today?",
  setup:"Players jog lightly, then gather in a circle.",
  how:["Two minutes of easy jogging and walking.","Hold stretches for calves, hamstrings, quads and hips, 20 seconds each.","Ask two or three players what they learned and what went well.","Finish with one thing to practise at home before next time."],
  points:["Breathe slowly; let the heart rate come down.","Let players talk; keep coach talk short.","End on something positive."],
  progress:"Players lead the stretches.",
  regress:"Skip the stretches for younger players; just the chat.",
  diagram:{w:20, h:20, items:[["A",10,3],["A",16,6],["A",17,13],["A",10,17],["A",3,13],["A",4,6],["N",10,10]]}});

d({id:"t-walk-down", title:"Technical walk-down", phase:"Cool-down", level:"Beginner", minutes:8, minAge:8, players:"Pairs", area:"Length of the field", equipment:"A ball per pair",
  skills:["passing","first_touch"], tips:["T"], method:"tips",
  summary:"Pairs walk the field passing gently with both feet: heart rate comes down, touches continue.",
  setup:"Pairs side by side at one end of the field, 5 yards apart, one ball.",
  how:["Walk the length of the field passing to each other with alternate feet.","On the way back, juggle together, letting it bounce if needed.","Finish with 10 easy passes from the hands to the head.","Keep it relaxed."],
  points:["Quality over speed.","Soft first touch out of your feet.","Same number of passes with each foot."],
  progress:"Two-touch passing only.",
  regress:"Stop the ball before every pass.",
  diagram:{w:40, h:10, items:[["A",3,3],["A",3,8],["b",4,3.5],["p",3,3,10,8],["r",3,3,35,3,0],["r",3,8,35,8,0]]}});

d({id:"t-juggle-circle", title:"Juggling circle", phase:"Cool-down", level:"Intermediate", minutes:8, minAge:9, players:"5 to 8 per circle", area:"Small circle", equipment:"1 ball per circle",
  skills:["first_touch","communication"], tips:["T","P"], method:"tips",
  summary:"A group keeps one ball in the air between them: calm touches and a bit of fun to end.",
  setup:"Groups of 5 to 8 in small circles with one ball.",
  how:["Keep the ball up, passing it around the circle in the air.","Each player can take up to three touches.","Count the group's best number of touches.","Then one-touch only."],
  points:["Soft touches that set up your next touch.","Call the name of the player you're passing to.","Stay relaxed and on your toes."],
  progress:"Only weak foot and head.",
  regress:"Allow one bounce between players.",
  diagram:{w:14, h:14, items:[["A",7,1.5],["A",12.5,5],["A",11,11.5],["A",3,11.5],["A",1.5,5],["b",7,3],["p",7,1.5,12.5,5]]}});

d({id:"t-mobility-goals", title:"Mobility and goal-setting", phase:"Cool-down", level:"Intermediate", minutes:10, minAge:10, players:"Whole team", area:"Centre circle", equipment:"None",
  skills:["coachability","communication","attitude"], tips:["P"], method:"ppp",
  summary:"Mobility stretches in a circle while each player shares one thing they did well and one goal for the week.",
  setup:"Players in a circle.",
  how:["Hold mobility stretches for 30 seconds each: hip flexors, calves, hamstrings, groin.","During each stretch, two players share one thing they did well today.","Finish with slow breathing: 4 seconds in, 6 seconds out, for one minute.","Each player names one small goal for their home drills before next session."],
  points:["Be specific: 'I checked my shoulder' beats 'I played well'.","One small goal a week builds habits.","Listen to each other."],
  progress:"Link each answer to the session's coaching point.",
  regress:"Coach asks yes/no questions for younger players.",
  diagram:{w:20, h:20, items:[["A",10,3],["A",16,6],["A",17,13],["A",10,17],["A",3,13],["A",4,6],["N",10,10]]}});

/* drills that were retired in the Nov 2026 rebuild: saved practice plans open the closest current drill */
const LEGACY_TEAM = {"t-knockout":"t-sharks","t-square-overlap":"t-four-corner","t-4v4-wide":"t-4v4-2-goals","t-gk-1v1":"t-gk-shooting","t-build-out":"t-buildout-pattern"};
export const LEVELS = ["Beginner","Intermediate","Advanced"];
export const LEVEL_NOTE = {
  Beginner:"Simple rules, lots of touches and small numbers. Right for younger or newer teams, and good warm-ups for any age.",
  Intermediate:"More players and more decisions: support angles, overlaps, pressure and cover, set pieces.",
  Advanced:"Team tactics at game speed: positional play, pressing traps, building out, compact defending and fast transitions."
};

export const TEAM_DRILLS = D;
export const teamDrillById = id => D.find(x => x.id === id) || (LEGACY_TEAM[id] ? D.find(x => x.id === LEGACY_TEAM[id]) : undefined);
export const playersText = dr => /^\d+( to \d+)?$/.test(dr.players) ? dr.players + " players" : dr.players;
export const TIPS_LABEL = {T:"Technique", I:"Insight", P:"Personality", S:"Speed"};

/* ---------- diagrams ---------- */
const ORANGE = "#d9572a", BLUE = "#1f5fc9", YELLOW = "#f2c81e", GREEN = "#1f8a4c", NAVY = "#14213a";
let UID = 0;
export function diagramSvg(dr, label){
  const g = dr.diagram; if(!g) return "";
  const pad = 2.2, W = g.w + pad * 2, H = g.h + pad * 2, u = "td" + (++UID), sx = x => (x + pad).toFixed(2), sy = y => (y + pad).toFixed(2);
  const r = 0.35 + Math.max(g.w, g.h) * 0.025, sw = r * 0.22;
  const arrow = (id, col) => `<marker id="${u}${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${col}"/></marker>`;
  let s = `<defs>${arrow("p", "#fff")}${arrow("r", "#fff")}${arrow("s", YELLOW)}</defs>`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" rx="${r}" fill="#3f9a53"/>`;
  for(let i = 0; i < W; i += 4) s += `<rect x="${i}" y="0" width="2" height="${H}" fill="#fff" fill-opacity=".05"/>`;
  s += `<rect x="${pad}" y="${pad}" width="${g.w}" height="${g.h}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="${sw}"/>`;
  const line = (x1, y1, x2, y2, kind) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, k = r * 1.05;
    const a = [x1 + ux * k, y1 + uy * k], b = [x2 - ux * k * 0.6, y2 - uy * k * 0.6];
    if(kind === "p") return `<line x1="${sx(a[0])}" y1="${sy(a[1])}" x2="${sx(b[0])}" y2="${sy(b[1])}" stroke="#fff" stroke-width="${sw}" stroke-dasharray="${r * .6} ${r * .45}" marker-end="url(#${u}p)"/>`;
    if(kind === "s") return `<line x1="${sx(a[0])}" y1="${sy(a[1])}" x2="${sx(b[0])}" y2="${sy(b[1])}" stroke="${YELLOW}" stroke-width="${sw * 1.4}" marker-end="url(#${u}s)"/>`;
    if(kind === "d"){ let p = `M${sx(a[0])} ${sy(a[1])}`; const n = Math.max(3, Math.round(len / 1.4)); for(let i = 1; i <= n; i++){ const t = i / n, w = (i % 2 ? 1 : -1) * r * 0.35 * (i < n ? 1 : 0); p += ` L${sx(a[0] + (b[0] - a[0]) * t - uy * w)} ${sy(a[1] + (b[1] - a[1]) * t + ux * w)}`; } return `<path d="${p}" fill="none" stroke="#fff" stroke-width="${sw}" marker-end="url(#${u}r)"/>`; }
    return "";
  };
  const items = g.items.slice().sort((a, b) => ("prsdz".includes(a[0][0]) && a[0] !== "s" ? -1 : 0) - ("prsdz".includes(b[0][0]) && b[0] !== "s" ? -1 : 0));
  items.forEach(it => {
    const [k, x, y, a3, a4, a5] = it;
    if(k === "z" && (!a3 || !a4)) s += `<line x1="${sx(x)}" y1="${sy(y)}" x2="${sx(x + (a3 || 0))}" y2="${sy(y + (a4 || 0))}" stroke="#fff" stroke-opacity=".75" stroke-width="${sw * .8}" stroke-dasharray="${r * .5} ${r * .4}"/>`;
    else if(k === "z") s += `<rect x="${sx(x)}" y="${sy(y)}" width="${a3}" height="${a4}" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-opacity=".75" stroke-width="${sw * .8}" stroke-dasharray="${r * .5} ${r * .4}"/>`;
    else if(k === "p" || k === "s" || k === "d") s += line(x, y, a3, a4, k);
    else if(k === "r"){ const bend = a5 || 0, mx = (x + a3) / 2 - (a4 - y) * bend, my = (y + a4) / 2 + (a3 - x) * bend, len = Math.hypot(a3 - x, a4 - y) || 1, k1 = r * 1.05;
      const sxp = x + (mx - x) / Math.hypot(mx - x, my - y || 1) * k1, syp = y + (my - y) / Math.hypot(mx - x || 1, my - y) * k1;
      s += `<path d="M${sx(sxp)} ${sy(syp)} Q${sx(mx)} ${sy(my)} ${sx(a3)} ${sy(a4)}" fill="none" stroke="#fff" stroke-width="${sw}" marker-end="url(#${u}r)" stroke-opacity=".95"/>`; }
  });
  g.items.forEach(it => {
    const [k, x, y, a3] = it;
    if(k === "c") s += `<path d="M${sx(x - r * .55)} ${sy(y + r * .45)} L${sx(x)} ${sy(y - r * .6)} L${sx(x + r * .55)} ${sy(y + r * .45)}Z" fill="${ORANGE}" stroke="#fff" stroke-width="${sw * .5}"/>`;
    else if(k === "mg"){ const h = a3 === "v", w = r * 3.2, t = r * 0.9; s += `<rect x="${sx(x - (h ? t : w) / 2)}" y="${sy(y - (h ? w : t) / 2)}" width="${h ? t : w}" height="${h ? w : t}" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-width="${sw}"/>`; }
    else if(k === "G"){ const w = Math.min(g.w * 0.3, 8), t = r * 1.1, top = a3 === "top"; s += `<rect x="${sx(x - w / 2)}" y="${sy(top ? y - t : y)}" width="${w}" height="${t}" fill="#fff" fill-opacity=".4" stroke="#fff" stroke-width="${sw * 1.2}"/>`; }
  });
  g.items.forEach(it => {
    const [k, x, y] = it;
    const dot = (fill, txt) => `<circle cx="${sx(x)}" cy="${sy(y)}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="${sw * .9}"/>${txt ? `<text x="${sx(x)}" y="${sy(y + r * .36)}" font-size="${r * 1.05}" font-weight="800" text-anchor="middle" fill="${fill === YELLOW ? NAVY : "#fff"}" font-family="Inter, Arial, sans-serif">${txt}</text>` : ""}`;
    if(k === "A") s += dot(ORANGE);
    else if(k === "D") s += dot(BLUE);
    else if(k === "N") s += dot(YELLOW, "N");
    else if(k === "K") s += dot(GREEN, "GK");
    else if(k === "X") s += dot("#8a94a6");
    else if(k === "b") s += `<circle cx="${sx(x)}" cy="${sy(y)}" r="${r * .45}" fill="#fff" stroke="${NAVY}" stroke-width="${sw * .6}"/>`;
  });
  return `<svg class="tdiag" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" role="img" aria-label="${(label || dr.title).replace(/"/g, "&quot;")}: diagram of the setup">${s}</svg>`;
}
export const DIAGRAM_KEY = `<div class="tkey" aria-hidden="true"><span><i style="background:${ORANGE}"></i>Attack / team in possession</span><span><i style="background:${BLUE}"></i>Defend</span><span><i style="background:${YELLOW}"></i>Neutral</span><span><i style="background:${GREEN}"></i>Keeper</span><span><i style="background:#8a94a6"></i>Waiting</span><span><b class="k-pass"></b>Pass</span><span><b class="k-run"></b>Run / dribble</span><span><b class="k-shot"></b>Shot</span></div>`;
