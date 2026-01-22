const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Production = sequelize.define("production", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  production_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  desc: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date_produce: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  shift: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  warehouse_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = Production;
