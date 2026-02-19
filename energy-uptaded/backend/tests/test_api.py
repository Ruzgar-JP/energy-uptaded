"""
Alarko Enerji API Test Suite
Tests authentication, admin operations, transactions, password change, and user management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://alarko-enerji.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@alarkoenerji.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = f"testuser_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Test User"

class TestAuthEndpoints:
    """Authentication API tests"""
    
    def test_admin_login_success(self):
        """Test admin can login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        
    def test_login_invalid_credentials(self):
        """Test login fails with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        
    def test_user_registration(self):
        """Test user registration creates new account"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "phone": "+90 555 111 2222"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        assert data["user"]["role"] == "investor"
        assert data["user"]["kyc_status"] == "pending"
        
    def test_get_current_user_without_token(self):
        """Test /auth/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


class TestPasswordChange:
    """Password change API tests"""
    
    @pytest.fixture
    def user_token(self):
        """Create test user and return token"""
        email = f"pwtest_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "oldpass123",
            "name": "Password Test User"
        })
        return response.json()["token"]
    
    def test_password_change_success(self, user_token):
        """Test password can be changed with correct current password"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": "oldpass123",
            "new_password": "newpass456"
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Sifre basariyla degistirildi"
        
    def test_password_change_wrong_current(self, user_token):
        """Test password change fails with wrong current password"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": "wrongpassword",
            "new_password": "newpass456"
        }, headers=headers)
        assert response.status_code == 400
        
    def test_password_change_short_new_password(self, user_token):
        """Test password change fails if new password is too short"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": "oldpass123",
            "new_password": "short"
        }, headers=headers)
        assert response.status_code == 400


class TestProjectEndpoints:
    """Project API tests"""
    
    def test_get_all_projects(self):
        """Test fetching all projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4  # Seeded projects
        
    def test_get_projects_filter_ges(self):
        """Test filtering projects by GES type"""
        response = requests.get(f"{BASE_URL}/api/projects?type=GES")
        assert response.status_code == 200
        data = response.json()
        for project in data:
            assert project["type"] == "GES"
            
    def test_get_projects_filter_res(self):
        """Test filtering projects by RES type"""
        response = requests.get(f"{BASE_URL}/api/projects?type=RES")
        assert response.status_code == 200
        data = response.json()
        for project in data:
            assert project["type"] == "RES"
            
    def test_get_single_project(self):
        """Test fetching a single project by ID"""
        # First get all projects
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == project_id


class TestBankEndpoints:
    """Bank API tests"""
    
    def test_get_all_banks(self):
        """Test fetching all active banks"""
        response = requests.get(f"{BASE_URL}/api/banks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4  # Seeded banks


class TestWithdrawalFlow:
    """Withdrawal flow tests - validates balance is NOT deducted on request creation"""
    
    @pytest.fixture
    def user_with_balance(self):
        """Create a user with balance for withdrawal testing"""
        # Admin login
        admin_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        admin_token = admin_resp.json()["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        email = f"withdraw_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass123", "name": "Withdraw Test"
        })
        user_data = reg_resp.json()
        user_id = user_data["user"]["user_id"]
        user_token = user_data["token"]
        
        # Add balance to user via admin
        requests.put(f"{BASE_URL}/api/admin/users/{user_id}/balance", json={
            "amount": 10000, "type": "add"
        }, headers=admin_headers)
        
        return {"token": user_token, "user_id": user_id, "admin_token": admin_token}
    
    def test_withdrawal_request_does_not_deduct_balance(self, user_with_balance):
        """Test that creating withdrawal request does NOT immediately deduct balance"""
        user_headers = {"Authorization": f"Bearer {user_with_balance['token']}"}
        
        # Check initial balance
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers)
        initial_balance = me_resp.json()["balance"]
        assert initial_balance == 10000
        
        # Create withdrawal request
        withdraw_resp = requests.post(f"{BASE_URL}/api/transactions", json={
            "amount": 5000, "type": "withdrawal"
        }, headers=user_headers)
        assert withdraw_resp.status_code == 200
        txn_data = withdraw_resp.json()
        assert txn_data["status"] == "pending"
        
        # Verify balance is NOT deducted
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers)
        current_balance = me_resp.json()["balance"]
        assert current_balance == 10000, f"Balance should remain 10000, got {current_balance}"
        
    def test_admin_approve_withdrawal_deducts_balance(self, user_with_balance):
        """Test that admin approval deducts balance"""
        user_headers = {"Authorization": f"Bearer {user_with_balance['token']}"}
        admin_headers = {"Authorization": f"Bearer {user_with_balance['admin_token']}"}
        
        # Create withdrawal request
        withdraw_resp = requests.post(f"{BASE_URL}/api/transactions", json={
            "amount": 3000, "type": "withdrawal"
        }, headers=user_headers)
        txn_id = withdraw_resp.json()["transaction_id"]
        
        # Verify balance before approval
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers)
        balance_before = me_resp.json()["balance"]
        
        # Admin approves
        approve_resp = requests.put(f"{BASE_URL}/api/admin/transactions/{txn_id}", json={
            "status": "approved"
        }, headers=admin_headers)
        assert approve_resp.status_code == 200
        
        # Verify balance is deducted AFTER approval
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers)
        balance_after = me_resp.json()["balance"]
        assert balance_after == balance_before - 3000


class TestAdminUserOperations:
    """Admin user management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_admin_get_all_users(self, admin_token):
        """Test admin can get all users"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_admin_get_stats(self, admin_token):
        """Test admin can get dashboard stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "pending_kyc" in data
        assert "total_projects" in data
        
    def test_admin_edit_user_info(self, admin_token):
        """Test admin can edit user info via PUT /admin/users/{user_id}/info"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        email = f"editme_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass123", "name": "Original Name"
        })
        user_id = reg_resp.json()["user"]["user_id"]
        
        # Admin edits user info
        new_email = f"edited_{uuid.uuid4().hex[:8]}@test.com"
        edit_resp = requests.put(f"{BASE_URL}/api/admin/users/{user_id}/info", json={
            "name": "Updated Name",
            "email": new_email,
            "phone": "+90 555 333 4444"
        }, headers=headers)
        
        assert edit_resp.status_code == 200
        updated_user = edit_resp.json()
        assert updated_user["name"] == "Updated Name"
        assert updated_user["email"] == new_email
        assert updated_user["phone"] == "+90 555 333 4444"
        
        # Verify persistence with GET
        users_resp = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_resp.json()
        found_user = next((u for u in users if u["user_id"] == user_id), None)
        assert found_user is not None
        assert found_user["name"] == "Updated Name"
        assert found_user["email"] == new_email
        
    def test_admin_update_user_balance(self, admin_token):
        """Test admin can add/subtract user balance"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        email = f"balance_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass123", "name": "Balance Test"
        })
        user_id = reg_resp.json()["user"]["user_id"]
        
        # Add balance
        add_resp = requests.put(f"{BASE_URL}/api/admin/users/{user_id}/balance", json={
            "amount": 5000, "type": "add"
        }, headers=headers)
        assert add_resp.status_code == 200
        assert add_resp.json()["balance"] == 5000
        
        # Subtract balance
        sub_resp = requests.put(f"{BASE_URL}/api/admin/users/{user_id}/balance", json={
            "amount": 2000, "type": "subtract"
        }, headers=headers)
        assert sub_resp.status_code == 200
        assert sub_resp.json()["balance"] == 3000


class TestAdminTransactions:
    """Admin transaction management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_admin_get_all_transactions(self, admin_token):
        """Test admin can get all transactions"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/transactions", headers=headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_admin_approve_deposit(self, admin_token):
        """Test admin can approve deposit which adds balance"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        email = f"deposit_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass123", "name": "Deposit Test"
        })
        user_token = reg_resp.json()["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Create deposit request
        deposit_resp = requests.post(f"{BASE_URL}/api/transactions", json={
            "amount": 8000, "type": "deposit"
        }, headers=user_headers)
        txn_id = deposit_resp.json()["transaction_id"]
        
        # Check balance before (should be 0)
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers)
        assert me_resp.json()["balance"] == 0
        
        # Admin approves
        approve_resp = requests.put(f"{BASE_URL}/api/admin/transactions/{txn_id}", json={
            "status": "approved"
        }, headers=admin_headers)
        assert approve_resp.status_code == 200
        
        # Check balance after approval
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers)
        assert me_resp.json()["balance"] == 8000


class TestPortfolioEndpoints:
    """Portfolio API tests"""
    
    @pytest.fixture
    def user_token(self):
        email = f"portfolio_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass123", "name": "Portfolio Test"
        })
        return response.json()["token"]
    
    def test_get_portfolio(self, user_token):
        """Test user can get their portfolio"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/portfolio", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "investments" in data
        assert "total_invested" in data
        assert "total_monthly_return" in data
        assert "balance" in data


class TestNotificationEndpoints:
    """Notification API tests"""
    
    @pytest.fixture
    def user_token(self):
        email = f"notif_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass123", "name": "Notification Test"
        })
        return response.json()["token"]
    
    def test_get_notifications(self, user_token):
        """Test user can get their notifications"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        # New users get welcome notification
        assert len(data["notifications"]) >= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
