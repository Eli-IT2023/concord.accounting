const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PurchaseOrderVendorProduct = sequelize.define(
  "purchase_order_vendor_product",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    po_id: {
      type: DataTypes.CHAR,
    },
    product_id: {
      type: DataTypes.CHAR,
    },
    pr_id: {
      type: DataTypes.CHAR,
    },
    price: {
      type: DataTypes.DOUBLE,
    },
    original_quantity: {
      type: DataTypes.DOUBLE,
    },
    quantity: {
      type: DataTypes.DOUBLE,
    },
    unit_quantity: {
      type: DataTypes.DOUBLE,
    },
    rejected_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    total_received: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    product_total: {
      type: DataTypes.DOUBLE,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
    },
  }
);

module.exports = PurchaseOrderVendorProduct;
