const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Payable_Payment = sequelize.define("payable_bulk_payment", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  payable_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  accountList_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  payment_type: {
    type: DataTypes.STRING,
  },
  check_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ref_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  date_issued: {
    type: DataTypes.DATEONLY,
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Payable_Payment;
