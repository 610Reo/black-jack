// ============ 1. DOM要素の取得 ============
const startScreen = document.getElementById('startScreen');
const bettingScreen = document.getElementById('bettingScreen');
const gameScreen = document.getElementById('gameScreen');
const settingsOverlay = document.getElementById('settingsOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay'); 

const startButton = document.getElementById('startButton');
const confirmButton = document.getElementById('confirmButton');
const settingsButton = document.getElementById('settingsButton');
const closeSettings = document.getElementById('closeSettings');
const hitButton = document.getElementById('hitButton');
const standButton = document.getElementById('standButton');
const doubleDownButton = document.getElementById('doubleDownButton');
const retryButton = document.getElementById('retryButton');
const restartGameButton = document.getElementById('restartGameButton'); 

// スライダー・スピナー・薄赤枠用DOM
const betSlider = document.getElementById('betSlider');
const betSpinner = document.getElementById('betSpinner');
const currentBetAmount = document.getElementById('currentBetAmount'); 

const bgmSlider = document.getElementById('bgmVolume');
const bgmValueDisplay = document.getElementById('bgmVolumeValue');
const designSelect = document.getElementById('themeSelect');
const seSlider = document.getElementById('seVolume');
const seValueDisplay = document.getElementById('seVolumeValue');

const dealerScoreDisplay = document.getElementById('dealerScore');
const playerScoreDisplay = document.getElementById('playerScore');
const playerNameDisplay = document.getElementById('playerName');
const resultMessage = document.getElementById('resultMessage');
const dealerCardsArea = document.querySelector('.dealer-cards');
const playerCardsArea = document.querySelector('.player-cards');

const playerChipsDisplay = document.getElementById('playerChips');
const currentBetPill = document.getElementById('currentBetPill');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const keySpans = document.querySelectorAll('.key-list span');
const statsTab = document.getElementById('statsTab');
const statsPanel = document.getElementById('statsPanel');

// 🎰 ゲームオーバーテキスト要素
const goTotalGames = document.getElementById('goTotalGames');
const goWinCount = document.getElementById('goWinCount');
const goLoseCount = document.getElementById('goLoseCount');
const goWinRate = document.getElementById('goWinRate');
const goTotalEarned = document.getElementById('goTotalEarned');
const goMaxEarned = document.getElementById('goMaxEarned');

// ============ 2. データ管理 (状態) ============
let playerHand = [];
let dealerHand = [];
let dealerHiddenRevealed = false;
let isGameOver = false;
let isAssigningKey = null;
let lastConfirmedBet = 100;

let keyBinds = {
    hit: 'h',
    stand: 's',
    double: 'd',
    settings: 'Escape',
    stats: 'v' 
};

// --- デッキ構築用の設定 ---
const suits = ['♠','♥','♦','♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const cardPool = [];        
const randomCardPool = [];  

for (const suit of suits) {
    for (const rank of ranks) {
        cardPool.push({
            suit,
            rank,
            value: rank === 'A' ? 11 : (['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank)),
            display: `${suit}${rank}`
        });
    }
}

// 💡 JOKERデータ定義
const jokerTypes = [
    { suit: 'color', rank: 'JOKER', value: 0, display: '🃏JOKER' },
    { suit: 'black', rank: 'JOKER', value: 0, display: '🃏JOKER' }
];
for (const joker of jokerTypes) {
    cardPool.push(joker);
}

let totalGames = 0;
let winCount = 0;
let loseCount = 0;
let drawCount = 0; 
let playerChips = 1000;
let selectedBet = 100;

let totalChipsEarned = 0;
let maxChipsEarnedSingleGame = 0;

let lifetimeGames = Number(localStorage.getItem('bj_lifetimeGames')) || 0;
let lifetimeWins = Number(localStorage.getItem('bj_lifetimeWins')) || 0;
let lifetimeLoses = Number(localStorage.getItem('bj_lifetimeLoses')) || 0;
let lifetimeDraws = Number(localStorage.getItem('bj_lifetimeDraws')) || 0;

// ============ 3. ヘルパー関数 ============
function shuffleDeck() {
    randomCardPool.length = 0; 
    const availableCards = cardPool.map(card => ({ ...card })); 

    for (let i = availableCards.length; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const [selectedCard] = availableCards.splice(randomIndex, 1);
        randomCardPool.push(selectedCard);
    }
    return randomCardPool;
}

function randomCard() {
    if (randomCardPool.length === 0) {
        shuffleDeck();
    }
    return randomCardPool.pop();
}

function cardValue(card) {
    if (typeof card === 'object' && card !== null) {
        return card.value ?? 0;
    }
    return 0; 
}

function calculateTotal(hand) {
    let total = hand.reduce((sum, card) => sum + cardValue(card), 0);
    let aceCount = hand.filter(card => card.rank === 'A').length;
    
    while (total > 21 && aceCount > 0) {
        total -= 10;
        aceCount -= 1;
    }
    return total;
}

function createCardElement(card, isHidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = isHidden ? 'card card-back' : 'card card-front';
    
    if (!isHidden) {
        cardDiv.classList.add(`rank-${card.rank}`);
    }
    
    // カラーJOKER、ハート、ダイヤは赤色クラスを付与
    if (!isHidden && (card.suit === '♥' || card.suit === '♦' || card.suit === 'color')) {
        cardDiv.classList.add('card-red');
    }

    if (!isHidden) {
        // 1. 左上のミニインデックス
        const topLeft = document.createElement('div');
        topLeft.className = 'card-index top-left';
        topLeft.innerHTML = card.rank === 'JOKER' ? 'J<br>O<br>K<br>E<br>R' : `${card.rank}<br>${card.suit}`;
        cardDiv.appendChild(topLeft);

        // 2. 中央エリア
        const center = document.createElement('div');
        center.className = 'card-center';
        
        // 💡 J, Q, K をJOKERと同じように「1つの大きな絵柄（アート）」として処理
        if (card.rank === 'JOKER' || ['J', 'Q', 'K'].includes(card.rank)) {
            center.classList.add('joker-art'); // JOKER用のアート用CSSクラスを共有適用
            
            if (card.rank === 'JOKER') {
                center.textContent = '🃏';
                if (card.suit === 'black') {
                    center.style.filter = 'grayscale(100%)'; 
                }
            } else if (card.rank === 'J') {
                center.textContent = 'J'; // ジャック（騎士風）
            } else if (card.rank === 'Q') {
                center.textContent = 'Q'; // クイーン（女王）
            } else if (card.rank === 'K') {
                center.textContent = 'K'; // キング（王冠・国王）
            }
        } else if (card.rank === 'A') {
            center.classList.add('suit-pattern-1');
            const icon = document.createElement('span');
            icon.textContent = card.suit;
            center.appendChild(icon);
        } else {
            // 2〜10の数字カード
            let count = Number(card.rank); 
            center.classList.add(`suit-pattern-${count}`);
            
            for (let i = 0; i < count; i++) {
                const icon = document.createElement('span');
                icon.textContent = card.suit;
                center.appendChild(icon);
            }
        }
        cardDiv.appendChild(center);

        // 3. 右下のミニインデックス
        const bottomRight = document.createElement('div');
        bottomRight.className = 'card-index bottom-right';
        bottomRight.innerHTML = card.rank === 'JOKER' ? 'J<br>O<br>K<br>E<br>R' : `${card.rank}<br>${card.suit}`;
        cardDiv.appendChild(bottomRight);
    }
    
    return cardDiv;
}

function animateValue(obj, start, end, duration, suffix = "") {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        obj.textContent = currentValue.toLocaleString() + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ============ 4. UI更新・同期ロジック ============
function setBetMax() {
    const minBet = Number(betSlider.min || 10);
    let maxBet;
    if (playerChips <= 1000) {
        maxBet = Math.max(Math.min(playerChips, 1000), minBet);
    } else {
        const rounded = roundToTwoSignificantDigits(playerChips);
        maxBet = Math.max(rounded, minBet);
    }

    betSlider.max = maxBet;
    betSpinner.max = maxBet;
    updateSliderLabels();

    if (selectedBet > maxBet) {
        updateBetDisplay(maxBet);
    }
}

function roundToTwoSignificantDigits(n) {
    if (n <= 0) return n;
    const digits = Math.floor(Math.log10(n)) + 1;
    const factor = Math.pow(10, Math.max(digits - 2, 0));
    return Math.round(n / factor) * factor;
}

function updateSliderLabels() {
    const minBet = Number(betSlider.min || 10);
    const maxBet = Number(betSlider.max || 1000);
    const labelsContainer = document.querySelector('.slider-labels');
    if (!labelsContainer) return;

    labelsContainer.innerHTML = '';
    const labels = [minBet];

    if (maxBet <= 1000) {
        for (let value = 100; value < maxBet; value += 100) {
            if (value > minBet) labels.push(value);
        }
    } else {
        const step = Math.round(maxBet / 10);
        for (let value = step; value < maxBet; value += step) {
            if (value > minBet) labels.push(value);
        }
    }

    if (labels[labels.length - 1] !== maxBet && maxBet > minBet) {
        labels.push(maxBet);
    }

    labels.forEach(value => {
        const span = document.createElement('span');
        span.textContent = value;
        labelsContainer.appendChild(span);
    });
}

function clampBet(value) {
    const minBet = Number(betSlider.min || 10);
    const maxBet = Number(betSlider.max || playerChips);
    let val = Math.max(minBet, Math.min(maxBet, Number(value)));
    return Math.round(val / 10) * 10;
}

function updateBetDisplay(value) {
    selectedBet = clampBet(value);
    
    if (betSlider) betSlider.value = selectedBet;
    if (betSpinner) betSpinner.value = selectedBet;
    
    if (currentBetAmount) {
        currentBetAmount.textContent = selectedBet;
    }
    if (currentBetPill) {
        currentBetPill.textContent = selectedBet;
    }
}

function updateStats() {
    const denominator = totalGames - drawCount;
    const rate = denominator === 0 ? 0 : Math.floor((winCount / denominator) * 100);
    
    document.getElementById("totalGames").textContent = totalGames;
    document.getElementById("winCount").textContent = winCount;
    document.getElementById("loseCount").textContent = loseCount;
    document.getElementById("drawCount").textContent = drawCount; 
    document.getElementById("winRate").textContent = rate;
    if (playerChipsDisplay) playerChipsDisplay.textContent = playerChips;

    const lifetimeDenominator = lifetimeGames - lifetimeDraws;
    const lifetimeRateVal = lifetimeDenominator === 0 ? 0 : Math.floor((lifetimeWins / lifetimeDenominator) * 100);

    document.getElementById("lifetimeGames").textContent = lifetimeGames;
    document.getElementById("lifetimeWins").textContent = lifetimeWins;
    document.getElementById("lifetimeLoses").textContent = lifetimeLoses;
    document.getElementById("lifetimeDraws").textContent = lifetimeDraws;
    document.getElementById("lifetimeRate").textContent = lifetimeRateVal;
}

function updateHandDisplay() {
    playerCardsArea.innerHTML = '';
    playerHand.forEach(card => playerCardsArea.appendChild(createCardElement(card)));
    playerScoreDisplay.textContent = calculateTotal(playerHand);

    dealerCardsArea.innerHTML = '';
    dealerHand.forEach((card, index) => {
        const isHidden = (index === 1 && !dealerHiddenRevealed);
        dealerCardsArea.appendChild(createCardElement(card, isHidden));
    });

    if (dealerHiddenRevealed) {
        dealerScoreDisplay.textContent = calculateTotal(dealerHand);
    } else {
        dealerScoreDisplay.textContent = cardValue(dealerHand[0]);
    }

    if (playerHand.length === 2 && !isGameOver && playerChips >= selectedBet) {
        doubleDownButton.disabled = false;
        doubleDownButton.style.opacity = "1";
    } else {
        doubleDownButton.disabled = true;
        doubleDownButton.style.opacity = "0.5";
    }
}

function updateKeyDisplay() {
    keySpans.forEach(span => {
        const actionText = span.parentElement.textContent;
        if (actionText.includes('ヒット')) span.textContent = keyBinds.hit.toUpperCase();
        if (actionText.includes('スタンド')) span.textContent = keyBinds.stand.toUpperCase();
        if (actionText.includes('ダブルダウン')) span.textContent = keyBinds.double.toUpperCase();
        if (actionText.includes('設定')) span.textContent = keyBinds.settings === 'Escape' ? 'ESC' : keyBinds.settings.toUpperCase();
        if (actionText.includes('戦績')) span.textContent = keyBinds.stats.toUpperCase(); 
    });
}

function updateGameBackground(theme) {
    const imageMap = {
        green: './画像/green.png',
        pink: './画像/pink.png',
        purple: './画像/purple.png'
    };
    const imagePath = imageMap[theme] || imageMap.green;
    if (gameScreen) {
        gameScreen.style.background = `linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1)), url('${imagePath}') center/cover no-repeat`;
    }
}

// ============ 5. ゲーム進行ロジック ============
function startGame() {
    isGameOver = false;
    dealerHiddenRevealed = false;
    playerNameDisplay.textContent = 'プレイヤー';
    resultOverlay.classList.remove('active');
    if (gameOverOverlay) gameOverOverlay.classList.remove('active');
    
    shuffleDeck();

    playerHand = [randomCard(), randomCard()];
    dealerHand = [randomCard(), randomCard()]; 
    
    updateHandDisplay();
}

function finishGame(result, message, isPureWin = false) {
    isGameOver = true;
    totalGames++;
    lifetimeGames++;

    if (result === "WIN") {
        winCount++;
        lifetimeWins++; 
        
        const firstSuit = playerHand[0].suit;
        const isSameSuit = playerHand.every(card => card.suit === firstSuit);
        const isDoubleDown = selectedBet > lastConfirmedBet;

        let payoutChips = 0; 

        if (isSameSuit && isPureWin) {
            const cardCount = playerHand.length;
            let multiplier = 1;

            if (isDoubleDown) {
                if (cardCount === 2) multiplier = 6;
            } else {
                if (cardCount === 2) multiplier = 2.5;
                else if (cardCount === 3) multiplier = 5;
                else if (cardCount === 4) multiplier = 20;
                else if (cardCount >= 5) multiplier = 100;
            }

            const profit = Math.floor(lastConfirmedBet * multiplier);
            payoutChips = selectedBet + profit;
            message += ` (同じ模様ボーナス！ ${multiplier}倍配当)`;
            
            totalChipsEarned += profit;
            if (profit > maxChipsEarnedSingleGame) {
                maxChipsEarnedSingleGame = profit;
            }
        } else {
            payoutChips = selectedBet * 2;
            
            totalChipsEarned += selectedBet; 
            if (selectedBet > maxChipsEarnedSingleGame) {
                maxChipsEarnedSingleGame = selectedBet;
            }
        }

        playerChips += payoutChips;

    } else if (result === "LOSE") {
        loseCount++;
        lifetimeLoses++; 
        if (playerChips < 0) playerChips = 0;

    } else if (result === "DRAW") {
        drawCount++; 
        lifetimeDraws++; 
        playerChips += selectedBet;
    }
    
    localStorage.setItem('bj_lifetimeGames', lifetimeGames);
    localStorage.setItem('bj_lifetimeWins', lifetimeWins);
    localStorage.setItem('bj_lifetimeLoses', lifetimeLoses);
    localStorage.setItem('bj_lifetimeDraws', lifetimeDraws);

    updateBetDisplay(lastConfirmedBet);
    updateStats();
    setBetMax();
    
    if (playerChips <= 0) {
        const denominator = totalGames - drawCount;
        const rate = denominator === 0 ? 0 : Math.floor((winCount / denominator) * 100);
        
        if (goTotalGames) goTotalGames.textContent = "0";
        if (goWinCount) goWinCount.textContent = "0";
        if (goLoseCount) goLoseCount.textContent = "0";
        if (goWinRate) goWinRate.textContent = "0%";
        if (goTotalEarned) goTotalEarned.textContent = "0";
        if (goMaxEarned) goMaxEarned.textContent = "0";
        
        gameOverOverlay.classList.add('active');

        setTimeout(() => {
            animateValue(goTotalGames, 0, totalGames, 600);
            animateValue(goWinCount, 0, winCount, 600);
            animateValue(goLoseCount, 0, loseCount, 600);
            animateValue(goWinRate, 0, rate, 600, "%");
        }, 300);

        setTimeout(() => {
            animateValue(goTotalEarned, 0, totalChipsEarned, 1200);
            animateValue(goMaxEarned, 0, maxChipsEarnedSingleGame, 1200);
        }, 1000);

    } else {
        resultMessage.textContent = message;
        resultOverlay.classList.add('active');
    }
}

function dealerDrawTurn() {
    let dTotal = calculateTotal(dealerHand);
    
    if (dTotal < 17) {
        dealerHand.push(randomCard());
        updateHandDisplay();
        setTimeout(dealerDrawTurn, 700);
    } else {
        const pTotal = calculateTotal(playerHand);
        let result = "DRAW";
        let message = "";
        let isPureWin = false; 
        
        if (dTotal > 21) { 
            result = "WIN"; 
            message = "ディーラーがバースト！勝ちです。"; 
            isPureWin = true; 
        } else {
            const hasJoker = playerHand.some(card => card.rank === 'JOKER');
            const scoreDiff = dTotal - pTotal;
            const isJokerWinCondition = (scoreDiff >= 0 && scoreDiff <= 3);

            if (hasJoker && isJokerWinCondition) {
                result = "WIN";
                message = `JOKERの効果発動！あなたの勝ちです！`;
                isPureWin = false; 
            } else if (pTotal > dTotal) { 
                result = "WIN"; 
                message = "あなたの勝ち！"; 
                isPureWin = true; 
            } else if (pTotal < dTotal) { 
                result = "LOSE"; 
                message = "あなたの負けです。"; 
            } else { 
                message = "引き分けです。"; 
            }
        }
        
        setTimeout(() => {
            finishGame(result, message, isPureWin);
        }, 500);
    }
}

// ============ 6. イベントリスナー ============
startButton.addEventListener('click', () => {
    startScreen.classList.remove('active');
    bettingScreen.classList.add('active');
    setBetMax();
    updateBetDisplay(lastConfirmedBet);
});

confirmButton.addEventListener('click', () => {
    lastConfirmedBet = selectedBet;
    updateBetDisplay(lastConfirmedBet);
    
    bettingScreen.classList.remove('active');
    gameScreen.classList.add('active');
    playerChips -= selectedBet; 
    startGame();
});

retryButton.addEventListener('click', () => {
    resultOverlay.classList.remove('active');
    gameScreen.classList.remove('active');
    bettingScreen.classList.add('active');
    
    setBetMax();
    updateBetDisplay(lastConfirmedBet);
    
    playerCardsArea.innerHTML = '';
    dealerCardsArea.innerHTML = '';
    playerScoreDisplay.textContent = '--';
    dealerScoreDisplay.textContent = '--';
});

if (restartGameButton) {
    restartGameButton.addEventListener('click', () => {
        gameOverOverlay.classList.remove('active');
        gameScreen.classList.remove('active');
        bettingScreen.classList.add('active');
        
        playerChips = 1000;
        totalGames = 0;
        winCount = 0;
        loseCount = 0;
        drawCount = 0;
        lastConfirmedBet = 100;
        
        totalChipsEarned = 0;
        maxChipsEarnedSingleGame = 0;
        
        updateStats();
        setBetMax();
        updateBetDisplay(100);
        
        playerCardsArea.innerHTML = '';
        dealerCardsArea.innerHTML = '';
        playerScoreDisplay.textContent = '--';
        dealerScoreDisplay.textContent = '--';
    });
}

if (betSlider) {
    betSlider.addEventListener('input', (e) => {
        updateBetDisplay(e.target.value);
    });
}
if (betSpinner) {
    betSpinner.addEventListener('change', (e) => {
        updateBetDisplay(e.target.value);
    });
}

settingsButton.addEventListener('click', () => settingsOverlay.classList.add('active'));
closeSettings.addEventListener('click', () => {
    settingsOverlay.classList.remove('active');
    isAssigningKey = null;
    updateKeyDisplay();
});

tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const targetTab = this.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

bgmSlider.addEventListener('input', function() { bgmValueDisplay.textContent = this.value; });

seSlider.addEventListener('input', function() { seValueDisplay.textContent = this.value; });
designSelect.addEventListener('change', function() { updateGameBackground(this.value); });

seSlider.addEventListener('input', function() { seVolumeValue.textContent = this.value; });


keySpans.forEach(span => {
    span.addEventListener('click', function() {
        keySpans.forEach(s => s.style.background = '#333');
        this.style.background = '#ff8b3d';
        this.textContent = '...';
        const actionText = this.parentElement.textContent;
        if (actionText.includes('ヒット')) isAssigningKey = 'hit';
        else if (actionText.includes('スタンド')) isAssigningKey = 'stand';
        else if (actionText.includes('ダブルダウン')) isAssigningKey = 'double';
        else if (actionText.includes('設定')) isAssigningKey = 'settings';
        else if (actionText.includes('戦績')) isAssigningKey = 'stats'; 
    });
});

window.addEventListener('keydown', function(e) {
    if (isAssigningKey) {
        e.preventDefault();
        keyBinds[isAssigningKey] = e.key;
        isAssigningKey = null;
        updateKeyDisplay();
        return;
    }
    if (e.key === keyBinds.settings) {
        settingsOverlay.classList.toggle('active');
        return;
    }
    if (e.key.toLowerCase() === keyBinds.stats.toLowerCase()) {
        if (statsTab && statsPanel) {
            statsTab.classList.toggle('open');
            statsPanel.classList.toggle('open');
        }
        return;
    }
    if (!settingsOverlay.classList.contains('active') && !isGameOver) {
        if (e.key.toLowerCase() === keyBinds.hit.toLowerCase()) hitButton.click();
        if (e.key.toLowerCase() === keyBinds.stand.toLowerCase()) standButton.click();
        if (e.key.toLowerCase() === keyBinds.double.toLowerCase()) doubleDownButton.click();
    }
});

hitButton.addEventListener('click', function() {
    if (isGameOver) return;
    playerHand.push(randomCard());
    updateHandDisplay();
    if (calculateTotal(playerHand) > 21) {
        isGameOver = true; 
        setTimeout(() => {
            finishGame("LOSE", "バースト！あなたの負けです。", false);
        }, 1000);
    }
});

standButton.addEventListener('click', function() {
    if (isGameOver) return;
    isGameOver = true; 
    dealerHiddenRevealed = true;
    updateHandDisplay();
    setTimeout(dealerDrawTurn, 500);
});

doubleDownButton.addEventListener('click', function() {
    if (isGameOver || playerHand.length !== 2) return;
    
    playerChips -= selectedBet; 
    updateBetDisplay(selectedBet * 2);
    
    playerHand.push(randomCard());
    updateHandDisplay();

    if (calculateTotal(playerHand) > 21) {
        isGameOver = true; 
        setTimeout(() => {
            finishGame("LOSE", "バースト！ダブルダウン失敗...", false);
        }, 1000);
    } else {
        isGameOver = true;
        dealerHiddenRevealed = true;
        updateHandDisplay();
        setTimeout(dealerDrawTurn, 500);
    }
});

if (statsTab && statsPanel) {
    statsTab.addEventListener('click', () => {
        statsTab.classList.toggle('open');   
        statsPanel.classList.toggle('open'); 
    });
}


window.addEventListener("load", () => {
    bgm.volume = bgmSlider.value / 100;
    hitSound.volume = seSlider.value / 100;
    winSound.volume = seSlider.value / 100;

     bgmValue.textContent = bgmSlider.value;
    seValue.textContent = seSlider.value;

});

const bgm = document.getElementById("bgm");
const hitSound = document.getElementById("hitSound");

// ゲーム開始でBGM再生
document.getElementById("startButton").addEventListener("click", () => {
    bgm.play();
});

// ヒット時のSE
document.getElementById("hitButton").addEventListener("click", () => {
    hitSound.currentTime = 0;
    hitSound.play();
});
document.getElementById("doubleDownButton").addEventListener("click", () => {
    doubledownSound.currentTime = 0;
    doubledownSound.play();
});
document.getElementById("standButton").addEventListener("click", () => {
    standSound.currentTime = 0;
    standSound.play();
});

document.getElementById("confirmButton").addEventListener("click", () => {
    confirmSound.currentTime = 0; // 連打しても鳴るように
    confirmSound.play();
});
// BGM音量
bgmSlider.addEventListener("input", () => {
    const volume = bgmSlider.value / 100;
    bgm.volume = volume;
    bgmValue.textContent = bgmSlider.value;
});


// SE音量
seSlider.addEventListener("input", () => {
    const volume = seSlider.value / 100;

    hitSound.volume = volume;
    winSound.volume = volume;
    doubledownSound.volume = volume;
    standSound.volume = volume;
    resultSound.volume = volume;
    seValue.textContent = seSlider.value;
});




const statsTabButtons = document.querySelectorAll('.stats-tab-btn');
const statsTabContents = document.querySelectorAll('.stats-tab-content');
statsTabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const target = this.dataset.statsTab;
        statsTabButtons.forEach(b => b.classList.remove('active'));
        statsTabContents.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        if (target === 'current') {
            document.getElementById('statsContentCurrent').classList.add('active');
        } else {
            document.getElementById('statsContentLifetime').classList.add('active');
        }
    });
});

window.addEventListener('load', () => {
    setBetMax();
    updateBetDisplay(100);
    updateStats();
    updateKeyDisplay();
});

// ==========================================
// 🎰 【追記】ゲームオーバー回数（通算）の管理ロジック
// ==========================================

// 1. ローカルストレージから通算ゲームオーバー回数を取得して変数に格納
let lifetimeGameOvers = Number(localStorage.getItem('bj_lifetimeGameOvers')) || 0;

// 2. ページ読み込み完了時に通算ゲームオーバー回数を画面に表示する
window.addEventListener('load', () => {
    const gameOverElement = document.getElementById('total-gameovers');
    if (gameOverElement) {
        gameOverElement.textContent = lifetimeGameOvers;
    }
});

// 3. 破産チェック（playerChips <= 0）のタイミングを監視してカウントする処理
// 既存の「restartGameButton」のクリックイベントと連動させ、ゲームオーバー画面が出ている状態で
// リスタートが押されたタイミング（＝1回のゲームオーバーから復帰する時）にカウントを確定させます。
if (restartGameButton) {
    restartGameButton.addEventListener('click', () => {
        // チップが0の状態でリスタートボタンが押された場合のみカウントアップ
        if (playerChips === 1000 && isGameOver) {
            lifetimeGameOvers++; // カウントを+1
            localStorage.setItem('bj_lifetimeGameOvers', lifetimeGameOvers); // ローカルストレージに保存
            
            // 画面の表示を更新（HTMLの id="total-gameovers"）
            const gameOverElement = document.getElementById('total-gameovers');
            if (gameOverElement) {
                gameOverElement.textContent = lifetimeGameOvers;
            }
        }
    });
}
    if (designSelect) updateGameBackground(designSelect.value || 'green');
});

