const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnStockHistory = sequelize.define("return_stock_history", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  return_product_list_id: {
    type: DataTypes.CHAR,
  },
  stock_management_id: {
    type: DataTypes.CHAR,
  },
  sales_invoice_id: {
    type: DataTypes.CHAR,
  },
  return_quantity: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
  },
  lot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  createdBy: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
});

module.exports = ReturnStockHistory;
