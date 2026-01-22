const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Production_History = sequelize.define("production_history_suffix", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  production_history_id: {
    type: DataTypes.CHAR,
  },
  suffix: {
    type: DataTypes.TEXT,
  },
  quantity: {
    type: DataTypes.DOUBLE,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = Production_History;
