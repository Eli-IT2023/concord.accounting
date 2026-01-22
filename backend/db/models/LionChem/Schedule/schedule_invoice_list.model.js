const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ScheduleInvoiceList = sequelize.define("schedule_invoice_list", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  schedule_id: {
    type: DataTypes.CHAR(36),
  },
  // batch_entry_id: {
  //   type: DataTypes.CHAR(36),
  // },
  sales_invoice_id: {
    type: DataTypes.CHAR(36),
  },
  weight_to_deliver: {
    type: DataTypes.DOUBLE,
  },
  delivered_quantity: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
  },
  ordered_weight: {
    type: DataTypes.DOUBLE,
  },
  non_modify_weight: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
    comment: "this is for record para sa records pag nag return",
  },
  returned_weight: {
    defaultValue: 0,
    allowNull: false,
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = ScheduleInvoiceList;
