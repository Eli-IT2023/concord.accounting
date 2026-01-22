const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CompanySettings = sequelize.define("company_settings", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  company_code: {
    type: DataTypes.STRING,
  },
  company_name: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  landline: {
    type: DataTypes.STRING,
  },
  contact_number: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  tin_no: {
    type: DataTypes.STRING,
  },
  company_logo: {
    type: DataTypes.BLOB("long"),
    allowNull: true,
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

module.exports = CompanySettings;
