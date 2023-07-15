const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  department: { type: String, required: true, enum: ['HR', 'Tech', 'Product', 'Leadership'] },
  annualSalary: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
