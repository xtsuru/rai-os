/**
 * Rai OS — Firebase 인증, 클라우드 캐시/메모, 랭킹
 */
(function () {
    const SPECIAL_USER = 'tls123';
    const SPECIAL_CASH = 10000;

    const TLS_SYNTHETIC_EMAIL = `${SPECIAL_USER}@raios-b4b2c.firebaseapp.com`;

    /** 로그인: 일반은 실제 이메일, TLS 계정만 tls / tls123 (이메일 없이) 허용 */
    function resolveLoginEmail(raw) {
        const s = String(raw).trim();
        if (!s) throw new Error('이메일을 입력하세요.');
        if (s.includes('@')) {
            return s.toLowerCase();
        }
        const lower = s.toLowerCase();
        if (lower === 'tls' || lower === 'tls123') {
            return TLS_SYNTHETIC_EMAIL;
        }
        throw new Error('이메일 주소를 입력하거나, TLS 계정은 tls 또는 tls123 만 입력할 수 있습니다.');
    }

    function normalizeRegisterEmail(raw) {
        const e = String(raw).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
            throw new Error('올바른 이메일 주소를 입력하세요.');
        }
        return e;
    }

    function usernameFromEmail(email) {
        if (!email || typeof email !== 'string') return '';
        return email.split('@')[0].toLowerCase();
    }

    function isTlsSpecialAccount(user, data) {
        const email = (user && user.email) || '';
        const local = usernameFromEmail(email);
        const stored = (data && data.username) ? String(data.username).toLowerCase() : '';
        return (
            local === SPECIAL_USER ||
            stored === SPECIAL_USER ||
            email.toLowerCase() === TLS_SYNTHETIC_EMAIL
        );
    }

    function showAuthError(msg) {
        const el = document.getElementById('auth-error');
        if (el) {
            el.textContent = msg || '';
            el.style.display = msg ? 'block' : 'none';
        } else if (msg) {
            alert(msg);
        }
    }

    function setDesktopLocked(locked) {
        const desk = document.getElementById('desktop');
        if (!desk) return;
        if (locked) {
            desk.setAttribute('inert', '');
            desk.setAttribute('aria-hidden', 'true');
            desk.style.visibility = 'hidden';
        } else {
            desk.removeAttribute('inert');
            desk.removeAttribute('aria-hidden');
            desk.style.visibility = '';
        }
    }

    function showWelcome(username) {
        const overlay = document.getElementById('welcome-overlay');
        const msg = document.getElementById('welcome-message');
        if (msg) msg.textContent = `${username}님 환영합니다!`;
        if (overlay) overlay.classList.remove('hidden');
    }

    function hideWelcome() {
        const overlay = document.getElementById('welcome-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    function showAuth(show) {
        const overlay = document.getElementById('auth-overlay');
        if (!overlay) return;
        overlay.classList.toggle('hidden', !show);
        setDesktopLocked(show);
    }

    function refreshCashBarsOnly() {
        document.querySelectorAll('.cash-display-val').forEach((el) => {
            el.textContent = systemState.raiCash.toLocaleString();
        });
        localStorage.setItem('rai_os_cash', String(systemState.raiCash));
    }

    function pushLeaderboard() {
        if (!systemState.firebaseUid || !window.raiDb) return;
        const name = systemState.displayUsername || usernameFromEmail(systemState.userEmail) || 'user';
        window.raiDb.ref(`leaderboard/${systemState.firebaseUid}`).set({
            username: name,
            cash: systemState.raiCash,
            updatedAt: Date.now()
        });
    }

    window.onCashUpdated = function () {
        if (systemState._skipCashCloud) return;
        if (!systemState.firebaseUid || !window.raiDb) return;
        window.raiDb.ref(`users/${systemState.firebaseUid}/cash`).set(systemState.raiCash);
        pushLeaderboard();
    };

    window.raiPersistNotes = function () {
        if (!systemState.firebaseUid || !window.raiDb) {
            localStorage.setItem('rai_os_notes', JSON.stringify(systemState.notes));
            return;
        }
        window.raiDb.ref(`users/${systemState.firebaseUid}/notes`).set(systemState.notes);
    };

    window.raiClearNotepadCloud = function () {
        if (!systemState.firebaseUid || !window.raiDb) return;
        window.raiDb.ref(`users/${systemState.firebaseUid}/notes`).set([]);
    };

    async function applySpecialAccountCash(uid, user, data) {
        if (!isTlsSpecialAccount(user, data)) return;
        systemState._skipCashCloud = true;
        systemState.raiCash = SPECIAL_CASH;
        refreshCashBarsOnly();
        systemState._skipCashCloud = false;
        await window.raiDb.ref(`users/${uid}/cash`).set(SPECIAL_CASH);
        pushLeaderboard();
    }

    async function loadUserProfile(uid) {
        const snap = await window.raiDb.ref(`users/${uid}`).once('value');
        const data = snap.val() || {};
        systemState._skipCashCloud = true;

        if (typeof data.cash === 'number' && !Number.isNaN(data.cash)) {
            systemState.raiCash = data.cash;
        } else {
            systemState.raiCash = parseInt(localStorage.getItem('rai_os_cash'), 10) || 0;
        }

        if (Array.isArray(data.notes)) {
            systemState.notes = data.notes;
        } else {
            systemState.notes = [];
        }

        systemState.displayUsername = data.username || usernameFromEmail(systemState.userEmail);
        refreshCashBarsOnly();
        systemState._skipCashCloud = false;

        try {
            localStorage.setItem('rai_os_notes', JSON.stringify(systemState.notes));
        } catch (e) { /* ignore */ }

        await applySpecialAccountCash(uid, firebase.auth().currentUser, data);

        const accLabel = document.getElementById('settings-account-label');
        if (accLabel) {
            accLabel.textContent = systemState.userEmail
                ? `로그인: ${systemState.userEmail}`
                : `로그인: ${systemState.displayUsername || '—'}`;
        }

        if (typeof renderNoteList === 'function') renderNoteList();
    }

    let rankingRef = null;
    let rankingHandler = null;

    window.startRankingListener = function () {
        window.stopRankingListener();
        const container = document.getElementById('ranking-list-body');
        if (!window.raiDb || !container) return;
        rankingRef = window.raiDb.ref('leaderboard').orderByChild('cash').limitToLast(50);
        rankingHandler = (snap) => {
            const rows = [];
            snap.forEach((child) => {
                const v = child.val();
                rows.push({
                    id: child.key,
                    username: v && v.username ? v.username : '—',
                    cash: v && typeof v.cash === 'number' ? v.cash : 0
                });
            });
            rows.sort((a, b) => b.cash - a.cash);
            if (rows.length === 0) {
                container.innerHTML = '<div class="ranking-empty">아직 랭킹 데이터가 없습니다. 캐시를 모아보세요!</div>';
                return;
            }
            container.innerHTML = rows
                .map((r, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                    return `<div class="ranking-row"><span class="rank-medal">${medal}</span><span class="rank-name">${escapeHtml(r.username)}</span><span class="rank-cash">${r.cash.toLocaleString()} C</span></div>`;
                })
                .join('');
        };
        const onRankErr = (err) => {
            container.innerHTML = `<div class="ranking-empty">랭킹을 불러올 수 없습니다. Firebase Realtime Database 규칙과 인덱스(.indexOn: cash)를 확인하세요.<br><small>${escapeHtml(err && err.message ? err.message : '')}</small></div>`;
        };
        rankingRef.on('value', rankingHandler, onRankErr);
    };

    window.stopRankingListener = function () {
        if (rankingRef && rankingHandler) {
            rankingRef.off('value', rankingHandler);
        }
        rankingRef = null;
        rankingHandler = null;
    };

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    async function registerWithEmail(emailRaw, password) {
        const email = normalizeRegisterEmail(emailRaw);
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;
        const localPart = email.split('@')[0];
        await window.raiDb.ref(`users/${uid}`).set({
            username: localPart,
            cash: 0,
            notes: []
        });
        await cred.user.updateProfile({ displayName: localPart });
    }

    async function loginWithEmailOrTls(rawLogin, password) {
        const email = resolveLoginEmail(rawLogin);
        await firebase.auth().signInWithEmailAndPassword(email, password);
    }

    window.raiLogout = async function () {
        try {
            await firebase.auth().signOut();
        } catch (e) {
            console.error(e);
        }
        location.reload();
    };

    window.raiConfirmDeleteAllData = function () {
        if (!confirm('1/3: 모든 데이터를 삭제하시겠습니까? 이 작업은 계속 진행됩니다.')) return;
        if (!confirm('2/3: 정말로 삭제하시겠습니까? 계정에 저장된 메모·캐시 등이 사라집니다.')) return;
        if (!confirm('3/3: 마지막 확인입니다. 삭제 후 복구할 수 없습니다. 진행할까요?')) return;
        const uid = systemState.firebaseUid;
        const clearLocal = () => {
            const keys = Object.keys(localStorage).filter((k) => k.startsWith('rai_os'));
            keys.forEach((k) => localStorage.removeItem(k));
        };
        (async () => {
            try {
                if (uid && window.raiDb) {
                    await window.raiDb.ref(`users/${uid}`).remove();
                    await window.raiDb.ref(`leaderboard/${uid}`).remove();
                }
                await firebase.auth().signOut();
                clearLocal();
            } catch (e) {
                console.error(e);
                alert('삭제 중 오류가 발생했습니다: ' + (e.message || e));
                return;
            }
            location.reload();
        })();
    };

    function bindAuthForm() {
        const loginForm = document.getElementById('auth-login-form');
        const regForm = document.getElementById('auth-register-form');
        const tabLogin = document.getElementById('auth-tab-login');
        const tabReg = document.getElementById('auth-tab-register');
        const welcomeBtn = document.getElementById('welcome-dismiss-btn');

        if (tabLogin && tabReg && loginForm && regForm) {
            tabLogin.addEventListener('click', () => {
                tabLogin.classList.add('active');
                tabReg.classList.remove('active');
                loginForm.classList.remove('hidden');
                regForm.classList.add('hidden');
                showAuthError('');
            });
            tabReg.addEventListener('click', () => {
                tabReg.classList.add('active');
                tabLogin.classList.remove('active');
                regForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
                showAuthError('');
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                showAuthError('');
                const emailOrTls = document.getElementById('auth-login-email').value;
                const pw = document.getElementById('auth-login-pw').value;
                try {
                    await loginWithEmailOrTls(emailOrTls, pw);
                } catch (err) {
                    if (err && err.message && !err.code) {
                        showAuthError(err.message);
                    } else {
                        showAuthError(mapAuthError(err));
                    }
                }
            });
        }

        if (regForm) {
            regForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                showAuthError('');
                const email = document.getElementById('auth-reg-email').value;
                const pw = document.getElementById('auth-reg-pw').value;
                const pw2 = document.getElementById('auth-reg-pw2').value;
                if (pw !== pw2) {
                    showAuthError('비밀번호가 일치하지 않습니다.');
                    return;
                }
                try {
                    await registerWithEmail(email, pw);
                } catch (err) {
                    if (err && err.message && !err.code) {
                        showAuthError(err.message);
                    } else {
                        showAuthError(mapAuthError(err));
                    }
                }
            });
        }

        if (welcomeBtn) {
            welcomeBtn.addEventListener('click', () => {
                hideWelcome();
            });
        }

        const logoutBtn = document.getElementById('settings-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('로그아웃하시겠습니까?')) window.raiLogout();
            });
        }

        const delBtn = document.getElementById('settings-delete-data-btn');
        if (delBtn) {
            delBtn.addEventListener('click', () => window.raiConfirmDeleteAllData());
        }
    }

    function mapAuthError(err) {
        const code = err && err.code;
        if (code === 'auth/configuration-not-found') {
            return (
                'Firebase 인증이 프로젝트에서 아직 설정되지 않았습니다. ' +
                '① Firebase 콘솔 → 빌드 → Authentication → 시작하기 → 이메일/비밀번호 사용 설정. ' +
                '② Google Cloud 콘솔 → API 및 서비스 → 라이브러리 → "Identity Toolkit API" 검색 후 사용 설정.'
            );
        }
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            return '이메일 또는 비밀번호가 올바르지 않습니다.';
        }
        if (code === 'auth/email-already-in-use') return '이미 사용 중인 이메일입니다.';
        if (code === 'auth/weak-password') return '비밀번호가 너무 짧습니다 (6자 이상).';
        if (code === 'auth/invalid-email') return '이메일 형식이 올바르지 않습니다.';
        return err.message || '오류가 발생했습니다.';
    }

    function initFirebase() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK가 로드되지 않았습니다.');
            document.body.classList.remove('rai-auth-loading');
            return;
        }
        if (typeof firebaseConfig === 'undefined' || !firebaseConfig.apiKey || firebaseConfig.apiKey.indexOf('YOUR_') === 0) {
            showAuthError('firebase-config.js 에서 Firebase 웹 앱 설정(apiKey 등)을 입력해 주세요.');
            document.body.classList.remove('rai-auth-loading');
            return;
        }
        let authResolved = false;
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            window.raiDb = firebase.database();
            firebase.auth().onAuthStateChanged(async (user) => {
                if (!authResolved) {
                    authResolved = true;
                    document.body.classList.remove('rai-auth-loading');
                }
                if (!user) {
                    systemState.firebaseUid = null;
                    systemState.userEmail = null;
                    systemState.displayUsername = '';
                    showAuth(true);
                    return;
                }
                systemState.firebaseUid = user.uid;
                systemState.userEmail = user.email;
                showAuth(false);
                await loadUserProfile(user.uid);
                const uname = systemState.displayUsername || usernameFromEmail(user.email);
                showWelcome(uname);
            });
            bindAuthForm();
        } catch (e) {
            console.error(e);
            showAuthError('Firebase 초기화 실패: ' + e.message);
            document.body.classList.remove('rai-auth-loading');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFirebase);
    } else {
        initFirebase();
    }
})();
