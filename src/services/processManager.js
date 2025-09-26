const mongoose = require('mongoose');
const { generateAndSaveOrders } = require('./generationService');
const Pedido = require('../models/pedido');
const { vipQueue, normalQueue } = require('../queues/queueSetup');
const { vipWorker, normalWorker } = require('../queues/orderWorker');

const getInitialState = () => ({
    status: 'IDLE',
    error: null,
    generation: { duration: 0, count: 0 },
    vipProcessing: { startTime: null, endTime: null, duration: 0, count: 0 },
    normalProcessing: { startTime: null, endTime: null, duration: 0, count: 0 },
    totalTime: 0,
});

let processStatus = getInitialState();

/**
 * Orquestra todo o fluxo de geração e processamento.
 */
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
        await startVipProcessing(totalStartTime);

    } catch (error) {
        console.error('Erro crítico durante o processo:', error);
        processStatus.status = 'ERROR';
        processStatus.error = error.message;
    }
}

/**
 * Busca pedidos no banco e os adiciona nas filas corretas em lotes.
 */
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

/**
 * Gerencia o processamento da fila VIP e dispara o processamento da fila Normal ao terminar.
 */
async function startVipProcessing(totalStartTime) {
    processStatus.vipProcessing.startTime = new Date().toISOString();
    console.log('Iniciando processamento da fila VIP...');

    if (processStatus.vipProcessing.count === 0) {
        console.log('Nenhum pedido VIP para processar.');
        processStatus.vipProcessing.endTime = new Date().toISOString();
        await startNormalProcessing(totalStartTime);
        return;
    }

    const vipListener = vipWorker.on('completed', async () => {
        const remaining = await vipQueue.getWaitingCount() + await vipQueue.getActiveCount();
        if (remaining === 0) {
            processStatus.vipProcessing.endTime = new Date().toISOString();
            const durationMs = new Date(processStatus.vipProcessing.endTime) - new Date(processStatus.vipProcessing.startTime);
            processStatus.vipProcessing.duration = durationMs / 1000;
            console.log(`Fila VIP concluída em ${processStatus.vipProcessing.duration} segundos.`);
            
            await vipListener.close(); 

            await startNormalProcessing(totalStartTime);
        }
    });
}

/**
 * Gerencia o processamento da fila Normal e finaliza o processo.
 */
async function startNormalProcessing(totalStartTime) {
    processStatus.status = 'PROCESSING_NORMAL';
    processStatus.normalProcessing.startTime = new Date().toISOString();
    console.log('Iniciando processamento da fila Normal...');

    if (processStatus.normalProcessing.count === 0) {
        console.log('Nenhum pedido Normal para processar.');
        processStatus.normalProcessing.endTime = new Date().toISOString();
        finalizeProcess(totalStartTime);
        return;
    }

    const normalListener = normalWorker.on('completed', async () => {
        const remaining = await normalQueue.getWaitingCount() + await normalQueue.getActiveCount();
        if (remaining === 0) {
            processStatus.normalProcessing.endTime = new Date().toISOString();
            const durationMs = new Date(processStatus.normalProcessing.endTime) - new Date(processStatus.normalProcessing.startTime);
            processStatus.normalProcessing.duration = durationMs / 1000;
            console.log(`Fila Normal concluída em ${processStatus.normalProcessing.duration} segundos.`);
            
            await normalListener.close();
            
            finalizeProcess(totalStartTime);
        }
    });
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
        if (error.codeName !== 'NamespaceNotFound') {
            throw error;
        }
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