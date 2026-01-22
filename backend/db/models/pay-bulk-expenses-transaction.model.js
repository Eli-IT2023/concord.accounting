const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PayBulkExpensesTransaction = sequelize.define(
  "pay_bulk_expenses_transaction",
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
      allowNull: true,
    },
    expenses_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: "soft delete",
    },
  }
);

module.exports = PayBulkExpensesTransaction;
