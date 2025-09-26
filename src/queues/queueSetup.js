const { Queue } = require('bullmq');

const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const vipQueue = new Queue('vip-orders', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3, 
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});

const normalQueue = new Queue('normal-orders', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});

module.exports = {
    vipQueue,
    normalQueue,
    redisConnection, 
};