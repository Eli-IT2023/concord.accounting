const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const SampleProductList = sequelize.define("sample_product_list", {
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
  product_id: {
    type: DataTypes.CHAR,
  },
  remaining_quantity: {
    type: DataTypes.DOUBLE,
  },
  release_quantity: {
    type: DataTypes.DOUBLE,
  },
  remarks: {
    type: DataTypes.TEXT,
  },

  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = SampleProductList;
