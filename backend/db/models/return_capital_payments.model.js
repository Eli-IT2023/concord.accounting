const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnCapitalPayments = sequelize.define("return_capital_payments", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  return_owner_list_id: {
    type: DataTypes.CHAR,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  check_number: {
    type: DataTypes.STRING,
  },
  account_list_id_payment: {
    type: DataTypes.CHAR,
  },
  date: {
    type: DataTypes.DATEONLY,
  },
  type: {
    type: DataTypes.STRING,
  },
});

module.exports = ReturnCapitalPayments;
