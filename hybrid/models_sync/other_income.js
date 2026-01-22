const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { OtherIncome } = require("../../backend/db/models/associations.js");

const OtherIncomeSyncData = async () => {
  try {
    const localUsers = await OtherIncome.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `other_incomes` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`other_incomes\` (
                id, transaction_id, \`desc\`, income_date, incomeType, totalAmount, status,  created_by, approved_by, createdAt, updatedAt
              ) VALUES (
               :id, :transaction_id, :desc, :income_date, :incomeType, :totalAmount, :status,  :created_by, :approved_by, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              transaction_id: user.transaction_id,
              desc: user.desc,
              income_date: user.income_date,
              incomeType: user.incomeType,
              totalAmount: user.totalAmount,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing other_incomes to cloud: ${user.transaction_id} ${user.desc} (${user.id})`
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
            `UPDATE other_incomes SET
            transaction_id = :transaction_id,
            \`desc\` = :desc,
            income_date = :income_date,
            incomeType = :incomeType,
            totalAmount = :totalAmount,
            status = :status,
            created_by = :created_by,
            approved_by = :approved_by,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                transaction_id: user.transaction_id,
                desc: user.desc,
                income_date: user.income_date,
                incomeType: user.incomeType,
                totalAmount: user.totalAmount,
                status: user.status,
                created_by: user.created_by,
                approved_by: user.approved_by,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated other_incomes in cloud: ${user.return_capital_mother_id} ${user.invested_amount} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `other_incomes`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await OtherIncome.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await OtherIncome.create({
          id: user.id,
          transaction_id: user.transaction_id,
          desc: user.desc,
          income_date: user.income_date,
          incomeType: user.incomeType,
          totalAmount: user.totalAmount,
          status: user.status,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing other_incomes to local: ${user.transaction_id} ${user.desc} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await OtherIncome.update(
            {
              id: user.id,
              transaction_id: user.transaction_id,
              desc: user.desc,
              income_date: user.income_date,
              incomeType: user.incomeType,
              totalAmount: user.totalAmount,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated other_incomes in local: ${user.transaction_id} ${user.income_date} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { OtherIncomeSyncData };
