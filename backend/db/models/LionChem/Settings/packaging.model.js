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
  unit: {
    type: DataTypes.STRING,
  },
  unit_quantity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  packaging_image: {
    type: DataTypes.BLOB("long"),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
  },
});

module.exports = Packaging;
