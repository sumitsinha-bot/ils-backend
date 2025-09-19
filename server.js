require('dotenv').config;
const express = require('express')
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose')
const winston = require('winston');
const prometheus = require('prom-client');


const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
})

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
})


app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    }
}));

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}))

app.use(express.json({ limit: "10mb" }));

// Rate Limiter
const generateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this ip"
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too much authentication requests"
})

app.use('/api', generateLimiter);
app.use('/api/auth', authLimiter);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});


let mediaServices, messageQueue, cacheService, streamService, chatService, metricService;

async function initializeServices() {
    try {
        logger.info('Initializing services...');

        await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/ils_db', {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })
        logger.info('Database connected')

        //     mediaService = new MediaService(logger);
        // await mediaService.initialize();

        // messageQueue = new MessageQueue(logger);
        // await messageQueue.connect();

        // cacheService = new CacheService(logger);
        // await cacheService.connect();

        // metricsService = new MetricsService();
        // streamService = new StreamService(mediaService, messageQueue, cacheService, logger);
        // chatService = new ChatService(messageQueue, cacheService, logger);
        logger.info('All services initialized successfully');

    } catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

// Routes
// app.use('/api/auth', require('./routes/auth')(logger));
// app.use('/api/streams', AuthMiddleware.authenticate, require('./routes/streams')(streamService, logger));
// app.use('/api/chat', AuthMiddleware.authenticate, require('./routes/chat')(chatService, logger));


const PORT = process.env.PORT || 5000;
initializeServices().then(() => {
    server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
    });
});
