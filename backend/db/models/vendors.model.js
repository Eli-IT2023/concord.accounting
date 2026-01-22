const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Vendors = sequelize.define("vendors", {
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
  company_nature: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_designation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fname: {
    type: DataTypes.STRING,
  },
  lname: {
    type: DataTypes.STRING,
  },
  mname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  civil_status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dob: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contact2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tin_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  currency_id: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
  },
  vat: {
    type: DataTypes.INTEGER,
  },
  isArchive: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = Vendors;
