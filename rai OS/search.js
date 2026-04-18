/**
 * Rai OS - Search System Logic
 */

const searchState = {
    isVisible: false,
    results: [],
    selectedIndex: 0,
    engines: [
        { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
        { id: 'naver', name: 'Naver', url: 'https://search.naver.com/search.naver?query=' }
    ]
};

function toggleSearch(force) {
    const overlay = document.getElementById('rai-search-overlay');
    if (!overlay) return;

    searchState.isVisible = force !== undefined ? force : !searchState.isVisible;
    
    if (searchState.isVisible) {
        overlay.classList.add('active');
        const input = document.getElementById('rai-search-input');
        input.value = '';
        input.focus();
        renderSearchResults([]);
    } else {
        overlay.classList.remove('active');
    }
}

function handleSearchInput(query) {
    if (!query.trim()) {
        renderSearchResults([]);
        return;
    }

    const results = [];
    const q = query.toLowerCase();

    // 1. Search Apps
    Object.keys(appRegistry).forEach(key => {
        const app = appRegistry[key];
        if (app.name.toLowerCase().includes(q) || key.includes(q)) {
            results.push({
                type: 'app',
                id: key,
                name: app.name,
                iconClass: app.logoClass,
                iconChar: app.logoChar
            });
        }
    });

    // 2. Search Notes
    systemState.notes.forEach(note => {
        if (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)) {
            results.push({
                type: 'note',
                id: note.id,
                name: note.title || '제목 없는 메모',
                iconChar: '📝'
            });
        }
    });

    // 3. Web Search Fallback
    results.push({
        type: 'web',
        engine: 'google',
        name: `'${query}' 구글 검색`,
        iconChar: '🔍'
    });
    
    results.push({
        type: 'web',
        engine: 'naver',
        name: `'${query}' 네이버 검색`,
        iconChar: '💚'
    });

    searchState.results = results;
    searchState.selectedIndex = 0;
    renderSearchResults(results);
}

function renderSearchResults(results) {
    const container = document.getElementById('rai-search-results');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = '<div class="search-empty">검색어를 입력하세요...</div>';
        return;
    }

    container.innerHTML = results.map((res, index) => `
        <div class="search-result-item ${index === searchState.selectedIndex ? 'selected' : ''}" 
             onclick="executeSearchResult(${index})">
            <div class="search-res-icon ${res.iconClass || ''}">${res.iconChar}</div>
            <div class="search-res-info">
                <div class="search-res-name">${res.name}</div>
                <div class="search-res-type">${res.type === 'app' ? '애플리케이션' : (res.type === 'note' ? '메모' : '웹 검색')}</div>
            </div>
        </div>
    `).join('');
}

function executeSearchResult(index) {
    const res = searchState.results[index || searchState.selectedIndex];
    if (!res) return;

    if (res.type === 'app') {
        openWindow(`rai${res.id}`);
    } else if (res.type === 'note') {
        openWindow('rainotepad');
        if (typeof loadNote === 'function') loadNote(res.id);
    } else if (res.type === 'web') {
        const query = document.getElementById('rai-search-input').value;
        openWebSearch(res.engine, query);
    }

    toggleSearch(false);
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
    }

    if (!searchState.isVisible) return;

    if (e.key === 'Escape') {
        toggleSearch(false);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchState.selectedIndex = (searchState.selectedIndex + 1) % searchState.results.length;
        renderSearchResults(searchState.results);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchState.selectedIndex = (searchState.selectedIndex - 1 + searchState.results.length) % searchState.results.length;
        renderSearchResults(searchState.results);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        executeSearchResult();
    }
});
