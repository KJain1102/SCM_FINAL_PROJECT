require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const expensesRouter = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 4000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/expenses', expensesRouter);

// Static frontend hosting (for Stage 3)
app.use(express.static(PUBLIC_DIR));

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err); // Keep concise server-side logging
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

async function startServer() {
  let mongoUri = process.env.MONGO_URI;
  try {
    if (!mongoUri) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri('expense_tracker');
      console.log('Using in-memory MongoDB for development');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
}

startServer();
