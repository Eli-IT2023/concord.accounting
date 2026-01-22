const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnEarningsCutoffs = sequelize.define("return_earnings_cutoffs", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  return_earnings_id: {
    type: DataTypes.CHAR,
  },
  cutoff_id: {
    type: DataTypes.CHAR,
  },
});

module.exports = ReturnEarningsCutoffs;
