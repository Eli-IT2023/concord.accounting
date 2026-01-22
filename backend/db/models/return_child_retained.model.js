const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnChildRetained = sequelize.define("return_child_retained", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  return_capital_mother_id: {
    type: DataTypes.CHAR,
  },
  return_earnings_id: {
    type: DataTypes.CHAR,
  },
});

module.exports = ReturnChildRetained;
