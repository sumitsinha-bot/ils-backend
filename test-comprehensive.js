const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAllEndpoints() {
    try {
        console.log('🚀 Testing All API Endpoints...\n');

        // Register and login
        const testEmail = `test${Date.now()}@example.com`;
        const register = await axios.post(`${BASE_URL}/api/auth/register`, {
            username: `testuser${Date.now()}`,
            email: testEmail,
            password: 'password123'
        });
        console.log('✓ Register:', register.status);

        const login = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testEmail,
            password: 'password123'
        });
        console.log('✓ Login:', login.status);

        const token = login.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Auth endpoints
        console.log('\n📝 Auth Endpoints:');
        const profile = await axios.get(`${BASE_URL}/api/auth/me`, { headers });
        console.log('✓ Profile:', profile.status);

        // Stream endpoints
        console.log('\n📺 Stream Endpoints:');
        const streams = await axios.get(`${BASE_URL}/api/streams`, { headers });
        console.log('✓ Get Streams:', streams.status);

        const createStream = await axios.post(`${BASE_URL}/api/streams`, {
            title: 'Test Stream',
            description: 'Test stream description',
            category: 'gaming'
        }, { headers });
        console.log('✓ Create Stream:', createStream.status);

        const streamId = createStream.data.stream.id;
        
        const getStream = await axios.get(`${BASE_URL}/api/streams/${streamId}`, { headers });
        console.log('✓ Get Stream:', getStream.status);

        const joinStream = await axios.post(`${BASE_URL}/api/streams/${streamId}/join`, {}, { headers });
        console.log('✓ Join Stream:', joinStream.status);

        const streamStats = await axios.get(`${BASE_URL}/api/streams/${streamId}/stats`, { headers });
        console.log('✓ Stream Stats:', streamStats.status);

        // Chat endpoints
        console.log('\n💬 Chat Endpoints:');
        const sendMessage = await axios.post(`${BASE_URL}/api/chat/${streamId}`, {
            content: 'Hello, this is a test message!'
        }, { headers });
        console.log('✓ Send Message:', sendMessage.status);

        const getMessages = await axios.get(`${BASE_URL}/api/chat/${streamId}`, { headers });
        console.log('✓ Get Messages:', getMessages.status);

        const chatStats = await axios.get(`${BASE_URL}/api/chat/${streamId}/stats`, { headers });
        console.log('✓ Chat Stats:', chatStats.status);

        // Clean up
        const deleteStream = await axios.delete(`${BASE_URL}/api/streams/${streamId}`, { headers });
        console.log('✓ Delete Stream:', deleteStream.status);

        console.log('\n🎉 All endpoints working successfully!');
        
    } catch (error) {
        console.error('✗ Error:', error.response?.status, error.response?.data?.error || error.message);
    }
}

testAllEndpoints();