const sequelize = require("../config/sequelize.config");
const { DataTypes, DATEONLY, INTEGER } = require("sequelize");
const Vendors = require("./vendors.model");

const Previous_Profit_Loss = sequelize.define("previous_profit_loss", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  account_list_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  currency_id: {
    type: DataTypes.CHAR,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  system_rate: {
    type: DataTypes.DOUBLE,
  },
  system_value: {
    type: DataTypes.DOUBLE,
  },
  actual_rate: {
    type: DataTypes.DOUBLE,
  },
  actual_amount: {
    type: DataTypes.DOUBLE,
  },
  exchange_gain_loss: {
    type: DataTypes.DOUBLE,
  },
});

module.exports = Previous_Profit_Loss;
