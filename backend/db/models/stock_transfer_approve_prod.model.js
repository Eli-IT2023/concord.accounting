const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const StockTransferApproveProducts = sequelize.define(
  "stock_transfer_approve_prod",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    stock_transfer_products_id: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    stockmanagement_id: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    deducted_quantity: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  }
);

module.exports = StockTransferApproveProducts;
