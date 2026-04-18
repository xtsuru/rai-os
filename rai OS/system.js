/**
 * Rai OS - Core System
 */

// --- Reset for Testing (Rainbow OS) ---
// Comment these lines if you want the state to persist across refreshes
localStorage.removeItem('rai_os_rainbow_unlocked');
localStorage.removeItem('rai_os_cash');
localStorage.removeItem('rai_os_game_brickbreaker_installed');
localStorage.removeItem('rai_os_game_minesweeper_installed');
if (localStorage.getItem('rai_os_theme') === 'theme-rainbow') {
    localStorage.removeItem('rai_os_theme');
}

const systemState = {
    isStoreInstalled: true,
    isSettingsInstalled: true,
    isTutorialInstalled: true,
    isBrowserInstalled: true,
    isNotepadInstalled: false,
    isTimerInstalled: false,
    isAlarmInstalled: false,
    raiCash: 0,
    isCashInstalled: false,
    isWallpapersPlusInstalled: false,
    isStylerInstalled: false,
    isRainbowUnlocked: false, // Reset on every start
    isAdminMode: false,
    activeTheme: localStorage.getItem('rai_os_theme') || '',
    focusedWindow: null,
    zIndexBase: 100,
    notes: JSON.parse(localStorage.getItem('rai_os_notes')) || [],
    currentNoteId: null,
    activeAlarmTime: null,
    alarmTriggeredFor: null,
    timerTicks: 0,
    timerInterval: null,
    isLightTheme: false,
    isWallpapersInstalled: false,
    fontScale: parseFloat(localStorage.getItem('rai_os_font_scale')) || 1.0,
    isBrickbreakerInstalled: localStorage.getItem('rai_os_game_brickbreaker_installed') === 'true',
    isMinesweeperInstalled: localStorage.getItem('rai_os_game_minesweeper_installed') === 'true'
};

function applyFontScale(scale) {
    document.documentElement.style.setProperty('--font-scale', scale);
    systemState.fontScale = scale;
    localStorage.setItem('rai_os_font_scale', scale);
}

function updateCash(amount) {
    systemState.raiCash += amount;
    localStorage.setItem('rai_os_cash', systemState.raiCash);
    document.querySelectorAll('.cash-display-val').forEach(el => {
        el.textContent = systemState.raiCash.toLocaleString();
    });
}

function updateTheme(themeClass) {
    // Remove all theme classes from body
    const themes = ['theme-red', 'theme-orange', 'theme-yellow', 'theme-green', 'theme-blue', 'theme-indigo', 'theme-purple', 'theme-rainbow'];
    document.body.classList.remove(...themes);
    
    if (themeClass) {
        document.body.classList.add(themeClass);
        systemState.activeTheme = themeClass;
        localStorage.setItem('rai_os_theme', themeClass);
    } else {
        systemState.activeTheme = '';
        localStorage.removeItem('rai_os_theme');
    }
}

// Window Manager
function openWindow(id) {
    const win = document.getElementById(`window-${id}`);
    if (win) {
        win.classList.remove('hidden');
        focusWindow(id);
        if (!win.style.top) {
            win.style.top = '100px';
            win.style.left = '100px';
        }
        if (id === 'rainotepad' && typeof renderNoteList === 'function') renderNoteList();
        if (id === 'raisettings' && typeof updateSettingsUI === 'function') updateSettingsUI();
        if (id === 'raistutorial' && typeof showTutorialStep === 'function') showTutorialStep(1);
        if (id === 'raigames' && typeof renderGamesHub === 'function') renderGamesHub();
        if (id === 'raibrickbreaker' && typeof initBrickBreaker === 'function') initBrickBreaker();
        if (id === 'raiminesweeper' && typeof initMinesweeper === 'function') initMinesweeper();
    }
}

function closeWindow(id) {
    const win = document.getElementById(`window-${id}`);
    if (win) win.classList.add('hidden');
}

function focusWindow(id) {
    const win = document.getElementById(`window-${id}`);
    if (win) {
        systemState.zIndexBase += 1;
        win.style.zIndex = systemState.zIndexBase;
        systemState.focusedWindow = id;
    }
}

function toggleMaximize(id) {
    const win = document.getElementById(`window-${id}`);
    if (win) win.classList.toggle('maximized');
}

// Draggable System
let isDragging = false;
let currentWin = null;
let offset = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    const header = e.target.closest('.window-header');
    if (header) {
        const win = header.parentElement;
        if (win.classList.contains('maximized')) return;
        isDragging = true;
        currentWin = win;
        focusWindow(currentWin.id.replace('window-', ''));
        offset.x = e.clientX - currentWin.offsetLeft;
        offset.y = e.clientY - currentWin.offsetTop;
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDragging && currentWin) {
        currentWin.style.left = `${e.clientX - offset.x}px`;
        currentWin.style.top = `${e.clientY - offset.y}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    currentWin = null;
});

document.addEventListener('dblclick', (e) => {
    const header = e.target.closest('.window-header');
    if (header) toggleMaximize(header.parentElement.id.replace('window-', ''));
});

// Clock Logic
function updateClock() {
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');
    if (!timeElement || !dateElement) return;

    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
    dateElement.textContent = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace(/\.$/, '');

    if (systemState.activeAlarmTime) {
        const nowTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        if (nowTime === systemState.activeAlarmTime && systemState.alarmTriggeredFor !== nowTime) {
            systemState.alarmTriggeredFor = nowTime;
            if (typeof triggerAlarm === 'function') triggerAlarm();
        }
        if (systemState.alarmTriggeredFor && systemState.alarmTriggeredFor !== nowTime) {
            systemState.alarmTriggeredFor = null;
        }
    }
}
setInterval(updateClock, 1000);
updateClock();

// Desktop Initialization
function renderDesktopIcons() {
    const iconGrid = document.getElementById('icon-grid');
    if (!iconGrid) return;
    iconGrid.innerHTML = '';

    for (const [key, app] of Object.entries(appRegistry)) {
        const installedKey = `is${key.charAt(0).toUpperCase() + key.slice(1)}Installed`;
        if (systemState[installedKey]) {
            // ... icon creation logic ...
            const icon = document.createElement('div');
            icon.className = 'desktop-icon';
            icon.id = `rai${key}-desktop`;
            icon.innerHTML = `<div class="app-logo ${app.logoClass}">${app.logoChar}</div><span class="app-name">${app.name}</span>`;
            icon.addEventListener('click', () => openWindow(`rai${key}`));
            iconGrid.appendChild(icon);
        }
    }
    updateTaskbarIcons();
}

function updateTaskbarIcons() {
    Object.keys(appRegistry).forEach(key => {
        const btn = document.getElementById(`rai${key}-taskbar`);
        if (btn) {
            const installedKey = `is${key.charAt(0).toUpperCase() + key.slice(1)}Installed`;
            if (systemState[installedKey]) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        }
    });
}

// Initial Sync
if (systemState.activeTheme) {
    document.body.classList.add(systemState.activeTheme);
}

// Wait for all scripts to load then sync store
window.addEventListener('load', () => {
    Object.keys(appRegistry).forEach(updateStoreButtons);
    renderDesktopIcons();
    applyFontScale(systemState.fontScale);
    // Auto-open tutorial on first load
    setTimeout(() => openWindow('raitutorial'), 500);
});
