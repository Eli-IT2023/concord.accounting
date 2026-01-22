const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Production_finish_raw_used = sequelize.define(
  "production_finish_raw_used",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    production_finish_product_id: {
      type: DataTypes.CHAR,
    },
    production_raw_used_id: {
      type: DataTypes.CHAR,
    },
    weight_in: {
      type: DataTypes.DOUBLE,
    },
    net_weight: {
      type: DataTypes.DOUBLE,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "soft delete",
    },
  }
);

module.exports = Production_finish_raw_used;
