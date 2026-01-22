const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  SalesInvoiceInventory,
} = require("../../backend/db/models/associations.js");

const SalesInvoiceTagInventorySyncData = async () => {
  try {
    const localUsers = await SalesInvoiceInventory.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `sales_invoice_tag_inventories` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`sales_invoice_tag_inventories\` (
                id ,sales_invoice_id, stock_management_id, average_price, unit_price, sales_profit, discount_item, quantity, moisture, net_weight, subtotal, discount_type, createdAt, updatedAt, isDeleted
              ) VALUES (
              :id , :sales_invoice_id, :stock_management_id, :average_price, :unit_price, :sales_profit, :discount_item, :quantity, :moisture, :net_weight, :subtotal, :discount_type, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              sales_invoice_id: user.sales_invoice_id,
              stock_management_id: user.stock_management_id,
              average_price: user.average_price,
              unit_price: user.unit_price,
              sales_profit: user.sales_profit,
              discount_item: user.discount_item,
              quantity: user.quantity,
              moisture: user.moisture,
              net_weight: user.net_weight,
              subtotal: user.subtotal,
              discount_type: user.discount_type,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing sales_invoice_tag_inventories to cloud: ${user.sales_invoice_id} ${user.stock_management_id} (${user.id})`
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
            `UPDATE sales_invoice_tag_inventories SET
            id = :id,
            sales_invoice_id = :sales_invoice_id,
            stock_management_id = :stock_management_id,
            average_price = :average_price,
            unit_price = :unit_price,
            sales_profit = :sales_profit,
            discount_item = :discount_item,
            quantity = :quantity,
            moisture = :moisture,
            net_weight = :net_weight,
            subtotal = :subtotal,
            discount_type = :discount_type,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                sales_invoice_id: user.sales_invoice_id,
                stock_management_id: user.stock_management_id,
                average_price: user.average_price,
                unit_price: user.unit_price,
                sales_profit: user.sales_profit,
                discount_item: user.discount_item,
                quantity: user.quantity,
                moisture: user.moisture,
                net_weight: user.net_weight,
                subtotal: user.subtotal,
                discount_type: user.discount_type,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated sales_invoice_tag_inventories in cloud: ${user.id} ${user.stock_management_id} (${user.sales_invoice_id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `sales_invoice_tag_inventories`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await SalesInvoiceInventory.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await SalesInvoiceInventory.create({
          id: user.id,
          sales_invoice_id: user.sales_invoice_id,
          stock_management_id: user.stock_management_id,
          average_price: user.average_price,
          unit_price: user.unit_price,
          sales_profit: user.sales_profit,
          discount_item: user.discount_item,
          quantity: user.quantity,
          moisture: user.moisture,
          net_weight: user.net_weight,
          subtotal: user.subtotal,
          discount_type: user.discount_type,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing sales_invoice_tag_inventories to local: ${user.sales_invoice_id} ${user.stock_management_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await SalesInvoiceInventory.update(
            {
              sales_invoice_id: user.sales_invoice_id,
              stock_management_id: user.stock_management_id,
              average_price: user.average_price,
              unit_price: user.unit_price,
              sales_profit: user.sales_profit,
              discount_item: user.discount_item,
              quantity: user.quantity,
              moisture: user.moisture,
              net_weight: user.net_weight,
              subtotal: user.subtotal,
              discount_type: user.discount_type,
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
            `🔁 Updated sales_invoice_tag_inventories in local: ${user.sales_invoice_id} ${user.stock_management_id} (${user.sales_invoice_id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { SalesInvoiceTagInventorySyncData };
