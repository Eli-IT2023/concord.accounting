const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const LendPayment = sequelize.define("lend_payment", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  lend_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  account_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  check_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = LendPayment;
