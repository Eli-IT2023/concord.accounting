const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Expenses1 = sequelize.define("expenses_one", {
  expenses_one_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  expenses_type_one: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isArchive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Expenses1;
