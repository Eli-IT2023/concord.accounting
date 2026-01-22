const { Sequelize } = require("sequelize");
module.exports = {
  localDB: new Sequelize({
    host: "localhost",
    database: "lionchem_erp",
    dialect: "mysql",
    username: "root",
    password: "",
    timezone: "+08:00",
    alter: false,
    logging: false,
  }),

  cloudDB: new Sequelize({
    host: "180.232.110.171",
    database: "lionchem_erp",
    dialect: "mysql",
    username: "root1",
    password: "Jq.wVhUaTRGBOYlB",
    timezone: "+08:00",
    alter: false,
    logging: false,
    dialectOptions: {
      connectTimeout: 60000, // Set timeout to 60 seconds
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
  }),
};
