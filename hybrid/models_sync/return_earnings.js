const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { ReturnEarnings } = require("../../backend/db/models/associations.js");

const ReturnEarningSyncData = async () => {
  try {
    const localUsers = await ReturnEarnings.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `return_earnings` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`return_earnings\` (
                id, name, \`from\`, \`to\`, isPosted, isAdded, createdAt,  updatedAt, isDeleted
              ) VALUES (
                :id, :name, :from, :to, :isPosted, :isAdded, :createdAt,  :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              name: user.name,
              from: user.from,
              to: user.to,
              isPosted: user.isPosted,
              isAdded: user.isAdded,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing return_earnings to cloud: ${user.name} ${user.isPosted} (${user.id})`
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
            `UPDATE return_earnings SET
            name = :name,
            \`from\` = :from,
            \`to\` = :to,
            isPosted = :isPosted,
            isAdded = :isAdded,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                name: user.name,
                from: user.from,
                to: user.to,
                isPosted: user.isPosted,
                isAdded: user.isAdded,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated return_earnings in cloud: ${user.name} ${user.from} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `return_earnings`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await ReturnEarnings.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await ReturnEarnings.create({
          id: user.id,
          name: user.name,
          from: user.from,
          to: user.to,
          isPosted: user.isPosted,
          isAdded: user.isAdded,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing return_earnings to local: ${user.name} ${user.from} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await ReturnEarnings.update(
            {
              id: user.id,
              name: user.name,
              from: user.from,
              to: user.to,
              isPosted: user.isPosted,
              isAdded: user.isAdded,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated return_earnings in local: ${user.module_from} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ReturnEarningSyncData };
