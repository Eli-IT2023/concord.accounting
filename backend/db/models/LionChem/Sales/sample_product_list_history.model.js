const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const SampleProductListHistory = sequelize.define(
  "sample_product_list_history",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },

    sample_product_id: {
      type: DataTypes.CHAR,
    },
    stock_management_id: {
      type: DataTypes.CHAR,
    },
    borrowed_quantity: {
      type: DataTypes.DOUBLE,
    },
  }
);

module.exports = SampleProductListHistory;
