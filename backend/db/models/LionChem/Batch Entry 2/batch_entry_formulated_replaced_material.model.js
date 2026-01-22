const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryFormulatedReplacedMaterial = sequelize.define(
  "batch_entry_formulated_replaced_material",
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

    product_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    replaced_product_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    target_weight: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },

    based_target_weight: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    merge_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }
);

module.exports = BatchEntryFormulatedReplacedMaterial;
