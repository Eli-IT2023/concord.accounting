const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ScheduleModel = sequelize.define("schedule", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  schedule_code: {
    type: DataTypes.STRING,
  },
  title: {
    type: DataTypes.STRING,
  },
  delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  total_weight: {
    type: DataTypes.DOUBLE,
  },
  delivered_weight: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
  },
  non_modify_weight: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
    comment: "this is for record para sa records pag nag return",
  },
  plate_number: {
    type: DataTypes.STRING,
  },
  remarks: {
    type: DataTypes.TEXT,
  },

  status: {
    type: DataTypes.STRING,
  },
  driver: {
    type: DataTypes.STRING,
  },

  porters: {
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
  approvedBy: {
    type: DataTypes.CHAR,
  },
  approvedRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null, // or DataTypes.NOW for automatic timestamp
  },
  rejectedBy: {
    type: DataTypes.CHAR,
  },
  rejectedRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null, // or DataTypes.NOW for automatic timestamp
  },
});

module.exports = ScheduleModel;
