const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const FixedAssetForecast = sequelize.define("fixed_asset_forecast", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  fixed_asset_id: {
    type: DataTypes.CHAR,
  },
  date: {
    type: DataTypes.DATEONLY,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.STRING,
  },
  isCreated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  expense_id: {
    type: DataTypes.CHAR,
  },
});

module.exports = FixedAssetForecast;
