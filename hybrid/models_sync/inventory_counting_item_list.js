const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  InventoryCountingItemList,
} = require("../../backend/db/models/associations.js");

const InventoryCountingItemListSyncData = async () => {
  try {
    const localUsers = await InventoryCountingItemList.findAll({ raw: true });
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `inventory_counting_item_lists`",
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
        "SELECT * FROM `inventory_counting_item_lists` WHERE inventory_counting_item_list_id = :inventory_counting_item_list_id",
        {
          replacements: {
            inventory_counting_item_list_id:
              user.inventory_counting_item_list_id,
          },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`inventory_counting_item_lists\` (
                inventory_counting_item_list_id, inventory_counting_id, stock_management_id, system_quantity, actual_count, product_id, warehouse_id, createdAt, updatedAt
              ) VALUES (
                  :inventory_counting_item_list_id, :inventory_counting_id, :stock_management_id, :system_quantity, :actual_count, :product_id, :warehouse_id, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              inventory_counting_item_list_id:
                user.inventory_counting_item_list_id,
              inventory_counting_id: user.inventory_counting_id,
              stock_management_id: user.stock_management_id,
              system_quantity: user.system_quantity,
              actual_count: user.actual_count,
              product_id: user.product_id,
              warehouse_id: user.warehouse_id,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing inventory_counting_item_lists to cloud: ${user.inventory_counting_id} ${user.system_quantity} (${user.id})`
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
            `UPDATE inventory_counting_item_lists SET
            inventory_counting_id = :inventory_counting_id,
            stock_management_id = :stock_management_id,
            system_quantity = :system_quantity,
            actual_count = :actual_count,
            product_id = :product_id,
            warehouse_id = :warehouse_id,
            updatedAt = :updatedAt
            WHERE inventory_counting_item_list_id = :inventory_counting_item_list_id;`,
            {
              replacements: {
                inventory_counting_item_list_id:
                  user.inventory_counting_item_list_id,
                inventory_counting_id: user.inventory_counting_id,
                stock_management_id: user.stock_management_id,
                system_quantity: user.system_quantity,
                actual_count: user.actual_count,
                product_id: user.product_id,
                warehouse_id: user.warehouse_id,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated inventory_counting_item_lists in cloud: ${user.inventory_counting_item_list_id} (${user.inventory_counting_id}) - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const localUser = await InventoryCountingItemList.findAll({
        where: {
          inventory_counting_item_list_id: user.inventory_counting_item_list_id,
        },
      });

      if (localUser.length === 0) {
        await InventoryCountingItemList.create({
          inventory_counting_item_list_id: user.inventory_counting_item_list_id,
          inventory_counting_id: user.inventory_counting_id,
          stock_management_id: user.stock_management_id,
          system_quantity: user.system_quantity,
          actual_count: user.actual_count,
          product_id: user.product_id,
          warehouse_id: user.warehouse_id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing inventory_counting_item_lists to local: ${user.inventory_counting_id} ${user.system_quantity} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await InventoryCountingItemList.update(
            {
              inventory_counting_item_list_id:
                user.inventory_counting_item_list_id,
              inventory_counting_id: user.inventory_counting_id,
              stock_management_id: user.stock_management_id,
              system_quantity: user.system_quantity,
              actual_count: user.actual_count,
              product_id: user.product_id,
              warehouse_id: user.warehouse_id,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                inventory_counting_item_list_id:
                  user.inventory_counting_item_list_id,
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

module.exports = { InventoryCountingItemListSyncData };
