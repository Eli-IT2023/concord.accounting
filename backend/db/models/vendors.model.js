const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const getAccurateDate = require("../../utils/accurate_date_time_today");
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
  },
  company_email: {
    type: DataTypes.STRING,
  },
  company_address: {
    type: DataTypes.STRING,
  },
  company_city: {
    type: DataTypes.STRING,
  },
  company_country: {
    type: DataTypes.STRING,
  },
  company_designation: {
    type: DataTypes.STRING,
  },
  fname: {
    type: DataTypes.STRING,
  },
  lname: {
    type: DataTypes.STRING,
  },
  mname: {
    type: DataTypes.STRING,
  },
  civil_status: {
    type: DataTypes.STRING,
  },
  dob: {
    type: DataTypes.STRING,
  },
  gender: {
    type: DataTypes.STRING,
  },
  contact: {
    type: DataTypes.STRING,
  },
  contact2: {
    type: DataTypes.STRING,
  },
  tin_number: {
    type: DataTypes.STRING,
  },
  position: {
    type: DataTypes.STRING,
  },
  currency_id: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
  },
  isArchive: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  supplier_code: {
    type: DataTypes.STRING,
  },
});

// to make accurate the date and time without relying in the local device date and time
Vendors.beforeCreate(async (vendor, options) => {
  const ntpDate = await getAccurateDate();
  vendor.createdAt = ntpDate;
  vendor.updatedAt = ntpDate;
});

Vendors.beforeUpdate(async (vendor, options) => {
  const ntpDate = await getAccurateDate();
  vendor.updatedAt = ntpDate;
});

module.exports = Vendors;
