const { getStore } = require('@netlify/blobs');

const BASE = 'https://customer.jetnetconnect.com';
const TOKEN_KEY = 'tokens';
// JETNET tokens live ~60 min; we stop trusting a cached token 5 min before that.
const TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

function tokenStore() {
  return getStore('jetnet-auth');
}

function cacheStore() {
  return getStore('jetnet-cache');
}

async function login() {
  const email = process.env.JETNET_EMAIL;
  const password = process.env.JETNET_PASSWORD;
  if (!email || !password) {
    throw new Error('JETNET_EMAIL / JETNET_PASSWORD environment varijable nisu podešene na Netlify sajtu');
  }

  const res = await fetch(`${BASE}/api/Admin/APILogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailAddress: email, password }),
  });

  if (!res.ok) {
    throw new Error(`JETNET login HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.bearerToken || !data.apiToken) {
    throw new Error('JETNET login odgovor nema tokene');
  }

  const record = {
    bearerToken: data.bearerToken,
    apiToken: data.apiToken,
    fetchedAt: Date.now(),
  };
  await tokenStore().setJSON(TOKEN_KEY, record);
  return record;
}

async function getTokens({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = await tokenStore().get(TOKEN_KEY, { type: 'json' });
    if (cached && Date.now() - cached.fetchedAt < TOKEN_TTL_MS - REFRESH_MARGIN_MS) {
      return cached;
    }
  }
  return login();
}

// path may contain a single {apiToken} placeholder segment.
async function jetnetRequest(path, { method = 'GET', body } = {}) {
  let tokens = await getTokens();

  const doCall = async (t) => {
    const url = `${BASE}${path.replace('{apiToken}', t.apiToken)}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${t.bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      // non-JSON body, fall through with empty object
    }
    return { res, data };
  };

  let { res, data } = await doCall(tokens);

  const status = String(data.responsestatus || '').toUpperCase();
  if (status.includes('ERROR') && status.includes('TOKEN')) {
    tokens = await getTokens({ forceRefresh: true });
    ({ res, data } = await doCall(tokens));
  }

  if (!res.ok) {
    throw new Error(`JETNET HTTP ${res.status} za ${path}`);
  }
  if (String(data.responsestatus || '').toUpperCase().includes('ERROR')) {
    throw new Error(`JETNET greška: ${data.responsestatus}`);
  }
  return data;
}

// Short server-side cache in front of JETNET so repeated widget loads for the
// same model don't re-hit the API (and stay well under the ~60 req/min limit).
async function cached(key, ttlMs, fn) {
  const store = cacheStore();
  const hit = await store.get(key, { type: 'json' });
  if (hit && Date.now() - hit.savedAt < ttlMs) {
    return hit.data;
  }
  const data = await fn();
  await store.setJSON(key, { data, savedAt: Date.now() });
  return data;
}

module.exports = { jetnetRequest, cached };
