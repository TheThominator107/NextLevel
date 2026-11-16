/* NextPlay team drill library: academy-style practices for a coach to run with a team.
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

export const PHASES = ["Warm-up","Technical","Possession","Attacking","Defending","Transition","Game","Cool-down"];
export const PHASE_NOTE = {
  "Warm-up":"Gets bodies ready and touches on the ball. 10 to 20 minutes.",
  "Technical":"Unopposed or lightly opposed technique: passing patterns, receiving, finishing.",
  "Possession":"Keep the ball under pressure: rondos and positional games.",
  "Attacking":"Opposed practices that end in a shot: overloads, crossing, finishing.",
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
d({id:"t-fifa11", title:"FIFA 11+ running warm-up", phase:"Warm-up", minutes:15, minAge:10, players:"Any number", area:"Two lines of 6 cones, 10 yd long", equipment:"12 cones",
  skills:["physicality","separation_speed"], tips:["S"], method:"fifa11",
  summary:"The running and cutting parts of the FIFA 11+ warm-up, which lowers injury risk when done at least twice a week.",
  setup:"Two parallel lines of 6 cones, about 5 yards apart and 10 yards long. Players work in pairs, one pair per line.",
  how:["Jog straight through to the last cone and back.","Jog with hip out: lift the knee and open it out at each cone. Then hip in.","Circle your partner: shuffle sideways to meet them in the middle, shuffle round and back.","Shoulder contact: jump sideways toward your partner at each cone and touch shoulders.","Quick forward and backward runs: sprint 2 cones, jog back 1.","Finish with three 40-yard runs at 75% then 90% pace, and bounding strides."],
  points:["Knees over toes on every landing and change of direction.","Stay upright; don't let the knee fall inward.","Build speed gradually, full speed only at the end."],
  progress:"Add the strength and balance part (planks, single-leg balance, Nordic hamstrings) on non-match days.",
  regress:"For under-12s, keep to jogging, hip out/in and short sprints.",
  diagram:{w:30, h:16, items:[...[0,1,2,3,4,5].flatMap(i => [["c",3+i*4.8,4],["c",3+i*4.8,12]]),["A",1,4],["A",1,12],["r",1,4,27,4,0],["r",1,12,27,12,0],["A",14,6],["A",14,10],["r",14,6,15,8,-.6],["r",14,10,15,8,.6]]}});

d({id:"t-rondo-4v1", title:"Rondo 4v1", phase:"Warm-up", minutes:12, minAge:8, players:"5 per grid", area:"8 × 8 yd", equipment:"4 cones, 1 ball, bibs",
  skills:["passing","first_touch","positional_awareness","defending"], tips:["T","I"], method:"rondo",
  summary:"The simplest rondo: four keep the ball from one. Fast passing, body shape and quick thinking.",
  setup:"A square 8 yards each side. Four players on the outside, one defender in the middle.",
  how:["The outside players pass across and around the square, two touches at first.","The defender tries to win or touch the ball.","If the defender wins it, the player who made the mistake swaps in.","Count passes; 10 in a row scores a point."],
  points:["Open your body so you can see the next pass before the ball arrives.","Move along your side to always give the passer two options.","Pass into the foot away from the defender."],
  progress:"One touch only, or make the square smaller (6 × 6).",
  regress:"Unlimited touches, or a bigger square.",
  diagram:{w:12, h:12, items:[["c",2,2],["c",10,2],["c",2,10],["c",10,10],["A",6,1],["A",11,6],["A",6,11],["A",1,6],["D",6.6,5.4],["b",6.6,1.6],["p",6,1,11,6],["p",11,6,6,11]]}});

d({id:"t-four-corner", title:"Four-corner passing", phase:"Warm-up", minutes:12, minAge:8, players:"8 to 12", area:"15 × 15 yd", equipment:"4 cones, 2 balls",
  skills:["passing","first_touch","communication"], tips:["T","S"], method:"tips",
  summary:"Pass and follow round a square: crisp passing, receiving on the move and talking.",
  setup:"A cone at each corner of a 15-yard square with 2 or 3 players at each. Two balls start on opposite corners.",
  how:["Pass to the next corner clockwise and follow your pass to that line.","The receiver takes a touch out of their feet and passes on.","After 2 minutes, go anticlockwise.","Then add a give-and-go: pass, get it back, pass on."],
  points:["Call the receiver's name before you pass.","Receive on the back foot, with your first touch toward the next corner.","Firm pass along the ground into the receiver's front foot."],
  progress:"One touch, or a third ball.",
  regress:"Make the square smaller and allow two touches.",
  diagram:{w:18, h:18, items:[["c",2,2],["c",16,2],["c",16,16],["c",2,16],["A",2,2],["A",16,2],["A",16,16],["A",2,16],["A",0.6,0.6],["A",17.4,17.4],["b",2.9,2.5],["p",2,2,16,2],["r",2.5,3,15.5,3,.2],["p",16,16,2,16]]}});

d({id:"t-y-passing", title:"Y passing pattern", phase:"Technical", minutes:15, minAge:11, players:"6 to 10", area:"25 × 20 yd", equipment:"5 cones, 2 balls",
  skills:["passing","first_touch","positional_awareness"], tips:["T","I"], method:"tips",
  summary:"A passing pattern in the shape of a Y that practises the third-man pass and receiving on the half-turn.",
  setup:"Cones in a Y: one at the base, one 10 yards up the middle, and two 10 yards further up, left and right.",
  how:["A at the base passes to B in the middle, who sets it back.","A plays the ball wide to C at the top left. B spins and runs on.","C passes into B's path; B dribbles to the start.","Everyone follows their pass to the next cone. Alternate left and right."],
  points:["B checks away before showing for the ball.","Set passes go back to the passer's front foot.","Timing: B runs as C receives, not before."],
  progress:"One-touch at every station, or add a passive defender behind B.",
  regress:"Remove the spin; B simply passes to C.",
  diagram:{w:24, h:24, items:[["c",12,22],["c",12,13],["c",5,4],["c",19,4],["A",12,22],["A",12,13],["A",5,4],["A",19,4],["b",12,21],["p",12,21,12,14],["p",12,14,12,20],["p",12,20,5.5,5],["r",12,13,17,6,.3],["p",5.5,5,16,6]]}});

d({id:"t-ball-mastery-grid", title:"Ball mastery grid", phase:"Warm-up", minutes:10, minAge:6, players:"Whole team, a ball each", area:"20 × 20 yd", equipment:"4 cones, a ball each",
  skills:["dribbling","first_touch","handling_speed"], tips:["T","S"], method:"dutch4v4",
  summary:"Everyone dribbles in a box while the coach calls skills, turns and speed changes. Hundreds of touches in 10 minutes.",
  setup:"A 20-yard square. Every player has a ball inside it.",
  how:["Dribble anywhere in the box without touching anyone.","On the call: sole stop, inside cut, outside cut, drag-back or step-over.","On 'Change!', switch to the weaker foot only.","Finish with a race: who can touch all four cones and get back first."],
  points:["Head up between touches to find space.","Small touches in traffic, bigger touches into open space.","Change speed after every turn."],
  progress:"Make the box smaller, or two players without a ball try to steal one.",
  regress:"Make the box bigger and slow the calls down.",
  diagram:{w:22, h:22, items:[["c",1,1],["c",21,1],["c",1,21],["c",21,21],["A",5,6],["A",15,5],["A",10,11],["A",17,15],["A",6,16],["A",12,18],["d",5,6,9,9],["d",15,5,12,8],["d",17,15,14,12]]}});

/* ---------------- possession ---------------- */
d({id:"t-rondo-5v2", title:"Rondo 5v2", phase:"Possession", minutes:15, minAge:10, players:"7 per grid", area:"10 × 10 yd", equipment:"4 cones, balls, bibs",
  skills:["passing","first_touch","decision_making","defending","communication"], tips:["T","I","P"], method:"rondo",
  summary:"The classic academy rondo. Five keep it from two who press together, so passers must find the split pass.",
  setup:"A 10-yard square. Five on the outside, two defenders in the middle.",
  how:["Outside players keep the ball with two touches.","A pass between the two defenders (a 'split') scores a bonus point.","If a defender wins it, the player who lost it and the one who passed to them go in.","Play 90 seconds per round and count points."],
  points:["Defenders: press together, one on the ball and one cutting the split.","Passers: play away from pressure and look for the split.","Support angles: never stand directly behind a defender."],
  progress:"One touch, or a player can step inside the square as a sixth option.",
  regress:"Three touches, or 5v1 for the first round.",
  diagram:{w:14, h:14, items:[["c",2,2],["c",12,2],["c",2,12],["c",12,12],["A",7,1.2],["A",12.8,5],["A",12.8,10],["A",4,12.8],["A",1.2,6],["D",6,6],["D",9,8],["b",7,1.8],["p",7,1.8,4,12.2],["p",1.2,6,12.8,10]]}});

d({id:"t-rondo-transition", title:"Double rondo with transition", phase:"Possession", minutes:15, minAge:12, players:"12", area:"Two 10 × 10 yd squares, 5 yd apart", equipment:"8 cones, balls, two sets of bibs",
  skills:["passing","decision_making","separation_speed","defending"], tips:["I","S","P"], method:"rondo",
  summary:"Two rondos side by side. When defenders win the ball, they pass it to the other square and switch roles.",
  setup:"Two squares, 5 yards apart. In each: four attackers on the outside and two defenders from the other team in the middle.",
  how:["4v2 rondo in each square.","When the defenders win the ball, they pass it into the other square to their own team and sprint over to join it.","The team that lost it sends two players to press in the other square straight away.","Keep score of the number of transitions won."],
  points:["React within two seconds of losing the ball.","Winners: look up and play the first pass to the other square quickly.","Keep the square wide when you have the ball."],
  progress:"One-touch, or the pressing pair must arrive within five seconds.",
  regress:"Larger squares and two-touch.",
  diagram:{w:28, h:12, items:[["c",1,1],["c",11,1],["c",1,11],["c",11,11],["c",17,1],["c",27,1],["c",17,11],["c",27,11],["A",6,0.5],["A",11.5,6],["A",6,11.5],["A",0.5,6],["D",5,5],["D",7,7],["D",22,0.5],["D",27.5,6],["D",22,11.5],["D",16.5,6],["A",21,5],["A",23,7],["b",7,7.6],["p",7,7,16.5,6],["r",5,5,20,4,-.3]]}});

d({id:"t-positional-4v4-3", title:"Positional game 4v4 + 3", phase:"Possession", minutes:18, minAge:12, players:"11", area:"30 × 25 yd", equipment:"Cones, balls, three sets of bibs",
  skills:["passing","positional_awareness","decision_making","tactical_understanding","first_touch"], tips:["I","T"], method:"positional",
  summary:"Two teams of four keep the ball with three neutral players who always play for the team in possession, creating 7v4.",
  setup:"A 30 × 25 yard area. Two teams of four inside. Neutrals: one at each end line and one in the middle.",
  how:["The team with the ball plays with the three neutrals.","Score a point for 8 passes in a row, or for playing end neutral to end neutral.","Neutrals have two touches; team players have three.","Lose it: the other team now plays with the neutrals."],
  points:["Find the free player: if you're marked, move to make space for someone else.","Width and depth: stretch the area when your team has the ball.","Play forward to the end neutral when the line opens."],
  progress:"Neutrals one touch, or the middle neutral can't pass back to whoever passed to them.",
  regress:"Make the area larger, or add a fourth neutral.",
  diagram:{w:30, h:25, items:[["z",0,0,30,25],["N",15,0.8],["N",15,24.2],["N",15,12.5],["A",6,7],["A",24,8],["A",7,18],["A",23,17],["D",11,9],["D",19,10],["D",12,16],["D",19,16],["b",6.6,7.6],["p",6.6,7.6,15,12.5],["p",15,12.5,23,17],["p",23,17,15,24.2]]}});

d({id:"t-three-zone", title:"Three-zone build-up game", phase:"Possession", minutes:18, minAge:13, players:"12 to 14", area:"40 × 30 yd, split in three", equipment:"Cones, balls, bibs",
  skills:["passing","positional_awareness","tactical_understanding","decision_making"], tips:["I","T"], method:"positional",
  summary:"Teams must pass through the middle zone to score, teaching patience and how to play through lines.",
  setup:"A 40 × 30 yard area cut into three zones of equal length. Each team has players in all three zones (for example 2-3-2), with a target player at each end.",
  how:["Players stay in their zones.","To score, the ball must travel back zone to middle zone to target player.","A pass from back zone straight to the target doesn't count.","After 4 minutes, one player may move up a zone to make an overload."],
  points:["Middle players: show on the half-turn between the opponents.","Back players: draw a defender in before passing to free a teammate.","Be patient: switch the ball if the middle is blocked."],
  progress:"Limit middle players to two touches.",
  regress:"Allow one player to move freely between zones from the start.",
  diagram:{w:40, h:30, items:[["z",0,0,40,30],["z",13.3,0,13.4,30],["N",0.8,15],["N",39.2,15],["A",6,9],["A",6,21],["D",9,15],["A",17,8],["A",20,15],["A",23,22],["D",17,12],["D",23,10],["D",20,20],["A",33,10],["A",33,20],["D",30,15],["b",6.6,9.6],["p",6.6,9.6,20,15],["p",20,15,39.2,15]]}});

d({id:"t-third-man", title:"Third-man combination", phase:"Technical", minutes:15, minAge:12, players:"6 to 9", area:"25 × 15 yd", equipment:"Cones, balls, a mannequin or cone",
  skills:["passing","positional_awareness","decision_making"], tips:["I","T"], method:"positional",
  summary:"A wall-pass pattern that frees a third player running past a blocked passing line, a staple of positional play.",
  setup:"Three lines: A at the start, B 10 yards ahead (checking to the ball), and C 10 yards to the side. A cone between A and C blocks the direct pass.",
  how:["A passes into B.","B sets back to A, or lays it off sideways.","A plays first time into C's run behind the cone.","Rotate A to B to C to A."],
  points:["B's set pass must be soft and to A's front foot.","C starts the run when B receives, not before.","A looks at C before the set comes back."],
  progress:"Add a passive defender who must be beaten by the third-man pass.",
  regress:"Allow A a touch before passing to C.",
  diagram:{w:24, h:18, items:[["A",4,15],["A",13,10],["A",4,4],["c",8,9],["b",4.6,14.4],["p",4.6,14.4,12.4,10.4],["p",12.4,10.4,6,14],["r",4,4,18,4,.25],["p",6,14,17,5]]}});

/* ---------------- attacking ---------------- */
d({id:"t-2v1-goal", title:"2v1 to goal", phase:"Attacking", minutes:15, minAge:9, players:"6 to 12", area:"25 × 20 yd with a goal", equipment:"Goal, cones, balls, bibs",
  skills:["passing","dribbling","decision_making","shooting"], tips:["I","T"], method:"wave",
  summary:"Two attackers against one defender: commit the defender, then pass or go.",
  setup:"A goal with a keeper. Two attacker lines 25 yards out. A defender line beside the goal.",
  how:["The defender passes out to the attackers and steps in.","The two attackers try to score against the defender and keeper.","Dribble at the defender to commit them, then pass to the free player or keep it.","Next three go as soon as the attack ends."],
  points:["Run at the defender's shoulder to make them choose.","The player without the ball stays level or slightly behind for a pass.","Shoot early when the defender's out of the way."],
  progress:"A second defender chases from the halfway line after 3 seconds.",
  regress:"The defender starts passive (walk only).",
  diagram:{w:30, h:28, items:[["G",15,0,"top"],["K",15,1.6],["D",15,9],["A",9,23],["A",21,23],["b",9.5,22.2],["d",9.5,22.2,13,13],["r",21,23,20,11,-.2],["p",13,13,19.5,10.5],["s",19.5,10.5,13.5,0.3]]}});

d({id:"t-3v2-waves", title:"3v2 attacking waves", phase:"Attacking", minutes:18, minAge:11, players:"10 to 15", area:"35 × 30 yd with goals at both ends", equipment:"2 goals, cones, balls, bibs",
  skills:["passing","positional_awareness","decision_making","shooting","defending"], tips:["I","S"], method:"wave",
  summary:"Three attack two. When the attack ends, the two defenders counter-attack against the next pair.",
  setup:"Goals at both ends with keepers. Groups of three at one end and pairs of defenders at the other.",
  how:["Three attackers go at two defenders and the keeper.","When the attack ends (goal, save or ball out), the two defenders become attackers and go the other way against the next two.","The three attackers stay on for one more wave as defenders, then rotate off.","Score points for goals in under 8 seconds."],
  points:["Attackers: use width; the middle player draws a defender.","Pass to the player the defender has left.","Defenders: delay, stay goal-side and force play wide."],
  progress:"Limit the attack to 6 seconds.",
  regress:"Make it 3v1 for the first round.",
  diagram:{w:30, h:35, items:[["G",15,0,"top"],["G",15,35,"bottom"],["K",15,1.6],["K",15,33.4],["D",11,10],["D",19,10],["A",6,22],["A",15,24],["A",24,22],["b",15.6,23.2],["p",15.6,23.2,6.5,21.5],["r",24,22,21,9,-.2],["p",6.5,21.5,20,9.5],["s",20,9.5,16.5,0.3]]}});

d({id:"t-cross-finish", title:"Wide play, cross and finish", phase:"Attacking", minutes:18, minAge:11, players:"8 to 12", area:"Half pitch", equipment:"Goal, cones, balls",
  skills:["passing","shooting","positional_awareness","communication"], tips:["T","I"], method:"finishing",
  summary:"A pass out wide, a cross and runs into the box: near post, far post and penalty spot.",
  setup:"A goal with a keeper. A wide player on each wing 30 yards out and two lines of strikers in the middle.",
  how:["A central player passes wide to the winger and runs into the box.","The winger dribbles to the end line and crosses.","Two strikers attack the near post and far post; the passer arrives at the penalty spot.","Alternate wings."],
  points:["Strikers: time the run so you arrive as the ball does.","Near-post run goes in front of the defender's line.","Winger: look up before you cross and pick a runner."],
  progress:"Add one or two defenders in the box.",
  regress:"The winger crosses from a stationary ball.",
  diagram:{w:40, h:30, items:[["G",20,0,"top"],["K",20,1.6],["z",10,0,20,10],["A",20,24],["A",35,18],["A",16,18],["A",24,18],["b",20.6,23.2],["p",20.6,23.2,34.5,18],["d",34.5,18,36,4],["p",36,4,17,5],["r",16,18,17,5,.2],["r",24,18,25,4,-.2],["r",20,24,20,11,0]]}});

d({id:"t-finishing-combo", title:"Combination and finish", phase:"Attacking", minutes:15, minAge:10, players:"6 to 12", area:"30 × 20 yd with a goal", equipment:"Goal, cones, balls",
  skills:["shooting","passing","first_touch"], tips:["T","S"], method:"finishing",
  summary:"A one-two with a server at the top of the box, then a shot. Repetition of finishing after a pass.",
  setup:"A goal with a keeper. A server stands at the top of the box. Players line up 25 yards out.",
  how:["Pass into the server and run past.","The server lays it into your path.","Finish first time or after one touch.","Alternate sides each round; rotate the server."],
  points:["Keep the shot low and aim for the corners.","Look at the keeper's position before the shot.","Follow in for rebounds."],
  progress:"Add a chasing defender who starts 3 yards behind.",
  regress:"Take a touch to set the ball before shooting.",
  diagram:{w:30, h:26, items:[["G",15,0,"top"],["K",15,1.6],["z",5,0,20,9],["N",15,12],["A",15,23],["b",15.6,22.2],["p",15.6,22.2,15,12.8],["r",15,23,19,11,-.3],["p",15,12.8,19,10],["s",19,10,12.5,0.3]]}});

d({id:"t-1v1-attack", title:"1v1 to a goal", phase:"Attacking", minutes:15, minAge:8, players:"6 to 12", area:"20 × 15 yd per pair", equipment:"Mini goals or cone gates, balls, bibs",
  skills:["dribbling","separation_speed","defending","physicality"], tips:["T","P","S"], method:"tips",
  summary:"One attacker, one defender, one goal each. Builds the confidence to take players on.",
  setup:"A 20 × 15 yard channel with a mini goal at each end. Pairs line up at each end.",
  how:["The defender passes to the attacker and closes them down.","The attacker tries to score in the far goal.","If the defender wins it, they can counter into the other goal.","Swap roles each go."],
  points:["Attack the front foot of the defender at speed.","Use a fake, then change speed into the space.","Defenders: get side-on and show the attacker one way."],
  progress:"Smaller goals, or a 6-second limit.",
  regress:"Wider channel so the attacker has more room.",
  diagram:{w:16, h:22, items:[["mg",8,0.6,"h"],["mg",8,21.4,"h"],["D",8,7],["A",8,17],["b",8.6,16.2],["d",8.6,16.2,4,8],["r",4,8,7,2,.2]]}});

/* ---------------- defending ---------------- */
d({id:"t-1v1-defend", title:"1v1 defending channel", phase:"Defending", minutes:15, minAge:9, players:"6 to 12", area:"10 × 20 yd channels", equipment:"Cones, balls, bibs",
  skills:["defending","physicality","decision_making"], tips:["P","S"], method:"defending",
  summary:"Close down quickly, get side-on and stop the attacker dribbling over the line.",
  setup:"A channel 10 yards wide and 20 long. Defenders at one end, attackers with balls at the other.",
  how:["The defender passes to the attacker and sprints to close down.","The attacker tries to dribble over the defender's end line.","The defender wins a point by stopping them or winning the ball.","Swap roles after 6 goes."],
  points:["Sprint to close, then slow down with short steps in the last 2 yards.","Side-on, low, about an arm's length away.","Show the attacker onto their weaker foot or toward the sideline."],
  progress:"The attacker can also score by passing to a target player behind the defender.",
  regress:"Narrow the channel to 8 yards.",
  diagram:{w:14, h:22, items:[["z",2,1,10,20],["D",7,3],["A",7,19],["b",7.6,18.2],["p",7,3.6,7.4,17.6],["r",7,3,7,12,0],["d",7.6,18.2,5,13]]}});

d({id:"t-2v2-cover", title:"2v2 pressure and cover", phase:"Defending", minutes:15, minAge:11, players:"8 to 12", area:"20 × 25 yd", equipment:"Cone gates or mini goals, balls, bibs",
  skills:["defending","communication","positional_awareness","tactical_understanding"], tips:["I","P"], method:"defending",
  summary:"The first defender presses, the second covers at an angle behind. The heart of team defending.",
  setup:"A 20 × 25 area. Two defenders protect two small gates at one end. Two attackers start at the other.",
  how:["Attackers try to dribble or pass through either gate.","The nearest defender presses the ball; the other covers behind at an angle.","When the ball moves, they swap roles.","Defenders score by winning the ball and passing it over the halfway line."],
  points:["Talk: 'I've got the ball', 'I'm covering'.","Cover at 3 to 5 yards, at an angle, not flat.","Press quickly as the ball travels, not after it arrives."],
  progress:"Make it 3v2 with defenders outnumbered.",
  regress:"Attackers must dribble only, no passing.",
  diagram:{w:22, h:26, items:[["mg",6,1,"h"],["mg",16,1,"h"],["D",9,9],["D",13,12],["A",8,21],["A",15,19],["b",8.6,20.2],["r",9,9,8.8,15,0],["r",13,12,12,13.5,0]]}});

d({id:"t-press-trigger", title:"Pressing game 6v4", phase:"Defending", minutes:18, minAge:13, players:"10", area:"35 × 30 yd", equipment:"Cones, mini goals, balls, bibs",
  skills:["defending","communication","tactical_understanding","physicality"], tips:["I","P","S"], method:"pressing",
  summary:"Four defenders press together to stop six from building out. They press on a trigger, like a backward pass or a heavy touch.",
  setup:"Six players try to keep possession and pass into either of two mini goals behind the four pressers. Four defenders start in front of the goals.",
  how:["The six pass among themselves and look for a pass into a goal.","The four press together on a trigger: a pass backward, a bad touch, or a pass to a player facing their own goal.","Defenders score by winning the ball and finishing in a cone gate at the far end.","Play 2-minute rounds and switch roles."],
  points:["Press together: if one goes, all four shift.","Cut off the passing lane with your run (curve your approach).","Shout the trigger so everyone presses at once."],
  progress:"Make it 6v3, or limit the six to two touches only to speed it up.",
  regress:"Make it 5v4 and give the area more length.",
  diagram:{w:35, h:30, items:[["mg",12,1,"h"],["mg",23,1,"h"],["D",10,9],["D",17,8],["D",24,9],["D",17,14],["A",5,17],["A",14,22],["A",21,22],["A",30,17],["A",9,27],["A",26,27],["b",14.6,21.2],["p",14.6,21.2,9.5,26.4],["r",17,14,12,22,.25],["r",10,9,7,15,0]]}});

/* ---------------- transition ---------------- */
d({id:"t-counter-4v3", title:"Win it and counter 4v3", phase:"Transition", minutes:18, minAge:12, players:"12 to 14", area:"Half pitch with two goals", equipment:"Goals, cones, balls, bibs",
  skills:["separation_speed","decision_making","passing","shooting"], tips:["S","I"], method:"pressing",
  summary:"Win the ball in your half and attack the other goal fast before the opponents can recover.",
  setup:"Two zones. In the defending zone, 4 defenders face 3 attackers. When the defenders win it, they counter into the other zone.",
  how:["The 3 attackers try to score.","When the 4 defenders win it, they break forward to score in the opposite goal or mini goals within 10 seconds.","Two of the attackers chase back to defend.","Rotate roles every 3 minutes."],
  points:["First pass forward if it's on.","Run in straight lines toward goal, then spread wide.","Attack while the other team is still disorganized."],
  progress:"Reduce the counter time to 8 seconds.",
  regress:"Allow 15 seconds.",
  diagram:{w:30, h:40, items:[["G",15,40,"bottom"],["K",15,38.4],["mg",8,0.8,"h"],["mg",22,0.8,"h"],["z",0,20,30,20],["A",8,28],["A",15,30],["A",22,28],["A",15,24],["D",10,33],["D",20,33],["D",15,34],["b",15.6,24.6],["p",15.6,24.6,6,15],["r",22,28,24,8,-.2],["r",8,28,8,8,.15],["p",6,15,22,9]]}});

d({id:"t-counterpress", title:"Five-second counter-press", phase:"Transition", minutes:15, minAge:12, players:"10 to 12", area:"30 × 25 yd", equipment:"Cones, balls, bibs",
  skills:["defending","physicality","communication","separation_speed"], tips:["P","S"], method:"pressing",
  summary:"A possession game where losing the ball starts a 5-second all-out press to win it straight back.",
  setup:"Two teams of 5 or 6 in a 30 × 25 area.",
  how:["Teams keep the ball; 6 passes is a point.","When you lose the ball, everyone near it presses for 5 seconds.","Win it back within 5 seconds: 2 points.","If the other team survives 5 seconds, they score a point."],
  points:["The nearest player presses the ball, the others close the passing options.","React straight away: no complaining about losing it.","If the 5 seconds pass, drop back into shape."],
  progress:"Three seconds instead of five.",
  regress:"Make the area bigger so pressing is easier.",
  diagram:{w:30, h:25, items:[["z",0,0,30,25],["A",6,6],["A",14,10],["A",8,17],["A",22,6],["A",24,18],["D",12,6],["D",18,12],["D",10,20],["D",25,12],["D",17,20],["b",18.6,11.6],["r",14,10,17.6,11.6,0],["r",22,6,19,10,0],["r",24,18,20,14,0]]}});

/* ---------------- small-sided games ---------------- */
d({id:"t-dutch-4v4", title:"Dutch 4v4", phase:"Game", minutes:20, minAge:6, players:"8 per pitch", area:"30 × 25 yd", equipment:"4 mini goals or cone gates, balls, bibs",
  skills:["dribbling","passing","decision_making","positional_awareness","defending"], tips:["T","I","P","S"], method:"dutch4v4",
  summary:"The game at the heart of Dutch youth football: 4v4, small goals, every player constantly involved.",
  setup:"A 30 × 25 pitch with two small goals on each end line. No keepers.",
  how:["Play 4v4. Score in either of the opponent's two goals.","Kick-ins or dribble-ins instead of throw-ins.","Play 4 to 6 minutes, then rest and change opponents.","Coach between games, not during."],
  points:["Use the whole width: if one goal is blocked, switch to the other.","Every player attacks and defends.","Let players solve problems; ask questions at the break."],
  progress:"Add a condition: a goal counts double after a switch of play.",
  regress:"Play 4v3 with the stronger team outnumbered.",
  diagram:{w:30, h:25, items:[["mg",8,0.7,"h"],["mg",22,0.7,"h"],["mg",8,24.3,"h"],["mg",22,24.3,"h"],["A",8,17],["A",15,14],["A",22,18],["A",15,20],["D",9,10],["D",15,8],["D",21,10],["D",15,5],["b",15.6,13.6],["p",15.6,13.6,22,17.6],["s",22,17.6,22,1]]}});

d({id:"t-funino", title:"Funino 3v3, four goals", phase:"Game", minutes:20, minAge:7, players:"6 to 8 per pitch", area:"25 × 20 yd with a shooting zone", equipment:"4 mini goals, cones, balls, bibs",
  skills:["decision_making","positional_awareness","dribbling","passing"], tips:["I","T","S"], method:"funino",
  summary:"Horst Wein's 3v3 game on four goals. Shooting only from a zone near the goals, so players learn to switch play.",
  setup:"A 25 × 20 pitch with two mini goals at each end, 12 yards apart. A shooting zone 6 yards from each end line.",
  how:["3v3. Score in either goal, but only from inside the shooting zone.","If one goal is crowded, switch to the other.","After each goal, the scoring team rotates a fresh player on.","Play 5-minute games and change opponents."],
  points:["Look for the open goal: the switch is often the answer.","Support the ball carrier with one wide and one deep.","Defend the goal that's in danger, not the one far away."],
  progress:"A goal from a pass made from the other half counts double.",
  regress:"Remove the shooting zone.",
  diagram:{w:25, h:30, items:[["mg",6,0.7,"h"],["mg",19,0.7,"h"],["mg",6,29.3,"h"],["mg",19,29.3,"h"],["z",0,0,25,6],["z",0,24,25,6],["A",7,12],["A",15,10],["A",19,16],["D",8,6],["D",12,7],["D",17,8],["b",7.6,11.4],["p",7.6,11.4,19,15.4],["d",19,15.4,20,5],["s",20,5,19,1]]}});

d({id:"t-ssg-5v5-gk", title:"5v5 with keepers", phase:"Game", minutes:20, minAge:9, players:"12", area:"40 × 30 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["shooting","passing","decision_making","defending","gk_shot_stopping","gk_distribution"], tips:["T","I","P","S"], method:"ppp",
  summary:"A small-sided game with keepers to finish the session: lots of shots, saves and decisions.",
  setup:"A 40 × 30 pitch with full-size or 12 × 6 ft goals and keepers.",
  how:["Play 5v5 plus keepers.","Add the session's condition, for example: a goal after a switch of play counts double.","Keepers must restart with a throw or a pass, never a long kick.","Play 3 × 6-minute games."],
  points:["Bring the session's topic into the game.","Coach in the breaks, not constantly during play.","Keepers: start attacks quickly to a free player."],
  progress:"Limit touches to three for outfield players.",
  regress:"Give the team that's behind an extra player.",
  diagram:{w:30, h:40, items:[["G",15,0,"top"],["G",15,40,"bottom"],["K",15,1.6],["K",15,38.4],["A",8,28],["A",15,25],["A",22,28],["A",10,18],["A",20,18],["D",8,12],["D",15,15],["D",22,12],["D",10,22],["D",20,22],["b",15.6,24.4],["p",15.6,24.4,20,18.6],["s",20,18.6,17,0.4]]}});

d({id:"t-endzone", title:"End-zone game", phase:"Game", minutes:20, minAge:10, players:"10 to 14", area:"40 × 30 yd with 5-yd end zones", equipment:"Cones, balls, bibs",
  skills:["passing","positional_awareness","decision_making","separation_speed"], tips:["I","S"], method:"ppp",
  summary:"Score by receiving the ball under control in the end zone. Teaches runs in behind and the timing of the pass.",
  setup:"A 40 × 30 area with a 5-yard zone at each end.",
  how:["Two teams of 5 to 7.","Score by passing to a teammate who runs into the end zone and stops the ball there.","No player may wait in the end zone.","Play 3 × 6 minutes."],
  points:["Time the run: arrive as the pass is played.","Look up early: the pass behind is on when the defender's facing the ball.","Use a fake run to pull the defender away first."],
  progress:"The receiver must control with one touch.",
  regress:"Allow dribbling into the end zone to score too.",
  diagram:{w:30, h:40, items:[["z",0,0,30,5],["z",0,35,30,5],["A",8,25],["A",16,22],["A",23,27],["A",12,15],["D",10,12],["D",18,14],["D",22,20],["D",13,22],["b",16.6,21.4],["r",12,15,10,3,.2],["p",16.6,21.4,10,3.5]]}});

d({id:"t-scrimmage-condition", title:"Conditioned scrimmage", phase:"Game", minutes:25, minAge:6, players:"Whole team", area:"Your match pitch size", equipment:"Goals, bibs, balls",
  skills:["tactical_understanding","decision_making","communication","positional_awareness"], tips:["I","P"], method:"ppp",
  summary:"A match at your normal team size with one rule that brings out the session's focus, the second 'Play' of Play-Practice-Play.",
  setup:"Your game format (7v7, 9v9 or 11v11), or as close as numbers allow.",
  how:["Pick one condition that matches today's session, for example: goals after a cross count double, or every player must touch the ball before a shot.","Play two halves of 10 to 12 minutes.","Freeze play only to show a moment that matches the topic.","Finish with 5 minutes of free play."],
  points:["Coach the topic, not everything.","Praise good decisions, not just goals.","Let players try things; mistakes are learning."],
  progress:"Make the condition harder to meet.",
  regress:"Play without a condition.",
  diagram:{w:40, h:50, items:[["G",20,0,"top"],["G",20,50,"bottom"],["K",20,1.6],["K",20,48.4],["z",0,25,40,0],["A",10,36],["A",20,40],["A",30,36],["A",14,28],["A",26,28],["A",20,20],["D",10,14],["D",20,10],["D",30,14],["D",14,22],["D",26,22],["D",20,30],["b",20.6,39.4]]}});

/* ---------------- goalkeepers with the team ---------------- */
d({id:"t-gk-shooting", title:"Keepers and shooting circuit", phase:"Technical", minutes:15, minAge:9, players:"Whole team + keepers", area:"Penalty area", equipment:"Goal, balls, cones",
  skills:["shooting","gk_shot_stopping","gk_diving","gk_positioning"], tips:["T","S"], method:"finishing",
  summary:"Shooting from three angles so keepers face game-like shots and outfield players practise finishing.",
  setup:"A goal with a keeper. Three shooting cones at 16 yards: left, centre, right.",
  how:["Players shoot in turn from each cone.","The keeper resets to the set position between shots.","After 10 shots, change keeper and move the cones.","Add a rebound: the next shooter follows in."],
  points:["Keeper: set feet before the shot, weight forward.","Shooters: hit the target, low and to the corners.","Give the keeper time to reset; quality over speed."],
  progress:"Shoot after a dribble or a one-two instead of from a still ball.",
  regress:"Move the shooting cones closer and shoot with the side foot.",
  diagram:{w:30, h:22, items:[["G",15,0,"top"],["K",15,1.8],["z",4,0,22,9],["c",7,16],["c",15,17],["c",23,16],["A",7,17],["A",15,18],["A",23,17],["s",15,17.4,11,0.4],["s",7,16.4,18,0.4]]}});

d({id:"t-gk-distribution", title:"Keeper distribution to targets", phase:"Technical", minutes:12, minAge:10, players:"Keepers + 4 targets", area:"Half pitch", equipment:"Goal, cones, balls",
  skills:["gk_distribution","gk_decision_making","first_touch","passing"], tips:["T","I"], method:"tips",
  summary:"Keepers start attacks: roll, throw and pass to players who have moved into space.",
  setup:"A keeper in goal with balls. Four target players in coned boxes: two full-backs wide, a midfielder and a striker.",
  how:["The coach calls a target.","The keeper picks the right distribution: roll, sidearm throw, pass or kick.","The target controls and passes back into the box for the next ball.","Add a passive defender who blocks one target."],
  points:["Pick the free player, not the furthest one.","Quick release: start the attack before opponents recover.","Targets: open up to receive facing forward."],
  progress:"The keeper chooses the target, not the coach.",
  regress:"Shorter distances and rolling only.",
  diagram:{w:40, h:40, items:[["G",20,0,"top"],["K",20,2.4],["z",2,12,8,8],["z",30,12,8,8],["z",16,18,8,8],["z",16,32,8,7],["A",6,16],["A",34,16],["A",20,22],["A",20,35],["b",20.6,3],["p",20.6,3,6,15.4],["p",20.6,3,20,21.4]]}});

d({id:"t-heading-game", title:"Throw-head-catch", phase:"Technical", minutes:12, minAge:11, players:"8 to 12", area:"30 × 20 yd", equipment:"Cones, balls, bibs",
  skills:["first_touch","communication","positional_awareness"], tips:["T","P"], method:"tips",
  summary:"A handball-style game where the ball goes throw, head, catch. Practises heading technique and movement without heavy impact.",
  setup:"Two teams in a 30 × 20 area with a goal line at each end.",
  how:["Pass the ball by hand in the order throw, head, catch.","Score by heading over the opponent's end line.","Drop it and it's the other team's ball.","Use a lighter ball for younger players."],
  points:["Eyes open, use the forehead, and attack the ball.","Movement: find space for the header.","Limit the number of headers per session, especially for under-14s."],
  progress:"Header must go to a teammate before scoring.",
  regress:"Throw-catch only, with heading only to score.",
  note:"U.S. Soccer guidelines: no heading in games or practice for players 10 and under, and limited heading practice for ages 11 to 13. Check your league's rules.",
  diagram:{w:30, h:22, items:[["z",0,0,30,22],["A",6,8],["A",12,14],["A",20,8],["D",9,11],["D",17,12],["D",24,10],["b",12,12.4],["p",6,8,12,13.4],["p",12,13.4,20,8.6]]}});

d({id:"t-cooldown", title:"Cool-down and reflection", phase:"Cool-down", minutes:8, minAge:6, players:"Whole team", area:"Anywhere", equipment:"None",
  skills:["coachability","communication"], tips:["P"], method:"ppp",
  summary:"Easy jogging, stretches and two questions that help players remember today's topic.",
  setup:"Players in a circle.",
  how:["Two minutes easy jogging and walking.","Gentle stretches for hamstrings, quads, calves and hips (20 to 30 seconds each).","Ask: 'When did you use today's topic in the game?' and 'What will you try next time?'","Finish with team news and a clap."],
  points:["Ask, don't tell: let players explain what they learned.","Mention one player who tried hard, not just one who scored.","Keep it short."],
  progress:"Players set one goal for the week.",
  regress:"Stretches only.",
  diagram:{w:16, h:16, items:[...[0,1,2,3,4,5,6,7].map(i => ["A", 8 + 5 * Math.cos(i * Math.PI / 4), 8 + 5 * Math.sin(i * Math.PI / 4)]),["N",8,8]]}});

/* ================= more drills (added Nov 2026) ================= */

/* ---------- beginner ---------- */
d({id:"t-dynamic-warmup", level:"Beginner", title:"Dynamic warm-up with the ball", phase:"Warm-up", minutes:10, minAge:6, players:"Whole team, a ball each", area:"25 × 20 yd", equipment:"4 cones, a ball each",
  skills:["first_touch","dribbling","physicality"], tips:["T","S"], method:"fifa11",
  summary:"Moving warm-up where every player has a ball: jogging, skips and stretches mixed with easy touches.",
  setup:"A 25 × 20 yard area. Every player has a ball and starts on one end line.",
  how:["Dribble slowly to the far line and back with small touches.","Skips and high knees across, then dribble back.","Hip openers and side shuffles across, then dribble back with the weaker foot.","Finish with three short races: dribble across at 50%, 75% and 90% pace."],
  points:["Touch the ball every step or two.","Look up as you dribble.","Build up speed gradually; full speed only at the end."],
  progress:"Add a turn at the halfway line on the coach's call.",
  regress:"Leave the balls out for the first round.",
  diagram:{w:26, h:20, items:[["A",2,4],["A",2,8],["A",2,12],["A",2,16],["d",2,4,22,4],["d",2,8,22,8],["r",2,12,22,12,0],["d",2,16,22,16],["c",1,1],["c",25,1],["c",1,19],["c",25,19]]}});

d({id:"t-gates-dribble", level:"Beginner", title:"Dribble through the gates", phase:"Warm-up", minutes:10, minAge:6, players:"Whole team, a ball each", area:"25 × 25 yd", equipment:"16 cones (8 gates), a ball each",
  skills:["dribbling","handling_speed","decision_making"], tips:["T","I","S"], method:"play",
  summary:"Dribble through as many small gates as you can in a minute. Head up to find the free gate.",
  setup:"Eight gates, 2 yards wide, spread around a 25-yard square. Every player has a ball.",
  how:["On 'Go', dribble through as many gates as you can in 60 seconds.","You can't go through the same gate twice in a row.","Count your gates; try to beat your score next round.","Round 2: weaker foot only. Round 3: do a turn after each gate."],
  points:["Head up between touches to spot an empty gate.","Small touches near the gate, then speed up into space.","Change direction straight after each gate."],
  progress:"Two players without a ball try to steal one.",
  regress:"Make the gates wider and the area smaller.",
  diagram:{w:26, h:26, items:[["c",5,5],["c",7,5],["c",19,4],["c",21,4],["c",12,12],["c",12,14],["c",4,19],["c",6,19],["c",20,20],["c",22,20],["c",14,21],["c",16,21],["A",6,9],["A",17,9],["A",9,16],["A",18,16],["d",6,9,6,5.5],["d",17,9,20,4.5],["d",9,16,12.2,13]]}});

d({id:"t-sharks", level:"Beginner", title:"Sharks and minnows", phase:"Warm-up", minutes:10, minAge:6, players:"8 to 16", area:"25 × 20 yd", equipment:"4 cones, balls, bibs",
  skills:["dribbling","defending","physicality"], tips:["T","P","S"], method:"play",
  summary:"Minnows dribble across while sharks try to knock their balls out. A favourite for younger players with lots of 1v1s.",
  setup:"A 25 × 20 area. Minnows each have a ball on one end line; two sharks stand in the middle.",
  how:["On 'Go', minnows dribble to the other end line.","Sharks try to win or knock balls out of the area.","Lose your ball and you become a shark.","Keep going until there's one minnow left, then pick new sharks."],
  points:["Minnows: keep the ball close and change speed past a shark.","Shield the ball with your body when a shark is near.","Sharks: work together and push minnows to the side."],
  progress:"Minnows must stop the ball on the end line to be safe.",
  regress:"Sharks walk, or start with one shark.",
  diagram:{w:26, h:20, items:[["A",2,4],["A",2,8],["A",2,12],["A",2,16],["D",12,7],["D",14,13],["d",2,4,10,5],["d",2,12,11,15],["r",12,7,10,5,0],["r",14,13,11,15,0],["z",0,0,26,20]]}});

d({id:"t-pairs-gates", level:"Beginner", title:"Pass through the gates in pairs", phase:"Technical", minutes:12, minAge:7, players:"Whole team in pairs", area:"30 × 25 yd", equipment:"16 cones, a ball per pair",
  skills:["passing","first_touch","communication"], tips:["T","I"], method:"play",
  summary:"Pairs move around the area and score by passing to each other through a gate. Passing, receiving and moving to find space.",
  setup:"Eight gates, 2 yards wide, spread around a 30 × 25 area. Players in pairs with one ball.",
  how:["Pass to your partner through any gate; one point per pass.","You can't use the same gate twice in a row.","Play 60-second rounds and count points.","Round 2: the receiver must control and move off in one touch."],
  points:["Move to the other side of a gate to get the ball.","Pass along the ground with the inside of the foot.","Call your partner's name and point where you want it."],
  progress:"One-touch passes only, or add a defender pair.",
  regress:"Wider gates and two touches to control.",
  diagram:{w:30, h:25, items:[["c",6,5],["c",8,5],["c",20,6],["c",22,6],["c",13,13],["c",13,15],["c",5,19],["c",7,19],["c",22,19],["c",24,19],["A",7,2],["A",7,9],["b",7.5,2.6],["p",7.5,2.6,7,8.2],["A",11,14],["A",16,14],["p",11,14,15.2,14],["r",21,9,24,16,.2],["A",21,9]]}});

d({id:"t-receive-turn", level:"Beginner", title:"Receive and turn in threes", phase:"Technical", minutes:12, minAge:8, players:"Groups of 3", area:"20 × 10 yd per group", equipment:"Cones, a ball per group",
  skills:["first_touch","dribbling","positional_awareness"], tips:["T","I"], method:"tips",
  summary:"The middle player receives, turns and passes to the far end. Teaches checking to the ball and opening up to turn.",
  setup:"Three players in a line: one at each end, 20 yards apart, and one in the middle.",
  how:["An end player passes to the middle player.","The middle player checks toward the ball, turns with one or two touches and passes to the other end.","Do 6 turns, then swap the middle player.","Use different turns: inside foot, outside foot, Cruyff turn, and an open body turn."],
  points:["Look over your shoulder before the ball arrives.","Open your body side-on so you can see both ends.","First touch takes the ball across your body, away from where pressure would be."],
  progress:"A passive defender stands behind the middle player.",
  regress:"The middle player stops the ball, then turns.",
  diagram:{w:24, h:10, items:[["A",2,5],["A",12,5],["A",22,5],["b",2.8,5],["p",2.8,5,11,5],["r",12,5,12.5,3.5,.6],["p",12.6,5.2,21,5]]}});

d({id:"t-shoot-two-lines", level:"Beginner", title:"Dribble and shoot, two lines", phase:"Attacking", minutes:12, minAge:7, players:"6 to 14", area:"25 × 25 yd with a goal", equipment:"Goal, cones, balls",
  skills:["shooting","dribbling","gk_shot_stopping"], tips:["T"], method:"finishing",
  summary:"Two lines take turns to dribble past a cone and shoot. Lots of shots, and lots of saves for keepers.",
  setup:"A goal with a keeper. Two lines with balls 22 yards out, left and right, each with a cone 6 yards in front.",
  how:["The first player dribbles round the cone and shoots before the edge of the box.","The next player in the other line goes when the shot is taken.","Players collect their ball and switch lines.","Keepers rotate every 10 shots."],
  points:["Look up at the goal before you shoot.","Strike with the laces, toe down, for power; side foot for accuracy.","Shoot across the keeper into the far corner."],
  progress:"A defender chases from behind the line.",
  regress:"Shoot from a still ball at 12 yards.",
  diagram:{w:30, h:26, items:[["G",15,0,"top"],["K",15,1.6],["z",6,0,18,9],["A",7,23],["A",23,23],["c",9,17],["c",21,17],["b",7.6,22.2],["d",7.6,22.2,9.5,15],["s",10.5,13,17.5,0.4]]}});

d({id:"t-line-soccer", level:"Beginner", title:"3v3 line soccer", phase:"Game", minutes:15, minAge:6, players:"6 to 8 per pitch", area:"25 × 20 yd", equipment:"Cones, balls, bibs",
  skills:["dribbling","decision_making","defending"], tips:["T","I","P"], method:"dutch4v4",
  summary:"Score by dribbling over the other team's end line under control. Rewards taking players on.",
  setup:"A 25 × 20 pitch. The end lines are the goals.",
  how:["Play 3v3.","Score by stopping the ball on the other team's end line with your sole.","After a goal, the other team restarts from their own line.","Play 4-minute games and change opponents."],
  points:["Look for the gap and run at it.","Pass when a defender commits to you.","Defenders: stay between the ball and your line."],
  progress:"A goal counts double after a skill move.",
  regress:"Play 3v2.",
  diagram:{w:25, h:20, items:[["z",0,0,25,20],["A",6,14],["A",12,15],["A",19,14],["D",7,7],["D",13,8],["D",18,6],["b",12.6,14.4],["d",12.6,14.4,10.5,1]]}});

d({id:"t-knockout", level:"Beginner", title:"King of the ring", phase:"Warm-up", minutes:10, minAge:6, players:"Whole team, a ball each", area:"20 × 20 yd", equipment:"4 cones, a ball each",
  skills:["dribbling","physicality","positional_awareness"], tips:["T","P"], method:"play",
  summary:"Everyone protects their own ball and tries to knock others out. Shielding, close control and awareness.",
  setup:"A 20-yard square. Every player has a ball inside it.",
  how:["Keep your ball in the square while trying to knock others' balls out.","If your ball goes out, do 5 toe taps outside and come back in.","Play 90-second rounds.","Count how many times you were knocked out; try for fewer each round."],
  points:["Keep your body between the ball and the nearest player.","Small touches, head up.","Use your arms for balance, not to push."],
  progress:"Make the square smaller.",
  regress:"Make the square bigger.",
  diagram:{w:20, h:20, items:[["z",0,0,20,20],["A",5,5],["A",14,6],["A",9,11],["A",16,14],["A",5,15],["A",11,17],["d",9,11,12,9],["d",14,6,12,8.6],["d",16,14,13,14]]}});

/* ---------- intermediate ---------- */
d({id:"t-square-overlap", level:"Intermediate", title:"Passing square with overlap", phase:"Technical", minutes:15, minAge:10, players:"8 to 12", area:"20 × 20 yd", equipment:"4 cones, 2 balls",
  skills:["passing","positional_awareness","communication","separation_speed"], tips:["T","I"], method:"tips",
  summary:"A passing square where the passer overlaps the receiver, the same run a full-back makes round a winger.",
  setup:"A cone at each corner of a 20-yard square, 2 or 3 players at each. Balls start at opposite corners.",
  how:["A passes to B at the next corner and runs round the outside of B.","B takes a touch inside, then plays A into the space in front of them.","A dribbles to the next corner and passes on.","Switch direction every 2 minutes."],
  points:["The overlap run is curved and fast: go round, not across.","B draws an imaginary defender inside before releasing the pass.","Pass into space ahead of the runner, not to their feet."],
  progress:"Add a passive defender in front of B.",
  regress:"Remove the overlap: pass and follow.",
  diagram:{w:24, h:24, items:[["c",2,2],["c",22,2],["c",22,22],["c",2,22],["A",2,22],["A",22,22],["A",22,2],["A",2,2],["b",2.8,21.4],["p",2.8,21.4,21,22],["d",22,22,20,19],["r",2.6,22.6,23.5,17,.18],["p",20,19,23.4,14]]}});

d({id:"t-rondo-4v2", level:"Intermediate", title:"Rondo 4v2", phase:"Possession", minutes:15, minAge:10, players:"6 per grid", area:"10 × 10 yd", equipment:"4 cones, balls, bibs",
  skills:["passing","first_touch","decision_making","defending"], tips:["T","I","P"], method:"rondo",
  summary:"Four keep the ball from two. Fewer passing options than 5v2, so players must move along their line to help.",
  setup:"A 10-yard square. One player on each side, two defenders in the middle.",
  how:["The four keep the ball with two touches each.","A split pass between the defenders scores a bonus point.","If a defender wins it, the player who lost it and the one who passed to them swap in.","Play 90-second rounds."],
  points:["Always give the player on the ball two options, left and right.","Pass to the foot away from pressure.","Defenders: one presses, one blocks the split."],
  progress:"One touch, or a smaller square.",
  regress:"Unlimited touches, or 4v1 for the first round.",
  diagram:{w:14, h:14, items:[["c",2,2],["c",12,2],["c",2,12],["c",12,12],["A",7,1.2],["A",12.8,7],["A",7,12.8],["A",1.2,7],["D",6,6.5],["D",8.5,8],["b",7,1.8],["p",7,1.8,1.8,7],["p",1.2,7,12.2,7]]}});

d({id:"t-gates-possession", level:"Intermediate", title:"Possession through the gates 5v5", phase:"Possession", minutes:18, minAge:9, players:"10 to 12", area:"35 × 30 yd", equipment:"Cones for 6 gates, balls, bibs",
  skills:["passing","positional_awareness","decision_making","communication"], tips:["I","T"], method:"positional",
  summary:"Score by passing through any gate to a teammate. Teams must find the free gate, which teaches switching play.",
  setup:"Six gates, 2 yards wide, spread around a 35 × 30 area. Two teams of five.",
  how:["Keep the ball as a team.","Score a point by passing through a gate to a teammate who controls it.","You can't score through the same gate twice in a row.","Play 4-minute rounds."],
  points:["If a gate is guarded, switch to one that isn't.","Move to the other side of a gate before the pass comes.","Defenders: guard the gate nearest the ball."],
  progress:"Limit players to two touches.",
  regress:"Play 5v3.",
  diagram:{w:35, h:30, items:[["c",7,6],["c",9,6],["c",26,5],["c",28,5],["c",17,15],["c",17,17],["c",6,23],["c",8,23],["c",26,24],["c",28,24],["A",6,13],["A",12,18],["A",22,12],["A",26,19],["A",8,26],["D",10,10],["D",16,14],["D",22,17],["D",27,9],["D",10,21],["b",12.6,17.4],["p",12.6,17.4,7,25.4],["r",8,26,7.5,26,0]]}});

d({id:"t-overlap-2v1-wing", level:"Intermediate", title:"Overlap 2v1 down the wing", phase:"Attacking", minutes:18, minAge:11, players:"8 to 12", area:"Half pitch, wide channel", equipment:"Goal, cones, balls, bibs",
  skills:["passing","communication","decision_making","separation_speed"], tips:["I","S"], method:"wave",
  summary:"A winger and an overlapping full-back beat one defender down the side, then cross for two strikers.",
  setup:"A 15-yard wide channel along one touchline. A winger, a full-back behind them and a defender in the channel. Two strikers and a defender in the box.",
  how:["The full-back passes to the winger and overlaps.","The winger takes on the defender or releases the full-back.","Whoever gets free crosses for the strikers.","Rotate positions after each go; switch wings after 6 goes."],
  points:["Winger: dribble inside to pull the defender, then release.","Full-back: call 'Overlap!' and time the run.","Strikers: one near post, one far post."],
  progress:"Add a second defender who tracks the full-back.",
  regress:"The channel defender is passive.",
  diagram:{w:40, h:34, items:[["G",20,0,"top"],["K",20,1.6],["z",10,0,20,10],["z",30,0,10,34],["A",34,24],["A",36,31],["D",34,16],["A",17,14],["A",24,14],["D",21,8],["p",36,31,34.6,24.6],["r",36,31,38,9,-.15],["d",34,24,31.5,18],["p",31.5,18,38,10],["p",38,9,18,5],["r",17,14,17.5,5,.1],["r",24,14,25,4,-.1]]}});

d({id:"t-shield-turn", level:"Intermediate", title:"Shield and turn 1v1", phase:"Technical", minutes:12, minAge:9, players:"Groups of 3", area:"15 × 10 yd per group", equipment:"Cones, mini goals or gates, balls",
  skills:["physicality","first_touch","dribbling"], tips:["T","P"], method:"tips",
  summary:"Receive with a defender on your back, protect the ball and turn to score. Strength and touch under pressure.",
  setup:"A server at one end. An attacker with a defender behind them in the middle. A small goal behind the defender.",
  how:["The server passes into the attacker.","The defender pushes up to pressure from behind.","The attacker shields, then turns to score, or plays back to the server and spins.","Rotate after 4 goes."],
  points:["Wide stance, knees bent, arm out for balance (no pushing).","Feel where the defender is, then turn the other way.","First touch away from the defender's foot."],
  progress:"The defender can tackle straight away.",
  regress:"The defender stays passive for the first touch.",
  diagram:{w:16, h:16, items:[["mg",8,0.8,"h"],["D",8,6.5],["A",8,8.5],["A",8,14.5],["b",8,13.8],["p",8,13.8,8,9.4],["r",8,8.5,11,3,-.3]]}});

d({id:"t-turn-shoot", level:"Intermediate", title:"Turn and shoot", phase:"Attacking", minutes:15, minAge:10, players:"6 to 12", area:"Penalty area plus 10 yd", equipment:"Goal, cones, balls",
  skills:["shooting","first_touch","handling_speed"], tips:["T","S"], method:"finishing",
  summary:"Strikers receive with their back to goal, turn in one touch and shoot. Real match situations at the edge of the box.",
  setup:"A goal with a keeper. A server 25 yards out. Strikers line up at the top of the box with their back to goal.",
  how:["The striker checks away, then comes short to receive.","Turn with the first touch and shoot with the second.","Alternate turning left and right.","Add a passive defender after 6 goes."],
  points:["Check your shoulder before you receive.","Let the ball run across your body to turn.","Shoot early: a quick shot beats a perfect one."],
  progress:"A live defender, and the striker has 3 seconds.",
  regress:"Take a set-up touch before the shot.",
  diagram:{w:30, h:28, items:[["G",15,0,"top"],["K",15,1.6],["z",5,0,20,10],["A",15,25],["A",15,13],["b",15,24.2],["r",15,13,14,15,.4],["p",15,24.2,14.4,15.6],["d",14.4,15.6,12,11.5],["s",12,11.5,18,0.4]]}});

d({id:"t-recovery-chase", level:"Intermediate", title:"Recovery run 1v1", phase:"Defending", minutes:12, minAge:10, players:"6 to 12", area:"30 × 15 yd channel with a goal", equipment:"Goal or mini goal, cones, balls",
  skills:["defending","separation_speed","physicality"], tips:["S","P"], method:"defending",
  summary:"The defender starts behind the attacker and must sprint back to get goal-side. Teaches recovery runs and timing tackles.",
  setup:"A channel with a goal at one end. The attacker starts 25 yards out with the ball; the defender starts 3 yards behind them.",
  how:["On the whistle, the attacker dribbles at goal.","The defender sprints to get between the attacker and the goal.","The defender wins by tackling or forcing the attacker out of the channel.","Swap roles after each go."],
  points:["Sprint the shortest line to goal, not to the ball.","Get goal-side first, then tackle.","Don't dive in from behind: show the attacker away from goal."],
  progress:"Start the defender 5 yards behind.",
  regress:"Start the defender level with the attacker.",
  diagram:{w:16, h:30, items:[["G",8,0,"top"],["K",8,1.6],["z",1,0,14,30],["A",8,24],["D",8,27.5],["b",8.6,23.2],["d",8.6,23.2,7,10],["r",8,27.5,6,8,-.2]]}});

d({id:"t-4v4-wide", level:"Intermediate", title:"4v4 + 2 wide players", phase:"Game", minutes:20, minAge:10, players:"10 + 2 keepers", area:"40 × 30 yd with wide channels", equipment:"2 goals, cones, balls, bibs",
  skills:["passing","positional_awareness","shooting","communication"], tips:["I","T"], method:"ppp",
  summary:"Two neutral wide players help the team with the ball. Encourages using width and getting crosses and cut-backs in.",
  setup:"A 40 × 30 pitch with a goal and keeper at each end and a 5-yard channel down each side. One neutral in each channel.",
  how:["Play 4v4 in the middle; the wide neutrals play for whoever has the ball.","Wide players can't be tackled and have two touches.","A goal from a wide player's pass counts double.","Swap the wide players every 4 minutes."],
  points:["Look wide early, especially when the middle is crowded.","Make a run into the box as the ball goes wide.","Wide players: cross early or cut back on the ground."],
  progress:"Wide players must cross first time.",
  regress:"Wide players can dribble into the middle.",
  diagram:{w:30, h:40, items:[["G",15,0,"top"],["G",15,40,"bottom"],["K",15,1.6],["K",15,38.4],["z",0,0,5,40],["z",25,0,5,40],["N",2.5,15],["A",11,24],["A",18,22],["A",14,14],["A",19,12],["D",12,18],["D",17,16],["D",11,10],["D",17,28],["b",18.6,21.4],["p",18.6,21.4,27,15.5],["N",27.5,15],["p",27.5,15,15,6],["r",14,14,15,6,0]]}});

d({id:"t-transition-3v3", level:"Intermediate", title:"3v3 waves: attack, then defend", phase:"Transition", minutes:18, minAge:10, players:"9 to 12 (3 or 4 teams of 3)", area:"30 × 25 yd with 2 goals", equipment:"2 goals, cones, balls, bibs",
  skills:["decision_making","separation_speed","defending","shooting"], tips:["I","S","P"], method:"wave",
  summary:"A team attacks one way; as soon as the attack ends, they defend against the next team coming the other way.",
  setup:"Goals at both ends. Team A attacks Team B. Team C waits behind the far goal.",
  how:["Team A attacks Team B.","When the attack ends, Team B leaves and Team C attacks the other way against Team A.","Team A must switch straight to defending.","Keep the waves going for 3 minutes; count goals."],
  points:["Switch your mind straight away when the ball is lost.","Nearest player presses the ball; the others get goal-side.","Attack quickly before the defence is set."],
  progress:"Attacks must finish within 8 seconds.",
  regress:"The waiting team gives the defenders 3 seconds before starting.",
  diagram:{w:25, h:32, items:[["mg",12.5,0.8,"h"],["mg",12.5,31.2,"h"],["A",7,13],["A",12,11],["A",18,13],["D",8,8],["D",14,6],["D",17,9],["X",9,30],["X",13,30],["X",17,30],["b",12.6,10.4],["s",12.6,10.4,12.5,1.4],["r",9,30,9,22,0],["r",17,30,17,22,0]]}});

d({id:"t-gk-1v1", level:"Intermediate", title:"Keeper 1v1 breakaways", phase:"Technical", minutes:15, minAge:10, players:"Keepers + 6 to 10", area:"Penalty area plus 20 yd", equipment:"Goal, cones, balls",
  skills:["gk_positioning","gk_diving","gk_decision_making","shooting"], tips:["T","P","I"], method:"finishing",
  summary:"Strikers run through on goal; keepers practise closing the angle, staying big and timing the block.",
  setup:"A goal with a keeper. Strikers line up 30 yards out with balls.",
  how:["The striker dribbles at goal from 30 yards.","The keeper comes off the line to close the angle and stays set as the shot comes.","The striker can shoot or try to round the keeper.","Rotate keepers every 6 attempts."],
  points:["Keeper: move while the ball is away from the striker's foot, set when it's close.","Stay big and stay on your feet as long as you can.","Striker: decide early, shoot or go round."],
  progress:"A defender chases the striker.",
  regress:"The striker must shoot from the edge of the box.",
  diagram:{w:30, h:32, items:[["G",15,0,"top"],["K",15,1.6],["z",5,0,20,10],["A",15,29],["b",15.6,28.2],["d",15.6,28.2,15.5,11],["r",15,1.6,15,6,0]]}});

d({id:"t-long-switch", level:"Intermediate", title:"Long passing: switch the play", phase:"Technical", minutes:15, minAge:11, players:"8 to 12", area:"Two 10 × 10 yd zones, 30 yd apart", equipment:"8 cones, balls",
  skills:["passing","first_touch"], tips:["T"], method:"tips",
  summary:"Players in two zones switch the ball with long, driven or lofted passes. Builds range and a clean first touch on long balls.",
  setup:"Two 10-yard zones, 30 yards apart, with 4 to 6 players in each.",
  how:["Pass short twice inside your zone, then play long to the other zone.","The receiving zone controls the long ball inside the zone.","Count successful switches in 2 minutes.","Then try driven passes along the ground."],
  points:["Plant foot beside the ball; strike under the middle for a lofted pass.","Lean back slightly for height; over the ball to keep it low.","Receiver: cushion it with the first touch into your zone."],
  progress:"Move the zones to 40 yards apart.",
  regress:"Move the zones to 20 yards apart.",
  diagram:{w:44, h:14, items:[["z",1,2,10,10],["z",33,2,10,10],["A",4,5],["A",8,9],["A",5,10],["A",36,5],["A",40,9],["A",37,10],["b",8.6,8.4],["p",4,5,8,8.4],["p",8.6,8.4,36,5.6]]}});

d({id:"t-corners", level:"Intermediate", title:"Set pieces: corners", phase:"Attacking", minutes:15, minAge:10, players:"10 to 16", area:"Penalty area", equipment:"Goal, cones, balls, bibs",
  skills:["positional_awareness","communication","shooting","defending"], tips:["I","P"], method:"setpieces",
  summary:"Practise attacking and defending corners: runs to the near post, far post and penalty spot, and who marks where.",
  setup:"A goal with a keeper. A taker at the corner, attackers outside the box and defenders set up in the box.",
  how:["Walk through the plan once: who runs near post, far post, penalty spot and edge of the box.","Take 6 corners from each side.","Defenders clear and push out after each one.","Swap attackers and defenders."],
  points:["Attackers: start your run late and attack the ball.","Defenders: know your zone or player before the kick, and talk.","Keeper: call early, 'Keeper!' or 'Away!'"],
  progress:"Play a 2-minute game after each corner so second balls count.",
  regress:"Throw the ball in by hand so it's easier to reach.",
  diagram:{w:40, h:22, items:[["G",20,0,"top"],["K",20,1.6],["z",8,0,24,14],["A",39,0.8],["A",16,17],["A",22,18],["A",28,16],["D",17,4],["D",23,5],["D",20,8],["b",38.4,1.2],["p",38.4,1.2,18,4.5],["r",16,17,17,5,.2],["r",22,18,23.5,6,-.2],["r",28,16,20,11,.1]]}});

/* ---------- advanced ---------- */
d({id:"t-rondo-6v3", level:"Advanced", title:"Rondo 6v3 with a middle player", phase:"Possession", minutes:15, minAge:12, players:"9 per grid", area:"14 × 14 yd", equipment:"4 cones, balls, bibs",
  skills:["passing","first_touch","positional_awareness","decision_making"], tips:["T","I","P"], method:"rondo",
  summary:"Five outside and one inside keep the ball from three. The middle player must receive and play through pressure.",
  setup:"A 14-yard square. Five players on the outside, one attacker inside, three defenders inside.",
  how:["Keep the ball, two touches outside, one or two inside.","A pass through the middle player scores a point.","If defenders win it, the three swap with the players who lost it.","Play 2-minute rounds."],
  points:["Middle player: stay between the defenders, check your shoulders.","Outside players: play into the middle when the lane opens.","Defenders: press as a three, cut the middle first."],
  progress:"One touch outside, or the middle player must play forward.",
  regress:"Play 6v2.",
  diagram:{w:16, h:16, items:[["c",1,1],["c",15,1],["c",1,15],["c",15,15],["A",8,0.6],["A",15.4,6],["A",15.4,11],["A",5,15.4],["A",0.6,8],["A",8,8.5],["D",6,6],["D",10.5,6.5],["D",8,12],["b",0.6,8.6],["p",1.2,8.2,7.2,8.5],["p",8.8,8.4,15,10.6]]}});

d({id:"t-switch-6v6", level:"Advanced", title:"Switch-play game 6v6 + 2", phase:"Possession", minutes:20, minAge:12, players:"14", area:"45 × 35 yd split into two halves", equipment:"Cones, balls, bibs",
  skills:["passing","tactical_understanding","positional_awareness","decision_making"], tips:["I","T"], method:"positional",
  summary:"Keep it in one half, then switch to the other. Teaches drawing the opponent to one side and attacking the far side.",
  setup:"A 45 × 35 area split lengthways into two halves. Two teams of six and two neutrals who play for the team with the ball.",
  how:["Teams keep the ball anywhere.","Score a point for 5 passes in one half followed by a pass into the other half that's controlled.","Neutrals have two touches.","Play 4-minute rounds."],
  points:["Draw the defenders in with short passes, then switch.","Players on the far side: stay wide and ready.","Defenders: shift across together as the ball moves."],
  progress:"The switch must be a single pass, no dribbling across.",
  regress:"Score after 3 passes, not 5.",
  diagram:{w:45, h:35, items:[["z",0,0,45,35],["z",22.5,0,0,35],["N",22.5,8],["N",22.5,27],["A",6,10],["A",12,17],["A",7,25],["A",16,8],["A",34,12],["A",38,24],["D",9,14],["D",14,12],["D",10,21],["D",17,20],["D",30,17],["D",28,10],["b",12.6,16.4],["p",6,10,12,16.4],["p",12.6,16.4,37.4,23.4]]}});

d({id:"t-build-out", level:"Advanced", title:"Build out from the back 6v4", phase:"Possession", minutes:20, minAge:12, players:"10 + keeper", area:"Half pitch", equipment:"Goal, 3 mini goals or gates, cones, balls, bibs",
  skills:["gk_distribution","passing","tactical_understanding","decision_making","positional_awareness"], tips:["I","T"], method:"positional",
  summary:"The keeper and five players play out against four pressers and score through gates at halfway.",
  setup:"A goal with a keeper. Back four and a defensive midfielder against four pressing forwards. Three gates on the halfway line.",
  how:["Every attack starts with the keeper.","The team in possession scores by passing or dribbling through a gate.","The pressers score in the big goal if they win it.","Play 6 attacks, then swap the pressing group."],
  points:["Keeper: be an extra player; angle your body to switch play.","Centre-backs split wide; full-backs high and wide.","Midfielder: show between the pressers, open body to play forward."],
  progress:"Add a fifth presser.",
  regress:"Pressers start 10 yards higher and the team gets 3 seconds before they press.",
  diagram:{w:40, h:40, items:[["G",20,0,"top"],["K",20,2],["mg",8,39.2,"h"],["mg",20,39.2,"h"],["mg",32,39.2,"h"],["A",11,7],["A",29,7],["A",4,15],["A",36,15],["A",20,15],["D",15,10],["D",25,10],["D",20,21],["D",30,20],["b",20.6,2.6],["p",20.6,2.6,11,6.4],["p",11,7,20,14.4],["p",20,15,35.4,15],["d",36,15,32,38]]}});

d({id:"t-unit-shift", level:"Advanced", title:"Defending as a unit: back four shift", phase:"Defending", minutes:18, minAge:13, players:"10 to 12", area:"Half pitch", equipment:"Goal, cones, balls, bibs",
  skills:["defending","positional_awareness","communication","tactical_understanding"], tips:["I","P"], method:"defending",
  summary:"A back four and two midfielders slide across as the ball moves between attackers, keeping the gaps closed.",
  setup:"A goal with a keeper. A back four and two holding midfielders. Five attackers spread across the front pass the ball around them.",
  how:["Attackers pass across the front slowly at first.","The unit shifts toward the ball: nearest defender presses, others cover.","When a gap opens, attackers can play through and attack goal.","Speed up the passing after 3 minutes."],
  points:["Shift together, like you're tied by a rope.","Distances: no more than 10 yards between defenders.","Talk: 'Step', 'Drop', 'Cover'."],
  progress:"Attackers can dribble and switch play long.",
  regress:"Attackers pass only, no runs.",
  diagram:{w:40, h:34, items:[["G",20,0,"top"],["K",20,1.6],["D",8,9],["D",16,8],["D",24,8],["D",32,9],["D",15,15],["D",25,15],["A",5,24],["A",14,26],["A",22,27],["A",30,25],["A",37,22],["b",30.6,24.4],["p",22,27,30,25],["r",32,9,31,14,0],["r",24,8,26,10,0],["r",16,8,19,9,0],["r",25,15,28,18,0]]}});

d({id:"t-press-sideline", level:"Advanced", title:"Pressing trap on the sideline", phase:"Defending", minutes:18, minAge:14, players:"12 to 14", area:"40 × 35 yd", equipment:"Cones, mini goals, balls, bibs",
  skills:["defending","tactical_understanding","communication","physicality"], tips:["I","P","S"], method:"pressing",
  summary:"Let the ball go wide, then trap it against the touchline with a curved press and players closing the inside options.",
  setup:"A 40 × 35 area. Six players build up from one end; five pressers defend. Two mini goals behind the pressers.",
  how:["The six try to pass through to the mini goals.","Pressers let the ball go to the wide player, then press together on that pass.","Winning the ball within 6 seconds of the trap scores 2 points.","Swap groups every 3 minutes."],
  points:["Curve your run so the wide player can't pass back inside.","Next defenders close the nearest passing options.","Use the touchline as an extra defender."],
  progress:"Trap must win the ball within 4 seconds.",
  regress:"The building team must pass wide first.",
  diagram:{w:35, h:40, items:[["z",0,0,35,40],["mg",11,0.8,"h"],["mg",24,0.8,"h"],["A",8,33],["A",17,35],["A",27,33],["A",3,22],["A",17,25],["A",32,23],["D",9,16],["D",17,15],["D",25,16],["D",13,22],["D",22,21],["b",3.6,21.4],["p",8,33,3.6,22],["r",9,16,4.5,19.5,-.3],["r",13,22,8,26,0],["r",17,15,15,22,0]]}});

d({id:"t-final-third", level:"Advanced", title:"Final-third combinations 4v3", phase:"Attacking", minutes:18, minAge:12, players:"10 + keeper", area:"Final third, 40 × 30 yd", equipment:"Goal, cones, balls, bibs",
  skills:["passing","shooting","decision_making","positional_awareness"], tips:["I","T"], method:"finishing",
  summary:"Four attackers use overlaps, underlaps and third-man runs to break three defenders and finish.",
  setup:"A goal with a keeper. Four attackers start at the edge of the final third; three defenders plus the keeper defend.",
  how:["The coach plays a ball into the attackers.","Attackers combine to create a shot within 10 seconds.","Defenders win a point for a clearance past halfway.","Rotate attackers and defenders every 5 goes."],
  points:["Run off the ball: someone always runs in behind.","Third-man: pass in, set back, play the runner.","Finish quickly: one or two touches in the box."],
  progress:"Make it 4v4, or limit to 8 seconds.",
  regress:"Make it 4v2.",
  diagram:{w:40, h:30, items:[["G",20,0,"top"],["K",20,1.6],["z",8,0,24,10],["A",10,22],["A",20,24],["A",30,22],["A",20,15],["D",14,12],["D",22,10],["D",28,13],["b",20.6,23.4],["p",20.6,23.4,20,15.6],["p",20,15.6,11,21.6],["r",30,22,25,5,-.2],["p",11,21.6,25,6],["s",25,5,22,0.4]]}});

d({id:"t-defend-crosses", level:"Advanced", title:"Defending crosses 4v4 in the box", phase:"Defending", minutes:18, minAge:13, players:"10 + keeper", area:"Penalty area with wide servers", equipment:"Goal, cones, balls, bibs",
  skills:["defending","communication","positional_awareness","gk_decision_making"], tips:["I","P"], method:"defending",
  summary:"Wide servers cross into a 4v4 in the box. Defenders mark, attack the ball and clear; the keeper decides to come or stay.",
  setup:"A goal with a keeper. Four attackers against four defenders in the box. A server on each wing with balls.",
  how:["Servers take turns crossing.","Defenders clear; attackers try to score from the cross or second ball.","Play 10 crosses, then swap roles.","Count clearances that leave the box."],
  points:["Body position: see the ball and your player.","Attack the ball at its highest point and clear high and wide.","Keeper: call early and decide: come or stay."],
  progress:"Servers can dribble in and cut back.",
  regress:"Crosses by hand.",
  diagram:{w:40, h:24, items:[["G",20,0,"top"],["K",20,1.6],["z",6,0,28,16],["A",2,10],["A",38,10],["A",15,9],["A",21,12],["A",26,8],["A",19,6],["D",15,6],["D",21,9],["D",25,5],["D",18,3.5],["b",2.6,9.4],["p",2.6,9.4,21,7],["r",21,9,21,7,0]]}});

d({id:"t-compact-7v7", level:"Advanced", title:"Compact team game 7v7 with offside lines", phase:"Game", minutes:20, minAge:13, players:"14 + 2 keepers", area:"60 × 45 yd", equipment:"2 goals, cones, balls, bibs",
  skills:["tactical_understanding","positional_awareness","defending","communication"], tips:["I","P"], method:"pressing",
  summary:"A game with offside lines and a rule that every outfield player must be past halfway for a goal to count, so teams stay compact.",
  setup:"A 60 × 45 pitch with goals and keepers. Cone lines 18 yards from each goal act as offside lines.",
  how:["Play 7v7 with offside from the cone lines.","A goal counts only if the whole team (not the keeper) is in the opponent's half.","If a team concedes while a player is still in the other half, the goal counts double.","Play 2 × 10 minutes."],
  points:["Move up and back as one block.","Back line: step up together on a backward pass.","Distances between lines no more than 10 to 15 yards."],
  progress:"Add pressing triggers: a backward pass means the whole team pushes up.",
  regress:"Remove the double-goal rule.",
  diagram:{w:45, h:60, items:[["G",22.5,0,"top"],["G",22.5,60,"bottom"],["K",22.5,1.6],["K",22.5,58.4],["z",0,18,45,0],["z",0,42,45,0],["z",0,30,45,0],["A",10,34],["A",22,33],["A",34,34],["A",15,40],["A",29,40],["A",22,22],["A",22,46],["D",10,25],["D",22,26],["D",34,25],["D",15,19],["D",29,19],["D",22,36],["D",22,12],["b",22.6,32.4]]}});

d({id:"t-between-lines", level:"Advanced", title:"Receive between the lines 4v2 + 2", phase:"Possession", minutes:18, minAge:12, players:"10", area:"30 × 20 yd in three zones", equipment:"Cones, balls, bibs",
  skills:["first_touch","positional_awareness","decision_making","passing"], tips:["I","T","S"], method:"positional",
  summary:"Two end groups of four pass to each other through a middle zone where two link players receive under pressure.",
  setup:"Three zones: 10 yards at each end, 10 yards in the middle. Four players in each end zone, two link players and two defenders in the middle.",
  how:["An end group passes until a link player is free, then plays into them.","The link player turns and passes into the far end zone.","Direct passes end to end don't count.","Swap link players and defenders every 2 minutes."],
  points:["Link players: find the space behind a defender's shoulder.","Open your body on the half-turn to see the far zone.","End players: pass into the link player's back foot."],
  progress:"Link players have one touch, or add a third defender.",
  regress:"One defender in the middle.",
  diagram:{w:30, h:20, items:[["z",0,0,10,20],["z",10,0,10,20],["z",20,0,10,20],["A",3,4],["A",7,9],["A",3,16],["A",7,15],["A",23,4],["A",27,10],["A",23,16],["A",27,15],["A",13,6],["A",17,14],["D",14,10],["D",16,7],["b",7.6,8.4],["p",7.6,8.4,12.4,6.2],["p",13.6,6.2,22.4,4]]}});

d({id:"t-ssg-intervals", level:"Advanced", title:"3v3 intensity intervals", phase:"Game", minutes:18, minAge:13, players:"12 (4 teams of 3)", area:"25 × 20 yd", equipment:"4 mini goals, balls around the pitch, bibs",
  skills:["physicality","separation_speed","decision_making","defending"], tips:["S","P"], method:"conditioning",
  summary:"Short, all-out 3v3 games with rest between. Builds match fitness with the ball instead of running laps.",
  setup:"A 25 × 20 pitch with two mini goals at each end and spare balls around the edge. Four teams of three.",
  how:["Two teams play 2 minutes flat out while two teams rest and collect balls.","A new ball goes in straight away when one goes out.","Swap after 2 minutes; each team plays 4 or 5 games.","Keep a league table."],
  points:["Full effort while you play, full rest while you don't.","Press straight away when you lose the ball.","Get water during every rest."],
  progress:"90-second games with 90 seconds rest.",
  regress:"3-minute games with longer rest.",
  note:"Hard work: use once a week at most, not the day before a match, and keep water nearby.",
  diagram:{w:25, h:20, items:[["mg",8,0.7,"h"],["mg",17,0.7,"h"],["mg",8,19.3,"h"],["mg",17,19.3,"h"],["A",7,12],["A",13,10],["A",18,13],["D",8,7],["D",14,6],["D",17,8],["b",13.6,9.4],["p",13.6,9.4,18,12.4],["s",18,12.4,17,1.2]]}});

d({id:"t-three-teams", level:"Advanced", title:"Three-team transition 4v4 + 4", phase:"Transition", minutes:18, minAge:12, players:"12 (3 teams of 4)", area:"30 × 30 yd", equipment:"Cones, balls, three sets of bibs",
  skills:["passing","decision_making","defending","separation_speed"], tips:["I","S","P"], method:"pressing",
  summary:"Two teams keep the ball together against one. The team that loses it becomes the defenders straight away.",
  setup:"A 30-yard square with three teams of four. Two teams in possession (8), one team defending (4).",
  how:["The two possession teams keep the ball together: 8v4.","When the defenders win it, the team that lost it becomes the new defenders.","Every 10 passes is a point for the passers.","Play 6 minutes and count points per team."],
  points:["Losing the ball: react in the first second.","Winners: get the first pass away from pressure fast.","Use the whole square to stretch the defenders."],
  progress:"Two touches maximum.",
  regress:"Score after 6 passes.",
  diagram:{w:30, h:30, items:[["z",0,0,30,30],["A",4,5],["A",15,3],["A",26,6],["A",4,25],["A",26,25],["A",15,27],["A",9,15],["A",22,15],["D",11,9],["D",19,10],["D",12,20],["D",19,19],["b",9.6,14.4],["p",4,5,9,14.4],["p",9.6,14.4,22,15]]}});

d({id:"t-counter-5v4", level:"Advanced", title:"Counter-attack 5v4 after a regain", phase:"Transition", minutes:20, minAge:12, players:"12 + 2 keepers", area:"Three-quarter pitch", equipment:"2 goals, cones, balls, bibs",
  skills:["separation_speed","decision_making","passing","shooting","positional_awareness"], tips:["S","I"], method:"pressing",
  summary:"Win the ball in midfield, then attack fast 5v4 before the other team gets back. Practises the first pass and the runs.",
  setup:"A long pitch with goals and keepers. A midfield zone in the middle. Five attackers wait outside the zone; four defenders and a 2v2 in the middle.",
  how:["The coach plays a ball into the middle zone; the 2v2 fights for it.","The pair that wins it plays forward and joins a counter with three teammates: 5v4 to goal.","They have 12 seconds to score.","The other pair tracks back to help defend."],
  points:["First look forward: the earliest pass is the best one.","Wide players sprint wide to stretch the defence.","Run in straight lines, then cut across defenders late."],
  progress:"10 seconds to score.",
  regress:"15 seconds, or 5v3.",
  diagram:{w:40, h:56, items:[["G",20,0,"top"],["G",20,56,"bottom"],["K",20,1.6],["K",20,54.4],["z",0,24,40,10],["A",17,29],["A",23,30],["D",19,27],["D",22,32],["A",6,22],["A",34,22],["A",20,20],["D",12,12],["D",20,10],["D",28,12],["D",20,16],["b",17.6,28.4],["p",17.6,28.4,6,22.6],["r",34,22,32,8,-.15],["r",20,20,22,6,0],["p",6,22,31,9]]}});

/* every drill sits in one level */
const LEVEL_OF = {"t-fifa11":"Beginner","t-rondo-4v1":"Beginner","t-four-corner":"Beginner","t-ball-mastery-grid":"Beginner","t-1v1-attack":"Beginner","t-2v1-goal":"Beginner",
  "t-finishing-combo":"Beginner","t-1v1-defend":"Beginner","t-dutch-4v4":"Beginner","t-funino":"Beginner","t-cooldown":"Beginner","t-gk-shooting":"Beginner","t-scrimmage-condition":"Beginner",
  "t-y-passing":"Intermediate","t-rondo-5v2":"Intermediate","t-3v2-waves":"Intermediate","t-cross-finish":"Intermediate","t-2v2-cover":"Intermediate","t-ssg-5v5-gk":"Intermediate",
  "t-endzone":"Intermediate","t-gk-distribution":"Intermediate","t-heading-game":"Intermediate",
  "t-rondo-transition":"Advanced","t-positional-4v4-3":"Advanced","t-three-zone":"Advanced","t-press-trigger":"Advanced","t-counter-4v3":"Advanced","t-counterpress":"Advanced","t-third-man":"Advanced"};
D.forEach(x => { if(!x.level) x.level = LEVEL_OF[x.id] || "Intermediate"; });
export const LEVELS = ["Beginner","Intermediate","Advanced"];
export const LEVEL_NOTE = {
  Beginner:"Simple rules, lots of touches and small numbers. Right for younger or newer teams, and good warm-ups for any age.",
  Intermediate:"More players and more decisions: support angles, overlaps, pressure and cover, set pieces.",
  Advanced:"Team tactics at game speed: positional play, pressing traps, building out, compact defending and fast transitions."
};

export const TEAM_DRILLS = D;
export const teamDrillById = id => D.find(x => x.id === id);
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
