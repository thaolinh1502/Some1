// -------------------- GLOBAL VARIABLES --------------------
let audioBtn, lightBtn, cloneBtn;
let who, am, iBox;
let playMusic = false;
let blendSwitch = false;
let glitching = false;
let song;
let transitioning = false;
let bars = [];
let transitionPhase = 0; // 0 = none, 1 = covering, 2 = clearing
let transitionTimer = 0;

let normalCursor, pointerCursor; // custom cursors

// --- Trail variables ---
let trail = [];
let pg;

// -------------------- PRELOAD --------------------
function preload() {
  helveticaNeue = loadFont("fonts/HelveticaNeueItalic.ttf");
  normalCursor = loadImage("elements/1x/cursor1-8.png");    // default cursor
  pointerCursor = loadImage("elements/1x/cursor2act-8.png"); // pointer hover cursor
  song = loadSound("elements/SVG/200222-electronic-drum-amp-bass-cyber-wonder-155550.mp3", () => {
    // Check local storage on load
    if (localStorage.getItem('audioState') === 'true') {
      song.loop();
      playMusic = true;
    }
  });
}

// -------------------- SETUP --------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor(); // hide system cursor
  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  // --- Trail layer ---
  pg = createGraphics(windowWidth, windowHeight);
  pg.clear(); // make transparent

  // --- Buttons ---
  audioBtn = createButton("AUDIO");
  audioBtn.position(width - 260, 40);
  audioBtn.mousePressed(toggleAudio);
  styleButton(audioBtn);

  lightBtn = createButton("LIGHT");
  lightBtn.position(width - 140, 40);
  lightBtn.mousePressed(toggleLight);
  styleButton(lightBtn);

  cloneBtn = createButton("START YOUR CLONE");
  cloneBtn.position(width / 2 - 70, height / 2 + 150);
  cloneBtn.mousePressed(() => {
    startTransition();
  });
  styleButton(cloneBtn);

  // --- Text Boxes ---
  who = createBox("Who", random(100, width - 100), random(100, height - 100));
  am = createBox("Am", random(100, width - 100), random(100, height - 100));
  iBox = createBox("I", random(100, width - 100), random(100, height - 100));
}

// -------------------- DRAW --------------------
function draw() {
  if (transitioning) {
    drawTransition();
    return;
  }

  if (glitching) {
    drawGlitch();
    return;
  }

  // background always normal
  background(178, 203, 167);

  // --- blended layer (only lines) ---
  push();
  if (blendSwitch) {
    blendMode(OVERLAY);
  } else {
    blendMode(BLEND);
  }
  stroke(0);
  line(who.x, who.y, am.x, am.y);
  line(who.x, who.y, iBox.x, iBox.y);
  line(am.x, am.y, iBox.x, iBox.y);

  drawBox(who);
  drawBox(am);
  drawBox(iBox);

  drawBinaryAtBox(who);
  drawBinaryAtBox(am);
  drawBinaryAtBox(iBox);
  pop();

  // --- blinking instruction ---
  let blinkSpeed = 70;
  if (frameCount % blinkSpeed < blinkSpeed / 2) {
    push();
    textFont(helveticaNeue);
    textSize(18);
    fill(0);
    noStroke();
    text("*Hover on the text boxes", width / 2, 55);
    pop();
  }

  shuffleOnHover(who);
  shuffleOnHover(am);
  shuffleOnHover(iBox);

  // --- TRAIL DRAW (beneath cursor) ---
  drawTrail();

  // --- Custom Cursor (on top of trail) ---
  push();
  blendMode(BLEND);
  if (
    isHoveringButton() ||
    isHoveringBox(who) ||
    isHoveringBox(am) ||
    isHoveringBox(iBox)
  ) {
    image(pointerCursor, mouseX, mouseY, 55, 55);
  } else {
    image(normalCursor, mouseX, mouseY, 50, 50);
  }
  pop();
}

// -------------------- TRAIL FUNCTIONS --------------------
function drawTrail() {
  if (trail.length > 4) {
    push();
    noFill();
    stroke(0);
    strokeWeight(1);

    beginShape();

    // ---- top edge ----
    for (let i = 0; i < trail.length; i++) {
      let p = trail[i];
      let t = i / (trail.length - 1);
      let taper = sin(t * PI);
      let w = 40 * taper + 1;
      let jitterX = random(-2, 2);
      let jitterY = random(-2, 2);

      if (random() < 0.05) {
        endShape();
        beginShape();
      }

      vertex(p.x + jitterX, p.y - w / 2 + jitterY);
    }

    // ---- rounded end cap ----
    let last = trail[trail.length - 1];
    let prev = trail[trail.length - 2];
    let angle = atan2(last.y - prev.y, last.x - prev.x);
    let endW = 40 * sin(1 * PI);
    for (let a = angle - HALF_PI; a <= angle + HALF_PI; a += PI / 20) {
      vertex(last.x + cos(a) * endW / 2, last.y + sin(a) * endW / 2);
    }

    // ---- bottom edge ----
    for (let i = trail.length - 1; i >= 0; i--) {
      let p = trail[i];
      let t = i / (trail.length - 1);
      let taper = sin(t * PI);
      let w = 40 * taper + 1;
      let jitterX = random(-2, 2);
      let jitterY = random(-2, 2);

      if (random() < 0.05) {
        endShape();
        beginShape();
      }

      vertex(p.x + jitterX, p.y + w / 2 + jitterY);
    }

    // ---- rounded start cap ----
    let first = trail[0];
    let next = trail[1];
    let angle2 = atan2(first.y - next.y, first.x - next.x);
    let startW = 40 * sin(0 * PI);
    for (let a = angle2 - HALF_PI; a <= angle2 + HALF_PI; a += PI / 20) {
      vertex(first.x + cos(a) * startW / 2, first.y + sin(a) * startW / 2);
    }

    endShape(CLOSE);

    // ---- scattered dots ----
    for (let i = 0; i < trail.length; i++) {
      if (random() < 0.1) {
        let p = trail[i];
        noStroke();
        fill(0);
        let d = random(1, 4);
        circle(p.x + random(-15, 15), p.y + random(-15, 15), d);
      }
    }
    pop();
  }

  if (trail.length > 40) trail.shift();
}

function mouseMoved() {
  trail.push(createVector(mouseX, mouseY));
}

function mouseDragged() {
  trail.push(createVector(mouseX, mouseY));
}

// -------------------- HELPERS --------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg = createGraphics(windowWidth, windowHeight);
  pg.clear();

  audioBtn.position(width - 260, 40);
  lightBtn.position(width - 140, 40);
  cloneBtn.position(width / 2 - 70, height / 2 + 150);
}

function isHoveringButton() {
  return (
    audioBtn.elt.matches(":hover") ||
    lightBtn.elt.matches(":hover") ||
    cloneBtn.elt.matches(":hover")
  );
}

function isHoveringBox(box) {
  return (
    mouseX > box.x - box.w / 2 &&
    mouseX < box.x + box.w / 2 &&
    mouseY > box.y - box.h / 2 &&
    mouseY < box.y + box.h / 2
  );
}

function drawBinaryAtBox(box) {
  push();
  textFont(helveticaNeue);
  textSize(18);
  fill(0);
  textAlign(CENTER, CENTER);

  let bits = "";
  for (let i = 0; i < 6; i++) bits += floor(random(2));

  text(bits, box.x, box.y);
  pop();
}

function styleButton(btn) {
  btn.attribute("data-text", btn.html());
  btn.style("padding", "10px 25px");
  btn.style("border-radius", "25px");
  btn.style("font-size", "18px");
  btn.style("border", "1px solid black");
  btn.style("background", "none");
  btn.style("font-style", "italic");
  btn.style("cursor", "none");
  btn.style("font-family", "HelveticaNeue, sans-serif");
  btn.style("transition", "all 0.3s ease");

  btn.mouseOver(() => {
    btn.style("background", "black");
    btn.style("color", "#D8EDCE");
  });

  btn.mouseOut(() => {
    btn.style("background", "none");
    btn.style("color", "black");
  });
}

function createBox(txt, x, y) {
  return { txt, x, y, w: 60, h: 40 };
}

function drawBox(box) {
  let firstChar = box.txt.charAt(0);
  let rest = box.txt.slice(1);
  let padding = 20;

  let scriptSize = 55;
  let restSize = 35;

  textFont("sloop-script-two");
  textSize(scriptSize);
  let firstW = textWidth(firstChar);
  let scriptAscent = textAscent();
  let scriptDescent = textDescent();

  textFont(helveticaNeue);
  textSize(restSize);
  let restW = textWidth(rest);
  let restAscent = textAscent();
  let restDescent = textDescent();

  let textH = max(scriptAscent + scriptDescent, restAscent + restDescent);
  box.w = firstW + restW + padding * 2;
  box.h = textH + padding * 2;

  noFill();
  stroke(0);
  rect(box.x, box.y, box.w, box.h);

  noStroke();
  fill(0);
  let totalW = firstW + restW;
  let startX = box.x - totalW / 2;
  let baselineY = box.y + textH / 2 - max(scriptDescent, restDescent);

  textFont("sloop-script-two");
  textSize(scriptSize);
  text(firstChar, startX + firstW / 2, baselineY);

  if (rest.length > 0) {
    textFont(helveticaNeue);
    textSize(restSize);
    text(rest, startX + firstW + restW / 2, baselineY);
  }
}

function shuffleOnHover(box) {
  if (isHoveringBox(box)) {
    box.x = random(100, width - 100);
    box.y = random(100, height - 100);
  }
}

function toggleAudio() {
  if (playMusic) {
    song.pause();
    localStorage.setItem('audioState', 'false'); // Save state
  } else {
    song.loop();
    localStorage.setItem('audioState', 'true'); // Save state
  }
  playMusic = !playMusic;
}

function toggleLight() {
  blendSwitch = !blendSwitch;
}

function startTransition() {
  transitioning = true;
  transitionPhase = 1;
  bars = [];
  transitionTimer = 0;
}

function drawTransition() {
  background(1);
  noFill(255);
  stroke(0);

  if (transitionPhase === 1) {
    for (let i = 0; i < 6; i++) {
      bars.push({
        x: random(width),
        y: random(height),
        w: random(90, width),
        h: random(5, 15),
        color: randomBarColor()
      });
    }
  }

  for (let bar of bars) {
    fill(bar.color);
    rect(bar.x, bar.y, bar.w, bar.h);
  }

  if (transitionPhase === 1 && bars.length > 500) {
    transitionPhase = 2;
  }

  if (transitionPhase === 2) {
    bars.splice(0, 20);
    if (bars.length === 0) {
      transitioning = false;
      window.location.href = 'phase1.html';
    }
  }
}

function randomBarColor() {
  let palette = [
    color(255, 0, 0),
    color(0, 255, 0),
    color(0, 0, 255),
    color(255),
    color(0)
  ];
  return random(palette);
}
