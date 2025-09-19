const CacheService = require('./src/services/CacheService');

const logger = {
    info: console.log,
    debug: console.log,
    error: console.error
};

async function testCache() {
    const cache = new CacheService(logger);
    
    try {
        await cache.connect();
        console.log('✓ Connected to Redis');
        
        // Test basic operations
        await cache.setUserSession('test123', { name: 'Test User' });
        const session = await cache.getUserSession('test123');
        console.log('✓ Session test:', session);
        
        // Test stream operations
        await cache.updateStream('stream1', { title: 'Test Stream', status: 'live' });
        const stream = await cache.getStream('stream1');
        console.log('✓ Stream test:', stream);
        
        await cache.disconnect();
        console.log('✓ All tests passed');
    } catch (error) {
        console.error('✗ Test failed:', error.message);
    }
}

testCache();