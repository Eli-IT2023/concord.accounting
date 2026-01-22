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
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "start date",
  },
  date_produce: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: "end date",
  },
  machine: {
    type: DataTypes.STRING,
    allowNull: true,
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
  total_quantity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  total_produce: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  loss_percent: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  loss_quantity: {
    type: DataTypes.DOUBLE,
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
