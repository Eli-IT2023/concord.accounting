const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const InventoryCounting = sequelize.define("inventory_counting", {
  inventory_counting_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_id: {
    type: DataTypes.STRING,
  },
  counting_date: {
    type: DataTypes.DATEONLY,
  },
  remarks: {
    type: DataTypes.STRING,
  },
  user: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id: For approver and rejector",
  },
});

module.exports = InventoryCounting;
