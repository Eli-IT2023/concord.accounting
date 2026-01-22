const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryRawMaterials = sequelize.define(
  "batch_entry_tag_raw_materials",
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
    original_product_tag_vendor_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    replacement_product_tag_vendor_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    is_replacement: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    quantity_required: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    quantity_used: {
      type: DataTypes.DOUBLE,
      comment: "for post production may comparison for required and used",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }
);

module.exports = BatchEntryRawMaterials;
