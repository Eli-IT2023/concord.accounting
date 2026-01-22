const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { PayableBulk } = require("../../backend/db/models/associations.js");

const PayableBulkSyncData = async () => {
  try {
    const localUsers = await PayableBulk.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `payable_bulks` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`payable_bulks\` (
                id, transaction_number, payable_date, status, vendor_id, total_amount, currency_id, created_by, approved_by, createdAt,  updatedAt, isDeleted
              ) VALUES (
                :id, :transaction_number, :payable_date, :status, :vendor_id, :total_amount, :currency_id, :created_by, :approved_by, :createdAt,  :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              transaction_number: user.transaction_number,
              payable_date: user.payable_date,
              status: user.status,
              vendor_id: user.vendor_id,
              total_amount: user.total_amount,
              currency_id: user.currency_id,
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
          `✅ Synced missing payable_bulks to cloud: ${user.payable_date} ${user.transaction_number} (${user.id})`
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
            `UPDATE payable_bulks SET
            transaction_number = :transaction_number,
            payable_date = :payable_date,
            status = :status,
            vendor_id = :vendor_id,
            total_amount = :total_amount,
            currency_id = :currency_id,
            created_by = :created_by,
            approved_by = :approved_by,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                transaction_number: user.transaction_number,
                payable_date: user.payable_date,
                status: user.status,
                vendor_id: user.vendor_id,
                total_amount: user.total_amount,
                currency_id: user.currency_id,
                created_by: user.created_by,
                approved_by: user.approved_by,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated payable_bulks in cloud: ${user.payable_date} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `payable_bulks`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await PayableBulk.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await PayableBulk.create({
          id: user.id,
          transaction_number: user.transaction_number,
          payable_date: user.payable_date,
          status: user.status,
          vendor_id: user.vendor_id,
          total_amount: user.total_amount,
          currency_id: user.currency_id,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing payable_bulks to local: ${user.payable_date} ${user.vendor_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await PayableBulk.update(
            {
              id: user.id,
              transaction_number: user.transaction_number,
              payable_date: user.payable_date,
              status: user.status,
              vendor_id: user.vendor_id,
              total_amount: user.total_amount,
              currency_id: user.currency_id,
              created_by: user.created_by,
              approved_by: user.approved_by,
              createdAt: user.createdAt,
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
            `🔁 Updated payable_bulks in local: ${user.transaction_number} ${user.payable_date} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PayableBulkSyncData };
