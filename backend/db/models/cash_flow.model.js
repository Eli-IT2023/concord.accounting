const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CashFlow = sequelize.define("cash_flow", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  account_list_id_cash_from: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
  },
  transaction_number: {
    type: DataTypes.STRING,
  },

  account_list_id_cash_to: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  module_from: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "soft delete",
  },
});

module.exports = CashFlow;
