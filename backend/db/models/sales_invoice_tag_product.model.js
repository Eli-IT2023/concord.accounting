const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const SalesInvoiceTagProduct = sequelize.define("sales_invoice_tag_product", {
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
  customer_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  product_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  unit_price: {
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
  actual_quantity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: "for post production may comparison for before and actual",
  },
  subtotal: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  discount_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  packaging_unit_quantity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = SalesInvoiceTagProduct;
