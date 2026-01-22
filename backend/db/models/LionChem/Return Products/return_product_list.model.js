const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnProductList = sequelize.define("return_product_list", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  return_product_id: {
    type: DataTypes.CHAR,
  },
  schedule_product_list_id: {
    type: DataTypes.CHAR,
  },
  original_weight: {
    type: DataTypes.DOUBLE,
  },
  return_weight: {
    type: DataTypes.DOUBLE,
  },
  delivered_weight: {
    type: DataTypes.DOUBLE,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = ReturnProductList;
