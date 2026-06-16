// ============ 1. DOM要素の取得 ============
const startScreen = document.getElementById('startScreen');
const bettingScreen = document.getElementById('bettingScreen');
const gameScreen = document.getElementById('gameScreen');
const settingsOverlay = document.getElementById('settingsOverlay');
const resultOverlay = document.getElementById('resultOverlay');

const startButton = document.getElementById('startButton');
const confirmButton = document.getElementById('confirmButton');
const settingsButton = document.getElementById('settingsButton');
const closeSettings = document.getElementById('closeSettings');
const hitButton = document.getElementById('hitButton');
const standButton = document.getElementById('standButton');
const doubleDownButton = document.getElementById('doubleDownButton');
const retryButton = document.getElementById('retryButton');

const betSlider = document.getElementById('betSlider');
const betSpinner = document.getElementById('betSpinner');
const currentBetAmount = document.getElementById('currentBetAmount');

const bgmSlider = document.getElementById('bgmVolume');
const bgmValueDisplay = document.getElementById('bgmVolumeValue');
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
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const cardPool = [];        // マスターデッキ（54枚の雛形）
const randomCardPool = [];  // 実際にゲームで使用する山札（シャッフル後）

// 52枚の通常カードを生成
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

// ジョーカー2枚を追加 (値は0)
const jokerTypes = [
    { suit: 'color', rank: 'JOKER', value: 0, display: '🃏JOKER' },
    { suit: 'black', rank: 'JOKER', value: 0, display: '🖤JOKER' }
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

// ============ 3. ヘルパー関数 ============
// 山札をシャッフルする関数
function shuffleDeck() {
    randomCardPool.length = 0; // 一度空にする
    const availableCards = cardPool.map(card => ({ ...card })); // コピーを作成

    for (let i = availableCards.length; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const [selectedCard] = availableCards.splice(randomIndex, 1);
        randomCardPool.push(selectedCard);
    }
    return randomCardPool;
}

// 山札からカードを1枚引く関数（無くなったら自動で再シャッフル）
function randomCard() {
    if (randomCardPool.length === 0) {
        shuffleDeck();
    }
    return randomCardPool.pop();
}

// カードの数値を返す関数
function cardValue(card) {
    if (typeof card === 'object' && card !== null) {
        return card.value ?? 0;
    }
    return 0; // 万が一のためのセーフティ
}

// 手札の合計値を計算する関数（Aのケアを含む）
function calculateTotal(hand) {
    let total = hand.reduce((sum, card) => sum + cardValue(card), 0);
    let aceCount = hand.filter(card => card.rank === 'A').length;
    
    while (total > 21 && aceCount > 0) {
        total -= 10;
        aceCount -= 1;
    }
    return total;
}

// カードのHTML要素を生成する関数
function createCardElement(card, isHidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = isHidden ? 'card card-back' : 'card card-front';
    cardDiv.textContent = isHidden ? '?' : card.display;
    return cardDiv;
}

// ============ 4. UI更新ロジック ============
function setBetMax() {
    const minBet = Number(betSlider.min);
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
    const minBet = Number(betSlider.min);
    const maxBet = Number(betSlider.max);
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
    const minBet = Number(betSlider.min);
    const maxBet = Number(betSlider.max);
    return Math.max(minBet, Math.min(maxBet, Number(value)));
}

function updateBetDisplay(value) {
    selectedBet = clampBet(value);
    betSlider.value = selectedBet;
    betSpinner.value = selectedBet;
    currentBetAmount.textContent = selectedBet;
    if (currentBetPill) currentBetPill.textContent = selectedBet;
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

    if (playerHand.length === 2 && !isGameOver && playerChips >= selectedBet * 2) {
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

// ============ 5. ゲーム進行ロジック ============
function startGame() {
    isGameOver = false;
    dealerHiddenRevealed = false;
    playerNameDisplay.textContent = 'プレイヤー';
    resultOverlay.classList.remove('active');
    
    // 毎ゲーム開始時に新しく山札を構築・シャッフルする
    shuffleDeck();

    playerHand = [randomCard(), randomCard()];
    dealerHand = [randomCard(), randomCard()]; 
    
    updateHandDisplay();
}

function finishGame(result, message) {
    isGameOver = true;
    totalGames++;

    if (result === "WIN") {
        winCount++;
        playerChips += selectedBet;
    } else if (result === "LOSE") {
        loseCount++;
        playerChips = Math.max(0, playerChips - selectedBet);
    } else if (result === "DRAW") {
        drawCount++; 
    }
    
    // 勝敗が決まり、チップ処理が終わったら、ダブルダウンで2倍になったselectedBetを元の確定額に戻す
    updateBetDisplay(lastConfirmedBet);

    updateStats();
    setBetMax();
    
    resultMessage.textContent = message;
    resultOverlay.classList.add('active');
}

// ディーラーが17以上になるまで、時間差（0.7秒）で1枚ずつカードを引く演出用関数
function dealerDrawTurn() {
    let dTotal = calculateTotal(dealerHand);
    
    if (dTotal < 17) {
        // 17未満なら山札からカードを1枚追加し、画面を更新して0.7秒後に自分自身を再度呼び出す
        dealerHand.push(randomCard());
        updateHandDisplay();
        setTimeout(dealerDrawTurn, 700);
    } else {
        // 17以上（またはバースト）になったら、最終的な勝敗判定をしてゲーム終了
        const pTotal = calculateTotal(playerHand);
        
        let result = "DRAW";
        let message = "";
        
        if (dTotal > 21) { 
            result = "WIN"; 
            message = "ディーラーがバースト！勝ちです。"; 
        } else if (pTotal > dTotal) { 
            result = "WIN"; 
            message = "あなたの勝ち！"; 
        } else if (pTotal < dTotal) { 
            result = "LOSE"; 
            message = "あなたの負けです。"; 
        } else { 
            message = "引き分けです。"; 
        }
        
        // 最後のカードが引かれてから、結果画面が出るまで少しだけ余韻（0.5秒）を持たせる
        setTimeout(() => {
            finishGame(result, message);
        }, 500);
    }
}

// ============ 6. イベントリスナー ============
startButton.addEventListener('click', () => {
    startScreen.classList.remove('active');
    bettingScreen.classList.add('active');
});

confirmButton.addEventListener('click', () => {
    lastConfirmedBet = Number(betSpinner.value);
    updateBetDisplay(lastConfirmedBet);
    
    bettingScreen.classList.remove('active');
    gameScreen.classList.add('active');

    startGame();
});

retryButton.addEventListener('click', () => {
    resultOverlay.classList.remove('active');
    gameScreen.classList.remove('active');
    bettingScreen.classList.add('active');
    
    updateBetDisplay(lastConfirmedBet);
    
    playerCardsArea.innerHTML = '';
    dealerCardsArea.innerHTML = '';
    playerScoreDisplay.textContent = '--';
    dealerScoreDisplay.textContent = '--';
});

[betSlider, betSpinner].forEach(el => {
    el.addEventListener('input', (e) => updateBetDisplay(e.target.value));
});

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
            finishGame("LOSE", "バースト！あなたの負けです。");
        }, 1000);
    }
});

standButton.addEventListener('click', function() {
    if (isGameOver) return;
    isGameOver = true; // 連打による二重呼び出しを防止
    dealerHiddenRevealed = true;
    updateHandDisplay();
    
    // 0.5秒後に時間差ドロー関数（dealerDrawTurn）をスタート
    setTimeout(dealerDrawTurn, 500);
});

doubleDownButton.addEventListener('click', function() {
    if (isGameOver || playerHand.length !== 2) return;
    
    let currentBet = Number(betSpinner.value);
    updateBetDisplay(currentBet * 2);

    playerHand.push(randomCard());
    updateHandDisplay();

    if (calculateTotal(playerHand) > 21) {
        isGameOver = true; 
        setTimeout(() => {
            finishGame("LOSE", "バースト！ダブルダウン失敗...");
        }, 1000);
    } else {
        // バーストしていなければ、ヒットボタンのように「もう一度判断」をさせず強制的にスタンド扱いにする
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

window.addEventListener('load', () => {
    setBetMax();
    updateBetDisplay(100);
    updateStats();
    updateKeyDisplay();
});