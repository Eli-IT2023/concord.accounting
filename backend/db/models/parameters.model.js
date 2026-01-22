const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Parameters = sequelize.define("parameter", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
  },
  uom: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  category: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING(2500),
  },
  status: {
    type: DataTypes.STRING,
  },
});

module.exports = Parameters;
