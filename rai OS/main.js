/**
 * Rai OS - Main Entry & Event Bindings
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Setup
    setupWallpapers();
    
    // 2. Global Bindings
    document.getElementById('raistore-taskbar').addEventListener('click', () => openWindow('raistore'));
    document.getElementById('raibrowser-taskbar').addEventListener('click', () => openWindow('raibrowser'));
    document.getElementById('raigames-taskbar').addEventListener('click', () => openWindow('raigames'));
    document.getElementById('raibrickbreaker-taskbar').addEventListener('click', () => openWindow('raibrickbreaker'));
    document.getElementById('raiminesweeper-taskbar').addEventListener('click', () => openWindow('raiminesweeper'));
    const rankingTb = document.getElementById('rairanking-taskbar');
    if (rankingTb) rankingTb.addEventListener('click', () => openWindow('rairanking'));
    document.getElementById('rai-search-taskbar').addEventListener('click', () => toggleSearch());
    
    // Taskbar Search Input
    const taskbarSearch = document.getElementById('taskbar-search-input');
    if (taskbarSearch) {
        taskbarSearch.addEventListener('keydown', (e) => {
            // Check for Enter and ensure Korean composition is finished
            if (e.key === 'Enter') {
                if (e.isComposing) return; // Prevent double trigger and incomplete composition
                
                const query = e.target.value.trim();
                if (query) {
                    openWebSearch('google', query);
                    e.target.value = '';
                    e.target.blur();
                }
            }
        });
    }
    
    const notificationButton = document.getElementById('notification-button');
    const updateLogPanel = document.getElementById('update-log-panel');
    const closeLogButton = document.getElementById('close-log');
    
    notificationButton.addEventListener('click', () => updateLogPanel.classList.toggle('hidden'));
    closeLogButton.addEventListener('click', () => updateLogPanel.classList.add('hidden'));

    // 3. Store management is handled dynamically via updateStoreButtons

    // 4. Timer Bindings
    document.getElementById('timer-start').addEventListener('click', startTimer);
    document.getElementById('timer-stop').addEventListener('click', stopTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);

    // 5. Alarm Bindings
    document.getElementById('set-alarm-btn').addEventListener('click', setAlarm);
    document.getElementById('cancel-alarm-btn').addEventListener('click', cancelAlarm);
    document.getElementById('dismiss-alarm-btn').addEventListener('click', dismissAlarm);

    // 6. Settings Bindings
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

    // 7. Notepad Bindings
    document.getElementById('save-note-btn').addEventListener('click', saveNote);
    document.getElementById('delete-note-btn').addEventListener('click', deleteNote);
    document.getElementById('new-note-btn').addEventListener('click', newNote);

    // 9. Tutorial Bindings
    const tNext = document.getElementById('tutorial-next');
    const tPrev = document.getElementById('tutorial-prev');
    if (tNext) tNext.onclick = tutorialNext;
    if (tPrev) tPrev.onclick = tutorialPrev;

    // 10. Cash Bindings
    const mineBtn = document.getElementById('mine-button');
    if (mineBtn) mineBtn.addEventListener('click', mineCash);
    
    const adminBtn = document.getElementById('admin-h-btn');
    if (adminBtn) adminBtn.addEventListener('click', checkAdmin);

    updateCash(0); // Sync initial display

    console.log('Rai OS - Modern Modular Core Initialized');
});
