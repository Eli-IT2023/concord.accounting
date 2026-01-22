const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Packaging = sequelize.define("packaging", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  packaging_name: {
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

module.exports = Packaging;
