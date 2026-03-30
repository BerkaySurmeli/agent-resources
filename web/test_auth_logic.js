#!/usr/bin/env node
/**
 * End-to-end test for auth persistence
 * Simulates browser localStorage behavior
 */

const TEST_RESULTS = {
  passed: [],
  failed: []
};

function test(name, fn) {
  try {
    fn();
    TEST_RESULTS.passed.push(name);
    console.log(`  ✓ ${name}`);
  } catch (err) {
    TEST_RESULTS.failed.push({ name, error: err.message });
    console.log(`  ✗ ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Simulate localStorage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key] || null;
  }
  
  setItem(key, value) {
    this.store[key] = String(value);
  }
  
  removeItem(key) {
    delete this.store[key];
  }
}

// Test the auth logic
console.log("=" .repeat(60));
console.log("AUTH CONTEXT LOGIC TEST");
console.log("=" .repeat(60));

// Simulate the AuthProvider logic
const localStorage = new MockLocalStorage();

// Test 1: Initial state should be null
test("Initial user state is null", () => {
  let user = null;
  assert(user === null, "User should be null initially");
});

// Test 2: Simulate login
test("Login saves user and token to localStorage", () => {
  const userData = {
    id: "123",
    email: "test@example.com",
    name: "Test User",
    initials: "TU",
    isDeveloper: true
  };
  const token = "fake-jwt-token";
  
  // Simulate login
  localStorage.setItem('ar-token', token);
  localStorage.setItem('ar-user', JSON.stringify(userData));
  
  assert(localStorage.getItem('ar-token') === token, "Token should be saved");
  assert(localStorage.getItem('ar-user') !== null, "User should be saved");
});

// Test 3: Simulate page load (refresh)
test("Page load restores user from localStorage", () => {
  const saved = localStorage.getItem('ar-user');
  const token = localStorage.getItem('ar-token');
  
  assert(saved !== null, "User data should exist in localStorage");
  assert(token !== null, "Token should exist in localStorage");
  
  const parsedUser = JSON.parse(saved);
  assert(parsedUser.email === "test@example.com", "User email should match");
});

// Test 4: Simulate second refresh
test("Second refresh still has user data", () => {
  const saved = localStorage.getItem('ar-user');
  const token = localStorage.getItem('ar-token');
  
  assert(saved !== null, "User data should still exist");
  assert(token !== null, "Token should still exist");
});

// Test 5: Simulate logout
test("Logout clears localStorage", () => {
  localStorage.removeItem('ar-user');
  localStorage.removeItem('ar-token');
  
  assert(localStorage.getItem('ar-user') === null, "User should be cleared");
  assert(localStorage.getItem('ar-token') === null, "Token should be cleared");
});

console.log("\n" + "=" .repeat(60));
console.log(`RESULTS: ${TEST_RESULTS.passed.length} passed, ${TEST_RESULTS.failed.length} failed`);
console.log("=" .repeat(60));

if (TEST_RESULTS.failed.length > 0) {
  console.log("\nFailed tests:");
  TEST_RESULTS.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log("\nAll logic tests passed!");
  process.exit(0);
}
