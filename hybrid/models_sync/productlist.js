const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { ProductList } = require("../../backend/db/models/associations.js");

const ProductListSyncData = async () => {
  try {
    const localUsers = await ProductList.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.product_id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `product_lists` WHERE product_id = :product_id",
        {
          replacements: { product_id: user.product_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`product_lists\` (
                product_id, product_code, product_name, product_category, unit_of_measure, description, status, threshold, archive_date, createdAt, updatedAt
              ) VALUES (
                :product_id, :product_code, :product_name, :product_category, :unit_of_measure, :description, :status, :threshold, :archive_date, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              product_id: user.product_id,
              product_code: user.product_code,
              product_name: user.product_name,
              product_category: user.product_category,
              unit_of_measure: user.unit_of_measure,
              description: user.description,
              status: user.status,
              threshold: user.threshold,
              archive_date: user.archive_date,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing product_lists to cloud: ${user.product_code} ${user.product_name} (${user.product_id})`
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
            `UPDATE product_lists SET 
                product_code = :product_code,
                product_name = :product_name,
                product_category = :product_category,
                unit_of_measure = :unit_of_measure,
                description = :description,
                status = :status,
                threshold = :threshold,
                archive_date = :archive_date,
                updatedAt = :updatedAt
              WHERE product_id = :product_id`,
            {
              replacements: {
                product_id: user.product_id,
                product_code: user.product_code,
                product_name: user.product_name,
                product_category: user.product_category,
                unit_of_measure: user.unit_of_measure,
                description: user.description,
                status: user.status,
                threshold: user.threshold,
                archive_date: user.archive_date,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated product_lists in cloud: ${user.product_code} ${user.product_name} (${user.product_id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `product_lists`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.product_id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await ProductList.findAll({
        where: { product_id: user.product_id },
      });

      if (localUser.length === 0) {
        await ProductList.create({
          product_id: user.product_id,
          product_code: user.product_code,
          product_name: user.product_name,
          product_category: user.product_category,
          unit_of_measure: user.unit_of_measure,
          description: user.description,
          status: user.status,
          threshold: user.threshold,
          archive_date: user.archive_date,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing product_lists to local: ${user.product_code} ${user.product_name} (${user.product_id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await ProductList.update(
            {
              product_code: user.product_code,
              product_name: user.product_name,
              product_category: user.product_category,
              unit_of_measure: user.unit_of_measure,
              description: user.description,
              status: user.status,
              threshold: user.threshold,
              archive_date: user.archive_date,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                product_id: user.product_id,
              },
            } // Use the product_id to find the record to update
          );

          console.log(
            `🔁 Updated product_lists in local: ${user.subject_name} ${user.subject_type} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ProductListSyncData };
