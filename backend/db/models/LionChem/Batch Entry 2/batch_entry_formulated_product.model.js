const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryFormulatedProduct = sequelize.define(
  "batch_entry_formulated_products",
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
    sales_product_tag_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    weight: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    merge_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    packaging_name: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    packaging_unit: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    packaging_unit_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    invoice_ordered_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    lot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }
);

module.exports = BatchEntryFormulatedProduct;
