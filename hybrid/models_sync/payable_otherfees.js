const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Payable_Fees } = require("../../backend/db/models/associations.js");

const PayableOtherFeesSyncData = async () => {
  try {
    const localUsers = await Payable_Fees.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `payable_other_fees` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`payable_other_fees\` (
                id, payable_id , fee_name, fee_amount, createdAt, updatedAt
              ) VALUES (
                :id, :payable_id , :fee_name, :fee_amount, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              payable_id: user.payable_id,
              fee_name: user.fee_name,
              fee_amount: user.fee_amount,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing payable_other_fees to cloud: ${user.fee_name} ${user.fee_amount} (${user.id})`
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
            `UPDATE payable_other_fees SET 
              payable_id = :payable_id,
              fee_name = :fee_name,
              fee_amount = :fee_amount,
              updatedAt= :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                payable_id: user.payable_id,
                fee_name: user.fee_name,
                fee_amount: user.fee_amount,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated payable_other_fees in cloud: ${user.fee_name} ${user.fee_amount} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `payable_other_fees`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Payable_Fees.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Payable_Fees.create({
          id: user.id,
          payable_id: user.payable_id,
          fee_name: user.fee_name,
          fee_amount: user.fee_amount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing payable_other_fees to local: ${user.fee_name} ${user.fee_amount} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Payable_Fees.update(
            {
              id: user.id,
              payable_id: user.payable_id,
              fee_name: user.fee_name,
              fee_amount: user.fee_amount,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the id to find the record to update
          );

          console.log(
            `🔁 Updated payable_other_fees in local: ${user.fee_name} ${user.fee_amount} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PayableOtherFeesSyncData };
