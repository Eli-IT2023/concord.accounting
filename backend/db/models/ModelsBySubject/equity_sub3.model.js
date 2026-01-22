const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const EquitySub3 = sequelize.define("equity_sub3", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  equity_id: {
    type: DataTypes.CHAR,
  },
  account_name: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  amount_static: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING,
  },
});

module.exports = EquitySub3;
