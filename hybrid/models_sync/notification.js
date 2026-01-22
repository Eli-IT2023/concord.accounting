const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Notification } = require("../../backend/db/models/associations.js");

const NotificationSyncData = async () => {
  try {
    const localUsers = await Notification.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `notifications` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`notifications\` (
                id, setting_type, isChecked, days, createdAt, updatedAt
              ) VALUES (
                :id, :setting_type, :isChecked, :days, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              setting_type: user.setting_type,
              isChecked: user.isChecked,
              days: user.days,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing notifications to cloud: ${user.setting_type} ${user.days} (${user.id})`
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
            `UPDATE notifications SET
               setting_type = :setting_type, 
               isChecked = :isChecked, 
               days = :days, 
               updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                setting_type: user.setting_type,
                isChecked: user.isChecked,
                days: user.days,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated notifications in cloud: ${user.setting_type} (${user.days}) - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `notifications`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Notification.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Notification.create({
          id: user.id,
          setting_type: user.setting_type,
          isChecked: user.isChecked,
          days: user.days,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing notifications to local: ${user.setting_type} ${user.currency_name} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Notification.update(
            {
              setting_type: user.setting_type,
              isChecked: user.isChecked,
              days: user.days,
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
            `🔁 Updated notifications in local: ${user.setting_type} (${user.days}) - ${user.id}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { NotificationSyncData };
