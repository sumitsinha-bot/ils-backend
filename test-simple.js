const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBasic() {
    try {
        // Test health
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✓ Health:', health.status);

        // Test register
        const testEmail = `test${Date.now()}@example.com`;
        const register = await axios.post(`${BASE_URL}/api/auth/register`, {
            username: `testuser${Date.now()}`,
            email: testEmail,
            password: 'password123'
        });
        console.log('✓ Register:', register.status);
        console.log('Register response:', register.data);

        // Test login
        console.log('Trying to login with:', testEmail);
        const login = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testEmail,
            password: 'password123'
        });
        console.log('✓ Login:', login.status);

        const token = login.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Test profile
        const profile = await axios.get(`${BASE_URL}/api/auth/me`, { headers });
        console.log('✓ Profile:', profile.status);

        // Test streams
        const streams = await axios.get(`${BASE_URL}/api/streams`, { headers });
        console.log('✓ Get Streams:', streams.status);

        console.log('\n✅ Basic tests passed!');
    } catch (error) {
        console.error('✗ Error:', error.response?.status, error.response?.data?.error || error.message);
    }
}

testBasic();