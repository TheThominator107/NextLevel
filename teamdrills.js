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
    if(k === "z") s += `<rect x="${sx(x)}" y="${sy(y)}" width="${a3}" height="${a4}" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-opacity=".75" stroke-width="${sw * .8}" stroke-dasharray="${r * .5} ${r * .4}"/>`;
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
    else if(k === "b") s += `<circle cx="${sx(x)}" cy="${sy(y)}" r="${r * .45}" fill="#fff" stroke="${NAVY}" stroke-width="${sw * .6}"/>`;
  });
  return `<svg class="tdiag" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" role="img" aria-label="${(label || dr.title).replace(/"/g, "&quot;")}: diagram of the setup">${s}</svg>`;
}
export const DIAGRAM_KEY = `<div class="tkey" aria-hidden="true"><span><i style="background:${ORANGE}"></i>Attack / team in possession</span><span><i style="background:${BLUE}"></i>Defend</span><span><i style="background:${YELLOW}"></i>Neutral</span><span><i style="background:${GREEN}"></i>Keeper</span><span><b class="k-pass"></b>Pass</span><span><b class="k-run"></b>Run / dribble</span><span><b class="k-shot"></b>Shot</span></div>`;
