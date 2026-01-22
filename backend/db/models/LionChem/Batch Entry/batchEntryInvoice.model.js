const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryInvoice = sequelize.define("batch_entry_tag_invoice", {
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
  sales_invoice_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = BatchEntryInvoice;
