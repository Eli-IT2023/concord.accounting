const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Currency = sequelize.define("currency", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  based_currency: {
    type: DataTypes.STRING,
  },
  currency_name: {
    type: DataTypes.STRING,
  },
  currency_rate: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
  isArchive: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = Currency;
