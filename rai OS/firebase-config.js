/**
 * Firebase 웹 앱 설정 — Firebase 콘솔 → 프로젝트 설정 → 일반 → 내 앱 → SDK 설정에서 복사해 아래 값을 채우세요.
 * (apiKey, messagingSenderId, appId 는 반드시 프로젝트 고유 값이어야 합니다.)
 *
 * Realtime Database 규칙 예시(콘솔 → Realtime Database → 규칙):
 * {
 *   "rules": {
 *     "users": {
 *       "$uid": {
 *         ".read": "auth != null && auth.uid === $uid",
 *         ".write": "auth != null && auth.uid === $uid"
 *       }
 *     },
 *     "leaderboard": {
 *       ".indexOn": ["cash"],
 *       "$uid": {
 *         ".read": true,
 *         ".write": "auth != null && auth.uid === $uid"
 *       }
 *     }
 *   }
 * }
 *
 * Authentication → Sign-in method 에서 이메일/비밀번호 사용 설정이 필요합니다.
 *
 * auth/configuration-not-found 가 나오면: 콘솔에서 Authentication 을 한 번 열어
 * "시작하기"로 인증을 켜고, Google Cloud 에서 Identity Toolkit API 사용 설정을 확인하세요.
 */
const firebaseConfig = {
    apiKey: 'AIzaSyAoYeWVrOx3XCyyiTh3CFMDrh9ozeZJJyQ',
    authDomain: 'raios-b4b2c.firebaseapp.com',
    databaseURL: 'https://raios-b4b2c-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'raios-b4b2c',
    storageBucket: 'raios-b4b2c.firebasestorage.app',
    messagingSenderId: '945368920008',
    appId: '1:945368920008:web:34007e2d64c2838b281afd'
};
