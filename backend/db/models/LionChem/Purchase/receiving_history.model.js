const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReceivingHistory = sequelize.define("Receiving_history", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  receiving_id: {
    type: DataTypes.CHAR,
  },
  rr_no: {
    type: DataTypes.STRING,
  },
  duty_custom: {
    type: DataTypes.TEXT,
  },
  shipping_fee: {
    type: DataTypes.TEXT,
  },
  date_received: {
    type: DataTypes.DATE,
  },
  receivedBy: {
    type: DataTypes.CHAR,
  },
  receivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
});

module.exports = ReceivingHistory;
