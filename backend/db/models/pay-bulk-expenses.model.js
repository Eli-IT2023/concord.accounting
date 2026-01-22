const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PayBulkExpenses = sequelize.define("pay_bulk_expenses", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  pay_date: {
    type: DataTypes.DATEONLY,
  },
  transaction_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  module_from: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  currency_id: {
    type: DataTypes.CHAR,
  },
  rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 1,
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id: For approver and rejector",
  },
  date_approved: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = PayBulkExpenses;
