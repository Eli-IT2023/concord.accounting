const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ProductTagCustomer = sequelize.define("product_tag_customer", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  product_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  customer_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  customer_product_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customer_product_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  product_price: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  previous_price: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = ProductTagCustomer;
