const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 5000
});

// Add auth token to requests
api.interceptors.request.use(config => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

async function testEndpoint(name, method, url, data = null) {
    try {
        const response = await api[method](url, data);
        console.log(`✓ ${name}: ${response.status}`);
        return response.data;
    } catch (error) {
        console.log(`✗ ${name}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Testing API Endpoints...\n');

    // Test server health
    await testEndpoint('Server Health', 'get', '/health');

    // Auth endpoints
    console.log('\n📝 Auth Endpoints:');
    const registerData = await testEndpoint('Register', 'post', '/api/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
    });

    const loginData = await testEndpoint('Login', 'post', '/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
    });

    if (loginData?.token) {
        authToken = loginData.token;
        console.log('✓ Auth token obtained');
    }

    await testEndpoint('Profile', 'get', '/api/auth/me');
    await testEndpoint('Refresh Token', 'post', '/api/auth/refresh-token', { token: authToken });
    await testEndpoint('Logout', 'post', '/api/auth/logout');

    // Stream endpoints
    console.log('\n📺 Stream Endpoints:');
    const streamData = await testEndpoint('Create Stream', 'post', '/api/streams', {
        title: 'Test Stream',
        description: 'Test stream description'
    });

    const streamId = streamData?.id || 'test-stream-id';
    
    await testEndpoint('Get Streams', 'get', '/api/streams');
    await testEndpoint('Get Stream', 'get', `/api/streams/${streamId}`);
    await testEndpoint('Update Stream', 'put', `/api/streams/${streamId}`, {
        title: 'Updated Stream'
    });
    await testEndpoint('Join Stream', 'post', `/api/streams/${streamId}/join`);
    await testEndpoint('Leave Stream', 'post', `/api/streams/${streamId}/leave`);
    await testEndpoint('Get Stream Stats', 'get', `/api/streams/${streamId}/stats`);
    await testEndpoint('Delete Stream', 'delete', `/api/streams/${streamId}`);

    // Chat endpoints
    console.log('\n💬 Chat Endpoints:');
    await testEndpoint('Send Message', 'post', `/api/chat/${streamId}`, {
        content: 'Test message'
    });
    await testEndpoint('Get Messages', 'get', `/api/chat/${streamId}`);
    await testEndpoint('Get Chat Stats', 'get', `/api/chat/${streamId}/stats`);

    console.log('\n✅ API testing completed!');
}

runTests().catch(console.error);