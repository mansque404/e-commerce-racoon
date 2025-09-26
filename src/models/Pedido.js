const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    cliente: String,
    valor: Number,
    tier: { type: String, enum: ['BRONZE', 'PRATA', 'OURO', 'DIAMANTE'] },
    observacoes: { type: String, default: '' },
    priority: { type: String, enum: ['VIP', 'NORMAL'] },
    status: { type: String, default: 'PENDENTE' }
}, { timestamps: true });

pedidoSchema.index({ priority: 1, status: 1 });

module.exports = mongoose.models.Pedido || mongoose.model('Pedido', pedidoSchema);
