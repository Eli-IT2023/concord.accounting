const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Inventory_Report = sequelize.define("inventory_report", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  cut_off_id: {
    type: DataTypes.CHAR,
  },
  product_id: {
    type: DataTypes.CHAR,
  },
  average_price: {
    type: DataTypes.DOUBLE,
  },
  product_out: {
    type: DataTypes.DOUBLE,
  },
  unit_price: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  from_counting: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  date_in: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  sales_invoice_id: {
    type: DataTypes.CHAR,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  module_in_from: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Inventory_Report;
