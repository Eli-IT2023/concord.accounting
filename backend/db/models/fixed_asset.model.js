const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const FixedAsset = sequelize.define("fixed_asset", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_code: {
    type: DataTypes.STRING,
  },
  // expenses_id: {
  //   type: DataTypes.CHAR,
  // },
  product_name: {
    type: DataTypes.STRING,
  },
  currency_id: {
    type: DataTypes.CHAR,
  },
  date_depreciated: {
    type: DataTypes.DATEONLY,
  },
  cost_per_unit: {
    type: DataTypes.DOUBLE,
  },
  quantity: {
    type: DataTypes.DOUBLE,
  },
  total_cost: {
    type: DataTypes.DOUBLE,
  },
  static_months_to_pay: {
    type: DataTypes.DOUBLE,
  },
  depreciation_amount: {
    type: DataTypes.DOUBLE,
  },
  remarks: {
    type: DataTypes.STRING(2000),
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

module.exports = FixedAsset;
