const Redis = require('ioredis');
const { error } = require('winston');

class CacheService {
    constructor(logger) {
        this.logger = logger;
        this.client = null;
        this.publisher = null;
        this.subscriber = null;
    }

    async connect() {
        try {
            const redisConfig = {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                db: process.env.REDIS_DB || 0,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: false,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000,
                family: 4
            }

            this.client = new Redis(redisConfig);
            this.publisher = new Redis(redisConfig);
            this.subscriber = new Redis(redisConfig);

            // error handling
            this.client.on('error', (error) => {
                this.logger.error(`Redis client error: ${error.message}`, { error });
            })

            this.client.on('connect', () => {
                this.logger.info('Redis client connected');
            })

            this.client.on('ready', () => {
                this.logger.info('Redis client ready');
            })

            this.publisher.on('error', (err) => {
                this.logger.error('Redis Publisher Error:', err);
            });

            this.subscriber.on('error', (err) => {
                this.logger.error('Redis Subscriber Error:', err);
            });

            await this.client.ping()
            this.logger.info('Redis connected successfully');
        } catch (error) {
            this.logger.error('Redis connection failed:', error);
            throw error;
        }
    }
    
    async setUserSession(userId, sessionData, ttl=86400){
        try {
            const key = `session:user:${userId}`;
            
            // Redis pipelining is a technique for improving performance by issuing multiple commands at once without waiting for the response to each individual command. 
            const pipeline = this.client.pipeline();
            
            for(const[field, value] of Object.entries(sessionData)){
                pipeline.hset(key, field, JSON.stringify(value));
            }
            
            pipeline.expire(key, ttl);
            await pipeline.exec();
            
            this.logger.debug(`User session set: ${userId}`)
            
            
        } catch (error) {
            this.logger.error(`Error setting user session: ${error.message}`, { error });
            throw error;
        }
    }
    
    async getUserSession(userId){
        try {
            
        } catch (error) {
            
        }
    }
}