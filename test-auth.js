const axios = require('axios');

async function testAuth() {
    try {
        // Register
        const register = await axios.post('http://localhost:3001/api/auth/register', {
            username: `testuser${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            password: 'password123'
        });
        
        console.log('Token:', register.data.token);
        
        // Test profile with detailed error
        try {
            const profile = await axios.get('http://localhost:3001/api/auth/me', {
                headers: { 
                    'Authorization': `Bearer ${register.data.token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✓ Profile works:', profile.status);
        } catch (error) {
            console.log('✗ Profile error:', error.response?.status, error.response?.data);
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testAuth();