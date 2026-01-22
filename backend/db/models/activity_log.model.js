const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Activity_Log = sequelize.define("activity_log", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  masterlist_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  action_taken: {
    type: DataTypes.STRING(5000),
  },
});

module.exports = Activity_Log;
