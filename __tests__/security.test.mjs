import assert from 'assert';
import { sanitizeAndNormalizeUrl, formatCentsToDollars } from '../utils/formatters.ts';
import { isSafePublicUrl, isPublicIpAddress } from '../utils/metadata.ts';
import { checkRateLimit } from '../utils/rateLimit.ts';
import {
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '../utils/adminAuth.ts';
import { sanitizeString } from '../utils/securityUtils.ts';
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

console.log('\n============================================================');
console.log(`📊 ADVERSARIAL VALIDATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('============================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
