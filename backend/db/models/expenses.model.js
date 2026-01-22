const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Expenses = sequelize.define("expenses", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  client_transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  foreign: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  currency_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  expenses2_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  paid_amount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  desc: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expenses_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  unitPrice: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  assetQuantity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  isAdded: {
    // indicator para malaman added naba sa bulk transaction
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = Expenses;
