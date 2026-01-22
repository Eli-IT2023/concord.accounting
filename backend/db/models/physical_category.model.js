const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PhysicalCategory = sequelize.define("physical_category", {
  physical_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  attribute: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
  },
});

module.exports = PhysicalCategory;
