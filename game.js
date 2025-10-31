// --- Canvas setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Game variables ---
let gameStarted = false;
let gameOver = false;
let gravity = 0.6;
let jumpPower = 15;
let isJumping = false;
let doubleJumpUsed = false; // New variable for double jump
let bgX = 0;
let groundX = 0;
let frame = 0;
let score = 0;
let highScore = localStorage.getItem("pikachuHighScore") || 0;
let balloons = [];
let trunks = [];
let nextTrunkFrame = 0;

// --- Images (Ensure these paths are correct) ---
// You must have these assets in an 'assests' folder for the game to work.
const trunkImage = new Image();
trunkImage.src = "trunk.png";

const balloonImg = new Image();
balloonImg.src = "baloon.png";

const bg = new Image();
bg.src = "sky.jpg";

const ground = new Image();
ground.src = "ground.png";

const pikachuIdle = new Image();
pikachuIdle.src = "idle.png";

const pikachuJump = new Image();
pikachuJump.src = "pikachusky.png";

const pikachuCollision = new Image();
pikachuCollision.src = "/obstacle.png";

const pikachuRunFrames = [
  "run5.png",
  "run4.png",
  "run1.png",
  "run4.png",
  "idle.png",
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

// --- Buttons and HTML Elements ---
const runBtn = document.getElementById("runBtn");
const htmlRestartBtn = document.getElementById("restartBtn"); 
const desktopControls = document.getElementById("desktopControls"); 
const mobileControls = document.getElementById("mobileControls"); 

// Desktop Controls
const jumpBtn = document.getElementById("jumpBtn");
const muteBGMBtn = document.getElementById("muteBGMBtn");
const muteSFXBtn = document.getElementById("muteSFXBtn");

// Mobile Controls
const mobileBGMBtn = document.getElementById("mobileBGMBtn");
const mobileSFXBtn = document.getElementById("mobileSFXBtn");
const mobileJumpBtn = document.getElementById("mobileJumpBtn");


// --- Game audio ---
const backgroundMusic = new Audio('baase.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const crashSound = new Audio('crash.mp3');
crashSound.volume = 0.8;

const collectSound = new Audio('collect.mp3');
collectSound.volume = 0.7;

const jumpSound = new Audio('jump.mp3');
jumpSound.volume = 0.5;

// Separate mute states
let isBGMMuted = false;
let isSFXMuted = false;


// --- Helper Function to toggle Mute States ---
function toggleBGM() {
    isBGMMuted = !isBGMMuted;
    backgroundMusic.muted = isBGMMuted;
    
    // Update button texts/icons for both desktop and mobile
    const text = isBGMMuted ? "🎵 Muted" : "🎶 BGM";
    const mobileIcon = isBGMMuted ? "🔇" : "🎶";
    
    if (muteBGMBtn) muteBGMBtn.textContent = text;
    if (mobileBGMBtn) mobileBGMBtn.textContent = mobileIcon;

    if (gameStarted && !gameOver) {
        // Start/Stop BGM based on mute state
        isBGMMuted ? backgroundMusic.pause() : backgroundMusic.play().catch(e => console.error(e));
    }
}

function toggleSFX() {
    isSFXMuted = !isSFXMuted;
    // Mute/unmute all sound effects
    crashSound.muted = isSFXMuted;
    collectSound.muted = isSFXMuted;
    jumpSound.muted = isSFXMuted;
    
    // Update button texts/icons
    const text = isSFXMuted ? "🔇 Muted" : "🔊 SFX";
    const mobileIcon = isSFXMuted ? "🔇" : "🔊";
    
    if (muteSFXBtn) muteSFXBtn.textContent = text;
    if (mobileSFXBtn) mobileSFXBtn.textContent = mobileIcon;
}

// --- General Jump Functionality (Handles single and double jump) ---
function handleJump(isInitialJump) {
    if (!gameStarted || gameOver) return;

    if (isInitialJump) {
        // First jump
        if (!isJumping) {
            pikachu.velocityY = -jumpPower;
            isJumping = true;
            pikachu.currentSprite = "jump";
            if (!isSFXMuted) {
                jumpSound.currentTime = 0;
                jumpSound.play();
            }
        }
    } else {
        // Double jump (Can only be used if already jumping and doubleJumpUsed is false)
        if (isJumping && !doubleJumpUsed) {
            pikachu.velocityY = -jumpPower * 1.2; // Slightly stronger second jump
            doubleJumpUsed = true;
            pikachu.currentSprite = "jump"; // Keep jump sprite
            if (!isSFXMuted) {
                jumpSound.currentTime = 0;
                jumpSound.play();
            }
        }
    }
}


// --- Event Listeners ---
runBtn.addEventListener("click", startGame);
htmlRestartBtn.addEventListener("click", startGame);


// --- Desktop Jump button listener (Uses a delay to detect double click) ---
let lastClick = 0;
jumpBtn.addEventListener("click", () => {
    const now = Date.now();
    const doubleClick = now - lastClick < 300; // Time window for double click
    lastClick = now;

    if (!isJumping) {
        handleJump(true); // Initial Jump
    } else if (doubleClick) {
        handleJump(false); // Double Jump on quick second click
    }
});

// --- Mobile Jump Button Listener (Taps = initial jump, Double Tap/Click = double jump) ---
if (mobileJumpBtn) {
    let mobileLastClick = 0;
    mobileJumpBtn.addEventListener("click", () => {
        const now = Date.now();
        const doubleClick = now - mobileLastClick < 300;
        mobileLastClick = now;

        if (!isJumping) {
            handleJump(true); // Initial Jump
        } else if (doubleClick) {
            handleJump(false); // Double Jump on quick second tap
        }
    });
}


// --- Audio Mute Listeners (Desktop) ---
if (muteBGMBtn) muteBGMBtn.addEventListener("click", toggleBGM);
if (muteSFXBtn) muteSFXBtn.addEventListener("click", toggleSFX);

// --- Audio Mute Listeners (Mobile) ---
if (mobileBGMBtn) mobileBGMBtn.addEventListener("click", toggleBGM);
if (mobileSFXBtn) mobileSFXBtn.addEventListener("click", toggleSFX);


// --- Start Game ---
function startGame() {
    document.getElementById("startScreen").style.display = "none";
    canvas.style.display = "block";
    
    // Show the correct set of controls based on screen size (CSS Media Queries handle which container is visible)
    // We only need to un-hide the main containers, CSS handles the rest.
    desktopControls.style.display = "flex"; 
    mobileControls.style.display = "block";

    resetGame();
    gameStarted = true;

    if (!isBGMMuted) { 
        backgroundMusic.play().catch(e => console.error("Audio playback failed:", e));
    }
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
    htmlRestartBtn.style.display = "none";
    pikachu.y = groundY - pikachu.height + 10;
    pikachu.velocityY = 0;
    pikachu.currentSprite = "run";
    isJumping = false;
    doubleJumpUsed = false; // Reset double jump
}

// --- Background Drawing ---
function drawBackground() {
    bgX -= 2;
    if (bgX <= -canvas.width) bgX = 0;
    ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

// --- Ground Drawing ---
function drawGround() {
    groundX -= 5;
    if (groundX <= -canvas.width) groundX = 0;
    ctx.drawImage(ground, groundX, groundY, canvas.width, 100);
    ctx.drawImage(ground, groundX + canvas.width, groundY, canvas.width, 100);
}

// --- Pikachu Drawing (Sprite Animation) ---
function drawPikachu() {
    let img;
    if (gameOver) {
        img = pikachuCollision;
    } else if (pikachu.currentSprite === "idle") {
        img = pikachuIdle;
    } else if (pikachu.currentSprite === "jump") {
        img = pikachuJump;
    } else {
        img = pikachuRunFrames[Math.floor(frame / 5) % pikachuRunFrames.length]; // Running animation
    }
    ctx.drawImage(img, pikachu.x, pikachu.y, pikachu.width, pikachu.height);
}

// --- Physics Update (Gravity and Jumping) ---
function update() {
    if (!gameOver) {
        pikachu.velocityY += gravity;
        pikachu.y += pikachu.velocityY;

        if (pikachu.y < 0) {
            pikachu.y = 0;
            pikachu.velocityY = 0;
        }

        // Check for landing on the ground
        if (pikachu.y + pikachu.height >= groundY) {
            pikachu.y = groundY - pikachu.height + 10;
            pikachu.velocityY = 0;
            isJumping = false;
            doubleJumpUsed = false; // Reset double jump on landing
            if (pikachu.currentSprite !== "run") pikachu.currentSprite = "run";
        }
    }
}

// --- Spawners ---
function spawnBalloon() {
    balloons.push({
        x: canvas.width,
        y: 50 + Math.random() * 100,
        width: 60,
        height: 90,
        speed: 1 + Math.random() * 1.5, // Increased speed variation
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

// --- Collision Detection (AABB) ---
function checkCollision(a, b) {
    // Add a small buffer/padding to Pikachu's hitbox for slightly easier play
    const padding = 10; 
    return (
        a.x + padding < b.x + b.width &&
        a.x + a.width - padding > b.x &&
        a.y + padding < b.y + b.height &&
        a.y + a.height - padding > b.y
    );
}

// --- Score Drawing ---
function drawScore() {
    ctx.font = "28px Comic Sans MS";
    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + score, 20, 40);
    ctx.fillText("High: " + highScore, 20, 70);
}

// --- Game Over Logic ---
function showGameOver() {
    gameOver = true;

    // Stop and reset BGM
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;

    if (!isSFXMuted) { 
        crashSound.currentTime = 0;
        crashSound.play().catch(e => console.error("Crash sound failed:", e));
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("pikachuHighScore", highScore);
    }

    // Hide all controls
    desktopControls.style.display = "none";
    mobileControls.style.display = "none";

    // Draw Game Over Text on Canvas
    ctx.font = "50px Comic Sans MS";
    ctx.fillStyle = "red";
    ctx.fillText("Game Over!", canvas.width / 2 - 130, canvas.height / 2 - 60);

    ctx.font = "28px Comic Sans MS";
    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + score, canvas.width / 2 - 60, canvas.height / 2 - 15);
    ctx.fillText("Best: " + highScore, canvas.width / 2 - 55, canvas.height / 2 + 25);

    htmlRestartBtn.style.display = "block";

    // Redraw Pikachu as collision image immediately
    drawPikachu();
}

// --- Game Loop ---
function gameLoop() {
    if (!gameStarted || gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    drawBackground();
    drawGround();

    // --- Spawners ---
    if (frame % 250 === 0) spawnBalloon(); // Balloon every 250 frames
    if (frame >= nextTrunkFrame) {
        spawnTrunk();
        nextTrunkFrame = frame + Math.floor(Math.random() * 250) + 150; // Trunk frequency
    }

    // --- Balloons Logic (Collectibles) ---
    for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        b.x -= 4; // Constant move speed
        b.y += Math.sin(frame / 30) * 0.5; // Sine wave for floating effect
        ctx.drawImage(balloonImg, b.x, b.y, b.width, b.height);

        if (checkCollision(pikachu, b)) {
            score += 10;
            balloons.splice(i, 1);
            if (!isSFXMuted) { 
                collectSound.currentTime = 0;
                collectSound.play(); 
            }
            continue; // Move to next item
        }
        if (b.x + b.width < 0) balloons.splice(i, 1);
    }

    // --- Trunks Logic (Obstacles) ---
    for (let i = trunks.length - 1; i >= 0; i--) {
        const trunk = trunks[i];
        trunk.x -= 6;
        ctx.drawImage(trunkImage, trunk.x, trunk.y, trunk.width, trunk.height);

        if (checkCollision(pikachu, trunk)) {
            showGameOver();
            return; // Stop the game loop immediately
        }
        if (trunk.x + trunk.width < 0) trunks.splice(i, 1);
    }

    update();
    drawPikachu();
    drawScore();

    requestAnimationFrame(gameLoop);
}

// --- Idle Pikachu (Initial Screen Load) ---
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
    
    // Set initial mute button icons/text
    if (mobileBGMBtn) mobileBGMBtn.textContent = "🎶";
    if (mobileSFXBtn) mobileSFXBtn.textContent = "🔊";
};

// --- Keyboard Controls (for desktop users) ---
document.addEventListener("keydown", (e) => {
    if (!gameStarted || gameOver) return;

    if (e.code === "Space" || e.code === "ArrowUp") {
        if (!isJumping) {
            handleJump(true); // Initial Jump
        } else {
            handleJump(false); // Double Jump
        }
    }

});
