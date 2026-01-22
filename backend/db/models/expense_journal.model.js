const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const ExpenseJournal = sequelize.define("expense_journal", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  expenses2_id: {
    type: DataTypes.CHAR,
  },
  date: {
    type: DataTypes.DATEONLY,
  },
  total_amount: {
    type: DataTypes.DOUBLE,
  },
  payment_type: {
    type: DataTypes.STRING,
  },
  currency_name: {
    type: DataTypes.STRING,
  },
  currency_rate: {
    type: DataTypes.DOUBLE,
  },
});

module.exports = ExpenseJournal;
