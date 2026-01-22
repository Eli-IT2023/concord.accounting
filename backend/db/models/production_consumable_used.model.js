const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ProductionConsumableUsed = sequelize.define(
  "production_consumable_used",
  {
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
    production_price: {
      type: DataTypes.DOUBLE,
      comment: "Unit Price",
    },
    weight_in: {
      type: DataTypes.DOUBLE,
      comment: "Quantity",
    },
    costing: {
      type: DataTypes.DOUBLE,
      comment: "Total",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "soft delete",
    },
  }
);

module.exports = ProductionConsumableUsed;
