const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Source = sequelize.define("source", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING(2500),
  },
  status: {
    type: DataTypes.STRING,
  },
});

module.exports = Source;
