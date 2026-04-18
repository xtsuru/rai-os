/**
 * Rai OS - Applications Logic
 */

// 1. Store Logic
const appRegistry = {
    'store': { id: 'store', name: '라이 스토어', logoClass: 'rai-store-logo', logoChar: 'L', type: 'free' },
    'settings': { id: 'settings', name: '라이 설정', logoClass: 'rai-settings-logo', logoChar: 'S', type: 'free' },
    'tutorial': { id: 'tutorial', name: '라이 튜토리얼', logoClass: 'rai-tutorial-logo', logoChar: '?', type: 'free' },
    'notepad': { id: 'notepad', name: '라이 메모장', logoClass: 'rai-notepad-logo', logoChar: 'N', type: 'free' },
    'timer': { id: 'timer', name: '라이 타이머', logoClass: 'rai-timer-logo', logoChar: 'T', type: 'free' },
    'alarm': { id: 'alarm', name: '라이 알람', logoClass: 'rai-alarm-logo', logoChar: 'A', type: 'free' },
    'wallpapers': { id: 'wallpapers', name: '라이 바탕화면', logoClass: 'rai-wallpapers-logo', logoChar: 'W', type: 'free' },
    'cash': { id: 'cash', name: '라이 캐시', logoClass: 'rai-cash-logo', logoChar: 'C', type: 'free' },
    'wallpapersplus': { id: 'wallpapersplus', name: '라이 바탕화면+', logoClass: 'rai-wallpapers-plus-logo', logoChar: 'W+', type: 'paid', price: 100 },
    'styler': { id: 'styler', name: '라이 OS 꾸미기', logoClass: 'rai-styler-logo', logoChar: 'S+', type: 'paid', price: 100 },
    'browser': { id: 'browser', name: '라이 브라우저', logoClass: 'rai-browser-logo', logoChar: '🧭', type: 'free' },
    'games': { id: 'games', name: '라이 게임즈', logoClass: 'rai-games-logo', logoChar: '🎮', type: 'free' },
    'ranking': { id: 'ranking', name: '라이 랭킹', logoClass: 'rai-ranking-logo', logoChar: '🏆', type: 'free' },
    'brickbreaker': { id: 'brickbreaker', name: '벽돌깨기', logoClass: 'rai-bb-logo', logoChar: '🧱', type: 'paid', price: 20, isGame: true },
    'minesweeper': { id: 'minesweeper', name: '지뢰찾기', logoClass: 'rai-ms-logo', logoChar: '💣', type: 'paid', price: 20, isGame: true }
};

function openWebSearch(engine, query) {
    let url = '';
    const q = encodeURIComponent(query);
    if (engine === 'google') url = `https://www.google.com/search?q=${q}`;
    else if (engine === 'naver') url = `https://search.naver.com/search.naver?query=${q}`;
    else if (engine === 'youtube') url = `https://www.youtube.com/results?search_query=${q}`;
    
    if (url) window.open(url, '_blank');
}

function updateStoreButtons(appKey) {
    const app = appRegistry[appKey];
    const container = document.getElementById(`btn-container-${appKey}`);
    if (!container) return;

    const installedKey = `is${appKey.charAt(0).toUpperCase() + appKey.slice(1)}Installed`;
    
    if (systemState[installedKey]) {
        container.innerHTML = `
            <button class="download-btn" onclick="openWindow('rai${appKey}')">열기</button>
            <button class="delete-btn" onclick="handleUninstall('${appKey}')">삭제</button>
        `;
    } else {
        const label = app.type === 'paid' ? '구매하기' : '다운로드';
        container.innerHTML = `<button id="download-${appKey}" class="download-btn" onclick="handleDownload('${appKey}')">${label}</button>`;
    }
}

function handleDownload(appKey) {
    const app = appRegistry[appKey];
    const btn = document.getElementById(`download-${appKey}`);
    const installedKey = `is${appKey.charAt(0).toUpperCase() + appKey.slice(1)}Installed`;

    // Check if it's a paid app
    if (app.type === 'paid') {
        if (systemState.raiCash < app.price) {
            alert(`캐시가 부족합니다! (필요: ${app.price} C, 현재: ${systemState.raiCash} C)`);
            return;
        }
        if (!confirm(`${app.name}을(를) ${app.price} 캐시로 구매하시겠습니까?`)) return;
        updateCash(-app.price);
    }

    btn.textContent = '설치 중...';
    btn.disabled = true;

    setTimeout(() => {
        systemState[installedKey] = true;
        localStorage.setItem(`rai_os_game_${appKey}_installed`, 'true');
        renderDesktopIcons();
        updateStoreButtons(appKey);
        if (typeof renderGamesHub === 'function') renderGamesHub();
        alert(`${app.name} 설치가 완료되었습니다!`);
    }, 1500);
}

function handleUninstall(appKey) {
    const app = appRegistry[appKey];
    if (!confirm(`${app.name}을(를) 삭제하시겠습니까? 모든 관련 데이터가 초기화됩니다.`)) return;

    const installedKey = `is${appKey.charAt(0).toUpperCase() + appKey.slice(1)}Installed`;
    systemState[installedKey] = false;
    localStorage.removeItem(`rai_os_game_${appKey}_installed`);
    
    if (typeof renderGamesHub === 'function') renderGamesHub();
    renderDesktopIcons();
    updateStoreButtons(appKey);

    // Data Deletion logic
    if (appKey === 'notepad') {
        systemState.notes = [];
        localStorage.removeItem('rai_os_notes');
        if (typeof window.raiClearNotepadCloud === 'function') window.raiClearNotepadCloud();
    } else if (appKey === 'cash') {
        systemState.raiCash = 0;
        localStorage.removeItem('rai_os_cash');
        updateCash(0);
    } else if (appKey === 'styler') {
        systemState.isRainbowUnlocked = false;
        localStorage.removeItem('rai_os_rainbow_unlocked');
        updateTheme('');
    }

    closeWindow(`rai${appKey}`);
    renderDesktopIcons();
    updateStoreButtons(appKey);
    alert(`${app.name}이(가) 삭제되었습니다.`);
}

// 7. Rai Cash Logic
function mineCash() {
    const btn = document.getElementById('mine-button');
    const status = document.getElementById('mine-status');
    const overlay = btn.querySelector('.cooldown-overlay');

    if (btn.disabled) return;

    // Award cash (Admin mode gives 1000, Normal gives 1)
    const amount = systemState.isAdminMode ? 1000 : 1;
    updateCash(amount);
    
    // Set Cooldown
    btn.disabled = true;
    status.textContent = '충전 중...';
    overlay.style.height = '100%';
    
    // Animation for cooldown
    let start = Date.now();
    let duration = 1000;
    
    const animate = () => {
        let elapsed = Date.now() - start;
        let progress = 1 - (elapsed / duration);
        if (progress > 0) {
            overlay.style.height = `${progress * 100}%`;
            requestAnimationFrame(animate);
        } else {
            overlay.style.height = '0%';
            btn.disabled = false;
            status.textContent = '발굴 가능!';
        }
    };
    requestAnimationFrame(animate);
}

// 8. OS Styler Logic
function updateStylerUI() {
    const btn = document.getElementById('unlock-rainbow-btn');
    if (!btn) return;
    
    if (systemState.isRainbowUnlocked) {
        btn.classList.add('unlocked');
        btn.querySelector('.btn-lock-icon').textContent = '🌈';
        btn.querySelector('.btn-text').textContent = '무지개 모드 활성/비활성';
        btn.onclick = () => {
            if (systemState.activeTheme === 'theme-rainbow') {
                updateTheme('');
            } else {
                updateTheme('theme-rainbow');
            }
        };
    } else {
        btn.onclick = unlockRainbow;
    }
}

function unlockRainbow() {
    if (systemState.raiCash < 100) {
        alert('캐시가 부족합니다! (필요: 100 C)');
        return;
    }
    
    if (confirm('무지개 OS 모드를 100 캐시로 해제하시겠습니까?')) {
        updateCash(-100);
        systemState.isRainbowUnlocked = true;
        localStorage.setItem('rai_os_rainbow_unlocked', 'true');
        updateStylerUI();
        alert('무지개 OS 모드가 해제되었습니다! 이제 언제든지 사용할 수 있습니다.');
    }
}

function checkAdmin() {
    const pw = prompt('관리자 비밀번호를 입력하세요:');
    if (pw === '053011') {
        systemState.isAdminMode = true;
        alert('관리자 모드가 활성화되었습니다! 이제 발굴 시마다 1,000 캐시가 지급됩니다.');
    } else if (pw !== null) {
        alert('비밀번호가 올바르지 않습니다.');
    }
}

// 2. Timer Logic
function formatTimer(ticks) {
    const centiseconds = (ticks % 100).toString().padStart(2, '0');
    const totalSeconds = Math.floor(ticks / 100);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s};${centiseconds}`;
}

const timerDisplay = document.getElementById('timer-display');
const timerStartBtn = document.getElementById('timer-start');
const timerStopBtn = document.getElementById('timer-stop');

function startTimer() {
    if (systemState.timerInterval) return;
    timerStartBtn.classList.add('hidden');
    timerStopBtn.classList.remove('hidden');
    systemState.timerInterval = setInterval(() => {
        systemState.timerTicks++;
        timerDisplay.textContent = formatTimer(systemState.timerTicks);
    }, 10);
}

function stopTimer() {
    clearInterval(systemState.timerInterval);
    systemState.timerInterval = null;
    timerStartBtn.classList.remove('hidden');
    timerStopBtn.classList.add('hidden');
}

function resetTimer() {
    stopTimer();
    systemState.timerTicks = 0;
    timerDisplay.textContent = '00:00:00;00';
}

// 3. Alarm Logic
const alarmOverlay = document.getElementById('alarm-alert-overlay');
const alertTimeText = document.getElementById('alert-time-text');
const alarmIndicator = document.getElementById('alarm-indicator');
const activeAlarmInfo = document.getElementById('active-alarm-info');

function setAlarm() {
    const timeVal = document.getElementById('alarm-time-input').value;
    if (!timeVal) return alert('시간을 선택해주세요.');
    systemState.activeAlarmTime = timeVal;
    document.getElementById('set-time-display').textContent = timeVal;
    activeAlarmInfo.classList.remove('hidden');
    document.getElementById('alarm-time-tray').textContent = timeVal;
    alarmIndicator.classList.remove('hidden');
    alert(`알람이 ${timeVal}에 설정되었습니다.`);
}

function cancelAlarm() {
    systemState.activeAlarmTime = null;
    systemState.alarmTriggeredFor = null;
    activeAlarmInfo.classList.add('hidden');
    alarmIndicator.classList.add('hidden');
}

function triggerAlarm() {
    const time = systemState.activeAlarmTime;
    systemState.activeAlarmTime = null;
    alertTimeText.textContent = time;
    alarmOverlay.classList.remove('hidden');
    alarmIndicator.classList.add('hidden');
    activeAlarmInfo.classList.add('hidden');
}

function dismissAlarm() {
    alarmOverlay.classList.add('hidden');
    cancelAlarm();
}

// 9. Tutorial Logic
let currentTutorialStep = 1;
const totalTutorialSteps = 10;

function showTutorialStep(step) {
    const steps = document.querySelectorAll('.tutorial-step');
    steps.forEach(s => s.classList.remove('active'));
    
    const target = document.querySelector(`.tutorial-step[data-step="${step}"]`);
    if (target) target.classList.add('active');
    
    const nextBtn = document.getElementById('tutorial-next');
    const prevBtn = document.getElementById('tutorial-prev');
    
    // Update button text and visibility
    if (step === 1) {
        prevBtn.classList.add('hidden');
        nextBtn.textContent = '시작하기';
    } else {
        prevBtn.classList.remove('hidden');
        nextBtn.textContent = '다음';
    }
    
    if (step === totalTutorialSteps) {
        nextBtn.textContent = '완료';
        nextBtn.onclick = () => {
            closeWindow('raitutorial');
            // Reset for next time
            currentTutorialStep = 1;
            showTutorialStep(1);
        };
    } else {
        nextBtn.onclick = tutorialNext;
    }
}

function tutorialNext() {
    if (currentTutorialStep < totalTutorialSteps) {
        currentTutorialStep++;
        showTutorialStep(currentTutorialStep);
    }
}

function tutorialPrev() {
    if (currentTutorialStep > 1) {
        currentTutorialStep--;
        showTutorialStep(currentTutorialStep);
    }
}

// 4. Settings Logic
function updateSettingsUI() {
    document.getElementById('theme-toggle-btn').textContent = systemState.isLightTheme ? '다크 모드 전환' : '라이트 모드 전환';
    
    const slider = document.getElementById('font-size-slider');
    const resetBtn = document.getElementById('reset-font-btn');
    
    if (slider) {
        slider.value = systemState.fontScale;
        slider.oninput = (e) => {
            const val = parseFloat(e.target.value);
            applyFontScale(val);
        };
    }
    
    if (resetBtn) {
        resetBtn.onclick = () => {
            applyFontScale(1.0);
            if (slider) slider.value = 1.0;
        };
    }
}

function toggleTheme() {
    systemState.isLightTheme = !systemState.isLightTheme;
    document.body.classList.toggle('light-mode', systemState.isLightTheme);
    updateSettingsUI();
}

// 5. Wallpapers Logic
function setupWallpapers() {
    const wallpaperThumbs = document.querySelectorAll('.wallpaper-thumb');
    const wallpaperEl = document.getElementById('wallpaper');

    wallpaperThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const wp = thumb.getAttribute('data-wp');
            wallpaperEl.className = '';
            if (wp.startsWith('class:')) {
                const className = wp.replace('class:', '');
                wallpaperEl.style.backgroundImage = '';
                wallpaperEl.classList.add(className);
            } else {
                wallpaperEl.style.backgroundImage = `url('${wp}')`;
            }
            wallpaperThumbs.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });
}

function persistNotes() {
    if (typeof window.raiPersistNotes === 'function') {
        window.raiPersistNotes();
    } else {
        localStorage.setItem('rai_os_notes', JSON.stringify(systemState.notes));
    }
}

// 6. Notepad Logic
const noteListContainer = document.getElementById('note-list');
const notepadTitle = document.getElementById('notepad-title');
const notepadContent = document.getElementById('notepad-content');
const deleteNoteBtn = document.getElementById('delete-note-btn');

function renderNoteList() {
    if (!noteListContainer) return;
    noteListContainer.innerHTML = '';
    if (systemState.notes.length === 0) {
        noteListContainer.innerHTML = '<div class="empty-notes">아직 메모가 없습니다</div>';
        return;
    }
    systemState.notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = `note-item ${systemState.currentNoteId === note.id ? 'active' : ''}`;
        noteItem.innerHTML = `<div class="note-item-title">${note.title || '제목 없음'}</div><div class="note-item-preview">${note.content.substring(0, 30) || '내용 없음'}</div>`;
        noteItem.addEventListener('click', () => loadNote(note.id));
        noteListContainer.appendChild(noteItem);
    });
}

function loadNote(id) {
    const note = systemState.notes.find(n => n.id === id);
    if (note) {
        systemState.currentNoteId = id;
        notepadTitle.value = note.title;
        notepadContent.value = note.content;
        deleteNoteBtn.classList.remove('hidden');
        renderNoteList();
    }
}

function saveNote() {
    const title = notepadTitle.value.trim();
    const content = notepadContent.value.trim();
    if (!title && !content) return;
    if (systemState.currentNoteId) {
        const index = systemState.notes.findIndex(n => n.id === systemState.currentNoteId);
        if (index !== -1) systemState.notes[index] = { ...systemState.notes[index], title, content, updatedAt: new Date().toISOString() };
    } else {
        const newNote = { id: Date.now().toString(), title, content, updatedAt: new Date().toISOString() };
        systemState.notes.unshift(newNote);
        systemState.currentNoteId = newNote.id;
    }
    persistNotes();
    deleteNoteBtn.classList.remove('hidden');
    renderNoteList();
}

function deleteNote() {
    if (!confirm('삭제하시겠습니까?')) return;
    systemState.notes = systemState.notes.filter(n => n.id !== systemState.currentNoteId);
    persistNotes();
    systemState.currentNoteId = null;
    notepadTitle.value = '';
    notepadContent.value = '';
    deleteNoteBtn.classList.add('hidden');
    renderNoteList();
}

function newNote() {
    systemState.currentNoteId = null;
    notepadTitle.value = '';
    notepadContent.value = '';
    deleteNoteBtn.classList.add('hidden');
    renderNoteList();
}
