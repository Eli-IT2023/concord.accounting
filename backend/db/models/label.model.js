const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Label = sequelize.define("label", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  label_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sub_label_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING("5000"),
    allowNull: true,
  },
});

module.exports = Label;
