const { Worker } = require('bullmq');
const { redisConnection } = require('./queueSetup'); 
const Pedido = require('../models/pedido');

/**
 * Função genérica para criar um worker.
 * @param {string} queueName - O nome da fila que o worker irá escutar.
 * @param {string} observationMessage - A mensagem a ser gravada no campo 'observacoes'.
 * @returns {Worker}
 */
const createOrderWorker = (queueName, observationMessage) => {
    const worker = new Worker(queueName, async (job) => {
        const { ids } = job.data;

        if (!ids || ids.length === 0) {
            console.log(`Job ${job.id} da fila ${queueName} recebido sem IDs. Ignorando.`);
            return;
        }

        try {
            const result = await Pedido.updateMany(
                { _id: { $in: ids } }, 
                { $set: { status: 'PROCESSADO', observacoes: observationMessage } }
            );

            console.log(`[Worker ${queueName}]: Lote de ${ids.length} pedidos processado. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        } catch (error) {
            console.error(`[Worker ${queueName}]: Erro ao processar o lote do job ${job.id}:`, error);
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 10, 
        removeOnComplete: { count: 1000 }, 
        removeOnFail: { count: 5000 },
    });

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} da fila ${queueName} concluído.`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job.id} da fila ${queueName} falhou: ${err.message}`);
    });

    return worker;
};

const vipWorker = createOrderWorker('vip-orders', 'enviados com prioridade');
const normalWorker = createOrderWorker('normal-orders', 'processado sem prioridade');

module.exports = {
    vipWorker,
    normalWorker,
};