import assert from 'assert';

console.log('\n============================================================');
console.log('💳 OUTBIDS.AUCTION CHECKOUT VERIFICATION RECONCILIATION TESTS');
console.log('============================================================\n');

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

const PAYMENT_ID_REGEX = /^pay_[A-Za-z0-9_-]{8,100}$/;

test('Rejects invalid or malformed payment_id formats', () => {
  assert.strictEqual(PAYMENT_ID_REGEX.test(''), false);
  assert.strictEqual(PAYMENT_ID_REGEX.test('pay_'), false);
  assert.strictEqual(PAYMENT_ID_REGEX.test('pay_123'), false); // too short
  assert.strictEqual(PAYMENT_ID_REGEX.test('sub_0Nn48icfxbf9ReNpInmsN'), false); // not pay_
  assert.strictEqual(PAYMENT_ID_REGEX.test('pay_0Nn48icfxbf9<script>'), false); // script injection
  assert.strictEqual(PAYMENT_ID_REGEX.test("pay_0Nn48icfxbf9' OR 1=1--"), false); // SQL injection
  assert.strictEqual(PAYMENT_ID_REGEX.test('pay_0Nn48icfxbf9ReNpInmsN; DROP TABLE'), false);
});

test('Validates legitimate Dodo Payments ID formats', () => {
  assert.strictEqual(PAYMENT_ID_REGEX.test('pay_0Nn48icfxbf9ReNpInmsN'), true);
  assert.strictEqual(PAYMENT_ID_REGEX.test('pay_test_1234567890'), true);
  assert.strictEqual(PAYMENT_ID_REGEX.test('pay_abc123-def456_ghi789'), true);
});

console.log(`\n============================================================`);
console.log(`📊 CHECKOUT VERIFY SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`============================================================\n`);
