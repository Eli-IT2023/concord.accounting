const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PurchaseRequest = sequelize.define("purchase_request", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  pr_no: {
    type: DataTypes.STRING,
  },
  date_needed: {
    type: DataTypes.STRING,
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING,
  },
  requestedBy: {
    type: DataTypes.STRING,
  },
  preparedBy: {
    type: DataTypes.STRING,
  },
  approvedBy: {
    type: DataTypes.STRING,
  },
});

module.exports = PurchaseRequest;
