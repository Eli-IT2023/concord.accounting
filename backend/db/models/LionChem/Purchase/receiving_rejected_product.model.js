const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReceivingRejectedProduct = sequelize.define(
  "receiving_rejected_product",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    po_vendor_prod_id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: false,
    },
    rejected_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    remarks: {
      type: DataTypes.TEXT,
    },
    isDeleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  }
);

module.exports = ReceivingRejectedProduct;
