const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntry = sequelize.define("batch_entry", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  batch_title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  team_leader: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  members: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  print_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  reprint_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = BatchEntry;
