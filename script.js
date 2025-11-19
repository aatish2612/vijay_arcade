/* FICHIER: script.js */

// --- VARIABLES ---
let players = [];
let currentPlayerIndex = 0;
let currentGameMode = "";
let currentQuestionList = [];
let currentQuestion = null;
let timerInterval = null;
let timeLeft = 20;
let isGameActive = false;
let isRouletteMode = true; // Par défaut: Mode Roulette activé

// Données de l'intro
const introSlides = [
    { title: "MESSAGE AUX FANS", text: "Salut les NANBA'S et NANBI'S ! Préparez-vous à tester vos connaissances sur l'univers de THALAPATHY, et bien plus encore ! Ce jeu est un hommage à notre passion commune." },
    { title: "LE DÉFI SUPRÊME", text: "J'ai créé ce jeu pour voir qui est le VRAI fan, celui qui maîtrise tout, des punchlines aux musiques, en passant par les films cachés derrière des émojis. Mais pas de panique, c'est aussi pour tous les amoureux du cinéma indien et des défis funs !" },
    { title: "RÈGLES DU GAME", text: "Chaque bonne réponse vous rapporte des points ! Soyez rapides : répondez en moins de 10 secondes pour gagner 2 points. Si vous êtes un peu plus lents (entre 10 et 1 seconde restante), c'est 1 point. Si le temps est écoulé ou que la réponse est fausse, c'est 0 point, mais on vous montrera la bonne réponse pour apprendre !\n\n💡 NOUVEAU : Utilisez l'interrupteur dans le menu pour choisir entre le hasard (Roulette) ou choisir votre jeu (Mode Manuel)." },
    { title: "PRÊTS AU COMBAT ?", text: "On va voir qui sera le plus fort, le véritable 'Master' de cette Arcade ! Donc ne décevez pas la communauté... montrez votre talent et votre passion !" },
    { title: "BONNE CHANCE !", text: "Que les meilleurs gagnent et que le fun soit avec vous ! THERIII BABYYYY... 🔥" }
];
let currentSlideIndex = 0;
let slideTimer = null;

// ==========================================
// 1. SETUP & INTRO
// ==========================================

function showSetup() { switchScreen('setup-count'); }

function generateNameInputs() {
    const count = document.getElementById('player-count-input').value;
    const container = document.getElementById('names-container');
    container.innerHTML = "";
    for(let i=0; i<count; i++) {
        const input = document.createElement('input');
        input.type = "text"; input.placeholder = `Joueur ${i+1}`; input.id = `player-name-${i}`;
        container.appendChild(input);
    }
    switchScreen('setup-names');
}

function startIntroSequence() {
    players = [];
    const inputs = document.querySelectorAll('#names-container input');
    inputs.forEach(input => {
        let name = input.value.trim() || "Anonyme";
        players.push({ name: name, score: 0 });
    });

    document.getElementById('story-modal').classList.remove('hidden');
    currentSlideIndex = 0;
    showSlide(0, true);
}

function showSlide(index, autoPlay = false) {
    clearTimeout(slideTimer);
    
    if(index < 0) index = 0;
    if(index >= introSlides.length) { finishIntro(); return; }
    
    currentSlideIndex = index;
    const titleEl = document.getElementById('story-title');
    const textEl = document.getElementById('story-text');
    
    titleEl.style.opacity = 0;
    textEl.style.opacity = 0;
    
    setTimeout(() => {
        titleEl.innerText = introSlides[index].title;
        textEl.innerText = introSlides[index].text;
        titleEl.style.opacity = 1;
        textEl.style.opacity = 1;
    }, 200);

    if(autoPlay) {
        slideTimer = setTimeout(() => nextSlide(true), 8000);
    }
}

function nextSlide(auto = false) { showSlide(currentSlideIndex + 1, auto); }
function prevSlide() { showSlide(currentSlideIndex - 1, false); }

function finishIntro() {
    clearTimeout(slideTimer);
    document.getElementById('story-modal').classList.add('hidden');
    switchScreen('home-menu');
    updateTurnIndicator();
    updateMiniScores();
    updateGameModeUI(); 
}

// ==========================================
// 2. GESTION DES MODES (C'est ici que je corrige)
// ==========================================

function toggleGameMode() {
    isRouletteMode = !isRouletteMode;
    updateGameModeUI();
}

function updateGameModeUI() {
    const btn = document.getElementById('mode-toggle-btn');
    const spinBtn = document.getElementById('spin-btn');
    const cards = document.querySelectorAll('.game-card');

    if (isRouletteMode) {
        // Mode ROULETTE (Vert)
        btn.className = "mode-btn green-mode";
        btn.innerText = "🟢 ROULETTE ACTIVÉE";
        
        spinBtn.classList.remove('hidden');
        cards.forEach(c => {
            c.classList.add('disabled-card');
            c.classList.remove('manual-active');
            c.style.cursor = "not-allowed"; // Force le curseur bloqué
        });
    } else {
        // Mode MANUEL (Rouge)
        btn.className = "mode-btn red-mode";
        btn.innerText = "🔴 MODE MANUEL";
        
        spinBtn.classList.add('hidden');
        cards.forEach(c => {
            c.classList.remove('disabled-card');
            c.classList.add('manual-active');
            c.style.cursor = "pointer"; // Force le curseur main
        });
    }
}

// LA FONCTION QUI MANQUAIT OU ÉTAIT MAL NOMMÉE :
function manualSelectGame(gameId) {
    // On ne lance le jeu que si on est PAS en mode roulette
    if (!isRouletteMode) {
        startGame(gameId);
    } else {
        // Petit effet visuel pour dire "Non"
        const btn = document.getElementById('spin-btn');
        btn.style.transform = "scale(1.1)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
    }
}

// ==========================================
// 3. ROULETTE RUSSE
// ==========================================

function spinTheWheel() {
    if (!isRouletteMode) return;

    const games = ['blindtest', 'punch', 'emoji'];
    const cards = {
        'blindtest': document.getElementById('card-blindtest'),
        'punch': document.getElementById('card-punch'),
        'emoji': document.getElementById('card-emoji')
    };
    const btn = document.getElementById('spin-btn');
    const msg = document.getElementById('roulette-msg');

    btn.disabled = true;
    msg.innerText = "La roue tourne...";
    
    const winnerIndex = Math.floor(Math.random() * 3);
    const winnerKey = games[winnerIndex];
    let steps = (4 * 3) + winnerIndex; 
    
    let currentStep = 0;
    let activeIndex = 0;
    let speed = 100;

    const cycle = () => {
        Object.values(cards).forEach(c => c.classList.remove('roulette-active', 'roulette-winner'));
        cards[games[activeIndex]].classList.add('roulette-active');

        activeIndex = (activeIndex + 1) % 3;
        currentStep++;

        if (currentStep <= steps) {
            if (currentStep > steps - 5) speed += 50;
            setTimeout(cycle, speed);
        } else {
            Object.values(cards).forEach(c => c.classList.remove('roulette-active'));
            cards[winnerKey].classList.add('roulette-winner');
            
            let cleanName = winnerKey.toUpperCase().replace('BLINDTEST', 'MASTER BEAT');
            msg.innerText = `Jeu choisi : ${cleanName} !`;
            
            setTimeout(() => {
                startGame(winnerKey);
                cards[winnerKey].classList.remove('roulette-winner');
                btn.disabled = false;
                msg.innerText = "";
            }, 1500);
        }
    };
    cycle();
}

// ==========================================
// 4. MOTEUR DE JEU
// ==========================================

function startGame(mode) {
    currentGameMode = mode;
    isGameActive = true;
    
    let sourceData = [];
    if(mode === 'blindtest') sourceData = [...songsData];
    if(mode === 'punch') sourceData = [...punchesData];
    if(mode === 'emoji') sourceData = [...emojiData];
    
    currentQuestionList = sourceData.sort(() => Math.random() - 0.5);
    
    document.getElementById('game-bar').classList.remove('hidden');
    switchScreen('game-' + mode);
    nextTurn(true);
}

function nextTurn(isFirstTurn = false) {
    document.querySelectorAll('.action-btn').forEach(b => {
        if(b.id.includes('next-btn')) b.classList.add('hidden');
    });
    document.querySelectorAll('.feedback-text').forEach(f => f.innerText = "");

    if(!isFirstTurn) {
        currentPlayerIndex++;
        if(currentPlayerIndex >= players.length) currentPlayerIndex = 0;
    }

    if(currentQuestionList.length === 0) {
        alert("Jeu terminé ! Retour au menu.");
        goHome();
        return;
    }

    currentQuestion = currentQuestionList.pop();
    updateTurnIndicator();
    startTimer();

    if(currentGameMode === 'blindtest') loadBlindTest();
    if(currentGameMode === 'punch') loadPunch();
    if(currentGameMode === 'emoji') loadEmoji();
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 20;
    const timerEl = document.getElementById('timer-circle');
    timerEl.innerText = timeLeft;
    timerEl.classList.remove('timer-danger');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if(timeLeft <= 10) timerEl.classList.add('timer-danger');
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

function handleTimeOut() {
    const feedback = document.querySelector(`#game-${currentGameMode} .feedback-text`);
    let correctAnswer = "";
    
    if(currentGameMode === 'blindtest') correctAnswer = currentQuestion.title;
    if(currentGameMode === 'punch') correctAnswer = currentQuestion.movie;
    if(currentGameMode === 'emoji') correctAnswer = currentQuestion.answer;

    feedback.innerText = `⏱ TROP TARD ! Réponse : ${correctAnswer}`;
    feedback.style.color = "white";
    revealNextButton();
}

// ==========================================
// 5. LOGIQUE JEUX
// ==========================================

let audioPlayer = null;

function loadBlindTest() {
    if(audioPlayer) audioPlayer.pause();
    audioPlayer = new Audio('assets/songs/' + currentQuestion.file);
    document.getElementById('play-btn').onclick = () => audioPlayer.play();
    
    const container = document.getElementById('bt-options');
    container.innerHTML = "";
    
    let options = [currentQuestion];
    while(options.length < 4) {
        let r = songsData[Math.floor(Math.random() * songsData.length)];
        if(!options.some(o => o.id === r.id)) options.push(r);
    }
    options.sort(() => Math.random() - 0.5);

    options.forEach(s => {
        let btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = s.title;
        btn.onclick = () => checkBlindTestAnswer(s.id, btn, currentQuestion.title);
        container.appendChild(btn);
    });
}

function checkBlindTestAnswer(selectedId, btn, correctTitle) {
    const isCorrect = (selectedId === currentQuestion.id);
    handleAnswer(isCorrect, btn, correctTitle);
}

function loadPunch() {
    document.getElementById('quote-text').innerText = `"${currentQuestion.text}"`;
    const container = document.getElementById('punch-options');
    container.innerHTML = "";
    
    const allM = [...new Set(songsData.map(s => s.movie))];
    let options = [currentQuestion.movie];
    while(options.length < 4) {
        let m = allM[Math.floor(Math.random() * allM.length)];
        if(!options.includes(m) && m !== currentQuestion.movie) options.push(m);
    }
    options.sort(() => Math.random() - 0.5);

    options.forEach(m => {
        let btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = m;
        btn.onclick = () => handleAnswer(m === currentQuestion.movie, btn, currentQuestion.movie);
        container.appendChild(btn);
    });
}

function loadEmoji() {
    document.getElementById('emoji-display').innerText = currentQuestion.emojis;
    document.getElementById('user-guess').value = "";
}

function submitEmojiAnswer() {
    const input = document.getElementById('user-guess');
    const val = input.value.trim().toLowerCase();
    const correct = currentQuestion.answer.toLowerCase();
    handleAnswer(val === correct, null, currentQuestion.answer);
}

// ==========================================
// 6. GESTION RÉPONSES
// ==========================================

function handleAnswer(isCorrect, btnElement, correctText) {
    clearInterval(timerInterval);
    if(audioPlayer) audioPlayer.pause();

    const feedback = document.querySelector(`#game-${currentGameMode} .feedback-text`);
    let points = 0;

    if (isCorrect) {
        points = timeLeft > 10 ? 2 : 1;
        feedback.innerText = `EXCELLENT ! +${points} Pts`;
        feedback.style.color = "#2ecc71";
        if(btnElement) btnElement.classList.add('correct');
        players[currentPlayerIndex].score += points;
    } else {
        feedback.innerText = `NON ! La réponse était : ${correctText}`;
        feedback.style.color = "#e74c3c";
        if(btnElement) btnElement.classList.add('wrong');
    }

    updateMiniScores();
    revealNextButton();
}

function revealNextButton() {
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    const btnId = currentGameMode === 'blindtest' ? 'next-btn-bt' : 
                  currentGameMode === 'punch' ? 'next-btn-punch' : 'next-btn-emoji';
    document.getElementById(btnId).classList.remove('hidden');
}

function switchScreen(screenId) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('active-screen');
}

function updateTurnIndicator() {
    const name = players[currentPlayerIndex].name;
    document.getElementById('current-player-span').innerText = name;
    document.querySelectorAll('.current-player-name').forEach(el => el.innerText = name);
    updateMiniScores();
}

function updateMiniScores() {
    const div = document.getElementById('mini-scores');
    div.innerHTML = players.map((p, i) => 
        `<span style="margin:5px; padding:5px; border:1px solid #555; border-radius:5px; ${i===currentPlayerIndex ? 'color:var(--primary-color); border-color:var(--primary-color);' : ''}">${p.name}: ${p.score}</span>`
    ).join('');
}

function managePlayers(action) {
    if(action === 'add') document.getElementById('modal-add-player').classList.remove('hidden');
    if(action === 'remove') {
        const list = document.getElementById('remove-list');
        list.innerHTML = players.map((p, i) => `<button class="themed-btn" onclick="removePlayer(${i})" style="margin:5px; width:100%;">❌ ${p.name}</button>`).join('');
        document.getElementById('modal-remove-player').classList.remove('hidden');
    }
}

function confirmAddPlayer() {
    const name = document.getElementById('new-player-name').value.trim() || "Nouveau";
    players.push({name: name, score: 0});
    closeModal(); updateMiniScores();
}

function removePlayer(index) {
    players.splice(index, 1);
    if(currentPlayerIndex >= players.length) currentPlayerIndex = 0;
    closeModal(); updateTurnIndicator();
}

function closeModal() { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); }

function goHome() {
    isGameActive = false; clearInterval(timerInterval);
    if(audioPlayer) audioPlayer.pause();
    document.getElementById('game-bar').classList.add('hidden');
    switchScreen('home-menu');
    // On remet l'UI à jour en revenant au menu
    updateGameModeUI();
}

function showLeaderboard() {
    switchScreen('leaderboard-screen');
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = [...players].sort((a,b) => b.score - a.score).map((p, i) => 
        `<tr><td>${i===0?'👑':i+1}</td><td>${p.name}</td><td>${p.score}</td></tr>`
    ).join('');
}