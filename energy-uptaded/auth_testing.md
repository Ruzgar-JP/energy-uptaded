# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'investor',
  kyc_status: 'approved',
  balance: 50000,
  phone: '+90 555 111 2233',
  password_hash: '',
  created_at: new Date().toISOString()
});
print('User ID: ' + userId);
"
```

## Step 2: Test Backend APIs
```bash
# Login as admin
curl -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@alarkoenerji.com","password":"admin123"}'

# Test auth/me
curl -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Test projects
curl -X GET "$API_URL/api/projects"
```

## Step 3: Browser Testing
Set cookie/token and navigate to protected routes.
