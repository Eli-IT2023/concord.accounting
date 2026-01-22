const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Payable } = require("../../backend/db/models/associations.js");

const PayableSyncData = async () => {
  try {
    const localUsers = await Payable.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `payables` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`payables\` (
                id, transaction_id, warehouse_id, vendor_id, MOP, domestic_type, due_date, tracking_number, isPercent_Discount, discount_value, weighing_fee, isPaid, status, isAdded, totalPrice, purchaseDate, notification, currencyId, description, created_by, approved_by, container_number, pier, rate, isDeleted, createdAt, updatedAt
              ) VALUES (
                :id, :transaction_id, :warehouse_id, :vendor_id, :MOP, :domestic_type, :due_date, :tracking_number, :isPercent_Discount, :discount_value, :weighing_fee, :isPaid, :status, :isAdded, :totalPrice, :purchaseDate, :notification, :currencyId, :description, :created_by, :approved_by, :container_number, :pier, :rate, :isDeleted, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              transaction_id: user.transaction_id,
              warehouse_id: user.warehouse_id,
              vendor_id: user.vendor_id,
              MOP: user.MOP,
              domestic_type: user.domestic_type,
              due_date: user.due_date,
              tracking_number: user.tracking_number,
              isPercent_Discount: user.isPercent_Discount,
              discount_value: user.discount_value,
              weighing_fee: user.weighing_fee,
              isPaid: user.isPaid,
              status: user.status,
              isAdded: user.isAdded,
              totalPrice: user.totalPrice,
              purchaseDate: user.purchaseDate,
              notification: user.notification,
              currencyId: user.currencyId,
              description: user.description,
              created_by: user.created_by,
              approved_by: user.approved_by,
              container_number: user.container_number,
              pier: user.pier,
              rate: user.rate,
              isDeleted: user.isDeleted,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing  payables to cloud: ${user.transaction_id} ${user.warehouse_id} (${user.id})`
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
            `UPDATE payables SET 
              transaction_id= :transaction_id,
              warehouse_id= :warehouse_id,
              vendor_id= :vendor_id,
              MOP= :MOP,
              domestic_type= :domestic_type,
              due_date= :due_date,
              tracking_number= :tracking_number,
              isPercent_Discount= :isPercent_Discount,
              discount_value= :discount_value,
              weighing_fee= :weighing_fee,
              isPaid= :isPaid,
              status= :status,
              isAdded= :isAdded,
              totalPrice= :totalPrice,
              purchaseDate= :purchaseDate,
              notification= :notification,
              currencyId= :currencyId,
              description= :description,
              created_by= :created_by,
              approved_by= :approved_by,
              container_number= :container_number,
              pier= :pier,
              rate= :rate,
              isDeleted= :isDeleted,
              updatedAt= :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                transaction_id: user.transaction_id,
                warehouse_id: user.warehouse_id,
                vendor_id: user.vendor_id,
                MOP: user.MOP,
                domestic_type: user.domestic_type,
                due_date: user.due_date,
                tracking_number: user.tracking_number,
                isPercent_Discount: user.isPercent_Discount,
                discount_value: user.discount_value,
                weighing_fee: user.weighing_fee,
                isPaid: user.isPaid,
                status: user.status,
                isAdded: user.isAdded,
                totalPrice: user.totalPrice,
                purchaseDate: user.purchaseDate,
                notification: user.notification,
                currencyId: user.currencyId,
                description: user.description,
                created_by: user.created_by,
                approved_by: user.approved_by,
                container_number: user.container_number,
                pier: user.pier,
                rate: user.rate,
                isDeleted: user.isDeleted,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated payables in cloud: ${user.transaction_id} ${user.warehouse_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `payables`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Payable.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Payable.create({
          id: user.id,
          transaction_id: user.transaction_id,
          warehouse_id: user.warehouse_id,
          vendor_id: user.vendor_id,
          MOP: user.MOP,
          domestic_type: user.domestic_type,
          due_date: user.due_date,
          tracking_number: user.tracking_number,
          isPercent_Discount: user.isPercent_Discount,
          discount_value: user.discount_value,
          weighing_fee: user.weighing_fee,
          isPaid: user.isPaid,
          status: user.status,
          isAdded: user.isAdded,
          totalPrice: user.totalPrice,
          purchaseDate: user.purchaseDate,
          notification: user.notification,
          currencyId: user.currencyId,
          description: user.description,
          created_by: user.created_by,
          approved_by: user.approved_by,
          container_number: user.container_number,
          pier: user.pier,
          rate: user.rate,
          isDeleted: user.isDeleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing payables to local: ${user.transaction_id} ${user.warehouse_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Payable.update(
            {
              transaction_id: user.transaction_id,
              warehouse_id: user.warehouse_id,
              vendor_id: user.vendor_id,
              MOP: user.MOP,
              domestic_type: user.domestic_type,
              due_date: user.due_date,
              tracking_number: user.tracking_number,
              isPercent_Discount: user.isPercent_Discount,
              discount_value: user.discount_value,
              weighing_fee: user.weighing_fee,
              isPaid: user.isPaid,
              status: user.status,
              isAdded: user.isAdded,
              totalPrice: user.totalPrice,
              purchaseDate: user.purchaseDate,
              notification: user.notification,
              currencyId: user.currencyId,
              description: user.description,
              created_by: user.created_by,
              approved_by: user.approved_by,
              container_number: user.container_number,
              pier: user.pier,
              rate: user.rate,
              isDeleted: user.isDeleted,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the id to find the record to update
          );

          console.log(
            `🔁 Updated payables in local: ${user.transaction_id} ${user.warehouse_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PayableSyncData };
