const violin = document.getElementById('violin');
const scoreDisplay = document.getElementById('score');
const gameContainer = document.querySelector('.game-container');
const gameOverScreen = document.querySelector('.game-over');
const welcomeScreen = document.querySelector('.welcome-screen');
const finalScoreDisplay = document.getElementById('final-score');
const finalPlayerDisplay = document.getElementById('final-player');
const jumpSound = document.getElementById('jump-sound');
const powerUpSound = document.getElementById('power-up-sound');
const highScoreSound = document.getElementById('high-score-sound');
const powerUpStatus = document.getElementById('power-up-status');
const playerNameInput = document.getElementById('player-name');
const startButton = document.getElementById('start-button');
const playerDisplay = document.getElementById('player-display');
const highScoresList = document.getElementById('high-scores-list');
const highScoreMessage = document.getElementById('high-score-message');

let score = 0;
let isGameOver = false;
let gameLoop;
let obstacles = [];
let powerUps = [];
let currentPlayer = '';
let violinPosition = {
    y: 300,
    velocity: 0,
    gravity: 0.5,
    jump: -8,
    isInvincible: false
};
let powerUpTypes = [
    { type: 'star', image: 'power_up.svg', effect: 'invincibility' },
    { type: 'notes', image: 'double_score.svg', effect: 'double_score' },
    { type: 'clock', image: 'slow_motion.svg', effect: 'slow_motion' }
];
let isInvincible = false;
let doubleScoreActive = false;
let slowMotionActive = false;

// High scores management
function getHighScores() {
    const scores = localStorage.getItem('flappyViolinScores');
    return scores ? JSON.parse(scores) : [];
}

function saveHighScore(playerName, score) {
    let scores = getHighScores();
    scores.push({ name: playerName, score: score });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5); // Keep only top 5 scores
    localStorage.setItem('flappyViolinScores', JSON.stringify(scores));
    return scores;
}

function updateHighScoresList() {
    const scores = getHighScores();
    highScoresList.innerHTML = scores.map((score, index) => `
        <div class="score-entry">
            <span>${index + 1}. ${score.name}</span>
            <span>${score.score}</span>
        </div>
    `).join('');
}

function checkIfHighScore(score) {
    const scores = getHighScores();
    return scores.length < 5 || score > scores[scores.length - 1].score;
}

// Game mechanics
function createObstacle() {
    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    obstacle.style.left = gameContainer.clientWidth + 'px';
    obstacle.style.top = Math.random() * (gameContainer.clientHeight - 150) + 'px';
    gameContainer.appendChild(obstacle);
    obstacles.push({
        element: obstacle,
        passed: false
    });
}

function createPowerUp() {
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const powerUp = document.createElement('img');
    powerUp.src = randomType.image;
    powerUp.className = 'power-up';
    powerUp.style.left = '100%';
    powerUp.style.top = Math.random() * (gameContainer.clientHeight - 40) + 'px';
    powerUp.dataset.type = randomType.type;
    gameContainer.appendChild(powerUp);
    return powerUp;
}

function moveObstacles() {
    obstacles.forEach((obstacle, index) => {
        const currentLeft = parseFloat(obstacle.element.style.left);
        if (currentLeft < -60) {
            obstacle.element.remove();
            obstacles.splice(index, 1);
        } else {
            obstacle.element.style.left = (currentLeft - 4) + 'px';
            
            if (!obstacle.passed && currentLeft < 50) {
                obstacle.passed = true;
                updateScore();
            }
        }
    });
}

function movePowerUps() {
    powerUps.forEach((powerUp, index) => {
        const currentLeft = parseFloat(powerUp.style.left);
        if (currentLeft < -60) {
            powerUp.remove();
            powerUps.splice(index, 1);
        } else {
            powerUp.style.left = (currentLeft - 4) + 'px';
        }
    });
}

function checkCollision() {
    if (isInvincible) return false;
    
    const violinRect = violin.getBoundingClientRect();
    
    for (const powerUp of powerUps) {
        if (powerUp.dataset.type) {
            const powerUpRect = powerUp.getBoundingClientRect();
            if (!(violinRect.right < powerUpRect.left || 
                violinRect.left > powerUpRect.right || 
                violinRect.bottom < powerUpRect.top || 
                violinRect.top > powerUpRect.bottom)) {
                activatePowerUp(powerUp.dataset.type);
                powerUp.remove();
            }
        }
    }
    
    for (const obstacle of obstacles) {
        const obstacleRect = obstacle.element.getBoundingClientRect();
        if (!(violinRect.right < obstacleRect.left || 
            violinRect.left > obstacleRect.right || 
            violinRect.bottom < obstacleRect.top || 
            violinRect.top > obstacleRect.bottom)) {
            return true;
        }
    }
    
    return violinPosition.y < 0 || violinPosition.y > gameContainer.clientHeight - violin.clientHeight;
}

function activatePowerUp(type) {
    const statusDiv = document.getElementById('power-up-status');

    switch(type) {
        case 'star':
            isInvincible = true;
            statusDiv.textContent = '⭐ Invincible!';
            setTimeout(() => {
                isInvincible = false;
                statusDiv.textContent = '';
            }, 5000);
            break;
        case 'notes':
            doubleScoreActive = true;
            statusDiv.textContent = '♫ Double Score!';
            setTimeout(() => {
                doubleScoreActive = false;
                statusDiv.textContent = '';
            }, 5000);
            break;
        case 'clock':
            slowMotionActive = true;
            statusDiv.textContent = '⏱ Slow Motion!';
            document.querySelectorAll('.obstacle').forEach(obstacle => {
                obstacle.style.animationDuration = '4s';
            });
            setTimeout(() => {
                slowMotionActive = false;
                statusDiv.textContent = '';
                document.querySelectorAll('.obstacle').forEach(obstacle => {
                    obstacle.style.animationDuration = '2s';
                });
            }, 5000);
            break;
    }
    powerUpSound.play();
}

function updateScore() {
    score += doubleScoreActive ? 2 : 1;
    document.getElementById('score').textContent = score;
}

function updateViolinPosition() {
    violinPosition.velocity += violinPosition.gravity;
    violinPosition.y += violinPosition.velocity;
    violin.style.transform = `translateY(${violinPosition.y}px) rotate(${violinPosition.velocity * 2}deg)`;
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    finalScoreDisplay.textContent = score;
    finalPlayerDisplay.textContent = currentPlayer;
    
    if (checkIfHighScore(score)) {
        highScoreSound.play();
        highScoreMessage.textContent = "New High Score! 🎉";
        saveHighScore(currentPlayer, score);
        updateHighScoresList();
    } else {
        highScoreMessage.textContent = "";
    }
    
    gameOverScreen.style.display = 'block';
}

function jump() {
    if (!isGameOver) {
        violinPosition.velocity = violinPosition.jump;
        jumpSound.currentTime = 0;
        jumpSound.play();
    }
}

function startGame() {
    if (!currentPlayer && !isGameOver) return;
    
    welcomeScreen.style.display = 'none';
    isGameOver = false;
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    playerDisplay.textContent = `Player: ${currentPlayer}`;
    powerUpStatus.textContent = '';
    gameOverScreen.style.display = 'none';
    
    obstacles.forEach(obstacle => obstacle.element.remove());
    powerUps.forEach(powerUp => powerUp.remove());
    obstacles = [];
    powerUps = [];
    
    violinPosition = {
        y: 300,
        velocity: 0,
        gravity: 0.5,
        jump: -8,
        isInvincible: false
    };
    
    gameLoop = setInterval(() => {
        if (Math.random() < 0.02) {
            createObstacle();
        }
        if (Math.random() < 0.005) {
            const powerUp = createPowerUp();
            powerUps.push(powerUp);
        }
        moveObstacles();
        movePowerUps();
        updateViolinPosition();
        
        if (checkCollision()) {
            gameOver();
        }
    }, 16);
}

// Event listeners
playerNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    startButton.disabled = name.length < 2;
    currentPlayer = name;
});

startButton.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        if (!gameLoop && !welcomeScreen.style.display) {
            startGame();
        }
        jump();
    }
});

// Initialize
updateHighScoresList();
violin.style.transform = `translateY(${violinPosition.y}px)`;
