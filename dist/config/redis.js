"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
});
redis.on('connect', () => {
    console.log('Redis Client Connected');
});
// Connect to Redis
redis.connect().catch(console.error);
exports.default = redis;
//# sourceMappingURL=redis.js.map