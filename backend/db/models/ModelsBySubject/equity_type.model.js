const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Equity = sequelize.define("equity_account", {
  equity_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  subject_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Equity;
