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
  request_name: {
    type: DataTypes.STRING,
    comment: "Name of the purchase request",
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

  rejectedBy: {
    type: DataTypes.STRING,
  },
  rejectRemarks: {
    type: DataTypes.TEXT,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null, // or DataTypes.NOW for automatic timestamp
  },
  approveRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null, // or DataTypes.NOW for automatic timestamp
  },

  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },

  isPO: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = PurchaseRequest;
