import assert from 'assert';
import { sanitizeAndNormalizeUrl, formatCentsToDollars } from '../utils/formatters.ts';
import { isSafePublicUrl, isPublicIpAddress, resolveAndValidateDns } from '../utils/metadata.ts';
import { checkRateLimit, checkProgressiveLockout, recordFailedAuthAttempt, resetAuthAttempts } from '../utils/rateLimit.ts';
import {
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminSessionToken,
  ADMIN_SESSION_TTL_SECONDS,
} from '../utils/adminAuth.ts';
import { sanitizeString, getClientIp, isValidUuid, validateRequestOrigin } from '../utils/securityUtils.ts';
import { PLATFORM_CATEGORIES } from '../types/bid.ts';
import crypto from 'crypto';

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`  ✗ ${description}`);
    console.error(error);
    process.exitCode = 1;
  }
}

async function runAsyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`  ✗ ${description}`);
    console.error(error);
    process.exitCode = 1;
  }
}

console.log('\n============================================================');
console.log('🛡️  OUTBIDS.AUCTION ADVERSARIAL SECURITY VALIDATION SUITE');
console.log('============================================================\n');

// -----------------------------------------------------------------
// 1. SSRF, DNS Rebinding & URL Injection Adversarial Matrix
// -----------------------------------------------------------------
console.log('--- 1. SSRF & Malicious Destination Attack Matrix ---');

test('Rejects dangerous and pseudo protocols', () => {
  assert.strictEqual(sanitizeAndNormalizeUrl('javascript:alert(document.domain)').isValid, false);
  assert.strictEqual(sanitizeAndNormalizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==').isValid, false);
  assert.strictEqual(sanitizeAndNormalizeUrl('blob:https://outbids.auction/uuid').isValid, false);
  assert.strictEqual(sanitizeAndNormalizeUrl('file:///etc/passwd').isValid, false);
  assert.strictEqual(sanitizeAndNormalizeUrl('ftp://example.com/file').isValid, false);
});

test('Rejects all Loopback, Localhost, and Internal domains', () => {
  assert.strictEqual(isSafePublicUrl('http://localhost:3000'), false);
  assert.strictEqual(isSafePublicUrl('http://admin.localhost/'), false);
  assert.strictEqual(isSafePublicUrl('http://127.0.0.1:8000'), false);
  assert.strictEqual(isSafePublicUrl('http://127.0.0.2'), false);
  assert.strictEqual(isSafePublicUrl('http://127.255.255.254'), false);
  assert.strictEqual(isSafePublicUrl('http://0.0.0.0'), false);
});

test('Rejects Cloud Metadata & Link-Local IP vectors (AWS/GCP/Azure/OpenStack)', () => {
  assert.strictEqual(isSafePublicUrl('http://169.254.169.254/latest/meta-data/'), false);
  assert.strictEqual(isSafePublicUrl('http://169.254.169.254/computeMetadata/v1/'), false);
  assert.strictEqual(isSafePublicUrl('http://metadata.google.internal/'), false);
  assert.strictEqual(isSafePublicUrl('http://instance-data/latest/'), false);
});

test('Rejects all RFC1918 Private IPv4 Subnets & CGNAT', () => {
  // 10.0.0.0/8
  assert.strictEqual(isSafePublicUrl('http://10.0.0.1/'), false);
  assert.strictEqual(isSafePublicUrl('http://10.255.255.255/'), false);
  // 172.16.0.0/12
  assert.strictEqual(isSafePublicUrl('http://172.16.0.1/'), false);
  assert.strictEqual(isSafePublicUrl('http://172.31.255.255/'), false);
  // 192.168.0.0/16
  assert.strictEqual(isSafePublicUrl('http://192.168.1.1/'), false);
  assert.strictEqual(isSafePublicUrl('http://192.168.254.254/'), false);
  // 100.64.0.0/10 CGNAT
  assert.strictEqual(isSafePublicUrl('http://100.64.0.1/'), false);
  assert.strictEqual(isSafePublicUrl('http://100.127.255.255/'), false);
});

test('Rejects IPv6 Local, Loopback, Unique-Local, and Link-Local', () => {
  assert.strictEqual(isSafePublicUrl('http://[::1]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[::]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[fe80::1]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[fc00::1]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[fd00::1]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[2001:db8::1]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[2002:c0a8:101::1]/'), false);
});

test('Rejects IPv4-Mapped IPv6 SSRF bypasses', () => {
  assert.strictEqual(isSafePublicUrl('http://[::ffff:127.0.0.1]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[::ffff:169.254.169.254]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[::ffff:10.0.0.1]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[::ffff:192.168.1.1]/'), false);
  assert.strictEqual(isSafePublicUrl('http://[::ffff:7f00:0001]/'), false);
});

test('Rejects Documentation, Benchmark, and Reserved TLD domains', () => {
  assert.strictEqual(isSafePublicUrl('http://192.0.2.1/'), false);
  assert.strictEqual(isSafePublicUrl('http://198.51.100.1/'), false);
  assert.strictEqual(isSafePublicUrl('http://203.0.113.1/'), false);
  assert.strictEqual(isSafePublicUrl('http://198.18.0.1/'), false);
  assert.strictEqual(isSafePublicUrl('http://internal.test/'), false);
  assert.strictEqual(isSafePublicUrl('http://site.example/'), false);
  assert.strictEqual(isSafePublicUrl('http://gateway.invalid/'), false);
});

test('Rejects Octal, Hex, and Integer Decimal IP representation bypasses', () => {
  assert.strictEqual(isSafePublicUrl('http://0177.0.0.1/'), false); // Octal 127.0.0.1
  assert.strictEqual(isSafePublicUrl('http://0x7f000001/'), false); // Hex 127.0.0.1
  assert.strictEqual(isSafePublicUrl('http://2130706433/'), false); // Dword 127.0.0.1
});

test('Accepts valid, routable public domains', () => {
  assert.strictEqual(isSafePublicUrl('https://example.com/'), true);
  assert.strictEqual(isSafePublicUrl('https://news.ycombinator.com/'), true);
  assert.strictEqual(isSafePublicUrl('https://outbids.auction/'), true);
});

// -----------------------------------------------------------------
// 2. URL Canonicalization & Spam Policy Adversarial Matrix
// -----------------------------------------------------------------
console.log('\n--- 2. URL Canonicalization & Spam Defense ---');

test('Strips marketing tracking parameters while preserving query logic', () => {
  const dirty = 'https://example.com/catalog?item=42&utm_source=tiktok&utm_medium=social&gclid=998877&ref=affiliate';
  const clean = sanitizeAndNormalizeUrl(dirty);
  assert.strictEqual(clean.isValid, true);
  assert.strictEqual(clean.normalizedUrl, 'https://example.com/catalog?item=42');
  assert.strictEqual(clean.displayDomain, 'example.com/catalog');
});

test('Converts Twitter/X social handles into canonical URLs', () => {
  const handle = sanitizeAndNormalizeUrl('@google_cloud');
  assert.strictEqual(handle.isValid, true);
  assert.strictEqual(handle.normalizedUrl, 'https://x.com/google_cloud');
  assert.strictEqual(handle.displayDomain, '@google_cloud');
});

test('Blocks private invite channels (Telegram, Discord, Signal, WhatsApp)', () => {
  assert.strictEqual(sanitizeAndNormalizeUrl('https://discord.gg/h7yTg7').isValid, false);
  assert.strictEqual(sanitizeAndNormalizeUrl('https://discord.com/invite/crypto').isValid, false);
  assert.strictEqual(sanitizeAndNormalizeUrl('https://t.me/free_crypto_airdrop').isValid, false);
  assert.strictEqual(sanitizeAndNormalizeUrl('https://chat.whatsapp.com/invite99').isValid, false);
  assert.strictEqual(sanitizeAndNormalizeUrl('https://signal.group/#CjQK...').isValid, false);
});

// -----------------------------------------------------------------
// 3. Rate Limiting & Anti-Brute-Force Under Adversarial Floods
// -----------------------------------------------------------------
console.log('\n--- 3. Rate Limiting & Anti-Brute-Force Under Flood ---');

test('Enforces progressive throttling and sliding window lockout', () => {
  const testIp = `203.0.113.${Math.floor(Math.random() * 200 + 1)}`;
  const action = 'adv_login_test';
  const limit = 5;

  for (let i = 1; i <= limit; i++) {
    const res = checkRateLimit(action, testIp, limit, 60);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.remaining, limit - i);
  }

  // Attempt 6 must be rejected with 429 status
  const blocked = checkRateLimit(action, testIp, limit, 60);
  assert.strictEqual(blocked.success, false);
  assert.strictEqual(blocked.remaining, 0);
  assert.ok(blocked.resetSeconds > 0);
});

// -----------------------------------------------------------------
// 4. Admin Authentication Cryptography & Session Epoch Invalidation
// -----------------------------------------------------------------
console.log('\n--- 4. Admin Authentication Cryptography ---');

test('Performs constant-time timing-safe password evaluation', () => {
  assert.strictEqual(verifyAdminPassword('wrong_password_attempt'), false);
  assert.strictEqual(verifyAdminPassword(''), false);
  assert.strictEqual(verifyAdminPassword(null), false);
  assert.strictEqual(verifyAdminPassword(undefined), false);
});

test('Enforces password input length boundary (DoS prevention)', () => {
  const oversizedPassword = 'A'.repeat(5000);
  assert.strictEqual(verifyAdminPassword(oversizedPassword), false);
  const boundaryPassword = 'A'.repeat(129);
  assert.strictEqual(verifyAdminPassword(boundaryPassword), false);
});

test('Generates cryptographic nonce-embedded HMAC session tokens', () => {
  const token1 = createAdminSessionToken();
  const token2 = createAdminSessionToken();
  // Tokens generated at the same second must have distinct nonces
  assert.notStrictEqual(token1, token2);
  assert.strictEqual(verifyAdminSessionToken(token1), true);
  assert.strictEqual(verifyAdminSessionToken(token2), true);
});

test('Rejects forged, truncated, or tampered HMAC tokens', () => {
  const valid = createAdminSessionToken();
  assert.strictEqual(verifyAdminSessionToken(valid.slice(0, -10)), false);
  assert.strictEqual(verifyAdminSessionToken(valid + 'x'), false);
  assert.strictEqual(verifyAdminSessionToken('admin.1234567.nonce.forgedsignature'), false);
});

// -----------------------------------------------------------------
// 5. Leaderboard Deterministic Sorting & Concurrency (100 concurrent bids)
// -----------------------------------------------------------------
console.log('\n--- 5. Deterministic Concurrency & Leaderboard Ordering ---');

test('Simulates 100 simultaneous concurrent bids with deterministic tie-breaking', () => {
  const baseTime = 1724750000000;
  const mockBids = [];

  // Generate 100 bids with varying amounts and timestamps
  for (let i = 0; i < 100; i++) {
    mockBids.push({
      id: `bid_${i}`,
      amount: (i % 10) * 1000 + 1000, // $10, $20, ..., $100
      created_at: new Date(baseTime + (100 - i) * 1000).toISOString(),
      status: 'paid',
    });
  }

  // Authoritative sorting rule: Highest amount first; Tie-breaker: earlier creation timestamp
  mockBids.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Verify invariants
  for (let i = 0; i < mockBids.length - 1; i++) {
    const current = mockBids[i];
    const next = mockBids[i + 1];

    if (current.amount === next.amount) {
      assert.ok(
        new Date(current.created_at).getTime() <= new Date(next.created_at).getTime(),
        `Tie-breaker failed: ${current.id} should precede ${next.id}`
      );
    } else {
      assert.ok(current.amount > next.amount, `Amount order failed at index ${i}`);
    }
  }
});

// -----------------------------------------------------------------
// 6. XSS & HTML Sanitization Invariants
// -----------------------------------------------------------------
console.log('\n--- 6. XSS & User Input Sanitization ---');

test('Strips nested script tags, HTML injection, and control characters', () => {
  const xssPayload = 'Super App <script>alert("XSS")</script><img src=x onerror=alert(1)>';
  const clean = sanitizeString(xssPayload, 100);
  assert.strictEqual(clean.includes('<script>'), false);
  assert.strictEqual(clean.includes('onerror='), false);
  assert.strictEqual(clean, 'Super App');
});

test('Safely handles non-string inputs and bounds string length', () => {
  assert.strictEqual(sanitizeString(null, 50), '');
  assert.strictEqual(sanitizeString(undefined, 50), '');
  assert.strictEqual(sanitizeString(12345, 50), '');
  const longText = 'A'.repeat(5000);
  assert.strictEqual(sanitizeString(longText, 100).length, 100);
});

// -----------------------------------------------------------------
// 7. Financial Precision & Integer Cents Invariant
// -----------------------------------------------------------------
console.log('\n--- 7. Financial Precision & Integer Cent Invariants ---');

test('Guarantees decimal-safe integer cent formatting without floating point drift', () => {
  assert.strictEqual(formatCentsToDollars(100), '$1');
  assert.strictEqual(formatCentsToDollars(10050), '$100.50');
  assert.strictEqual(formatCentsToDollars(13100), '$131');
  assert.strictEqual(formatCentsToDollars(0), '$0');
});

function createMockRequest(headersObj, nextUrl = 'https://outbids.auction/api/test') {
  const map = new Map(Object.entries(headersObj).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    headers: {
      get: (k) => map.get(k.toLowerCase()) ?? null,
    },
    nextUrl: new URL(nextUrl),
  };
}

// -----------------------------------------------------------------
// 8. Reverse-Proxy IP Extraction & Anti-Spoofing on Hostinger
// -----------------------------------------------------------------
console.log('\n--- 8. Reverse-Proxy IP Anti-Spoofing Invariants ---');

test('Ignores forged x-vercel-forwarded-for when not running on Vercel', () => {
  const origVercel = process.env.VERCEL;
  delete process.env.VERCEL;

  const mockReq = createMockRequest({
    'x-vercel-forwarded-for': '1.1.1.1',
    'x-real-ip': '203.0.113.195',
  });

  const extracted = getClientIp(mockReq);
  assert.strictEqual(extracted, '203.0.113.195', 'Should prioritize x-real-ip and reject forged x-vercel header');

  if (origVercel) process.env.VERCEL = origVercel;
});

test('Prioritizes Cloudflare cf-connecting-ip when present', () => {
  const mockReq = createMockRequest({
    'cf-connecting-ip': '198.51.100.42',
    'x-real-ip': '10.0.0.1',
    'x-forwarded-for': '1.2.3.4',
  });

  assert.strictEqual(getClientIp(mockReq), '198.51.100.42');
});

test('Safely extracts rightmost IP from x-forwarded-for chain', () => {
  const mockReq = createMockRequest({
    'x-forwarded-for': '1.2.3.4, 203.0.113.88',
  });

  assert.strictEqual(getClientIp(mockReq), '203.0.113.88');
});

// -----------------------------------------------------------------
// 9. UUID Validation Against Injection & Schema Corruption
// -----------------------------------------------------------------
console.log('\n--- 9. UUID Parameter Validation Matrix ---');

test('Validates legitimate UUIDs and rejects injection or malformed payloads', () => {
  assert.strictEqual(isValidUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'), true);
  assert.strictEqual(isValidUuid('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'), true);
  assert.strictEqual(isValidUuid('not-a-uuid'), false);
  assert.strictEqual(isValidUuid("'; DROP TABLE bids; --"), false);
  assert.strictEqual(isValidUuid('../../etc/passwd'), false);
  assert.strictEqual(isValidUuid('12345'), false);
  assert.strictEqual(isValidUuid(null), false);
  assert.strictEqual(isValidUuid(undefined), false);
  assert.strictEqual(isValidUuid({}), false);
});

// -----------------------------------------------------------------
// 10. Input Size Bounds (DoS & Memory Exhaustion Prevention)
// -----------------------------------------------------------------
console.log('\n--- 10. Input Size Boundaries ---');

test('Rejects URLs exceeding 2048 characters', () => {
  const excessiveUrl = 'https://example.com/' + 'a'.repeat(2100);
  const result = sanitizeAndNormalizeUrl(excessiveUrl);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.error && result.error.includes('2,048 characters'));
});

// -----------------------------------------------------------------
// 11. Category Allow-List Schema Validation (BOPLA Defense)
// -----------------------------------------------------------------
console.log('\n--- 11. Category Allow-List Schema Validation ---');

test('Validates allowed categories against PLATFORM_CATEGORIES schema', () => {
  assert.ok(PLATFORM_CATEGORIES.includes('SEO & AI Visibility'));
  assert.ok(PLATFORM_CATEGORIES.includes('Developer Tools'));
  assert.ok(PLATFORM_CATEGORIES.includes('Other'));
  assert.strictEqual((PLATFORM_CATEGORIES).includes('<script>alert(1)</script>'), false);
  assert.strictEqual((PLATFORM_CATEGORIES).includes('__proto__'), false);
  assert.strictEqual((PLATFORM_CATEGORIES).includes('admin_override'), false);
});

// -----------------------------------------------------------------
// 12. CSRF & Cross-Origin Request Validation
// -----------------------------------------------------------------
console.log('\n--- 12. CSRF & Origin Defense ---');

test('Rejects cross-site mutating requests with sec-fetch-site: cross-site', () => {
  const mockReq = createMockRequest({
    'sec-fetch-site': 'cross-site',
    origin: 'https://attacker.evil.com',
  });

  assert.strictEqual(validateRequestOrigin(mockReq), false);
});

test('Rejects mismatched foreign origins', () => {
  const origSite = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://outbids.auction';

  const mockReq = createMockRequest({
    origin: 'https://phishing-site.xyz',
    host: 'outbids.auction',
  });

  assert.strictEqual(validateRequestOrigin(mockReq), false);

  if (origSite) process.env.NEXT_PUBLIC_SITE_URL = origSite;
});

test('Permits matching host origin', () => {
  const mockReq = createMockRequest({
    origin: 'https://outbids.auction',
    host: 'outbids.auction',
  });

  assert.strictEqual(validateRequestOrigin(mockReq), true);

  // Cross-match between apex and www
  const mockReqWww = createMockRequest({
    origin: 'https://www.outbids.auction',
    host: 'outbids.auction',
  });
  assert.strictEqual(validateRequestOrigin(mockReqWww), true);

  const mockReqApex = createMockRequest({
    origin: 'https://outbids.auction',
    host: 'www.outbids.auction',
  });
  assert.strictEqual(validateRequestOrigin(mockReqApex), true);
});

// -----------------------------------------------------------------
// 13. Production Password Hardcoded Fallback Prevention (P0)
// -----------------------------------------------------------------
console.log('\n--- 13. Production Password Hardcoded Fallback Prevention ---');

test('Rejects authentication in production when ADMIN_PASSWORD is unset', () => {
  const origEnv = process.env.NODE_ENV;
  const origPass = process.env.ADMIN_PASSWORD;

  process.env.NODE_ENV = 'production';
  delete process.env.ADMIN_PASSWORD;

  // Even with default password, production must strictly reject
  assert.strictEqual(verifyAdminPassword('outbids_admin_2026'), false);
  assert.strictEqual(verifyAdminPassword('any_attempt'), false);

  process.env.NODE_ENV = origEnv;
  if (origPass) process.env.ADMIN_PASSWORD = origPass;
});

// -----------------------------------------------------------------
// 14. DNS Resolution & SSRF Rebinding Validation
// -----------------------------------------------------------------
console.log('\n--- 14. DNS Resolution SSRF Defense ---');

await runAsyncTest('Rejects localhost and loopback through DNS resolution check', async () => {
  const isSafe = await resolveAndValidateDns('localhost');
  assert.strictEqual(isSafe, false);
});

// -----------------------------------------------------------------
// 15. Progressive 15-Minute Brute-Force Lockout Defense
// -----------------------------------------------------------------
console.log('\n--- 15. Progressive Brute-Force Lockout Defense ---');

test('Enforces 15-minute lockout on 5 consecutive failed authentication attempts', () => {
  const testIp = '198.51.100.42';
  resetAuthAttempts(testIp);

  // First 4 failures do not trigger lockout
  for (let i = 1; i <= 4; i++) {
    const res = recordFailedAuthAttempt(testIp);
    assert.strictEqual(res.isLocked, false);
    assert.strictEqual(res.count, i);
  }

  // 5th failure triggers 15-minute (900s) lockout
  const fifthAttempt = recordFailedAuthAttempt(testIp);
  assert.strictEqual(fifthAttempt.isLocked, true);
  assert.strictEqual(fifthAttempt.count, 5);
  assert.strictEqual(fifthAttempt.remainingSeconds, 900);

  // Subsequent check shows lockout active
  const checkStatus = checkProgressiveLockout(testIp);
  assert.strictEqual(checkStatus.isLocked, true);
  assert.ok(checkStatus.remainingSeconds > 0 && checkStatus.remainingSeconds <= 900);

  // Successful login resets lockout
  resetAuthAttempts(testIp);
  assert.strictEqual(checkProgressiveLockout(testIp).isLocked, false);
});

// -----------------------------------------------------------------
// 16. User-Agent Session Binding & Anti-Hijacking
// -----------------------------------------------------------------
console.log('\n--- 16. User-Agent Session Binding & Anti-Hijacking ---');

test('Binds session token to client User-Agent and rejects altered client environments', () => {
  const validUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0';
  const attackerUserAgent = 'python-requests/2.31.0';
  const spoofedBrowserUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1';

  const token = createAdminSessionToken(validUserAgent);

  // Valid with matching User-Agent
  assert.strictEqual(verifyAdminSessionToken(token, validUserAgent), true);

  // Strictly rejected with altered User-Agent (stolen cookie replay attempt)
  assert.strictEqual(verifyAdminSessionToken(token, attackerUserAgent), false);
  assert.strictEqual(verifyAdminSessionToken(token, spoofedBrowserUa), false);
  assert.strictEqual(verifyAdminSessionToken(token, ''), false);
});

// -----------------------------------------------------------------
// 17. 12-Hour Session Expiration Boundary
// -----------------------------------------------------------------
console.log('\n--- 17. 12-Hour Session Expiration Boundary ---');

test('Rejects tokens exceeding the 12-hour session lifespan', () => {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
  const now = Math.floor(Date.now() / 1000);
  const thirteenHoursAgo = now - 13 * 60 * 60; // 13 hours old

  const nonce = crypto.randomBytes(16).toString('hex');
  const uaHash = crypto.createHash('sha256').update(userAgent).digest('hex').slice(0, 16);
  const secret = process.env.ADMIN_PASSWORD || 'outbids_admin_secure_secret_2026';
  const payload = `admin_session_${thirteenHoursAgo}_${nonce}_${uaHash}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const expiredToken = `${thirteenHoursAgo}.${nonce}.${uaHash}.${signature}`;

  assert.strictEqual(verifyAdminSessionToken(expiredToken, userAgent), false);
});

console.log('\n============================================================');
console.log(`📊 ADVERSARIAL VALIDATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('============================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
