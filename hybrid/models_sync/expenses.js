const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Expenses } = require("../../backend/db/models/associations.js");

const ExpensesSyncData = async () => {
  try {
    const localUsers = await Expenses.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `expenses` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`expenses\` (
                id, transaction_id, \`foreign\`, currency_id, expenses2_id, totalAmount, \`desc\`, expenses_date, product_name, unitPrice, assetQuantity, isAdded, status, due_date, notification, created_by, approved_by, rate, createdAt,  updatedAt, isDeleted
              ) VALUES (
                :id, :transaction_id, :foreign, :currency_id, :expenses2_id, :totalAmount, :desc, :expenses_date, :product_name, :unitPrice, :assetQuantity, :isAdded, :status, :due_date, :notification, :created_by, :approved_by, :rate, :createdAt,  :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              transaction_id: user.transaction_id,
              foreign: user.foreign,
              currency_id: user.currency_id,
              expenses2_id: user.expenses2_id,
              totalAmount: user.totalAmount,
              desc: user.desc,
              expenses_date: user.expenses_date,
              product_name: user.product_name,
              unitPrice: user.unitPrice,
              assetQuantity: user.assetQuantity,
              isAdded: user.isAdded,
              status: user.status,
              due_date: user.due_date,
              notification: user.notification,
              created_by: user.created_by,
              approved_by: user.approved_by,
              rate: user.rate,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing expenses to cloud: ${user.transaction_id} ${user.totalAmount} (${user.id})`
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
            `UPDATE expenses SET
              transaction_id = :transaction_id,
              \`foreign\` = :foreign,
              currency_id = :currency_id,
              expenses2_id = :expenses2_id,
              totalAmount = :totalAmount,
              \`desc\` = :desc,
              expenses_date = :expenses_date,
              product_name = :product_name,
              unitPrice = :unitPrice,
              assetQuantity = :assetQuantity,
              isAdded = :isAdded,
              status = :status,
              due_date = :due_date,
              notification = :notification,
              approved_by = :approved_by,
              rate = :rate,
              updatedAt = :updatedAt,
              isDeleted = :isDeleted
              WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                transaction_id: user.transaction_id,
                foreign: user.foreign,
                currency_id: user.currency_id,
                expenses2_id: user.expenses2_id,
                totalAmount: user.totalAmount,
                desc: user.desc,
                expenses_date: user.expenses_date,
                product_name: user.product_name,
                unitPrice: user.unitPrice,
                assetQuantity: user.assetQuantity,
                isAdded: user.isAdded,
                status: user.status,
                due_date: user.due_date,
                notification: user.notification,
                approved_by: user.approved_by,
                rate: user.rate,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated expenses in cloud: ${user.customer_id} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `expenses`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Expenses.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Expenses.create({
          id: user.id,
          transaction_id: user.transaction_id,
          foreign: user.foreign,
          currency_id: user.currency_id,
          expenses2_id: user.expenses2_id,
          totalAmount: user.totalAmount,
          desc: user.desc,
          expenses_date: user.expenses_date,
          product_name: user.product_name,
          unitPrice: user.unitPrice,
          assetQuantity: user.assetQuantity,
          isAdded: user.isAdded,
          status: user.status,
          due_date: user.due_date,
          notification: user.notification,
          created_by: user.created_by,
          approved_by: user.approved_by,
          rate: user.rate,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing expenses to local: ${user.totalAmount} ${user.transaction_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Expenses.update(
            {
              id: user.id,
              transaction_id: user.transaction_id,
              foreign: user.foreign,
              currency_id: user.currency_id,
              expenses2_id: user.expenses2_id,
              totalAmount: user.totalAmount,
              desc: user.desc,
              expenses_date: user.expenses_date,
              product_name: user.product_name,
              unitPrice: user.unitPrice,
              assetQuantity: user.assetQuantity,
              isAdded: user.isAdded,
              status: user.status,
              due_date: user.due_date,
              notification: user.notification,
              approved_by: user.approved_by,
              rate: user.rate,
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
            `🔁 Updated expenses in local: ${user.customer_id} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ExpensesSyncData };
