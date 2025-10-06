const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  }
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);
