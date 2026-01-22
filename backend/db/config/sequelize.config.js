const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");

const sequelize = new Sequelize({
  host: "localhost",
  database: "eli_accounting",
  dialect: "mysql",
  username: "root",
  password: "",
  timezone: "+08:00",
  alter: false,
  logging: false,
});

sequelize
  .sync()
  .then(() => {
    console.log("Database synced successfully");
  })
  .catch((e) => {
    console.error("Database synchronization failed: " + e);
  });

module.exports = sequelize;
