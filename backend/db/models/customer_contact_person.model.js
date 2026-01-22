const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CustomerContactPerson = sequelize.define("customer_contact_person", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  customer_id: {
    type: DataTypes.CHAR,
  },
  fname: {
    type: DataTypes.STRING,
  },
  mname: {
    type: DataTypes.STRING,
  },
  lname: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  job_position: {
    type: DataTypes.STRING,
  },
  mobile_no: {
    type: DataTypes.STRING,
  },
  remarks: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = CustomerContactPerson;
