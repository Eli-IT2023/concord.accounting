const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Payable_Product = sequelize.define("payable_product", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  payable_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  product_vendor_id: {
    type: DataTypes.CHAR,
  },
  moisture: {
    type: DataTypes.DOUBLE,
  },
  moisture_type: {
    type: DataTypes.STRING,
  },
  weight: {
    type: DataTypes.DOUBLE,
  },
  net_weight: {
    type: DataTypes.DOUBLE,
  },
  static_net_weight: {
    type: DataTypes.DOUBLE,
  },
  unitPrice: {
    type: DataTypes.DOUBLE,
  },
  order_index: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
});

module.exports = Payable_Product;
