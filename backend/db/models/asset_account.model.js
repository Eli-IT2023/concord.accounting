const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const AssetAccount = sequelize.define("asset_account", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  masterlist_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  account_list_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  label_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  payment_options: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  release_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  loan_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  interest_percent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  interest_amount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  terms: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  total: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
});

module.exports = AssetAccount;
