const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ScheduleDeliver = sequelize.define("schedule_deliver", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  schedule_id: {
    type: DataTypes.CHAR,
  },
  title: {
    type: DataTypes.STRING,
  },
  delivered_date: {
    type: DataTypes.DATE,
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.CHAR,
  },
});

module.exports = ScheduleDeliver;
