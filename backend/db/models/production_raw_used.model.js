const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Production_Raw = sequelize.define("production_raw_used", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  production_id: {
    type: DataTypes.CHAR,
  },
  product_id: {
    type: DataTypes.CHAR,
  },
  stock_management_id: {
    type: DataTypes.CHAR,
  },
  vendor_id: {
    type: DataTypes.CHAR,
    comment: "for supplier code",
  },
  production_price: {
    type: DataTypes.DOUBLE,
  },
  weight_in: {
    type: DataTypes.DOUBLE,
  },
  costing: {
    type: DataTypes.DOUBLE,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "soft delete",
  },
});

module.exports = Production_Raw;
