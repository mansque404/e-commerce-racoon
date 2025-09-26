const mongoose = require('mongoose');
const { generateAndSaveOrders } = require('./generationService');
const Pedido = require('../models/Pedido');
const { vipQueue, normalQueue, vipQueueEvents, normalQueueEvents } = require('../queues/queueSetup');

const getInitialState = () => ({
    status: 'IDLE',
    error: null,
    generation: { duration: 0, count: 0 },
    vipProcessing: { startTime: null, endTime: null, duration: 0, count: 0 },
    normalProcessing: { startTime: null, endTime: null, duration: 0, count: 0 },
    totalTime: 0,
});

let processStatus = getInitialState();

async function startGenerationAndProcessing() {
    if (processStatus.status !== 'IDLE' && processStatus.status !== 'COMPLETED' && processStatus.status !== 'ERROR') {
        console.log('Processo já está em execução.');
        return;
    }
    
    console.log('--- INICIANDO NOVO PROCESSO ---');
    const totalStartTime = Date.now();
    processStatus = getInitialState();
    processStatus.status = 'GENERATING';

    try {
        const { duration, totalGenerated } = await generateAndSaveOrders();
        processStatus.generation = { duration, count: totalGenerated };

        processStatus.status = 'ENQUEUEING';
        await enqueueOrders();

        processStatus.status = 'PROCESSING_VIP';
        console.log('Iniciando e aguardando conclusão da fila VIP...');
        processStatus.vipProcessing.startTime = new Date().toISOString();
        const vipJobs = await vipQueue.getJobs(['wait', 'active']);
        await Promise.all(vipJobs.map(job => job.waitUntilFinished(vipQueueEvents)));
        processStatus.vipProcessing.endTime = new Date().toISOString();
        const vipDurationMs = new Date(processStatus.vipProcessing.endTime) - new Date(processStatus.vipProcessing.startTime);
        processStatus.vipProcessing.duration = vipDurationMs / 1000;
        console.log(`Fila VIP concluída em ${processStatus.vipProcessing.duration} segundos.`);

        processStatus.status = 'PROCESSING_NORMAL';
        console.log('Iniciando e aguardando conclusão da fila Normal...');
        processStatus.normalProcessing.startTime = new Date().toISOString();
        const normalJobs = await normalQueue.getJobs(['wait', 'active']);
        await Promise.all(normalJobs.map(job => job.waitUntilFinished(normalQueueEvents)));
        processStatus.normalProcessing.endTime = new Date().toISOString();
        const normalDurationMs = new Date(processStatus.normalProcessing.endTime) - new Date(processStatus.normalProcessing.startTime);
        processStatus.normalProcessing.duration = normalDurationMs / 1000;
        console.log(`Fila Normal concluída em ${processStatus.normalProcessing.duration} segundos.`);

        finalizeProcess(totalStartTime);

    } catch (error) {
        console.error('Erro crítico durante o processo:', error);
        processStatus.status = 'ERROR';
        processStatus.error = error.message;
    }
}

async function enqueueOrders(batchSize = 500) {
    console.log('Enfileirando pedidos...');
    const enqueue = async (priority, queue) => {
        const cursor = Pedido.find({ priority: priority, status: 'PENDENTE' }).select('_id').cursor();
        let idBatch = [];
        let totalCount = 0;
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            idBatch.push(doc._id);
            if (idBatch.length >= batchSize) {
                await queue.add('process-batch', { ids: idBatch });
                idBatch = [];
            }
            totalCount++;
        }
        if (idBatch.length > 0) {
            await queue.add('process-batch', { ids: idBatch });
        }
        console.log(`${totalCount} pedidos de prioridade ${priority} enfileirados.`);
        return totalCount;
    };
    processStatus.vipProcessing.count = await enqueue('VIP', vipQueue);
    processStatus.normalProcessing.count = await enqueue('NORMAL', normalQueue);
}

function finalizeProcess(totalStartTime) {
    const totalEndTime = Date.now();
    processStatus.totalTime = (totalEndTime - totalStartTime) / 1000;
    processStatus.status = 'COMPLETED';
    console.log(`--- PROCESSO TOTAL CONCLUÍDO EM ${processStatus.totalTime} SEGUNDOS ---`);
}

const getStatus = () => processStatus;

const resetState = async () => {
    console.log('Resetando o sistema...');
    await vipQueue.obliterate({ force: true });
    await normalQueue.obliterate({ force: true });
    try {
        await mongoose.connection.db.dropCollection('pedidos');
    } catch (error) {
        if (error.codeName !== 'NamespaceNotFound') throw error;
    }
    processStatus = getInitialState();
    console.log('Sistema resetado.');
    return { message: 'Banco de dados e filas resetados com sucesso' };
};

module.exports = {
    startGenerationAndProcessing,
    getStatus,
    resetState,
};