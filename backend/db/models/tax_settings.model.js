const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const TaxSettings = sequelize.define("tax_settings", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
  },
  rate: {
    type: DataTypes.DOUBLE,
  },
  threshold_amount: {
    type: DataTypes.DOUBLE,
  },
  applicability: {
    type: DataTypes.STRING,
  },
  transaction_type: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING(5000),
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "active",
  },
});

module.exports = TaxSettings;
