# E-commerce Racoon - Simulador de Fila de Processamento de Pedidos 🦝

## 📖 Sobre o Projeto

Este projeto é uma simulação de backend robusta para uma plataforma de e-commerce, desenhada para gerar, enfileirar e processar um grande volume de pedidos (1 milhão) de forma assíncrona e eficiente. A aplicação utiliza um sistema de filas com prioridade para diferenciar o processamento de pedidos normais e VIPs, armazenando todos os dados num banco NoSQL e fornecendo logs detalhados sobre a performance de cada etapa do processo.

O objetivo principal é demonstrar uma arquitetura escalável e resiliente, capaz de lidar com cargas de trabalho intensas, utilizando tecnologias modernas de backend.

---

## ✨ Funcionalidades Principais

* **📦 Geração em Massa:** Gera 1 milhão de pedidos com dados aleatórios (`cliente`, `valor`, `tier`).
* **💾 Armazenamento NoSQL:** Persiste todos os pedidos numa base de dados MongoDB.
* **🚀 Fila com Prioridade:** Utiliza BullMQ e Redis para criar duas filas distintas, garantindo que pedidos VIP (`DIAMANTE`) sejam processados antes dos normais.
* **⚙️ Processamento Assíncrono:** Workers processam os pedidos em lotes, atualizando o seu status no banco de dados de forma eficiente.
* **📊 Monitorização Detalhada:** Uma API e uma interface web simples fornecem logs completos sobre a operação, incluindo:
    * Tempo total de geração dos pedidos.
    * Tempos de início, fim e duração do processamento para cada fila (VIP e Normal).
    * Contagem total de pedidos processados por categoria.
    * Tempo total de execução do ciclo completo.
* **🔄 Funcionalidade de Reset:** Permite limpar completamente a base de dados e as filas para executar a simulação novamente do zero.
* **🐳 Ambiente Containerizado:** Todo o ambiente (Aplicação Node.js, MongoDB, Redis) é orquestrado com Docker e Docker Compose, garantindo uma configuração fácil e consistente.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias:

* **Backend:** Node.js, Express.js
* **Base de Dados:** MongoDB (com Mongoose para modelagem)
* **Sistema de Filas:** BullMQ
* **Cache/Broker:** Redis
* **Orquestração:** Docker, Docker Compose
* **Frontend (UI):** EJS (Embedded JavaScript templates)
* **Geração de Dados:** `@faker-js/faker`

---

## 🚀 Como Executar o Projeto

Para executar este projeto localmente, você precisará ter o **Docker** e o **Docker Compose** instalados na sua máquina.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/mansque404/e-commerce-racoon.git
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd e-commerce-racoon
    ```

3.  **Crie o arquivo de variáveis de ambiente:**
    Crie um ficheiro chamado `.env` na raiz do projeto e copie o conteúdo abaixo para ele. Estes valores correspondem aos serviços definidos no `docker-compose.yml`.

    ```env
    # .env

    PORT=3000

    # Aponta para o serviço 'mongo' do docker-compose
    MONGO_URI=mongodb://mongo:27017/e-commerce-racoon

    # Aponta para o serviço 'redis' do docker-compose
    REDIS_HOST=redis
    REDIS_PORT=6379
    ```

4.  **Construa e inicie os contentores:**
    Execute o seguinte comando no seu terminal. Ele irá construir a imagem da aplicação e iniciar todos os serviços.

    ```bash
    docker-compose up --build
    ```
    Aguarde até que os logs indiquem que o servidor está online e conectado à base de dados.

---

## 🕹️ Como Usar a Aplicação

1.  **Acesse a Interface:** Abra o seu navegador e visite `http://localhost:3000`.

2.  **Inicie a Simulação:** Clique no botão **"Executar Código"**. O processo de geração de 1 milhão de pedidos começará em segundo plano.

3.  **Acompanhe o Progresso:**
    * **No terminal:** Você verá os logs em tempo real, mostrando o progresso da geração, enfileiramento e processamento dos lotes.
    * **Na interface web:** Os logs detalhados com os tempos e contagens serão atualizados periodicamente.

4.  **Visualize os Dados (Opcional):**
    * Use uma ferramenta como o MongoDB Compass para se conectar ao banco de dados em `mongodb://localhost:27017/`.
    * Você poderá ver a coleção `pedidos` ser criada e preenchida em tempo real.

5.  **Resetar a Simulação:**
    * Após a conclusão, clique no botão **"Resetar Banco"** para apagar todos os dados e preparar o ambiente para uma nova execução.

---

## 📋 Endpoints da API

A aplicação expõe os seguintes endpoints:

* **`GET /pedidos`**
    * **Descrição:** Retorna um objeto JSON com o status detalhado e os tempos de todo o processo.

* **`POST /start-process`**
    * **Descrição:** Inicia a simulação de geração e processamento de pedidos.

* **`POST /reset`**
    * **Descrição:** Limpa a base de dados e as filas do Redis, resetando o estado da aplicação.

---

## 📁 Estrutura do Projeto

```
/e-commerce-racoon
|-- /src
|   |-- /controllers       # Lida com as requisições HTTP e respostas
|   |-- /models            # Schemas do Mongoose para o MongoDB
|   |-- /queues            # Configuração das filas e workers do BullMQ
|   |-- /services          # Contém a lógica de negócio principal
|   |-- /views             # Ficheiros EJS para a interface do utilizador
|   |-- app.js             # Configuração do Express (rotas, middlewares)
|   `-- server.js          # Ponto de entrada, inicia o servidor e a conexão com a DB
|-- .env                   # Variáveis de ambiente
|-- docker-compose.yml     # Orquestra os nossos contentores
|-- Dockerfile             # Define a imagem Docker da nossa aplicação
|-- package.json           # Dependências e scripts do projeto
`-- README.md              # Este ficheiro
```

---

## 📄 Licença

Este projeto está sob a licença MIT.
