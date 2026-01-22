const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnCapitalMother = sequelize.define("return_capital_mother", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING(2000),
  },
  total_net_amount: {
    type: DataTypes.DOUBLE,
  },
  total_distributed_amount: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "Pending",
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlistID approve/reject",
  },
});

module.exports = ReturnCapitalMother;
