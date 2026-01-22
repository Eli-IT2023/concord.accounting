const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  FixedAssetForecast,
} = require("../../backend/db/models/associations.js");

const FixedAssetForecastSyncData = async () => {
  try {
    const localUsers = await FixedAssetForecast.findAll({ raw: true });
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `fixed_asset_forecasts`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `fixed_asset_forecasts` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`fixed_asset_forecasts\` (
                id, fixed_asset_id, date, amount, isPaid, createdAt, updatedAt
              ) VALUES (
                :id, :fixed_asset_id, :date, :amount, :isPaid, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              fixed_asset_id: user.fixed_asset_id,
              date: user.date,
              amount: user.amount,
              isPaid: user.isPaid,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing fixed_asset_forecasts to cloud: ${user.fixed_asset_id} ${user.date} (${user.id})`
        );
      } else {
        // Compare fields to check if update is needed
        const cloud = cloudUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(cloud.updatedAt).getTime();

        if (needsUpdate) {
          await cloudDB.query(
            `UPDATE fixed_asset_forecasts SET
            fixed_asset_id = :fixed_asset_id,
            date = :date,
            amount = :amount,
            isPaid = :isPaid,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                fixed_asset_id: user.fixed_asset_id,
                date: user.date,
                amount: user.amount,
                isPaid: user.isPaid,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated fixed_asset_forecasts in cloud: ${user.fixed_asset_id} (${user.date}) - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const localUser = await FixedAssetForecast.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await FixedAssetForecast.create({
          id: user.id,
          fixed_asset_id: user.fixed_asset_id,
          date: user.date,
          amount: user.amount,
          isPaid: user.isPaid,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing fixed_asset_forecasts to local: ${user.fixed_asset_id} ${user.amount} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await FixedAssetForecast.update(
            {
              id: user.id,
              fixed_asset_id: user.fixed_asset_id,
              date: user.date,
              amount: user.amount,
              isPaid: user.isPaid,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the ID to find the record to update
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { FixedAssetForecastSyncData };
