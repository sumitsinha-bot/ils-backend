# ILS Streaming Test Frontend

Simple vanilla JS frontend to test the ILS streaming functionality.

## Setup

1. Install dependencies:
```bash
cd test-frontend
npm install
```

2. Start the frontend server:
```bash
npm start
```

3. Make sure your ILS backend is running on port 5000

4. Open [http://localhost:8080](http://localhost:8080) in your browser

## Testing Steps

1. **Authentication**: Register/Login with test credentials
2. **Start Stream**: Click "Start Stream" to begin broadcasting
3. **Join Stream**: Copy the stream ID and use it in the viewer section
4. **Test**: Open another browser tab/window to test viewer functionality

## Features Tested

- User authentication
- Stream creation
- WebRTC transport setup
- Media production (camera/microphone)
- Media consumption (viewing streams)
- Socket.io real-time communication

## Notes

- Requires HTTPS for camera access in production
- Use Chrome/Firefox for best WebRTC support
- Check browser console for detailed logs