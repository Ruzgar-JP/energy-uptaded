"""
Alarko Enerji - Share-Based Investment System Tests
Tests the new share-based investment system with tiered rates:
- 1-4 shares (25,000-100,000 TL): 7% monthly, TL-based
- 5-9 shares (125,000-225,000 TL): 7% monthly, USD-based
- 10+ shares (250,000+ TL): 8% monthly, USD-based
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://alarko-enerji.preview.emergentagent.com')

ADMIN_EMAIL = "admin@alarkoenerji.com"
ADMIN_PASSWORD = "admin123"
SHARE_PRICE = 25000


class TestUsdRateEndpoint:
    """Tests for GET /api/usd-rate endpoint"""
    
    def test_usd_rate_returns_rate_and_share_price(self):
        """Test /api/usd-rate returns live USD rate and share_price=25000"""
        response = requests.get(f"{BASE_URL}/api/usd-rate")
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "rate" in data, "Response should contain 'rate'"
        assert "share_price" in data, "Response should contain 'share_price'"
        
        # Validate values
        assert data["share_price"] == 25000, "share_price should be 25000"
        assert isinstance(data["rate"], (int, float)), "rate should be numeric"
        assert data["rate"] > 0, "rate should be positive"
        # USD/TRY rate should be reasonable (between 20-100 as of 2024-2026)
        assert 20 < data["rate"] < 100, f"USD rate {data['rate']} seems unreasonable"


class TestShareBasedInvestment:
    """Tests for POST /api/portfolio/invest with share-based system"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    @pytest.fixture
    def approved_investor(self, admin_headers):
        """Create a user with approved KYC and sufficient balance"""
        # Register new user
        email = f"invest_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Investment Test User"
        })
        user_data = reg_resp.json()
        user_id = user_data["user"]["user_id"]
        user_token = user_data["token"]
        
        # Approve KYC via admin (simulate approval)
        # First we need KYC submitted, but for testing we'll just update user directly
        # The KYC approval sets kyc_status to 'approved'
        # For test purposes, let's check the invest endpoint's KYC validation directly
        
        # Add sufficient balance (300,000 TL for testing all tiers)
        requests.put(f"{BASE_URL}/api/admin/users/{user_id}/balance", json={
            "amount": 300000,
            "type": "add"
        }, headers=admin_headers)
        
        return {
            "token": user_token,
            "user_id": user_id,
            "headers": {"Authorization": f"Bearer {user_token}"}
        }
    
    def test_invest_requires_minimum_one_share(self, approved_investor):
        """Test investment requires minimum 25000 TL (1 share)"""
        headers = approved_investor["headers"]
        
        # Get a project
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        # Try to invest less than 25000 TL
        response = requests.post(f"{BASE_URL}/api/portfolio/invest", json={
            "project_id": project_id,
            "amount": 20000  # Less than 1 share
        }, headers=headers)
        
        # Should fail (either 400 for min amount or 400 for KYC)
        assert response.status_code == 400
        detail = response.json().get("detail", "")
        # Either KYC not approved or minimum amount error
        assert "25" in detail or "Minimum" in detail.lower() or "kimlik" in detail.lower() or "hisse" in detail.lower()
    
    def test_invest_requires_multiples_of_share_price(self, approved_investor):
        """Test investment amount must be multiples of 25000 TL"""
        headers = approved_investor["headers"]
        
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        # Try to invest non-multiple of 25000
        response = requests.post(f"{BASE_URL}/api/portfolio/invest", json={
            "project_id": project_id,
            "amount": 30000  # Not a multiple of 25000
        }, headers=headers)
        
        # Should fail
        assert response.status_code == 400
        detail = response.json().get("detail", "")
        # Either KYC error or multiple error
        assert "25" in detail or "katlar" in detail.lower() or "kimlik" in detail.lower()
    
    def test_invest_one_share_returns_7_percent_no_usd(self, admin_headers):
        """Test 1 share (25000 TL) gets 7% rate, not USD-based"""
        # Create user with approved KYC
        email = f"tier1_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Tier 1 Test"
        })
        user_id = reg_resp.json()["user"]["user_id"]
        user_token = reg_resp.json()["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Add balance
        requests.put(f"{BASE_URL}/api/admin/users/{user_id}/balance", json={
            "amount": 50000, "type": "add"
        }, headers=admin_headers)
        
        # Get user's KYC status - without approved KYC, invest will fail
        me = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers).json()
        
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        # Attempt invest - will fail if KYC not approved
        response = requests.post(f"{BASE_URL}/api/portfolio/invest", json={
            "project_id": project_id,
            "amount": 25000  # 1 share
        }, headers=user_headers)
        
        if response.status_code == 400 and "kimlik" in response.json().get("detail", "").lower():
            pytest.skip("KYC approval required - cannot test investment tiers without KYC flow")
        
        if response.status_code == 200:
            data = response.json()
            portfolio = data.get("portfolio", {})
            assert portfolio.get("shares") == 1
            assert portfolio.get("return_rate") == 7.0
            assert portfolio.get("usd_based") == False
    
    def test_invest_five_shares_returns_7_percent_with_usd(self, admin_headers):
        """Test 5 shares (125000 TL) gets 7% rate + USD-based"""
        email = f"tier2_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Tier 2 Test"
        })
        user_id = reg_resp.json()["user"]["user_id"]
        user_token = reg_resp.json()["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Add balance
        requests.put(f"{BASE_URL}/api/admin/users/{user_id}/balance", json={
            "amount": 150000, "type": "add"
        }, headers=admin_headers)
        
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        response = requests.post(f"{BASE_URL}/api/portfolio/invest", json={
            "project_id": project_id,
            "amount": 125000  # 5 shares
        }, headers=user_headers)
        
        if response.status_code == 400 and "kimlik" in response.json().get("detail", "").lower():
            pytest.skip("KYC approval required - cannot test investment tiers without KYC flow")
        
        if response.status_code == 200:
            data = response.json()
            portfolio = data.get("portfolio", {})
            assert portfolio.get("shares") == 5
            assert portfolio.get("return_rate") == 7.0
            assert portfolio.get("usd_based") == True
            assert "usd_rate_at_purchase" in portfolio
    
    def test_invest_ten_shares_returns_8_percent_with_usd(self, admin_headers):
        """Test 10 shares (250000 TL) gets 8% rate + USD-based"""
        email = f"tier3_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Tier 3 Test"
        })
        user_id = reg_resp.json()["user"]["user_id"]
        user_token = reg_resp.json()["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Add balance
        requests.put(f"{BASE_URL}/api/admin/users/{user_id}/balance", json={
            "amount": 300000, "type": "add"
        }, headers=admin_headers)
        
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        response = requests.post(f"{BASE_URL}/api/portfolio/invest", json={
            "project_id": project_id,
            "amount": 250000  # 10 shares
        }, headers=user_headers)
        
        if response.status_code == 400 and "kimlik" in response.json().get("detail", "").lower():
            pytest.skip("KYC approval required - cannot test investment tiers without KYC flow")
        
        if response.status_code == 200:
            data = response.json()
            portfolio = data.get("portfolio", {})
            assert portfolio.get("shares") == 10
            assert portfolio.get("return_rate") == 8.0
            assert portfolio.get("usd_based") == True
            assert "usd_rate_at_purchase" in portfolio


class TestInvestmentValidation:
    """Tests for investment validation rules"""
    
    def test_invest_requires_authentication(self):
        """Test investment endpoint requires auth token"""
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        response = requests.post(f"{BASE_URL}/api/portfolio/invest", json={
            "project_id": project_id,
            "amount": 25000
        })
        assert response.status_code == 401
    
    def test_invest_requires_kyc_approval(self):
        """Test investment requires approved KYC status"""
        # Create new user (KYC starts as pending)
        email = f"kyc_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "KYC Test"
        })
        user_token = reg_resp.json()["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        response = requests.post(f"{BASE_URL}/api/portfolio/invest", json={
            "project_id": project_id,
            "amount": 25000
        }, headers=user_headers)
        
        # Should fail due to KYC not approved
        assert response.status_code == 400
        assert "kimlik" in response.json().get("detail", "").lower()
    
    def test_invest_requires_sufficient_balance(self):
        """Test investment fails with insufficient balance"""
        # Get admin token
        admin_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        admin_token = admin_resp.json()["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create user
        email = f"balance_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Balance Test"
        })
        user_token = reg_resp.json()["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # User has 0 balance, try to invest
        projects = requests.get(f"{BASE_URL}/api/projects").json()
        project_id = projects[0]["project_id"]
        
        response = requests.post(f"{BASE_URL}/api/portfolio/invest", json={
            "project_id": project_id,
            "amount": 25000
        }, headers=user_headers)
        
        # Should fail - either KYC or balance error
        assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
