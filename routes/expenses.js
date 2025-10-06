const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// CRUD ROUTES
// GET /api/expenses - list all expenses (most recent first)
router.get('/', async (req, res, next) => {
  try {
    const expenses = await Expense.find({}).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses/:id - fetch single expense
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid expense id' });
    }
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses - create a new expense
router.post('/', async (req, res, next) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title || amount === undefined || !category || !date) {
      return res.status(400).json({ error: 'title, amount, category, and date are required' });
    }

    const expense = await Expense.create({ title, amount, category, date });
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

// PUT /api/expenses/:id - update an expense
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid expense id' });
    }

    const { title, amount, category, date } = req.body;
    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { title, amount, category, date },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:id - delete an expense
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid expense id' });
    }

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// AGGREGATION ROUTES
// GET /api/expenses/aggregations/monthly?year=2025
router.get('/aggregations/monthly', async (req, res, next) => {
  try {
    const { year } = req.query;
    const matchStage = {};

    if (year) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`);
      matchStage.date = { $gte: start, $lt: end };
    }

    const results = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(results.map(r => ({ month: r._id, total: r.total, count: r.count })));
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses/aggregations/by-category?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/aggregations/by-category', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const match = {};
    if (start || end) {
      match.date = {};
      if (start) match.date.$gte = new Date(`${start}T00:00:00.000Z`);
      if (end) match.date.$lte = new Date(`${end}T23:59:59.999Z`);
    }

    const results = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    res.json(results.map(r => ({ category: r._id, total: r.total, count: r.count })));
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses/aggregations/recent?limit=5
router.get('/aggregations/recent', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 100);
    const expenses = await Expense.find({}).sort({ date: -1, createdAt: -1 }).limit(limit);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
