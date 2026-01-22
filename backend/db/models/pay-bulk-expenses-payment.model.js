const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PayBulkExpensesPayment = sequelize.define("pay_bulk_expenses_payment", {
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
  payment_type: {
    type: DataTypes.STRING,
  },
  check_number: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  online_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  online_ref_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  date_issued: {
    type: DataTypes.DATEONLY,
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
  payment_status: {
    type: DataTypes.STRING,
  },
});

module.exports = PayBulkExpensesPayment;
