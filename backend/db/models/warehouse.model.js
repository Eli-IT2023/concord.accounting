const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Warehouse = sequelize.define("warehouse", {
  warehouse_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
  },
  branch_type: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  province: {
    type: DataTypes.STRING,
  },
  municipality: {
    type: DataTypes.STRING,
  },
  zipcode: {
    type: DataTypes.INTEGER,
  },
  description: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.INTEGER,
  },
});

module.exports = Warehouse;
