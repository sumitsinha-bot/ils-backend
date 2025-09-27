const mediasoupClient = require('mediasoup-client');

class StreamingTest {
    constructor() {
        this.socket = null;
        this.token = null;
        this.currentStream = null;
        this.localStream = null;
        this.device = null;
        this.sendTransport = null;
        this.recvTransport = null;
        this.producers = new Map();
        this.consumers = new Map();
        
        this.init();
    }

    init() {
        this.log('Initializing streaming test...');
        this.connectSocket();
    }

    connectSocket() {
        this.socket = io('http://localhost:3001', {
            auth: {
                token: this.token
            }
        });
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            this.log('Disconnected from server');
        });

        this.socket.on('stream-created', (stream) => {
            this.log('Stream created event received:', stream);
            this.currentStream = stream;
            document.getElementById('stream-id').value = stream.id;
            this.updateStatus('stream-status', `Stream created: ${stream.id}`, 'success');
            this.setupWebRTC();
        });

        this.socket.on('stream-joined', (data) => {
            this.log('Stream joined:', data);
            this.updateStatus('viewer-status', `Joined stream: ${data.stream.id}`, 'success');
        });

        this.socket.on('new-producer', (data) => {
            this.log('New producer available:', data);
            this.consumeMedia(data.producerId, data.kind);
        });
    }

    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage, data);
        
        const debugDiv = document.getElementById('debug-info');
        debugDiv.innerHTML += logMessage + (data ? ' ' + JSON.stringify(data) : '') + '\n';
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }

    updateStatus(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `status ${type}`;
    }

    async register() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.updateStatus('auth-status', `Registered: ${username}`, 'success');
                this.log('Registration successful');
            } else {
                this.updateStatus('auth-status', data.message, 'error');
            }
        } catch (error) {
            this.log('Registration error:', error);
            this.updateStatus('auth-status', 'Registration failed', 'error');
        }
    }

    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.socket.disconnect();
                this.socket = io('http://localhost:3001', {
                    auth: {
                        token: this.token
                    }
                });
                this.setupSocketListeners();
                this.updateStatus('auth-status', `Logged in: ${email}`, 'success');
                this.log('Login successful');
            } else {
                this.updateStatus('auth-status', data.message, 'error');
            }
        } catch (error) {
            this.log('Login error:', error);
            this.updateStatus('auth-status', 'Login failed', 'error');
        }
    }

    async startStream() {
        if (!this.token) {
            this.updateStatus('stream-status', 'Please login first', 'error');
            return;
        }

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            document.getElementById('local-video').srcObject = this.localStream;
            document.getElementById('toggle-video').disabled = false;
            document.getElementById('toggle-audio').disabled = false;
            this.log('Got local media stream');

            const title = document.getElementById('stream-title').value;
            this.log('Emitting create-stream event with title:', title);
            this.socket.emit('create-stream', { title }, (response) => {
                this.log('Received create-stream callback:', response);
                if (response && response.error) {
                    this.updateStatus('stream-status', response.error, 'error');
                } else if (response && response.success && response.stream) {
                    this.log('Stream creation successful:', response.stream);
                    this.currentStream = response.stream;
                    document.getElementById('stream-id').value = response.stream.id;
                    this.updateStatus('stream-status', `Stream created: ${response.stream.id}`, 'success');
                } else {
                    this.log('Unexpected response format:', response);
                    this.updateStatus('stream-status', 'Stream creation failed', 'error');
                }
            });

        } catch (error) {
            this.log('Error starting stream:', error);
            this.updateStatus('stream-status', 'Failed to start stream', 'error');
        }
    }

    async setupWebRTC() {
        try {
            this.socket.emit('get-router-capabilities', (capabilities) => {
                this.log('Router capabilities:', capabilities);
                this.loadDevice(capabilities);
            });
        } catch (error) {
            this.log('WebRTC setup error:', error);
        }
    }

    async loadDevice(routerRtpCapabilities) {
        try {
            this.log('Creating mediasoup device...');
            this.device = new mediasoupClient.Device();
            
            this.log('Loading device with capabilities:', JSON.stringify(routerRtpCapabilities, null, 2));
            await this.device.load({ routerRtpCapabilities });
            
            this.log('Device loaded successfully');
            this.createSendTransport();
        } catch (error) {
            this.log('Device load error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.updateStatus('stream-status', `WebRTC Error: ${error.message}`, 'error');
        }
    }

    createSendTransport() {
        this.socket.emit('create-transport', {
            roomId: this.currentStream.id,
            direction: 'send'
        }, (params) => {
            if (params.error) {
                this.log('Send transport error:', params.error);
                return;
            }

            this.sendTransport = this.device.createSendTransport(params);

            this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    this.socket.emit('connect-transport', {
                        roomId: this.currentStream.id,
                        transportId: this.sendTransport.id,
                        dtlsParameters
                    }, (response) => {
                        if (response.error) {
                            errback(new Error(response.error));
                        } else {
                            callback();
                        }
                    });
                } catch (error) {
                    errback(error);
                }
            });

            this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
                try {
                    this.socket.emit('produce', {
                        roomId: this.currentStream.id,
                        transportId: this.sendTransport.id,
                        kind,
                        rtpParameters
                    }, (response) => {
                        if (response.error) {
                            errback(new Error(response.error));
                        } else {
                            callback({ id: response.producerId });
                        }
                    });
                } catch (error) {
                    errback(error);
                }
            });

            this.produceMedia();
        });
    }

    async produceMedia() {
        try {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                const videoProducer = await this.sendTransport.produce({ track: videoTrack });
                this.producers.set('video', videoProducer);
                this.log('Video producer created');
            }

            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                const audioProducer = await this.sendTransport.produce({ track: audioTrack });
                this.producers.set('audio', audioProducer);
                this.log('Audio producer created');
            }

            this.updateStatus('stream-status', 'Stream is live!', 'success');
        } catch (error) {
            this.log('Produce media error:', error);
        }
    }

    joinStream() {
        const streamId = document.getElementById('stream-id').value;
        if (!streamId) {
            this.updateStatus('viewer-status', 'Please enter stream ID', 'error');
            return;
        }

        this.log('Attempting to join stream:', streamId);
        this.socket.emit('join-stream', { streamId }, (response) => {
            this.log('Join stream response:', response);
            if (response && response.error) {
                this.updateStatus('viewer-status', `Join failed: ${response.error}`, 'error');
            } else if (response && response.success) {
                this.log('Successfully joined stream');
                this.setupViewerWebRTC(streamId);
            } else {
                this.log('Unexpected join response:', response);
                this.updateStatus('viewer-status', 'Unexpected response from server', 'error');
            }
        });
    }

    async setupViewerWebRTC(streamId) {
        try {
            this.socket.emit('get-router-capabilities', (capabilities) => {
                this.loadViewerDevice(capabilities, streamId);
            });
        } catch (error) {
            this.log('Viewer WebRTC setup error:', error);
        }
    }

    async loadViewerDevice(routerRtpCapabilities, streamId) {
        try {
            if (!this.device) {
                this.device = new mediasoupClient.Device();
                await this.device.load({ routerRtpCapabilities });
            }
            this.createRecvTransport(streamId);
        } catch (error) {
            this.log('Viewer device load error:', error);
        }
    }

    createRecvTransport(streamId) {
        this.socket.emit('create-transport', {
            roomId: streamId,
            direction: 'recv'
        }, (params) => {
            if (params.error) {
                this.log('Recv transport error:', params.error);
                return;
            }

            this.recvTransport = this.device.createRecvTransport(params);

            this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    this.socket.emit('connect-transport', {
                        roomId: streamId,
                        transportId: this.recvTransport.id,
                        dtlsParameters
                    }, (response) => {
                        if (response.error) {
                            errback(new Error(response.error));
                        } else {
                            callback();
                        }
                    });
                } catch (error) {
                    errback(error);
                }
            });

            this.log('Receive transport created');
        });
    }

    async consumeMedia(producerId, kind) {
        try {
            this.socket.emit('consume', {
                roomId: document.getElementById('stream-id').value,
                producerId,
                rtpCapabilities: this.device.rtpCapabilities
            }, async (params) => {
                if (params.error) {
                    this.log('Consume error:', params.error);
                    return;
                }

                const consumer = await this.recvTransport.consume(params);
                this.consumers.set(kind, consumer);

                const remoteVideo = document.getElementById('remote-video');
                let stream = remoteVideo.srcObject;
                if (!stream) {
                    stream = new MediaStream();
                    remoteVideo.srcObject = stream;
                }
                stream.addTrack(consumer.track);

                this.socket.emit('resume-consumer', {
                    roomId: document.getElementById('stream-id').value,
                    consumerId: consumer.id
                });

                this.log(`${kind} consumer created`);
            });
        } catch (error) {
            this.log('Consume media error:', error);
        }
    }

    // stopStream() {
    //     if (this.localStream) {
    //         this.localStream.getTracks().forEach(track => track.stop());
    //         this.localStream = null;
    //     }
    //     document.getElementById('local-video').srcObject = null;
    //     this.updateStatus('stream-status', 'Stream stopped', 'info');
    //     this.log('Stream stopped');
    // }

    leaveStream() {
        if (this.recvTransport) {
            this.recvTransport.close();
            this.recvTransport = null;
        }
        document.getElementById('remote-video').srcObject = null;
        this.updateStatus('viewer-status', 'Left stream', 'info');
        this.log('Left stream');
    }

    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                const button = document.getElementById('toggle-video');
                button.textContent = videoTrack.enabled ? '📹 Video Off' : '📹 Video On';
                this.log(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
            }
        }
    }

    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                const button = document.getElementById('toggle-audio');
                button.textContent = audioTrack.enabled ? '🎤 Mic Off' : '🎤 Mic On';
                this.log(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
            }
        }
    }

    toggleRemoteAudio() {
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
            remoteVideo.muted = !remoteVideo.muted;
            const button = document.getElementById('toggle-remote-audio');
            button.textContent = remoteVideo.muted ? '🔇 Unmute' : '🔊 Mute';
            this.log(`Remote audio ${remoteVideo.muted ? 'muted' : 'unmuted'}`);
        }
    }

    stopStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        document.getElementById('local-video').srcObject = null;
        document.getElementById('toggle-video').disabled = true;
        document.getElementById('toggle-audio').disabled = true;
        this.updateStatus('stream-status', 'Stream stopped', 'info');
        this.log('Stream stopped');
    }
}

// Global variables
let streamingTest;

// Global functions for HTML onclick events
window.login = function() { 
    if (streamingTest) streamingTest.login(); 
    else console.error('StreamingTest not initialized');
};

window.register = function() { 
    if (streamingTest) streamingTest.register(); 
    else console.error('StreamingTest not initialized');
};

window.startStream = function() { 
    if (streamingTest) streamingTest.startStream(); 
    else console.error('StreamingTest not initialized');
};

window.stopStream = function() { 
    if (streamingTest) streamingTest.stopStream(); 
    else console.error('StreamingTest not initialized');
};

window.joinStream = function() { 
    if (streamingTest) streamingTest.joinStream(); 
    else console.error('StreamingTest not initialized');
};

window.leaveStream = function() { 
    if (streamingTest) streamingTest.leaveStream(); 
    else console.error('StreamingTest not initialized');
};

window.toggleVideo = function() {
    if (streamingTest) streamingTest.toggleVideo();
    else console.error('StreamingTest not initialized');
};

window.toggleAudio = function() {
    if (streamingTest) streamingTest.toggleAudio();
    else console.error('StreamingTest not initialized');
};

window.toggleRemoteAudio = function() {
    if (streamingTest) streamingTest.toggleRemoteAudio();
    else console.error('StreamingTest not initialized');
};

// Initialize when page loads
window.addEventListener('load', () => {
    console.log('Starting streaming test application');
    streamingTest = new StreamingTest();
});