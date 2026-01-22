const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const LoanPayment = sequelize.define("loan_payment", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  loan_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  amount_pay: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  check_reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  account_list_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = LoanPayment;
