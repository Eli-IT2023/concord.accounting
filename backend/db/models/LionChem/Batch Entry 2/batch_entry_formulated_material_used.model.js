const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");
const Vendors = require("../../vendors.model");

const BatchEntryFormulatedMaterialUsed = sequelize.define(
  "batch_entry_formulated_material_used",
  {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    batch_entry_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    formulated_product_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    product_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    vendor_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      defaultValue: null,
    },
    target_weight: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instruction: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    based_target_weight: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    merge_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    unit_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    cost_amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "price sa weight na inorder",
    },
    price_per_unit: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "price per 0.01, quantity to ha hindi weight",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isReplaced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isAdditional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isAdded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }
);

module.exports = BatchEntryFormulatedMaterialUsed;
