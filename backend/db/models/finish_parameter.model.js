const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Finish_Parameter = sequelize.define("finish_parameter", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  formulation_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  finish_product_id: {
    type: DataTypes.CHAR,
    allowNull: false,
    comment: "Finish Product ID",
  },
  parameter_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  uom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = Finish_Parameter;
