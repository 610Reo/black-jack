// ============ 1. DOM要素の取得 ============
// 画面
const startScreen = document.getElementById('startScreen');
const bettingScreen = document.getElementById('bettingScreen');
const gameScreen = document.getElementById('gameScreen');
const settingsOverlay = document.getElementById('settingsOverlay');

<<<<<<< HEAD
console.log('startButton:', startButton);
console.log('startScreen:', startScreen);
console.log('bettingScreen:', bettingScreen);

=======
// ボタン
const startButton = document.getElementById('startButton');
const confirmButton = document.getElementById('confirmButton');
const settingsButton = document.getElementById('settingsButton');
const closeSettings = document.getElementById('closeSettings');
const hitButton = document.getElementById('hitButton');
const standButton = document.getElementById('standButton');

// 掛け金関連
>>>>>>> 0263aa8323f97f5b060e5bff5369c591a6946708
const betSlider = document.getElementById('betSlider');
const betSpinner = document.getElementById('betSpinner');
const currentBetAmount = document.getElementById('currentBetAmount');

// 音量設定関連
const bgmSlider = document.getElementById('bgmVolume');
const bgmValueDisplay = document.getElementById('bgmVolumeValue');
const seSlider = document.getElementById('seVolume');
const seValueDisplay = document.getElementById('seVolumeValue');

// ゲームプレイ表示関連
const dealerScoreDisplay = document.getElementById('dealerScore');
const playerScoreDisplay = document.getElementById('playerScore');
const playerNameDisplay = document.getElementById('playerName');
const dealerCardsArea = document.querySelector('.dealer-cards');
const playerCardsArea = document.querySelector('.player-cards');

// タブ・キー設定・統計
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

let keyBinds = {
    hit: 'h',
    stand: 's',
    settings: 'Escape'
};

const cardPool = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];

// 統計データ
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
    // プレイヤー側
    playerCardsArea.innerHTML = '';
    playerHand.forEach(card => playerCardsArea.appendChild(createCardElement(card)));
    playerScoreDisplay.textContent = calculateTotal(playerHand);

    // ディーラー側
    dealerCardsArea.innerHTML = '';
<<<<<<< HEAD
    // dealerCardFlipを再追加
    const dealerCardFlip = document.createElement('div');
    dealerCardFlip.className = 'card-flip';
    dealerCardFlip.id = 'dealerCardFlip';
    const dealerCardFront = document.createElement('div');
    dealerCardFront.className = 'card card-face card-front';
    dealerCardFront.id = 'dealerCardFront';
    const dealerCardBack = document.createElement('div');
    dealerCardBack.className = 'card card-face card-back';
    dealerCardBack.id = 'dealerCardBack';
    dealerCardFlip.appendChild(dealerCardFront);
    dealerCardFlip.appendChild(dealerCardBack);
    dealerCardsArea.appendChild(dealerCardFlip);

    // 追加カード表示（3枚目以降）
    for (let i = 2; i < dealerHand.length; i++) {
        dealerCardsArea.appendChild(createCardElement(dealerHand[i]));
    }

    // dealerCardFlipの更新
    const [dealerFirst, dealerHidden] = dealerHand;
    dealerCardFront.textContent = dealerFirst || '表';
    dealerCardBack.textContent = dealerHiddenRevealed ? dealerHidden : '裏';
    dealerCardFlip.classList.toggle('flipped', dealerHiddenRevealed);

    // ディーラースコア表示
    dealerScoreDisplay.textContent = dealerHiddenRevealed ? calculateTotal(dealerHand) : cardValue(dealerHand[0]);
}

function animateCardDraw(card, targetArea, callback) {
    const deckCard = document.querySelector('.deck-card');
    const targetRect = targetArea.getBoundingClientRect();
    const deckRect = deckCard.getBoundingClientRect();

    // 新しいカード要素を作成
    const animatingCard = document.createElement('div');
    animatingCard.className = 'card card-front card-animating';
    animatingCard.textContent = card;
    animatingCard.style.left = deckRect.left + 'px';
    animatingCard.style.top = deckRect.top + 'px';

    // ターゲット位置を計算（最後のカードの位置）
    const existingCards = targetArea.querySelectorAll('.card');
    let targetX = 0;
    let targetY = 0;
    if (existingCards.length > 0) {
        const lastCard = existingCards[existingCards.length - 1];
        const lastRect = lastCard.getBoundingClientRect();
        targetX = lastRect.left - deckRect.left + 120; // 次のカードの位置
        targetY = lastRect.top - deckRect.top;
=======
    dealerHand.forEach((card, index) => {
        const isHidden = (index === 1 && !dealerHiddenRevealed);
        dealerCardsArea.appendChild(createCardElement(card, isHidden));
    });

    if (dealerHiddenRevealed) {
        dealerScoreDisplay.textContent = calculateTotal(dealerHand);
>>>>>>> 0263aa8323f97f5b060e5bff5369c591a6946708
    } else {
        targetX = targetRect.left - deckRect.left;
        targetY = targetRect.top - deckRect.top;
    }

    animatingCard.style.setProperty('--target-x', targetX + 'px');
    animatingCard.style.setProperty('--target-y', targetY + 'px');

    document.body.appendChild(animatingCard);

    // アニメーション終了後にコールバック
    animatingCard.addEventListener('animationend', () => {
        document.body.removeChild(animatingCard);
        callback();
    });
}

function dealerDrawCards() {
    return new Promise((resolve) => {
        let dTotal = calculateTotal(dealerHand);
        if (dTotal >= 17) {
            resolve();
            return;
        }

        const drawNext = () => {
            const newCard = randomCard();
            animateCardDraw(newCard, dealerCardsArea, () => {
                dealerHand.push(newCard);
                updateHandDisplay();
                dTotal = calculateTotal(dealerHand);
                if (dTotal < 17) {
                    drawNext();
                } else {
                    resolve();
                }
            });
        };
        drawNext();
    });
}

function updateKeyDisplay() {
    keySpans.forEach(span => {
        const actionText = span.parentElement.textContent;
        if (actionText.includes('ヒット')) span.textContent = keyBinds.hit.toUpperCase();
        if (actionText.includes('スタンド')) span.textContent = keyBinds.stand.toUpperCase();
        if (actionText.includes('設定')) span.textContent = keyBinds.settings === 'Escape' ? 'ESC' : keyBinds.settings.toUpperCase();
        span.style.cursor = 'pointer';
    });
}

// ============ 5. ゲーム進行ロジック ============

function startGame(betAmount) {
    console.log('ゲーム開始。掛け金: ¥' + betAmount);
    isGameOver = false;
    dealerHiddenRevealed = false;
    playerNameDisplay.textContent = 'プレイヤー';
    
    playerHand = [randomCard(), randomCard()];
    dealerHand = [randomCard(), randomCard()]; 
    
    updateHandDisplay();
}

<<<<<<< HEAD
// ============ 5. イベントリスナー ============

hitButton.addEventListener('click', function() {
    if (isGameOver) return;
    if (playerHand.length >= 5) return alert('5枚が上限です');

    const newCard = randomCard();
    animateCardDraw(newCard, playerCardsArea, () => {
        playerHand.push(newCard);
        updateHandDisplay();

        if (calculateTotal(playerHand) > 21) {
            alert('バースト！あなたの負けです。');
            isGameOver = true;
        }
    });
});

standButton.addEventListener('click', async function() {
    if (isGameOver) return;
=======
function finishGame(result) {
    isGameOver = true;
    totalGames++;
    if (result === "WIN") winCount++;
    if (result === "LOSE") loseCount++;
>>>>>>> 0263aa8323f97f5b060e5bff5369c591a6946708
    
    updateStats();
}

<<<<<<< HEAD
    // ディーラーの思考ロジック（17以上になるまで引く）
    await dealerDrawCards();

    const pTotal = calculateTotal(playerHand);
    const dTotal = calculateTotal(dealerHand);
    
    setTimeout(() => {
        if (dTotal > 21) {
            alert(`ディーラーがバースト（${dTotal}）。あなたの勝ちです！`);
        } else if (pTotal > dTotal) {
            alert(`あなたの勝ち！ (Player: ${pTotal} / Dealer: ${dTotal})`);
        } else if (pTotal < dTotal) {
            alert(`あなたの負けです。 (Player: ${pTotal} / Dealer: ${dTotal})`);
        } else {
            alert(`引き分け (Push) です。 (Score: ${pTotal})`);
        }
        isGameOver = true;
    }, 300);
});

betSlider.addEventListener('input', function() {
    betSpinner.value = this.value;
    currentBetAmount.textContent = this.value;
});

betSpinner.addEventListener('input', function() {
    betSlider.value = this.value;
    currentBetAmount.textContent = this.value;
});

bgmSlider.addEventListener('input', function() {
    bgmValueDisplay.textContent = this.value;
});

seSlider.addEventListener('input', function() {
    seValueDisplay.textContent = this.value;
});
=======
// ============ 6. イベントリスナーの登録 ============
>>>>>>> 0263aa8323f97f5b060e5bff5369c591a6946708

// --- 画面遷移 ---
startButton.addEventListener('click', () => {
    console.log('startButton clicked');
    startScreen.classList.remove('active');
    bettingScreen.classList.add('active');
});

confirmButton.addEventListener('click', () => {
    bettingScreen.classList.remove('active');
    gameScreen.classList.add('active');
    startGame(betSpinner.value);
});

// --- 掛け金操作 ---
[betSlider, betSpinner].forEach(el => {
    el.addEventListener('input', (e) => updateBetDisplay(e.target.value));
});

// --- 設定関連 ---
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

// --- キーバインド設定 ---
keySpans.forEach(span => {
    span.addEventListener('click', function() {
        keySpans.forEach(s => s.style.background = '#333');
        this.style.background = '#ff8b3d';
        this.textContent = '...';
        
        const actionText = this.parentElement.textContent;
        if (actionText.includes('ヒット')) isAssigningKey = 'hit';
        else if (actionText.includes('スタンド')) isAssigningKey = 'stand';
        else if (actionText.includes('設定')) isAssigningKey = 'settings';
    });
});

// --- キーボード入力 ---
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
    }
});

// --- ヒット・スタンド動作 ---
hitButton.addEventListener('click', function() {
    if (isGameOver) return;
    if (playerHand.length >= 5) return alert('5枚が上限です');

    playerHand.push(randomCard());
    updateHandDisplay();

    if (calculateTotal(playerHand) > 21) {
        alert('バースト！あなたの負けです。');
        finishGame("LOSE");
    }
});

standButton.addEventListener('click', function() {
    if (isGameOver) return;
    
    dealerHiddenRevealed = true;
    
    // ディーラーの思考ロジック
    let dTotal = calculateTotal(dealerHand);
    while (dTotal < 17) {
        dealerHand.push(randomCard());
        dTotal = calculateTotal(dealerHand);
    }
    updateHandDisplay();

    const pTotal = calculateTotal(playerHand);
    
    setTimeout(() => {
        let result = "DRAW";
        if (dTotal > 21) {
            alert(`ディーラーがバースト（${dTotal}）。あなたの勝ちです！`);
            result = "WIN";
        } else if (pTotal > dTotal) {
            alert(`あなたの勝ち！ (${pTotal} vs ${dTotal})`);
            result = "WIN";
        } else if (pTotal < dTotal) {
            alert(`あなたの負けです。 (${pTotal} vs ${dTotal})`);
            result = "LOSE";
        } else {
            alert(`引き分け (Push) です。 (Score: ${pTotal})`);
        }
        finishGame(result);
    }, 300);
});

// 戦績パネルの開閉
if (statsTab) {
    statsTab.addEventListener('click', () => statsPanel?.classList.toggle('open'));
}

// ============ 7. 初期化実行 ============
window.addEventListener('load', () => {
    console.log('ブラックジャック - 初期化完了');
    updateBetDisplay(100);
    updateStats();
    updateKeyDisplay();
});