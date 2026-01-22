const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Label_Tag = sequelize.define("label_tag", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  label_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Label_Tag;
