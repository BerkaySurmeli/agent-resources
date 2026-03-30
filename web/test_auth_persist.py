#!/usr/bin/env python3
"""
End-to-end test for auth persistence across page refreshes.
Tests that a user remains logged in after multiple refreshes.
"""
import subprocess
import json
import sys

# Test configuration
BASE_URL = "https://shopagentresources.com"
API_URL = "https://api.shopagentresources.com"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def run_curl(url, method="GET", headers=None, data=None):
    """Run curl command and return response"""
    cmd = ["curl", "-s", "-w", "\\n%{http_code}"]
    
    if method != "GET":
        cmd.extend(["-X", method])
    
    if headers:
        for key, value in headers.items():
            cmd.extend(["-H", f"{key}: {value}"])
    
    if data:
        cmd.extend(["-d", json.dumps(data)])
    
    cmd.append(url)
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    output = result.stdout.strip()
    
    # Split body and status code
    lines = output.split("\n")
    status_code = lines[-1]
    body = "\n".join(lines[:-1])
    
    return int(status_code), body

def test_login_and_persist():
    """Test that login works and user persists across refreshes"""
    print("=" * 60)
    print("AUTH PERSISTENCE E2E TEST")
    print("=" * 60)
    
    # Step 1: Test login endpoint
    print("\n[TEST 1] Testing login endpoint...")
    status, body = run_curl(
        f"{API_URL}/auth/login",
        method="POST",
        headers={"Content-Type": "application/json"},
        data={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    
    if status == 200:
        print(f"  ✓ Login successful (status {status})")
        response_data = json.loads(body)
        token = response_data.get("access_token")
        user = response_data.get("user")
        print(f"  ✓ Got token: {token[:20]}..." if token else "  ✗ No token received")
        print(f"  ✓ Got user: {user.get('email')}" if user else "  ✗ No user received")
    elif status == 401:
        print(f"  ⚠ Login failed (status {status}) - user may not exist")
        print(f"  Response: {body[:200]}")
        print("\n  Creating test user...")
        # Try to create user
        status2, body2 = run_curl(
            f"{API_URL}/auth/signup",
            method="POST",
            headers={"Content-Type": "application/json"},
            data={"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": "Test User"}
        )
        if status2 == 200:
            print(f"  ✓ User created successfully")
            response_data = json.loads(body2)
            token = response_data.get("access_token")
        else:
            print(f"  ✗ Failed to create user (status {status2})")
            print(f"  Response: {body2[:200]}")
            return False
    else:
        print(f"  ✗ Login failed (status {status})")
        print(f"  Response: {body[:200]}")
        return False
    
    # Step 2: Test token validation
    print("\n[TEST 2] Testing token validation...")
    status, body = run_curl(
        f"{API_URL}/auth/validate",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if status == 200:
        print(f"  ✓ Token valid (status {status})")
    else:
        print(f"  ✗ Token invalid (status {status})")
        print(f"  Response: {body[:200]}")
        return False
    
    # Step 3: Test dashboard access with token
    print("\n[TEST 3] Testing dashboard access with token...")
    status, body = run_curl(
        f"{API_URL}/listings/my-listings",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if status == 200:
        print(f"  ✓ Dashboard accessible (status {status})")
    elif status == 401:
        print(f"  ✗ Dashboard not accessible (status {status}) - token rejected")
        return False
    else:
        print(f"  ⚠ Unexpected status {status}")
        print(f"  Response: {body[:200]}")
    
    # Step 4: Simulate "refresh" by validating token again
    print("\n[TEST 4] Simulating page refresh (token validation #2)...")
    status, body = run_curl(
        f"{API_URL}/auth/validate",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if status == 200:
        print(f"  ✓ Token still valid after refresh (status {status})")
    else:
        print(f"  ✗ Token invalid after refresh (status {status})")
        print(f"  Response: {body[:200]}")
        return False
    
    # Step 5: Simulate second refresh
    print("\n[TEST 5] Simulating second page refresh (token validation #3)...")
    status, body = run_curl(
        f"{API_URL}/auth/validate",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if status == 200:
        print(f"  ✓ Token still valid after 2nd refresh (status {status})")
    else:
        print(f"  ✗ Token invalid after 2nd refresh (status {status})")
        print(f"  Response: {body[:200]}")
        return False
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_login_and_persist()
    sys.exit(0 if success else 1)
