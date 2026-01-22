const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  Product_Tag_Vendor,
} = require("../../backend/db/models/associations.js");

const Prod_VendorSyncData = async () => {
  try {
    const localUsers = await Product_Tag_Vendor.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `product_tag_vendors` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`product_tag_vendors\` (
                id, product_id, vendor_id, product_price, status, createdAt, updatedAt
              ) VALUES (
                :id, :product_id, :vendor_id, :product_price, :status, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              product_id: user.product_id,
              vendor_id: user.vendor_id,
              product_price: user.product_price,
              status: user.status,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing product_tag_vendors to cloud: ${user.product_id} ${user.vendor_id} (${user.id})`
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
            `UPDATE product_tag_vendors SET
               product_id = :product_id, 
               vendor_id = :vendor_id, 
               product_price = :product_price,
               status = :status,
               updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                product_id: user.product_id,
                vendor_id: user.vendor_id,
                product_price: user.product_price,
                status: user.status,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated product_tag_vendors in cloud: ${user.product_id} ${user.vendor_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `product_tag_vendors`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Product_Tag_Vendor.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Product_Tag_Vendor.create({
          id: user.id,
          product_id: user.product_id,
          vendor_id: user.vendor_id,
          product_price: user.product_price,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing product_tag_vendors to local: ${user.product_id} ${user.vendor_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Product_Tag_Vendor.update(
            {
              product_id: user.product_id,
              vendor_id: user.vendor_id,
              product_price: user.product_price,
              status: user.status,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated product_tag_vendors in local: ${user.product_id} ${user.vendor_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { Prod_VendorSyncData };
