const express = require('express');
const path = require('path');
const { startProcess, getProcessStatus, resetProcess } = require('./controllers/pedidoController');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.render('index'));
app.post('/start-process', startProcess);
app.get('/pedidos', getProcessStatus);
app.post('/reset', resetProcess);

module.exports = app;