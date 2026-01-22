const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const SeriesNumber = sequelize.define("series_number", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  category: {
    type: DataTypes.STRING,
  },
  alphabetical_value: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  series_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: false,
  },
});

module.exports = SeriesNumber;
