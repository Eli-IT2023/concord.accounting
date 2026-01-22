const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryStockManagementHistory = sequelize.define(
  "batch_entry_stock_management_history",
  {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    batch_entry_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    stock_management_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    be_material_used_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    deducted_stock: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    cost_amount: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    lot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }
);

module.exports = BatchEntryStockManagementHistory;
