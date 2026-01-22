const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { FixedAsset } = require("../../backend/db/models/associations.js");

const FixedAssetSyncData = async () => {
  try {
    const localUsers = await FixedAsset.findAll({ raw: true });
    const cloudUsers = await cloudDB.query("SELECT * FROM `fixed_assets`", {
      type: Sequelize.QueryTypes.SELECT,
    });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `fixed_assets` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`fixed_assets\` (
                id, transaction_code, expenses_id, date_depreciated, cost_per_unit, quantity, total_cost, static_months_to_pay, depreciation_amount, remarks, status, created_by, approved_by, createdAt, updatedAt
              ) VALUES (
                :id, :transaction_code, :expenses_id, :date_depreciated, :cost_per_unit, :quantity, :total_cost, :static_months_to_pay, :depreciation_amount, :remarks, :status, :created_by, :approved_by, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              transaction_code: user.transaction_code,
              expenses_id: user.expenses_id,
              date_depreciated: user.date_depreciated,
              cost_per_unit: user.cost_per_unit,
              quantity: user.quantity,
              total_cost: user.total_cost,
              static_months_to_pay: user.static_months_to_pay,
              depreciation_amount: user.depreciation_amount,
              remarks: user.remarks,
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
          `✅ Synced missing fixed_assets to cloud: ${user.transaction_code} ${user.expenses_id} (${user.id})`
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
            `UPDATE fixed_assets SET
            transaction_code = :transaction_code,
            expenses_id = :expenses_id,
            date_depreciated = :date_depreciated,
            cost_per_unit = :cost_per_unit,
            quantity = :quantity,
            total_cost = :total_cost,
            static_months_to_pay = :static_months_to_pay,
            depreciation_amount = :depreciation_amount,
            remarks = :remarks,
            status = :status,
            created_by = :created_by,
            approved_by = :approved_by,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                transaction_code: user.transaction_code,
                expenses_id: user.expenses_id,
                date_depreciated: user.date_depreciated,
                cost_per_unit: user.cost_per_unit,
                quantity: user.quantity,
                total_cost: user.total_cost,
                static_months_to_pay: user.static_months_to_pay,
                depreciation_amount: user.depreciation_amount,
                remarks: user.remarks,
                status: user.status,
                created_by: user.created_by,
                approved_by: user.approved_by,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated fixed_assets in cloud: ${user.transaction_code} (${user.expenses_id}) - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const localUser = await FixedAsset.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await FixedAsset.create({
          id: user.id,
          transaction_code: user.transaction_code,
          expenses_id: user.expenses_id,
          date_depreciated: user.date_depreciated,
          cost_per_unit: user.cost_per_unit,
          quantity: user.quantity,
          total_cost: user.total_cost,
          static_months_to_pay: user.static_months_to_pay,
          depreciation_amount: user.depreciation_amount,
          remarks: user.remarks,
          status: user.status,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing fixed_assets to local: ${user.expenses_id} ${user.transaction_code} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await FixedAsset.update(
            {
              id: user.id,
              transaction_code: user.transaction_code,
              expenses_id: user.expenses_id,
              date_depreciated: user.date_depreciated,
              cost_per_unit: user.cost_per_unit,
              quantity: user.quantity,
              total_cost: user.total_cost,
              static_months_to_pay: user.static_months_to_pay,
              depreciation_amount: user.depreciation_amount,
              remarks: user.remarks,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
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

module.exports = { FixedAssetSyncData };
