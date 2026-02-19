#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import tempfile
import os

class AlarkoEnerjiAPITester:
    def __init__(self):
        self.base_url = "https://alarko-enerji.preview.emergentagent.com/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_project_id = None
        self.test_bank_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart
                    headers_copy = {k: v for k, v in default_headers.items() if k != 'Content-Type'}
                    response = requests.post(url, files=files, headers=headers_copy)
                else:
                    response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"   ✅ Passed - Status: {response.status_code}")
                return True, response.json() if response.content else {}
            else:
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200] if response.content else ''
                })
                print(f"   ❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            print(f"   ❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        print("\n=== AUTHENTICATION TESTS ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@alarkoenerji.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        test_email = f"test_{timestamp}@example.com"
        
        success, response = self.run_test(
            "User Registration",
            "POST", 
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": f"Test User {timestamp}",
                "phone": "+90 555 123 4567"
            }
        )
        if success and 'token' in response:
            self.user_token = response['token']
            self.test_user_id = response.get('user', {}).get('user_id')
            print(f"   User registered: {test_email}")
            print(f"   User token obtained: {self.user_token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test auth/me endpoint"""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Get Current User (Admin)",
            "GET",
            "auth/me", 
            200,
            headers=headers
        )
        if success:
            print(f"   Admin user: {response.get('name', 'Unknown')} - {response.get('role', 'No Role')}")
        return success

    def test_projects_endpoints(self):
        """Test project-related endpoints"""
        print("\n=== PROJECT TESTS ===")
        
        # Test get all projects
        success, projects = self.run_test("Get All Projects", "GET", "projects", 200)
        if success and projects:
            print(f"   Found {len(projects)} projects")
            self.test_project_id = projects[0].get('project_id')
            
        # Test get projects with filter
        self.run_test("Get GES Projects", "GET", "projects?type=GES", 200)
        self.run_test("Get RES Projects", "GET", "projects?type=RES", 200)
        
        # Test get single project
        if self.test_project_id:
            success, project = self.run_test(
                "Get Single Project",
                "GET", 
                f"projects/{self.test_project_id}",
                200
            )
            if success:
                print(f"   Project: {project.get('name', 'Unknown')}")
        
        return success

    def test_banks_endpoint(self):
        """Test banks endpoint"""
        print("\n=== BANK TESTS ===")
        
        success, banks = self.run_test("Get Banks", "GET", "banks", 200)
        if success and banks:
            print(f"   Found {len(banks)} banks")
            self.test_bank_id = banks[0].get('bank_id')
            for bank in banks[:2]:  # Show first 2 banks
                print(f"   Bank: {bank.get('name', 'Unknown')} - {bank.get('iban', 'No IBAN')}")
        return success

    def test_portfolio_endpoints(self):
        """Test portfolio endpoints (requires user token)"""
        print("\n=== PORTFOLIO TESTS ===")
        
        if not self.user_token:
            print("   ⚠️  Skipping portfolio tests - no user token")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Test get portfolio
        success, portfolio = self.run_test(
            "Get User Portfolio",
            "GET", 
            "portfolio",
            200,
            headers=headers
        )
        if success:
            print(f"   Portfolio balance: {portfolio.get('balance', 0)} TL")
            print(f"   Total invested: {portfolio.get('total_invested', 0)} TL")
            
        return success

    def test_transaction_endpoints(self):
        """Test transaction endpoints"""
        print("\n=== TRANSACTION TESTS ===")
        
        if not self.user_token:
            print("   ⚠️  Skipping transaction tests - no user token") 
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Test get user transactions
        success, transactions = self.run_test(
            "Get User Transactions",
            "GET",
            "transactions", 
            200,
            headers=headers
        )
        if success:
            print(f"   Found {len(transactions)} transactions")
            
        return success

    def test_notification_endpoints(self):
        """Test notification endpoints"""
        print("\n=== NOTIFICATION TESTS ===")
        
        if not self.user_token:
            print("   ⚠️  Skipping notification tests - no user token")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Test get notifications
        success, response = self.run_test(
            "Get User Notifications",
            "GET",
            "notifications",
            200, 
            headers=headers
        )
        if success:
            notifications = response.get('notifications', [])
            unread_count = response.get('unread_count', 0)
            print(f"   Found {len(notifications)} notifications, {unread_count} unread")
            
        return success

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        print("\n=== ADMIN TESTS ===")
        
        if not self.admin_token:
            print("   ⚠️  Skipping admin tests - no admin token")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test admin stats
        success, stats = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200,
            headers=headers
        )
        if success:
            print(f"   Total users: {stats.get('total_users', 0)}")
            print(f"   Pending KYC: {stats.get('pending_kyc', 0)}")
            print(f"   Total projects: {stats.get('total_projects', 0)}")
            print(f"   Total balance: {stats.get('total_balance', 0)} TL")
            
        return success

    def test_admin_users(self):
        """Test admin users endpoint"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        success, users = self.run_test(
            "Get Admin Users",
            "GET",
            "admin/users",
            200,
            headers=headers
        )
        if success:
            print(f"   Found {len(users)} users in system")
            
        return success

    def test_admin_transactions(self):
        """Test admin transactions endpoint"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        success, transactions = self.run_test(
            "Get Admin Transactions",
            "GET", 
            "admin/transactions",
            200,
            headers=headers
        )
        if success:
            print(f"   Found {len(transactions)} total transactions")
            
        return success

    def test_admin_kyc(self):
        """Test admin KYC endpoint"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        success, kyc_docs = self.run_test(
            "Get Admin KYC Documents",
            "GET",
            "admin/kyc",
            200,
            headers=headers
        )
        if success:
            print(f"   Found {len(kyc_docs)} KYC documents")
            
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Alarko Enerji API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Core tests that should always pass
        self.test_admin_login()
        self.test_user_registration() 
        self.test_auth_me()
        self.test_projects_endpoints()
        self.test_banks_endpoint()
        
        # User-specific tests
        self.test_portfolio_endpoints()
        self.test_transaction_endpoints()
        self.test_notification_endpoints()
        
        # Admin-specific tests
        self.test_admin_stats()
        self.test_admin_users()
        self.test_admin_transactions()
        self.test_admin_kyc()
        
        # Print results
        print("\n" + "=" * 60)
        print("🏁 TEST RESULTS")
        print("=" * 60)
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n📋 FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   • {failure.get('name', 'Unknown')}")
                if 'expected' in failure:
                    print(f"     Expected: {failure['expected']}, Got: {failure['actual']}")
                if 'error' in failure:
                    print(f"     Error: {failure['error']}")
                if 'response' in failure and failure['response']:
                    print(f"     Response: {failure['response']}")
                print()
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AlarkoEnerjiAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())