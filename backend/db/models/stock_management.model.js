const sequelize = require("../config/sequelize.config");
const { DataTypes, Transaction, STRING } = require("sequelize");

const StockManagement = sequelize.define("stock_management", {
  stock_management_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  product_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  warehouse_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  stock: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  in: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    comment: "Para static na quantity na pumasok",
  },
  price: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    comment: "IN PESO NA TO",
  },
  price_in: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    comment: "IN PESO NA TO",
  },
  vendor_id: {
    type: DataTypes.CHAR,
  },
  date_in: {
    type: DataTypes.DATEONLY,
  },
  transaction_number: {
    type: STRING,
    defaultValue: null,
  },
  module_in_from: {
    type: STRING,
    defaultValue: null,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: "Expiry date of the stock",
  },
  lot: {
    type: STRING,
    allowNull: true,
    comment: "For more specific stock tracking (batch entry)",
  },
});

module.exports = StockManagement;
