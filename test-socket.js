const io = require('socket.io-client');
const axios = require('axios');

async function testSocket() {
    try {
        console.log('🔌 Testing Socket.IO functionality...\n');

        // Get auth token first
        const testEmail = `test${Date.now()}@example.com`;
        const register = await axios.post('http://localhost:3001/api/auth/register', {
            username: `testuser${Date.now()}`,
            email: testEmail,
            password: 'password123'
        });

        const login = await axios.post('http://localhost:3001/api/auth/login', {
            email: testEmail,
            password: 'password123'
        });

        const token = login.data.token;
        console.log('✓ Got auth token');

        // Connect to socket
        const socket = io('http://localhost:3001', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('✓ Socket connected');

            // Test get router capabilities
            socket.emit('get-router-capabilities', (response) => {
                if (response.codecs) {
                    console.log('✓ Router capabilities received');
                } else {
                    console.log('✗ Router capabilities failed:', response.error);
                }
            });

            // Test create stream
            socket.emit('create-stream', {
                title: 'Socket Test Stream',
                description: 'Testing socket stream creation'
            }, (response) => {
                if (response.success) {
                    console.log('✓ Stream created via socket');
                    
                    // Test join stream
                    socket.emit('join-stream', {
                        streamId: response.stream.id
                    }, (joinResponse) => {
                        if (joinResponse.success) {
                            console.log('✓ Stream joined via socket');
                        } else {
                            console.log('✗ Stream join failed:', joinResponse.error);
                        }
                    });
                } else {
                    console.log('✗ Stream creation failed:', response.error);
                }
            });

            setTimeout(() => {
                socket.disconnect();
                console.log('✓ Socket disconnected');
                console.log('\n🎉 Socket.IO tests completed!');
            }, 2000);
        });

        socket.on('connect_error', (error) => {
            console.log('✗ Socket connection error:', error.message);
        });

    } catch (error) {
        console.error('✗ Socket test error:', error.message);
    }
}

testSocket();