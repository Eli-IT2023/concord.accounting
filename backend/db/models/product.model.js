const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ProductList = sequelize.define("product_list", {
  product_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  product_code: {
    type: DataTypes.STRING,
    allowNull: false,
    // unique: true, //tinaggal ko yung uniqueness for formulation pwede kasi mangyari same product code pero hindi same suffix
  },
  client_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  srp_amount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  product_name: {
    type: DataTypes.STRING,
  },
  product_category: {
    type: DataTypes.STRING,
  },
  packaging_id: {
    type: DataTypes.CHAR,
  },
  status: {
    type: DataTypes.STRING,
  },
  threshold: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: null,
  },
  archive_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
  },
  suffix: {
    type: DataTypes.CHAR,
    allowNull: true,
    defaultValue: null,
  },
  weight: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: null,
  },
  masterlist_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  reserved: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    comment: "value sa pagreserve ng sales",
  },
});

module.exports = ProductList;
