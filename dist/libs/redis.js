// libs/redis.ts
import { Redis } from 'ioredis';
const redis = new Redis({
    host: 'redis-16039.c245.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 16039,
    password: 'YggUzD0EJC4iWL9abKDqZhjUutnG8CU1',
    username: 'default',
    tls: undefined, // No TLS
    connectTimeout: 10000,
});
redis.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
});
redis.on('connect', () => {
    console.log('✅ Connected to Redis Cloud successfully');
});
redis.on('ready', () => {
    console.log('✅ Redis client is ready');
});
export default redis;
