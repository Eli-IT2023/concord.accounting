const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Production_History = sequelize.define("production_history", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  production_finish_product_id: {
    type: DataTypes.CHAR,
  },
  internal_remarks: {
    type: DataTypes.TEXT,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = Production_History;
