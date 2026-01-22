const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Cutoff } = require("../../backend/db/models/associations.js");

const CutoffSyncData = async () => {
  try {
    const localUsers = await Cutoff.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `cutoffs` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`cutoffs\` (
                id, name, \`from\`, \`to\`, isPosted, isDeleted, createdAt, updatedAt
              ) VALUES (
                :id, :name, :from, :to, :isPosted, :isDeleted, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              name: user.name,
              from: user.from,
              to: user.to,
              isPosted: user.isPosted,
              isDeleted: user.isDeleted,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing cutoffs to cloud: ${user.name} ${user.from} ${user.to}  (${user.id})`
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
            `UPDATE cutoffs SET
               name = :name, 
               \`from\` = :from, 
               \`to\` = :to, 
               isPosted = :isPosted, 
               isDeleted = :isDeleted,
               updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                name: user.name,
                from: user.from,
                to: user.to,
                isPosted: user.isPosted,
                isDeleted: user.isDeleted,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated cutoffs in cloud: ${user.name} ${user.from} ${user.to}  (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `cutoffs`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Cutoff.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Cutoff.create({
          id: user.id,
          name: user.name,
          from: user.from,
          to: user.to,
          isPosted: user.isPosted,
          isDeleted: user.isDeleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing cutoffs to local: ${user.name} ${user.from} ${user.to}  (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Cutoff.update(
            {
              name: user.name,
              from: user.from,
              to: user.to,
              isPosted: user.isPosted,
              isDeleted: user.isDeleted,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated cutoffs in local: ${user.name} ${user.from} ${user.to}  (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { CutoffSyncData };
