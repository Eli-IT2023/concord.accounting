const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { PayBulkExpenses } = require("../../backend/db/models/associations.js");

const PayBulkExpensesSyncData = async () => {
  try {
    const localUsers = await PayBulkExpenses.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `pay_bulk_expenses` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`pay_bulk_expenses\` (
                id, pay_date, transaction_number, status, module_from, created_by, approved_by, createdAt,  updatedAt, isDeleted
              ) VALUES (
                :id, :pay_date, :transaction_number, :status, :module_from, :created_by, :approved_by, :createdAt,  :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              pay_date: user.pay_date,
              transaction_number: user.transaction_number,
              status: user.status,
              module_from: user.module_from,
              created_by: user.created_by,
              approved_by: user.approved_by,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing pay_bulk_expenses to cloud: ${user.transaction_number} ${user.status} (${user.id})`
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
            `UPDATE pay_bulk_expenses SET
            pay_date = :pay_date,
            transaction_number = :transaction_number,
            status = :status,
            module_from = :module_from,
            approved_by = :approved_by,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                pay_date: user.pay_date,
                transaction_number: user.transaction_number,
                status: user.status,
                module_from: user.module_from,
                approved_by: user.approved_by,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated pay_bulk_expenses in cloud: ${user.customer_id} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `pay_bulk_expenses`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await PayBulkExpenses.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await PayBulkExpenses.create({
          id: user.id,
          pay_date: user.pay_date,
          transaction_number: user.transaction_number,
          status: user.status,
          module_from: user.module_from,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing pay_bulk_expenses to local: ${user.transaction_number} ${user.pay_date} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await PayBulkExpenses.update(
            {
              id: user.id,
              pay_date: user.pay_date,
              transaction_number: user.transaction_number,
              status: user.status,
              module_from: user.module_from,
              created_by: user.created_by,
              approved_by: user.approved_by,
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
            `🔁 Updated pay_bulk_expenses in local: ${user.module_from} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PayBulkExpensesSyncData };
