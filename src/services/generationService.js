const { faker } = require('@faker-js/faker');
const Pedido = require('../models/Pedido');

/**
 * Gera um lote de objetos de pedido em memória.
 * @param {number} count - O número de pedidos a serem gerados no lote.
 * @returns {Array<Object>}
 */
const generateOrdersBatch = (count) => {
    const orders = [];
    const tiers = ['BRONZE', 'PRATA', 'OURO', 'DIAMANTE'];

    for (let i = 0; i < count; i++) {
        const tier = tiers[Math.floor(Math.random() * tiers.length)];
        orders.push({
            cliente: faker.person.fullName(),
            valor: parseFloat(faker.commerce.price({ min: 10, max: 5000 })),
            tier: tier,
            priority: tier === 'DIAMANTE' ? 'VIP' : 'NORMAL',
            status: 'PENDENTE',
            observacoes: ''
        });
    }
    return orders;
};

/**
 * Orquestra a geração de 1 milhão de pedidos e os salva no banco de dados.
 * @param {number} totalOrders - Total de pedidos a gerar.
 * @param {number} batchSize - Tamanho de cada lote para inserção no banco.
 * @returns {Object} - Contém o tempo de duração e o total de pedidos gerados.
 */
const generateAndSaveOrders = async (totalOrders = 1000000, batchSize = 10000) => {
    console.log('Iniciando geração de 1 milhão de pedidos...');
    const startTime = Date.now();
    let generatedCount = 0;

    for (let i = 0; i < totalOrders; i += batchSize) {
        const currentBatchSize = Math.min(batchSize, totalOrders - i);
        const batch = generateOrdersBatch(currentBatchSize);
        
        await Pedido.insertMany(batch, { ordered: false }); 

        generatedCount += batch.length;
        console.log(`${generatedCount} de ${totalOrders} pedidos gerados e salvos...`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; 
    console.log(`Geração de ${totalOrders} pedidos concluída em ${duration.toFixed(2)} segundos.`);
    
    return {
        duration,
        totalGenerated: totalOrders,
    };
};

module.exports = { generateAndSaveOrders };