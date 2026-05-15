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
let lastConfirmedBet = 100; // 確定した時の賭け金を保存する変数

let keyBinds = {
    hit: 'h',
    stand: 's',
    double: 'd',
    settings: 'Escape'
};

const cardPool = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
let totalGames = 0;
let winCount = 0;
let loseCount = 0;

// ============ 3. ヘルパー関数 ============
function randomCard() {
    return cardPool[Math.floor(Math.random() * cardPool.length)];
}

function cardValue(card) {
    if (card === 'J' || card === 'Q' || card === 'K') return 10;
    if (card === 'A') return 11;
    return Number(card);
}

function calculateTotal(hand) {
    let total = hand.reduce((sum, card) => sum + cardValue(card), 0);
    let aceCount = hand.filter(card => card === 'A').length;
    while (total > 21 && aceCount > 0) {
        total -= 10;
        aceCount -= 1;
    }
    return total;
}

function createCardElement(card, isHidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = isHidden ? 'card card-back' : 'card card-front';
    cardDiv.textContent = isHidden ? '?' : card;
    return cardDiv;
}

// ============ 4. UI更新ロジック ============
function updateBetDisplay(value) {

    selectedBet = Number(value);
    betSlider.value = selectedBet;
    betSpinner.value = selectedBet;
    currentBetAmount.textContent = selectedBet;
    if (currentBetPill) currentBetPill.textContent = selectedBet;
}

function updateChipsDisplay() {
    playerChipsDisplay.textContent = playerChips;

    betSlider.value = value;
    betSpinner.value = value;
    currentBetAmount.textContent = value;

}

function updateStats() {
    const rate = totalGames === 0 ? 0 : Math.floor((winCount / totalGames) * 100);
    document.getElementById("totalGames").textContent = totalGames;
    document.getElementById("winCount").textContent = winCount;
    document.getElementById("loseCount").textContent = loseCount;
    document.getElementById("winRate").textContent = rate;
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

    if (playerHand.length === 2 && !isGameOver) {
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
    });
}

// ============ 5. ゲーム進行ロジック ============
function startGame(betAmount) {
    isGameOver = false;
    dealerHiddenRevealed = false;
    playerNameDisplay.textContent = 'プレイヤー';
    resultOverlay.classList.remove('active');
    
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
    }
    if (result === "LOSE") {
        loseCount++;
        if (playerChips - selectedBet < 0) {
            playerChips = 0;
        } else {
            playerChips -= selectedBet;
        }
    }
    updateStats();
    updateChipsDisplay();
}

function dealerAction() {
    dealerHiddenRevealed = true;
    
    // ディーラーの思考ロジック
    let dTotal = calculateTotal(dealerHand);
    while (dTotal < 17) {
        dealerHand.push(randomCard());
        dTotal = calculateTotal(dealerHand);
    }
    updateHandDisplay();
    return dTotal;
}

function determineWinner(dealerTotal, playerTotal) {
    setTimeout(() => {
        let result = "";
        if (dealerTotal > 21) {
            alert(`ディーラーがバースト（${dealerTotal}）。あなたの勝ちです！`);
            result = "WIN";
        } else if (playerTotal > dealerTotal) {
            alert(`あなたの勝ち！ (${playerTotal} vs ${dealerTotal})`);
            result = "WIN";
        } else if (playerTotal < dealerTotal) {
            alert(`あなたの負けです。 (${playerTotal} vs ${dealerTotal})`);
            result = "LOSE";
        } else {
            alert(`引き分け (Push) です。 (Score: ${playerTotal})`);
            result = "DRAW";
        }
        finishGame(result);
    }, 300);
}



// ============ 6. イベントリスナーの登録 ============


    if (result === "WIN") winCount++;
    if (result === "LOSE") loseCount++;
    updateStats();

    setTimeout(() => {
        resultMessage.textContent = message;
        resultOverlay.classList.add('active');
    }, 500);


// ============ 6. イベントリスナー ============
startButton.addEventListener('click', () => {
    startScreen.classList.remove('active');
    bettingScreen.classList.add('active');
});

confirmButton.addEventListener('click', () => {
    lastConfirmedBet = Number(betSpinner.value); // 確定時の額を保存
    bettingScreen.classList.remove('active');
    gameScreen.classList.add('active');

    startGame(selectedBet);

    startGame(lastConfirmedBet);
});

retryButton.addEventListener('click', () => {
    resultOverlay.classList.remove('active');
    gameScreen.classList.remove('active');
    bettingScreen.classList.add('active');
    
    // 【重要】ダブルダウンで増えた額をリセットし、最後に確定した時の額に戻す
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
    if (calculateTotal(playerHand) > 21) finishGame("LOSE", "バースト！あなたの負けです。");
});

standButton.addEventListener('click', function() {
    if (isGameOver) return;
    
    const dealerTotal = dealerAction();
    const playerTotal = calculateTotal(playerHand);
    
    determineWinner(dealerTotal, playerTotal);

    dealerHiddenRevealed = true;
    let dTotal = calculateTotal(dealerHand);
    while (dTotal < 17) {
        dealerHand.push(randomCard());
        dTotal = calculateTotal(dealerHand);
    }
    updateHandDisplay();
    const pTotal = calculateTotal(playerHand);
    setTimeout(() => {
        let result = "DRAW";
        let message = "";
        if (dTotal > 21) { result = "WIN"; message = "ディーラーがバースト！勝ちです。"; }
        else if (pTotal > dTotal) { result = "WIN"; message = "あなたの勝ち！"; }
        else if (pTotal < dTotal) { result = "LOSE"; message = "あなたの負けです。"; }
        else { message = "引き分けです。"; }
        finishGame(result, message);
    }, 300);

});

doubleDownButton.addEventListener('click', function() {
    if (isGameOver || playerHand.length !== 2) return;
    
    // 表示上の賭け金を2倍にする（実際の勝負用）
    let currentBet = Number(betSpinner.value);
    updateBetDisplay(currentBet * 2);

    playerHand.push(randomCard());
    updateHandDisplay();

    if (calculateTotal(playerHand) > 21) {
        finishGame("LOSE", "バースト！ダブルダウン失敗...");
    } else {
        standButton.click();
    }
});

if (statsTab) {
    statsTab.addEventListener('click', () => statsPanel?.classList.toggle('open'));
}

window.addEventListener('load', () => {
    updateBetDisplay(100);
    updateStats();
    updateKeyDisplay();
});