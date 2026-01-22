const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryMain = sequelize.define("batch_entry_main", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  batch_transaction_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  batch_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  batch_remarks: {
    type: DataTypes.STRING,
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
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "Masterlist ID kung sino nag-create ng batch entry",
  },
});

module.exports = BatchEntryMain;
