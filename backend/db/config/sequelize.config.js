const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");

const sequelize = new Sequelize({
  host: "localhost",
  database: "lionchem_erp", //eto yung ichachange sa on cloud
  dialect: "mysql",
  username: "root",
  password: "",
  timezone: "+08:00",
  alter: false,
  logging: true,
});

sequelize
  .sync()
  .then(() => {
    console.log("Database synced successfully");
  })
  .catch((e) => {
    console.error("Database synchronization failed: " + e);
  });

// host: "180.232.110.171",
// username: "repl",
// port: 3306,
// password: "LVTphz27527",

// async function checkReplicationStatus(logs) {
//   try {
//     const connection = await mysql.createConnection({
//       host: "localhost",
//       user: "root",
//       password: "",
//     });

//     const [rows] = await connection.query("SHOW SLAVE STATUS");
//     await connection.end();

//     if (rows.length === 0) {
//       logs.push("Not a slave instance or replication is not set up.");
//       return false;
//     }

//     const slaveStatus = rows[0];
//     if (
//       slaveStatus.Slave_IO_Running === "Yes" &&
//       slaveStatus.Slave_SQL_Running === "Yes"
//     ) {
//       logs.push("Cloud and Local are connected successfully.");
//       return true;
//     } else {
//       logs.push("Master and Slave are NOT connected.");
//       logs.push(`Slave_IO_Running: ${slaveStatus.Slave_IO_Running}`);
//       logs.push(`Slave_SQL_Running: ${slaveStatus.Slave_SQL_Running}`);
//       logs.push(`Last_Error: ${slaveStatus.Last_Error || "None"}`);
//       return false;
//     }
//   } catch (error) {
//     logs.push(`Failed to check replication status: ${error.message}`);
//     return false;
//   }
// }

// async function initializeDatabase() {
//   const logs = [];

//   try {
//     await sequelize.authenticate();
//     logs.push("Database connection established successfully.");

//     const isReplicationOK = await checkReplicationStatus(logs);

//     if (isReplicationOK) {
//       await sequelize.sync();
//       logs.push("Database synced successfully.");
//     } else {
//       logs.push("Replication check failed. Database sync aborted.");
//     }
//   } catch (error) {
//     logs.push(`Database connection or sync failed: ${error.message}`);
//   }

//   console.log(logs.join("\n"));
// }

// initializeDatabase();

module.exports = sequelize;
