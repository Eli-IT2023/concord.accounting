const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryCost = sequelize.define("batch_entry_tag_cost", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  batch_entry_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  cost_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cost_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = BatchEntryCost;
