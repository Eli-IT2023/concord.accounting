const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PrinterList = sequelize.define("printer_list", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  printer_name: {
    type: DataTypes.STRING,
  },
  printer_id: {
    type: DataTypes.STRING,
  },
  printer_state: {
    type: DataTypes.STRING,
  },
  computer_name: {
    type: DataTypes.STRING,
  },
  computer_inet: {
    type: DataTypes.STRING,
  },
  computer_state: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = PrinterList;
