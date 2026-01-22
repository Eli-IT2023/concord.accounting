const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CompanyProfile = sequelize.define("company_profile", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  company_name: {
    type: DataTypes.STRING,
  },
  company_address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contact_number: {
    type: DataTypes.STRING,
  },
  landline: {
    type: DataTypes.STRING,
  },
  tin: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  logo: {
    type: DataTypes.BLOB("long"),
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = CompanyProfile;
