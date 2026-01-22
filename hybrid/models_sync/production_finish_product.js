const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  Production_Finish_Product,
} = require("../../backend/db/models/associations.js");

const ProductionFinishProductSyncData = async () => {
  try {
    const localUsers = await Production_Finish_Product.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `production_finish_products` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`production_finish_products\` (
                id, production_id, product_id, produce, createdAt, updatedAt, isDeleted
              ) VALUES (
                :id, :production_id, :product_id, :produce, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              production_id: user.production_id,
              product_id: user.product_id,
              produce: user.produce,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing production_finish_products to cloud: ${user.production_id} ${user.product_id} (${user.id})`
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
            `UPDATE production_finish_products SET
            production_id = :production_id,
            product_id = :product_id,
            produce = :produce,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                production_id: user.production_id,
                product_id: user.product_id,
                produce: user.produce,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated production_finish_products in cloud: ${user.production_id} ${user.product_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `production_finish_products`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Production_Finish_Product.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Production_Finish_Product.create({
          id: user.id,
          production_id: user.production_id,
          product_id: user.product_id,
          produce: user.produce,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing production_finish_products to local: ${user.production_id} ${user.product_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Production_Finish_Product.update(
            {
              id: user.id,
              production_id: user.production_id,
              product_id: user.product_id,
              produce: user.produce,
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
            `🔁 Updated production_finish_products in local: ${user.production_id} ${user.product_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ProductionFinishProductSyncData };
