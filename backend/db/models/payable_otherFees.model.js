const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Payable_Fees = sequelize.define("payable_other_fees", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  payable_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  fee_name: {
    type: DataTypes.STRING,
  },
  fee_amount: {
    type: DataTypes.DOUBLE,
  },
});

module.exports = Payable_Fees;
