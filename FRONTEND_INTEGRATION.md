# Frontend Integration Guide

## Backend Configuration
- **API Server**: `http://localhost:8080`
- **Socket.IO**: `http://localhost:8080`
- **Frontend Expected**: `http://localhost:3000`

## Frontend Environment Variables (.env)
```bash
# React/Next.js Frontend
REACT_APP_API_URL=http://localhost:8080
REACT_APP_SOCKET_URL=http://localhost:8080

# Or for Next.js
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
```

## API Architecture for Frontend

### 1. Authentication Flow
```javascript
// Login
POST /api/auth/login
Body: { email, password }
Response: { token, user }

// Register  
POST /api/auth/register
Body: { username, email, password }
Response: { token, user }

// Get Profile
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### 2. Streaming API
```javascript
// Create Stream
POST /api/streams
Headers: { Authorization: "Bearer <token>" }
Body: { title, description }

// Get Streams
GET /api/streams
Headers: { Authorization: "Bearer <token>" }

// Join Stream
POST /api/streams/:id/join
Headers: { Authorization: "Bearer <token>" }
```

### 3. Real-time Socket.IO
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8080', {
  auth: { token: localStorage.getItem('token') }
});

// WebRTC Events
socket.emit('get-router-capabilities', callback);
socket.emit('create-transport', data, callback);
socket.emit('produce', data, callback);
socket.emit('consume', data, callback);

// Stream Events
socket.emit('create-stream', data, callback);
socket.emit('join-stream', data, callback);

// Chat Events
socket.emit('send-message', data, callback);
```

### 4. Frontend Architecture Recommendations

#### React/Next.js Structure:
```
src/
├── components/
│   ├── Stream/
│   │   ├── StreamPlayer.jsx
│   │   ├── StreamControls.jsx
│   │   └── StreamChat.jsx
│   └── Auth/
│       ├── Login.jsx
│       └── Register.jsx
├── hooks/
│   ├── useSocket.js
│   ├── useAuth.js
│   └── useWebRTC.js
├── services/
│   ├── api.js
│   ├── socket.js
│   └── webrtc.js
└── pages/
    ├── stream/[id].jsx
    └── dashboard.jsx
```

#### Key Frontend Services:

**API Service (services/api.js):**
```javascript
const API_URL = process.env.REACT_APP_API_URL;

export const api = {
  auth: {
    login: (credentials) => fetch(`${API_URL}/api/auth/login`, {...}),
    register: (data) => fetch(`${API_URL}/api/auth/register`, {...}),
  },
  streams: {
    create: (data) => fetch(`${API_URL}/api/streams`, {...}),
    list: () => fetch(`${API_URL}/api/streams`, {...}),
  }
};
```

**Socket Service (services/socket.js):**
```javascript
import io from 'socket.io-client';

class SocketService {
  connect(token) {
    this.socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token }
    });
  }
  
  createStream(data) {
    return new Promise((resolve) => {
      this.socket.emit('create-stream', data, resolve);
    });
  }
}
```

## Production Deployment
- Backend: Port 8080 (or environment variable)
- Frontend: Port 80/443 (Nginx/Apache)
- WebRTC: Ports 20000-29999 (configured in .env)