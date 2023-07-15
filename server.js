const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

mongoose
  .connect(
    "mongodb+srv://Prateek:EjCOPVeGUt3mVxBR@cluster0.ukgaesh.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });
const db = mongoose.connection;
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  department: {
    type: String,
    required: true,
    enum: ["HR", "Tech", "Product", "Leadership"],
  },
  annualSalary: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Employee = mongoose.model("Employee", employeeSchema);

const logEntrySchema = new mongoose.Schema({
  action: { type: String, required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  originalData: { type: mongoose.Schema.Types.Mixed },
  newData: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

const LogEntry = mongoose.model("LogEntry", logEntrySchema);

app.use(bodyParser.json());
app.use(cors());

app.post("/api/employees", async (req, res) => {
  try {
    const { name, title, department, annualSalary } = req.body;
    const employee = new Employee({ name, title, department, annualSalary });
    await employee.save();
    console.log(`Employee created: ${employee}`);

    const logEntry = new LogEntry({
      action: "create",
      employeeId: employee._id,
      newData: employee.toObject(),
    });
    await logEntry.save();

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to create the employee" });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.get("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the employee" });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const { department, title, annualSalary } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const originalEmployeeData = employee.toObject();
    employee.department = department || employee.department;
    employee.title = title || employee.title;
    employee.annualSalary = annualSalary || employee.annualSalary;
    await employee.save();

    const updatedEmployeeData = employee.toObject();
    console.log(`Employee updated: ${employee}`);

    const logEntry = new LogEntry({
      action: "update",
      employeeId: employee._id,
      originalData: originalEmployeeData,
      newData: updatedEmployeeData,
    });
    await logEntry.save();

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to update the employee" });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    employee.isDeleted = true;
    await employee.save();

    console.log(`Employee deleted: ${employee}`);

    const logEntry = new LogEntry({
      action: "delete",
      employeeId: employee._id,
      deletedData: employee.toObject(),
    });
    await logEntry.save();

    res.json({ message: "Employee marked as deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete the employee" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
