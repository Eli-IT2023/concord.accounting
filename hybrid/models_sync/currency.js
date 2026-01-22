const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  currency_sub,
} = require("../../backend/db/models/ModelsBySubject/associations_sub.js");

const CurrencySyncData = async () => {
  try {
    const localUsers = await currency_sub.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `currencies` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`currencies\` (
                id, based_currency, currency_name, currency_rate, status, isArchive, createdAt, updatedAt
              ) VALUES (
                :id, :based_currency, :currency_name, :currency_rate, :status, :isArchive, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              based_currency: user.based_currency,
              currency_name: user.currency_name,
              currency_rate: user.currency_rate,
              status: user.status,
              isArchive: user.isArchive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing currencies to cloud: ${user.based_currency} ${user.currency_name} (${user.id})`
        );
      } else {
        // Compare fields to check if update is needed
        const cloud = cloudUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(cloud.updatedAt).getTime();

        if (needsUpdate) {
          //   console.log(`pumasok sa needsUpdate`);
          await cloudDB.query(
            `UPDATE currencies SET
               based_currency = :based_currency, 
               currency_name = :currency_name, 
               currency_rate = :currency_rate, 
               status = :status, 
               isArchive = :isArchive,
               updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                based_currency: user.based_currency,
                currency_name: user.currency_name,
                currency_rate: user.currency_rate,
                status: user.status,
                isArchive: user.isArchive,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated currencies in cloud: ${user.based_currency} (${user.currency_name}) - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `currencies`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await currency_sub.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await currency_sub.create({
          id: user.id,
          based_currency: user.based_currency,
          currency_name: user.currency_name,
          currency_rate: user.currency_rate,
          status: user.status,
          isArchive: user.isArchive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing currencies to local: ${user.based_currency} ${user.currency_name} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await currency_sub.update(
            {
              based_currency: user.based_currency,
              currency_name: user.currency_name,
              currency_rate: user.currency_rate,
              status: user.status,
              isArchive: user.isArchive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated currencies in local: ${user.based_currency} (${user.currency_name}) - ${user.id}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { CurrencySyncData };
