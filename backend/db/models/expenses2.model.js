const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Expenses2 = sequelize.define("expenses2", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  expenses_type: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  sub_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING("5000"),
    allowNull: true,
  },
  isArchive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Expenses2;
