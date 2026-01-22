const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const MasterList = sequelize.define("masterlist", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  emp_id: {
    type: DataTypes.STRING,
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
  address: {
    type: DataTypes.STRING(1000),
  },
  city: {
    type: DataTypes.STRING,
  },
  province: {
    type: DataTypes.STRING,
  },
  zip_code: {
    type: DataTypes.INTEGER,
  },
  email: {
    type: DataTypes.STRING,
  },
  number: {
    type: DataTypes.BIGINT,
  },
  birthdate: {
    type: DataTypes.DATEONLY,
  },
  marital_status: {
    type: DataTypes.STRING,
  },
  gender: {
    type: DataTypes.STRING,
  },
  userrole_id: {
    type: DataTypes.CHAR,
  },
  uname: {
    type: DataTypes.STRING,
  },
  password: {
    type: DataTypes.STRING,
  },
  salary: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  daily_rate: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  user_type: {
    type: DataTypes.STRING,
  },
});

module.exports = MasterList;
