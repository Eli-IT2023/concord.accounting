const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  StockTransferProducts,
} = require("../../backend/db/models/associations.js");

const StockTransferProductSyncData = async () => {
  try {
    const localUsers = await StockTransferProducts.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `stock_transfer_products` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`stock_transfer_products\` (
                id, stock_transfer_id, product_id, available_quantity, quantity_to_transfer, createdAt, updatedAt
              ) VALUES (
                :id, :stock_transfer_id, :product_id, :available_quantity, :quantity_to_transfer, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              stock_transfer_id: user.stock_transfer_id,
              product_id: user.product_id,
              available_quantity: user.available_quantity,
              quantity_to_transfer: user.quantity_to_transfer,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing stock_transfer_products to cloud: ${user.stock_transfer_id} ${user.product_id} (${user.id})`
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
            `UPDATE stock_transfer_products SET
            stock_transfer_id = :stock_transfer_id,
            product_id = :product_id,
            available_quantity = :available_quantity,
            quantity_to_transfer = :quantity_to_transfer,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                stock_transfer_id: user.stock_transfer_id,
                product_id: user.product_id,
                available_quantity: user.available_quantity,
                quantity_to_transfer: user.quantity_to_transfer,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated stock_transfer_products in cloud: ${user.stock_transfer_id} ${user.available_quantity} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `stock_transfer_products`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await StockTransferProducts.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await StockTransferProducts.create({
          id: user.id,
          stock_transfer_id: user.stock_transfer_id,
          product_id: user.product_id,
          available_quantity: user.available_quantity,
          quantity_to_transfer: user.quantity_to_transfer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing stock_transfer_products to local: ${user.transaction_id} ${user.warehouse_from_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await StockTransferProducts.update(
            {
              id: user.id,
              stock_transfer_id: user.stock_transfer_id,
              product_id: user.product_id,
              available_quantity: user.available_quantity,
              quantity_to_transfer: user.quantity_to_transfer,
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
            `🔁 Updated stock_transfer_products in local: ${user.stock_transfer_id} ${user.product_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { StockTransferProductSyncData };
