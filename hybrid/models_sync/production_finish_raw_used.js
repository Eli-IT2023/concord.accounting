const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  Production_finish_raw_used,
} = require("../../backend/db/models/associations.js");

const ProductionFinishRawUseSyncData = async () => {
  try {
    const localUsers = await Production_finish_raw_used.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `production_finish_raw_useds` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`production_finish_raw_useds\` (
                id, production_finish_product_id, production_raw_used_id, weight_in, net_weight, createdAt, updatedAt, isDeleted
              ) VALUES (
                 :id, :production_finish_product_id, :production_raw_used_id, :weight_in, :net_weight, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              production_finish_product_id: user.production_finish_product_id,
              production_raw_used_id: user.production_raw_used_id,
              weight_in: user.weight_in,
              net_weight: user.net_weight,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing production_finish_raw_useds to cloud: ${user.production_finish_product_id} ${user.production_raw_used_id} (${user.id})`
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
            `UPDATE production_finish_raw_useds SET
            production_finish_product_id = :production_finish_product_id,
            production_raw_used_id = :production_raw_used_id,
            weight_in = :weight_in,
            net_weight = :net_weight,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                production_finish_product_id: user.production_finish_product_id,
                production_raw_used_id: user.production_raw_used_id,
                weight_in: user.weight_in,
                net_weight: user.net_weight,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated production_finish_raw_useds in cloud: ${user.production_finish_product_id} ${user.weight_in} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `production_finish_raw_useds`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Production_finish_raw_used.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Production_finish_raw_used.create({
          id: user.id,
          production_finish_product_id: user.production_finish_product_id,
          production_raw_used_id: user.production_raw_used_id,
          weight_in: user.weight_in,
          net_weight: user.net_weight,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing production_finish_raw_useds to local: ${user.production_finish_product_id} ${user.production_raw_used_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Production_finish_raw_used.update(
            {
              id: user.id,
              production_finish_product_id: user.production_finish_product_id,
              production_raw_used_id: user.production_raw_used_id,
              weight_in: user.weight_in,
              net_weight: user.net_weight,
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
            `🔁 Updated production_finish_raw_useds in local: ${user.production_finish_product_id} ${user.production_finish_product_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ProductionFinishRawUseSyncData };
