const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Activity_Log } = require("../../backend/db/models/associations.js");

const ActivityLogSyncData = async () => {
  try {
    const localUsers = await Activity_Log.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `activity_logs` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`activity_logs\` (
                id, masterlist_id, action_taken, createdAt, updatedAt
              ) VALUES (
                :id, :masterlist_id, :action_taken, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              masterlist_id: user.masterlist_id,
              action_taken: user.action_taken,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing  activity_logs to cloud: ${user.masterlist_id} (${user.id})`
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
            `UPDATE activity_logs SET
               masterlist_id = :masterlist_id, 
               action_taken = :action_taken, 
               updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                masterlist_id: user.masterlist_id,
                action_taken: user.action_taken,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated activity_logs in cloud: ${user.masterlist_id} - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `activity_logs`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Activity_Log.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Activity_Log.create({
          id: user.id,
          masterlist_id: user.masterlist_id,
          action_taken: user.action_taken,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing activity_logs to local: ${user.masterlist_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Activity_Log.update(
            {
              masterlist_id: user.masterlist_id,
              action_taken: user.action_taken,
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
            `🔁 Updated activity_logs in local: ${user.masterlist_id} - ${user.id}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ActivityLogSyncData };
