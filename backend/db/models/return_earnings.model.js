const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnEarnings = sequelize.define("return_earnings", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
  },
  from: {
    type: DataTypes.DATEONLY,
  },
  to: {
    type: DataTypes.DATEONLY,
  },
  isPosted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isAdded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "soft delete",
  },
});

module.exports = ReturnEarnings;
