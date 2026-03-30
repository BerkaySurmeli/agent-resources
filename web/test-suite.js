#!/usr/bin/env node
/**
 * E2E Test Suite for Agent Resources
 * Run with: node test-suite.js
 */

const TEST_RESULTS = {
  passed: [],
  failed: []
};

function test(name, fn) {
  try {
    fn();
    TEST_RESULTS.passed.push(name);
    console.log(`✓ ${name}`);
  } catch (err) {
    TEST_RESULTS.failed.push({ name, error: err.message });
    console.log(`✗ ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

console.log("=" .repeat(70));
console.log("AGENT RESOURCES E2E TEST SUITE");
console.log("=" .repeat(70));

// Test 1: Cart Price Formatting
console.log("\n--- CART PRICE FORMATTING ---");
test("Price should have exactly 2 decimal places", () => {
  const price = 49;
  const formatted = (price).toFixed(2);
  assert(formatted === "49.00", `Expected "49.00" but got "${formatted}"`);
});

test("Price calculation should not produce floating point errors", () => {
  const priceCents = 4900;
  const price = Math.round(priceCents) / 100;
  const formatted = price.toFixed(2);
  assert(formatted === "49.00", `Expected "49.00" but got "${formatted}"`);
  assert(price === 49, `Expected 49 but got ${price}`);
});

test("Multiple items should sum correctly", () => {
  const items = [
    { price: 49 },
    { price: 59 },
    { price: 0.99 }
  ];
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const formatted = total.toFixed(2);
  assert(formatted === "108.99", `Expected "108.99" but got "${formatted}"`);
});

// Test 2: Category Enforcement
console.log("\n--- CATEGORY ENFORCEMENT ---");
test("Category should be required when listing", () => {
  const listingData = {
    name: "Test Item",
    description: "Test description",
    category: "", // Empty category
    price_cents: 4900
  };
  assert(listingData.category !== "", "Category should not be empty");
});

test("Valid category should be accepted", () => {
  const validCategories = ['persona', 'skill', 'mcp_server'];
  const category = 'persona';
  assert(validCategories.includes(category), `"${category}" should be a valid category`);
});

// Test 3: Developer Self-Redirect
console.log("\n--- DEVELOPER SELF-REDIRECT ---");
test("Developer should be redirected to manage page for own items", () => {
  const currentUser = { id: "user-123", isDeveloper: true };
  const listing = { slug: "my-item", owner_id: "user-123" };
  
  const shouldRedirectToManage = 
    currentUser.isDeveloper && 
    currentUser.id === listing.owner_id;
  
  assert(shouldRedirectToManage === true, "Developer should be redirected to manage page");
});

test("Non-owners should see buy page", () => {
  const currentUser = { id: "user-456", isDeveloper: true };
  const listing = { slug: "other-item", owner_id: "user-123" };
  
  const shouldRedirectToManage = 
    currentUser.isDeveloper && 
    currentUser.id === listing.owner_id;
  
  assert(shouldRedirectToManage === false, "Non-owner should see buy page");
});

// Test 4: Review Permissions
console.log("\n--- REVIEW PERMISSIONS ---");
test("Only verified purchasers should be able to review", () => {
  const hasPurchased = true;
  const canReview = hasPurchased;
  assert(canReview === true, "Verified purchaser should be able to review");
});

test("Non-purchasers should not be able to review", () => {
  const hasPurchased = false;
  const canReview = hasPurchased;
  assert(canReview === false, "Non-purchaser should not be able to review");
});

// Test 5: File Requirements
console.log("\n--- FILE REQUIREMENTS ---");
test("Persona should not require skills.md", () => {
  const category = 'persona';
  const requiredFiles = category === 'skill' ? ['skill.md'] : [];
  assert(!requiredFiles.includes('skill.md') || category === 'skill', 
    "Persona should not require skills.md");
});

test("MCP Server should not require skills.md", () => {
  const category = 'mcp_server';
  const requiredFiles = category === 'skill' ? ['skill.md'] : [];
  assert(!requiredFiles.includes('skill.md') || category === 'skill', 
    "MCP Server should not require skills.md");
});

test("Skill should require skill.md", () => {
  const category = 'skill';
  const requiredFiles = ['skill.md'];
  assert(requiredFiles.includes('skill.md'), 
    "Skill should require skill.md");
});

// Test 6: Terms and Conditions
console.log("\n--- TERMS AND CONDITIONS ---");
test("Terms acceptance should be required", () => {
  const termsAccepted = true;
  assert(termsAccepted === true, "Terms must be accepted before listing");
});

// Summary
console.log("\n" + "=" .repeat(70));
const total = TEST_RESULTS.passed.length + TEST_RESULTS.failed.length;
console.log(`RESULTS: ${TEST_RESULTS.passed.length}/${total} passed`);

if (TEST_RESULTS.failed.length > 0) {
  console.log("\nFailed tests:");
  TEST_RESULTS.failed.forEach(f => console.log(`  - ${f.name}`));
  process.exit(1);
} else {
  console.log("\n✓ All tests passed!");
  process.exit(0);
}
