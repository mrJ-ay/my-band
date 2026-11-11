const TOKEN_KEY = 'myband_oneid_token_v1';
const VERIFIER_KEY = 'myband_oneid_verifier';
const STATE_KEY = 'myband_oneid_state';

const DEFAULT_ONEID_URL = 'https://oneid-icvq.onrender.com';
const CLIENT_ID = 'myband';

function base64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomUrlSafe(byteLen = 32) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function getOneIdBaseUrl() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const cfg = await res.json();
      if (cfg.oneidUrl) return cfg.oneidUrl.replace(/\/$/, '');
    }
  } catch (_) {}
  return DEFAULT_ONEID_URL;
}

function getRedirectUri() {
  return `${location.origin}${location.pathname}`;
}

export function getSavedToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function clearOneIdSession() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function startOneIdLogin() {
  const oneidUrl = await getOneIdBaseUrl();
  const verifier = randomUrlSafe(48);
  const state = randomUrlSafe(24);
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(new Uint8Array(hashBuf));
  const redirectUri = getRedirectUri();

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const query = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    state
  });

  location.assign(`${oneidUrl}/login.html?${query.toString()}`);
}

export async function handleOneIdCallback(onNotice) {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const errorDesc = params.get('error_description') || params.get('error');

  if (errorDesc) {
    history.replaceState(null, '', `${location.pathname}${location.hash}`);
    if (onNotice) onNotice(`ONEID 로그인 취소/오류: ${errorDesc}`);
    return null;
  }

  if (!code) return null;

  const returnedState = params.get('state');
  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);

  history.replaceState(null, '', `${location.pathname}${location.hash}`);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  if (!returnedState || returnedState !== expectedState || !verifier) {
    if (onNotice) onNotice('ONEID 로그인 보안 검증에 실패했습니다. 다시 시도해 주세요.');
    return null;
  }

  try {
    const oneidUrl = await getOneIdBaseUrl();
    const res = await fetch(`${oneidUrl}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        redirect_uri: getRedirectUri(),
        code,
        code_verifier: verifier
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(data.detail || 'ONEID 인증 토큰 발급에 실패했습니다.');
    }

    localStorage.setItem(TOKEN_KEY, data.access_token);
    return data.user || (await fetchCurrentOneIdUser());
  } catch (err) {
    if (onNotice) onNotice(err.message || 'ONEID 로그인 처리 중 오류가 발생했습니다.');
    return null;
  }
}

export async function fetchCurrentOneIdUser() {
  const token = getSavedToken();
  if (!token) return null;

  try {
    const oneidUrl = await getOneIdBaseUrl();
    const res = await fetch(`${oneidUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      clearOneIdSession();
      return null;
    }
    return await res.json();
  } catch (_) {
    return null;
  }
}
