const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const getAccurateDate = require("../../utils/accurate_date_time_today");
const Customer = sequelize.define("customer", {
  customer_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  type: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.BOOLEAN,
  },
  first_name: {
    type: DataTypes.STRING,
  },
  last_name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  company_address: {
    type: DataTypes.STRING,
  },
  country: {
    type: DataTypes.STRING,
  },
  destination: {
    type: DataTypes.STRING,
  },
  civil_status: {
    type: DataTypes.STRING,
  },
  date_birth: {
    type: DataTypes.STRING,
  },
  gender: {
    type: DataTypes.STRING,
  },
  mobile_no: {
    type: DataTypes.STRING,
  },
  job_position: {
    type: DataTypes.STRING,
  },
  tin: {
    type: DataTypes.STRING,
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
  notes: {
    type: DataTypes.STRING,
  },
  balance: {
    type: DataTypes.DOUBLE,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Soft delete",
  },
});
Customer.beforeCreate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.createdAt = ntpDate;
  data.updatedAt = ntpDate;
});

Customer.beforeUpdate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.updatedAt = ntpDate;
});
module.exports = Customer;
