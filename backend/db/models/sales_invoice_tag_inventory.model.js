const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const SalesInvoiceInventory = sequelize.define("sales_invoice_tag_inventory", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  sales_invoice_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  stock_management_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  average_price: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  unit_price: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  sales_profit: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  discount_item: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  moisture: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  net_weight: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  static_net_weight: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  discount_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = SalesInvoiceInventory;
