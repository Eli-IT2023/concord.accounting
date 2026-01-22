const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Other_Income_Payment = sequelize.define("other_income_payment", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  other_income_id: {
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
    type: DataTypes.STRING,
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
  foreign: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Other_Income_Payment;
