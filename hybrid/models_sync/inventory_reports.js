const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Inventory_Report } = require("../../backend/db/models/associations.js");

const InventoryReportSyncData = async () => {
  try {
    const localUsers = await Inventory_Report.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `inventory_reports` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`inventory_reports\` (
                id, cut_off_id, product_id, average_price, product_out, unit_price, createdAt, updatedAt
              ) VALUES (
                :id, :cut_off_id, :product_id, :average_price, :product_out, :unit_price, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              cut_off_id: user.cut_off_id,
              product_id: user.product_id,
              average_price: user.average_price,
              product_out: user.product_out,
              unit_price: user.unit_price,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing inventory_reports to cloud: ${user.cut_off_id} ${user.average_price} (${user.id})`
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
            `UPDATE inventory_reports SET
            cut_off_id = :cut_off_id,
            product_id = :product_id,
            average_price = :average_price,
            product_out = :product_out,
            unit_price = :unit_price,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                cut_off_id: user.cut_off_id,
                product_id: user.product_id,
                average_price: user.average_price,
                product_out: user.product_out,
                unit_price: user.unit_price,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated inventory_reports in cloud: ${user.cut_off_id} ${user.product_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `inventory_reports`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Inventory_Report.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Inventory_Report.create({
          id: user.id,
          cut_off_id: user.cut_off_id,
          product_id: user.product_id,
          average_price: user.average_price,
          product_out: user.product_out,
          unit_price: user.unit_price,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing inventory_reports to local: ${user.cut_off_id} ${user.product_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Inventory_Report.update(
            {
              id: user.id,
              cut_off_id: user.cut_off_id,
              product_id: user.product_id,
              average_price: user.average_price,
              product_out: user.product_out,
              unit_price: user.unit_price,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated inventory_reports in local: ${user.bulk_collectionn_payment_id} ${user.account_list_sub3_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { InventoryReportSyncData };
