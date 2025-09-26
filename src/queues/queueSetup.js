const { Queue, QueueEvents } = require('bullmq');

const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const vipQueue = new Queue('vip-orders', { connection: redisConnection });
const normalQueue = new Queue('normal-orders', { connection: redisConnection });

vipQueue.setMaxListeners(15);
normalQueue.setMaxListeners(15);

const vipQueueEvents = new QueueEvents('vip-orders', { connection: redisConnection });
const normalQueueEvents = new QueueEvents('normal-orders', { connection: redisConnection });

vipQueueEvents.setMaxListeners(15);
normalQueueEvents.setMaxListeners(15);


module.exports = {
    vipQueue,
    normalQueue,
    redisConnection,
    vipQueueEvents,
    normalQueueEvents,
};