const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Payable_Product } = require("../../backend/db/models/associations.js");

const PayableProductsSyncData = async () => {
  try {
    const localUsers = await Payable_Product.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `payable_products` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`payable_products\` (
                id, payable_id , product_vendor_id, moisture, moisture_type, weight, net_weight, unitPrice, createdAt, updatedAt
              ) VALUES (
                :id, :payable_id , :product_vendor_id, :moisture, :moisture_type, :weight, :net_weight, :unitPrice, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              payable_id: user.payable_id,
              product_vendor_id: user.product_vendor_id,
              moisture: user.moisture,
              moisture_type: user.moisture_type,
              weight: user.weight,
              net_weight: user.net_weight,
              unitPrice: user.unitPrice,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing payable_products to cloud: ${user.transaction_id} ${user.warehouse_id} (${user.id})`
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
            `UPDATE payable_products SET 
              payable_id = :payable_id,
              product_vendor_id = :product_vendor_id,
              moisture = :moisture,
              moisture_type = :moisture_type,
              weight = :weight,
              net_weight = :net_weight,
              unitPrice = :unitPrice,
              updatedAt= :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                payable_id: user.payable_id,
                product_vendor_id: user.product_vendor_id,
                moisture: user.moisture,
                moisture_type: user.moisture_type,
                weight: user.weight,
                net_weight: user.net_weight,
                unitPrice: user.unitPrice,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated payable_products in cloud: ${user.payable_id} ${user.product_vendor_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `payable_products`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Payable_Product.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Payable_Product.create({
          id: user.id,
          payable_id: user.payable_id,
          product_vendor_id: user.product_vendor_id,
          moisture: user.moisture,
          moisture_type: user.moisture_type,
          weight: user.weight,
          net_weight: user.net_weight,
          unitPrice: user.unitPrice,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing payable_products to local: ${user.payable_id} ${user.product_vendor_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Payable_Product.update(
            {
              id: user.id,
              payable_id: user.payable_id,
              product_vendor_id: user.product_vendor_id,
              moisture: user.moisture,
              moisture_type: user.moisture_type,
              weight: user.weight,
              net_weight: user.net_weight,
              unitPrice: user.unitPrice,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the id to find the record to update
          );

          console.log(
            `🔁 Updated payable_products in local: ${user.payable_id} ${user.product_vendor_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PayableProductsSyncData };
