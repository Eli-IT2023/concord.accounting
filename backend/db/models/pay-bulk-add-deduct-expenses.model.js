const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PayBulkAddDeductExpenses = sequelize.define(
  "pay_bulk_add_deduct_expenses",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    pay_bulk_id: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    account_list_sub3_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    loan_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DOUBLE,
    },
    type_expenses: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    loan_or_account: {
      type: DataTypes.STRING,
    },
    rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }
);

module.exports = PayBulkAddDeductExpenses;
