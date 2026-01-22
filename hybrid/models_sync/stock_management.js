const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { StockManagement } = require("../../backend/db/models/associations.js");

const StockManagementSyncData = async () => {
  try {
    const localUsers = await StockManagement.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `stock_managements` WHERE stock_management_id = :stock_management_id",
        {
          replacements: { stock_management_id: user.stock_management_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`stock_managements\` (
                stock_management_id ,product_id, warehouse_id, stock, \`in\`, price, price_in, vendor_id, date_in, transaction_number, module_in_from, createdAt, updatedAt, isDeleted
              ) VALUES (
               :stock_management_id , :product_id, :warehouse_id, :stock, :in, :price, :price_in, :vendor_id, :date_in, :transaction_number, :module_in_from, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              stock_management_id: user.stock_management_id,
              product_id: user.product_id,
              warehouse_id: user.warehouse_id,
              stock: user.stock,
              in: user.in,
              price: user.price,
              price_in: user.price_in,
              vendor_id: user.vendor_id,
              date_in: user.date_in,
              transaction_number: user.transaction_number,
              module_in_from: user.module_in_from,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing stock_managements to cloud: ${user.sales_invoice_id} ${user.stock_management_id} (${user.id})`
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
            `UPDATE stock_managements SET
            product_id = :product_id,
            warehouse_id = :warehouse_id,
            stock = :stock,
            \`in\` = :in,
            price = :price,
            price_in = :price_in,
            vendor_id = :vendor_id,
            date_in = :date_in,
            transaction_number = :transaction_number,
            module_in_from = :module_in_from,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE stock_management_id = :stock_management_id;`,
            {
              replacements: {
                stock_management_id: user.stock_management_id,
                product_id: user.product_id,
                warehouse_id: user.warehouse_id,
                stock: user.stock,
                in: user.in,
                price: user.price,
                price_in: user.price_in,
                vendor_id: user.vendor_id,
                date_in: user.date_in,
                transaction_number: user.transaction_number,
                module_in_from: user.module_in_from,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated stock_managements in cloud: ${user.id} ${user.stock_management_id} (${user.sales_invoice_id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `stock_managements`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await StockManagement.findAll({
        where: { stock_management_id: user.stock_management_id },
      });

      if (localUser.length === 0) {
        await StockManagement.create({
          stock_management_id: user.stock_management_id,
          product_id: user.product_id,
          warehouse_id: user.warehouse_id,
          stock: user.stock,
          in: user.in,
          price: user.price,
          price_in: user.price_in,
          vendor_id: user.vendor_id,
          date_in: user.date_in,
          transaction_number: user.transaction_number,
          module_in_from: user.module_in_from,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing stock_managements to local: ${user.sales_invoice_id} ${user.stock_management_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await StockManagement.update(
            {
              product_id: user.product_id,
              warehouse_id: user.warehouse_id,
              stock: user.stock,
              in: user.in,
              price: user.price,
              price_in: user.price_in,
              vendor_id: user.vendor_id,
              date_in: user.date_in,
              transaction_number: user.transaction_number,
              module_in_from: user.module_in_from,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            {
              where: {
                stock_management_id: user.stock_management_id,
              },
            }
          );

          console.log(
            `🔁 Updated stock_managements in local: ${user.product_id} ${user.transaction_number} (${user.vendor_id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { StockManagementSyncData };
