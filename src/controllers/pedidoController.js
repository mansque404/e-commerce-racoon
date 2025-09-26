const processManager = require('../services/processManager');

/**
 * Inicia o processo de geração e enfileiramento em background.
 * Retorna uma resposta imediata para o cliente.
 */
const startProcess = (req, res) => {
    processManager.startGenerationAndProcessing();
    res.status(202).json({ message: 'Processo iniciado. Monitore o status através do endpoint GET /pedidos.' });
};

/**
 * Retorna o estado atual do processo.
 */
const getProcessStatus = (req, res) => {
    const status = processManager.getStatus();
    res.status(200).json(status);
};

/**
 * Reseta o banco de dados e as filas para um novo teste.
 */
const resetProcess = async (req, res) => {
    try {
        const result = await processManager.resetState();
        res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao resetar o processo:', error);
        res.status(500).json({ message: 'Falha ao resetar o processo.', error: error.message });
    }
};

module.exports = {
    startProcess,
    getProcessStatus,
    resetProcess,
};