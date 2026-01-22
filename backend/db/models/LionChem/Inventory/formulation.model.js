const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Formulation = sequelize.define("formulation", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  product_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  total_composition: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  total_target_weight: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdBy: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
});

module.exports = Formulation;
