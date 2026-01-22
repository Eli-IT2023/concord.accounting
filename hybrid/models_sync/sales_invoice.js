const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { SalesInvoice } = require("../../backend/db/models/associations.js");

const SalesInvoiceSyncData = async () => {
  try {
    const localUsers = await SalesInvoice.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `sales_invoices` WHERE sales_invoice_id = :sales_invoice_id",
        {
          replacements: { sales_invoice_id: user.sales_invoice_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`sales_invoices\` (
                sales_invoice_id, transaction_id, customer_id, currency_id, warehouse_id, account_list_sub3_id, liability_amount, payment_method, due_date, invoice_date, payment_terms, destination, transaction_discount, item_discount, shipping_fee, total_amount, discount_type, status, payAdded, remarks, notification, container_number, pier, created_by, approved_by, rate, amount, quantity, createdAt, updatedAt, isDeleted
              ) VALUES (
              :sales_invoice_id, :transaction_id, :customer_id, :currency_id, :warehouse_id, :account_list_sub3_id, :liability_amount, :payment_method, :due_date, :invoice_date, :payment_terms, :destination, :transaction_discount, :item_discount, :shipping_fee, :total_amount, :discount_type, :status, :payAdded, :remarks, :notification, :container_number, :pier, :created_by, :approved_by, :rate, :amount, :quantity, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              sales_invoice_id: user.sales_invoice_id,
              transaction_id: user.transaction_id,
              customer_id: user.customer_id,
              currency_id: user.currency_id,
              warehouse_id: user.warehouse_id,
              account_list_sub3_id: user.account_list_sub3_id,
              liability_amount: user.liability_amount,
              payment_method: user.payment_method,
              due_date: user.due_date,
              invoice_date: user.invoice_date,
              payment_terms: user.payment_terms,
              destination: user.destination,
              transaction_discount: user.transaction_discount,
              item_discount: user.item_discount,
              shipping_fee: user.shipping_fee,
              total_amount: user.total_amount,
              discount_type: user.discount_type,
              status: user.status,
              payAdded: user.payAdded,
              remarks: user.remarks,
              notification: user.notification,
              container_number: user.container_number,
              pier: user.pier,
              created_by: user.created_by,
              approved_by: user.approved_by,
              rate: user.rate,
              amount: user.amount,
              quantity: user.quantity,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing sales_invoices to cloud: ${user.transaction_id} ${user.warehouse_id} (${user.id})`
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
            `UPDATE sales_invoices SET
            customer_id = :customer_id,
            transaction_id = :transaction_id,
            warehouse_id = :warehouse_id,
            currency_id = :currency_id,
            liability_amount = :liability_amount,
            account_list_sub3_id = :account_list_sub3_id,
            due_date = :due_date,
            payment_method = :payment_method,
            invoice_date = :invoice_date,
            payment_terms = :payment_terms,
            destination = :destination,
            transaction_discount = :transaction_discount,
            item_discount = :item_discount,
            shipping_fee = :shipping_fee,
            total_amount = :total_amount,
            discount_type = :discount_type,
            status = :status,
            payAdded = :payAdded,
            remarks = :remarks,
            notification = :notification,
            container_number = :container_number,
            pier = :pier,
            created_by = :created_by,
            approved_by = :approved_by,
            rate = :rate,
            amount = :amount,
            quantity = :quantity,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE sales_invoice_id = :sales_invoice_id;`,
            {
              replacements: {
                sales_invoice_id: user.sales_invoice_id,
                transaction_id: user.transaction_id,
                customer_id: user.customer_id,
                currency_id: user.currency_id,
                warehouse_id: user.warehouse_id,
                account_list_sub3_id: user.account_list_sub3_id,
                liability_amount: user.liability_amount,
                payment_method: user.payment_method,
                due_date: user.due_date,
                invoice_date: user.invoice_date,
                payment_terms: user.payment_terms,
                destination: user.destination,
                transaction_discount: user.transaction_discount,
                item_discount: user.item_discount,
                shipping_fee: user.shipping_fee,
                total_amount: user.total_amount,
                discount_type: user.discount_type,
                status: user.status,
                payAdded: user.payAdded,
                remarks: user.remarks,
                notification: user.notification,
                container_number: user.container_number,
                pier: user.pier,
                created_by: user.created_by,
                approved_by: user.approved_by,
                rate: user.rate,
                amount: user.amount,
                quantity: user.quantity,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated sales_invoices in cloud: ${user.transaction_id} ${user.warehouse_id} (${user.sales_invoice_id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `sales_invoices`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await SalesInvoice.findAll({
        where: { sales_invoice_id: user.sales_invoice_id },
      });

      if (localUser.length === 0) {
        await SalesInvoice.create({
          sales_invoice_id: user.sales_invoice_id,
          transaction_id: user.transaction_id,
          customer_id: user.customer_id,
          currency_id: user.currency_id,
          warehouse_id: user.warehouse_id,
          account_list_sub3_id: user.account_list_sub3_id,
          liability_amount: user.liability_amount,
          payment_method: user.payment_method,
          due_date: user.due_date,
          invoice_date: user.invoice_date,
          payment_terms: user.payment_terms,
          destination: user.destination,
          transaction_discount: user.transaction_discount,
          item_discount: user.item_discount,
          shipping_fee: user.shipping_fee,
          total_amount: user.total_amount,
          discount_type: user.discount_type,
          status: user.status,
          payAdded: user.payAdded,
          remarks: user.remarks,
          notification: user.notification,
          container_number: user.container_number,
          pier: user.pier,
          created_by: user.created_by,
          approved_by: user.approved_by,
          rate: user.rate,
          amount: user.amount,
          quantity: user.quantity,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing sales_invoices to local: ${user.transaction_id} ${user.warehouse_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await SalesInvoice.update(
            {
              transaction_id: user.transaction_id,
              customer_id: user.customer_id,
              currency_id: user.currency_id,
              warehouse_id: user.warehouse_id,
              account_list_sub3_id: user.account_list_sub3_id,
              liability_amount: user.liability_amount,
              payment_method: user.payment_method,
              due_date: user.due_date,
              invoice_date: user.invoice_date,
              payment_terms: user.payment_terms,
              destination: user.destination,
              transaction_discount: user.transaction_discount,
              item_discount: user.item_discount,
              shipping_fee: user.shipping_fee,
              total_amount: user.total_amount,
              discount_type: user.discount_type,
              status: user.status,
              payAdded: user.payAdded,
              remarks: user.remarks,
              notification: user.notification,
              container_number: user.container_number,
              pier: user.pier,
              created_by: user.created_by,
              approved_by: user.approved_by,
              rate: user.rate,
              amount: user.amount,
              quantity: user.quantity,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            {
              where: {
                sales_invoice_id: user.sales_invoice_id,
              },
            }
          );

          console.log(
            `🔁 Updated sales_invoices in local: ${user.transaction_id} ${user.warehouse_id} (${user.sales_invoice_id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { SalesInvoiceSyncData };
