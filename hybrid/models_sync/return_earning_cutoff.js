const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  ReturnEarningsCutoffs,
} = require("../../backend/db/models/associations.js");

const ReturnEarningCutoffSyncData = async () => {
  try {
    const localUsers = await ReturnEarningsCutoffs.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `return_earnings_cutoffs` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`return_earnings_cutoffs\` (
                id, return_earnings_id, cutoff_id, createdAt, updatedAt
              ) VALUES (
                 :id, :return_earnings_id, :cutoff_id, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              return_earnings_id: user.return_earnings_id,
              cutoff_id: user.cutoff_id,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing return_earnings_cutoffs to cloud: ${user.return_earnings_id} ${user.cutoff_id} (${user.id})`
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
            `UPDATE return_earnings_cutoffs SET
            return_earnings_id = :return_earnings_id,
            cutoff_id = :cutoff_id,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                return_earnings_id: user.return_earnings_id,
                cutoff_id: user.cutoff_id,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated return_earnings_cutoffs in cloud: ${user.return_earnings_id} ${user.cutoff_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `return_earnings_cutoffs`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await ReturnEarningsCutoffs.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await ReturnEarningsCutoffs.create({
          id: user.id,
          return_earnings_id: user.return_earnings_id,
          cutoff_id: user.cutoff_id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing return_earnings_cutoffs to local: ${user.return_earnings_id} ${user.cutoff_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await ReturnEarningsCutoffs.update(
            {
              id: user.id,
              return_earnings_id: user.return_earnings_id,
              cutoff_id: user.cutoff_id,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated return_earnings_cutoffs in local: ${user.return_earnings_id} ${user.cutoff_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ReturnEarningCutoffSyncData };
