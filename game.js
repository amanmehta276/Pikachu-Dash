// --- Canvas setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Game variables ---
let gameStarted = false;
let gameOver = false;
let gravity = 0.6;
let jumpPower = 15;
let isJumping = false;
let bgX = 0;
let groundX = 0;
let frame = 0;
let score = 0;
let highScore = localStorage.getItem("pikachuHighScore") || 0;
let balloons = [];
let trunks = [];
let nextTrunkFrame = 0;

// --- Images ---
const trunkImage = new Image();
trunkImage.src = "assests/obstacles/trunk.png";

const balloonImg = new Image();
balloonImg.src = "assests/collectibles/baloon.png";

const bg = new Image();
bg.src = "assests/background/sky.jpg";

const ground = new Image();
ground.src = "assests/background/ground.png";

const pikachuIdle = new Image();
pikachuIdle.src = "assests/pikachu/idle.png";

// const pikachuJump = new Image();
// pikachuJump.src = "assests/pikachu/jump.png";

const pikachuJump = new Image();
pikachuJump.src = "assests/pikachu/pikachusky.png";

const pikachuRunFrames = [
  "assests/pikachu/run5.png",
  "assests/pikachu/run4.png",
  "assests/pikachu/run1.png",
  "assests/pikachu/run4.png",
  "assests/pikachu/idle.png",
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// --- Pikachu object ---
const pikachu = {
  x: 150,
  y: 0,
  width: 130,
  height: 130,
  velocityY: 0,
  currentSprite: "idle",
};

// --- Ground level ---
const groundY = canvas.height - 100;

// --- Buttons ---
const runBtn = document.getElementById("runBtn");
const jumpBtn = document.getElementById("jumpBtn");

// --- Run button ---
runBtn.addEventListener("click", startGame);

// --- Jump button ---
let lastClick = 0;
jumpBtn.addEventListener("click", () => {
  if (!gameStarted || gameOver) return;

  const now = Date.now();
  const doubleClick = now - lastClick < 300;
  lastClick = now;

  if (!isJumping) {
    pikachu.velocityY = -jumpPower;
    isJumping = true;
    pikachu.currentSprite = "jump";
  } else if (doubleClick) {
    pikachu.velocityY = -jumpPower * 1.5;
  }
});

// --- Start Game ---
function startGame() {
  document.getElementById("startScreen").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("controls").style.display = "block";

  resetGame();
  gameStarted = true;
  gameLoop();
}

// --- Reset Game ---
function resetGame() {
  bgX = 0;
  groundX = 0;
  frame = 0;
  balloons = [];
  trunks = [];
  nextTrunkFrame = Math.floor(Math.random() * 100) + 60;
  score = 0;
  gameOver = false;
  pikachu.y = groundY - pikachu.height + 10;
  pikachu.velocityY = 0;
  pikachu.currentSprite = "run";
}

// --- Background ---
function drawBackground() {
  bgX -= 2;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

// --- Ground ---
function drawGround() {
  groundX -= 5;
  if (groundX <= -canvas.width) groundX = 0;
  ctx.drawImage(ground, groundX, groundY, canvas.width, 100);
  ctx.drawImage(ground, groundX + canvas.width, groundY, canvas.width, 100);
}

// --- Pikachu ---
function drawPikachu() {
  let img;
  if (pikachu.currentSprite === "idle") img = pikachuIdle;
  else if (pikachu.currentSprite === "jump") img = pikachuJump;
  else img = pikachuRunFrames[Math.floor(frame / 5) % pikachuRunFrames.length];
  ctx.drawImage(img, pikachu.x, pikachu.y, pikachu.width, pikachu.height);
}

// --- Physics ---
function update() {
  pikachu.velocityY += gravity;
  pikachu.y += pikachu.velocityY;

  if (pikachu.y < 0) {
    pikachu.y = 0;
    pikachu.velocityY = 0;
  }

  if (pikachu.y + pikachu.height >= groundY) {
    pikachu.y = groundY - pikachu.height + 10;
    pikachu.velocityY = 0;
    isJumping = false;
    if (pikachu.currentSprite !== "run") pikachu.currentSprite = "run";
  }
}

// --- Spawners ---
function spawnBalloon() {
  balloons.push({
    x: canvas.width,
    y: 50 + Math.random() * 100,
    width: 60,
    height: 90,
    speed: 1 + Math.random() * 1,
  });
}

function spawnTrunk() {
  trunks.push({
    x: canvas.width,
    y: groundY - 60,
    width: 60,
    height: 70,
  });
}

// --- Collision ---
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// --- Score ---
function drawScore() {
  ctx.font = "28px Comic Sans MS";
  ctx.fillStyle = "#fff";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("High: " + highScore, 20, 70);
}

// --- Game Over ---
function showGameOver() {
  gameOver = true;

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("pikachuHighScore", highScore);
  }

  ctx.font = "50px Comic Sans MS";
  ctx.fillStyle = "red";
  ctx.fillText("Game Over!", canvas.width / 2 - 130, canvas.height / 2 - 60);

  ctx.font = "28px Comic Sans MS";
  ctx.fillStyle = "#fff";
  ctx.fillText("Score: " + score, canvas.width / 2 - 60, canvas.height / 2 - 15);
  ctx.fillText("Best: " + highScore, canvas.width / 2 - 55, canvas.height / 2 + 25);

  // --- Fancy Restart Button ---
  const btnW = 200;
  const btnH = 70;
  const btnX = canvas.width / 2 - btnW / 2;
  const btnY = canvas.height / 2 + 50;

  // Gradient + glow
  const gradient = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
  gradient.addColorStop(0, "#FFD700");
  gradient.addColorStop(1, "#FFA500");
  ctx.fillStyle = gradient;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#FFF176";
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 20);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Border
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#FFF";
  ctx.stroke();

  // Text
  ctx.fillStyle = "#000";
  ctx.font = "28px Comic Sans MS";
  ctx.fillText("Restart", btnX + 55, btnY + 45);

  // Click handler
  canvas.addEventListener("click", function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      canvas.removeEventListener("click", onClick);
      startGame();
    }
  });
}

// --- Game Loop ---
function gameLoop() {
  if (!gameStarted || gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frame++;

  drawBackground();
  drawGround();

  // Balloons
  if (frame % 200 === 0) spawnBalloon();
  balloons.forEach((b, index) => {
    b.x -= b.speed;
    b.y += Math.sin(frame / 30) * 0.5;
    ctx.drawImage(balloonImg, b.x, b.y, b.width, b.height);
    if (checkCollision(pikachu, b)) {
      score += 10;
      balloons.splice(index, 1);
    }
  });
  balloons = balloons.filter(b => b.x + b.width > 0);

  // Trunks — increased distance
  if (frame >= nextTrunkFrame) {
    spawnTrunk();
    nextTrunkFrame = frame + Math.floor(Math.random() * 250) + 300; // <-- increased gap
  }

  for (let i = trunks.length - 1; i >= 0; i--) {
    const trunk = trunks[i];
    trunk.x -= 6;
    ctx.drawImage(trunkImage, trunk.x, trunk.y, trunk.width, trunk.height);

    if (checkCollision(pikachu, trunk)) {
      showGameOver();
      return;
    }
    if (trunk.x + trunk.width < 0) trunks.splice(i, 1);
  }

  update();
  drawPikachu();
  drawScore();

  requestAnimationFrame(gameLoop);
}

// --- Idle Pikachu ---
window.onload = function () {
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(ground, 0, groundY, canvas.width, 100);
  ctx.drawImage(
    pikachuIdle,
    pikachu.x,
    groundY - pikachu.height + 10,
    pikachu.width,
    pikachu.height
  );
};

// --- Touch Controls for Mobile ---
canvas.addEventListener("touchstart", (e) => {
  if (!gameStarted || gameOver) return;

  // Handle jump when screen is tapped
  if (!isJumping) {
    pikachu.velocityY = -jumpPower;
    isJumping = true;
    pikachu.currentSprite = "jump";
  }
});

function endGame() {
  gameOver = true;
  document.getElementById("restartBtn").style.display = "block";
}

document.getElementById("restartBtn").addEventListener("click", () => {
  resetGame();
  document.getElementById("restartBtn").style.display = "none";
});

canvas.addEventListener("click", function onClick(e) {
  const rect = canvas.getBoundingClientRect();
  
  // scale click coordinates according to resized canvas
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
    canvas.removeEventListener("click", onClick);
    startGame();
  }
});

