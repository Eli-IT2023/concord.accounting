const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Notification = sequelize.define("notification", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  setting_type: {
    type: DataTypes.STRING,
  },
  isChecked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  days: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
});

module.exports = Notification;
