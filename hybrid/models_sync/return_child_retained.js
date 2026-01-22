const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  ReturnChildRetained,
} = require("../../backend/db/models/associations.js");

const ReturnChildRetainedSyncData = async () => {
  try {
    const localUsers = await ReturnChildRetained.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `return_child_retaineds` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`return_child_retaineds\` (
                id, return_capital_mother_id, return_earnings_id, createdAt, updatedAt
              ) VALUES (
                 :id, :return_capital_mother_id, :return_earnings_id, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              return_capital_mother_id: user.return_capital_mother_id,
              return_earnings_id: user.return_earnings_id,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing return_child_retaineds to cloud: ${user.return_capital_mother_id} ${user.return_earnings_id} (${user.id})`
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
            `UPDATE return_child_retaineds SET
            return_capital_mother_id = :return_capital_mother_id,
            return_earnings_id = :return_earnings_id,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                return_capital_mother_id: user.return_capital_mother_id,
                return_earnings_id: user.return_earnings_id,
                cutoff_id: user.cutoff_id,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated return_child_retaineds in cloud: ${user.return_earnings_id} ${user.return_capital_mother_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `return_child_retaineds`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await ReturnChildRetained.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await ReturnChildRetained.create({
          id: user.id,
          return_capital_mother_id: user.return_capital_mother_id,
          return_earnings_id: user.return_earnings_id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing return_child_retaineds to local: ${user.return_earnings_id} ${user.cutoff_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await ReturnChildRetained.update(
            {
              id: user.id,
              return_capital_mother_id: user.return_capital_mother_id,
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
            `🔁 Updated return_child_retaineds in local: ${user.return_earnings_id} ${user.return_capital_mother_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ReturnChildRetainedSyncData };
