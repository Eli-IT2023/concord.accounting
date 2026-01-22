const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Customer } = require("../../backend/db/models/associations.js");

const CustomerData = async () => {
  try {
    const localUsers = await Customer.findAll({
      where: { isDeleted: false },
      raw: true,
    });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.expenses_one_id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `customers` WHERE customer_id  = :customer_id ",
        {
          replacements: { customer_id: user.customer_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`customers\` (
                customer_id, type, status, first_name, last_name, email, company_address, country, civil_status, date_birth, gender, mobile_no, job_position, tin, company_name, company_nature, company_email, notes, balance, createdAt, updatedAt
              ) VALUES (
                :customer_id, :type, :status, :first_name, :last_name, :email, :company_address, :country, :civil_status, :date_birth, :gender, :mobile_no, :job_position, :tin, :company_name, :company_nature, :company_email, :notes, :balance, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              customer_id: user.customer_id,
              type: user.type,
              status: user.status,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              company_address: user.company_address,
              country: user.country,
              civil_status: user.civil_status,
              date_birth: user.date_birth,
              gender: user.gender,
              mobile_no: user.mobile_no,
              job_position: user.job_position,
              tin: user.tin,
              company_name: user.company_name,
              company_nature: user.company_nature,
              company_email: user.company_email,
              notes: user.notes,
              balance: user.balance,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing customers to cloud: ${user.first_name} ${user.company_name} (${user.customer_id})`
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
            `UPDATE customers SET
                type = :type,
                status = :status,
                first_name = :first_name,
                last_name = :last_name,
                email = :email,
                company_address = :company_address,
                country = :country,
                civil_status = :civil_status,
                date_birth = :date_birth,
                gender = :gender,
                mobile_no = :mobile_no,
                job_position = :job_position,
                tin = :tin,
                company_name = :company_name,
                company_nature = :company_nature,
                company_email = :company_email,
                notes = :notes,
                balance = :balance,
                updatedAt = :updatedAt
              WHERE customer_id = :customer_id`,
            {
              replacements: {
                customer_id: user.customer_id,
                type: user.type,
                status: user.status,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                company_address: user.company_address,
                country: user.country,
                civil_status: user.civil_status,
                date_birth: user.date_birth,
                gender: user.gender,
                mobile_no: user.mobile_no,
                job_position: user.job_position,
                tin: user.tin,
                company_name: user.company_name,
                company_nature: user.company_nature,
                company_email: user.company_email,
                notes: user.notes,
                balance: user.balance,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated in customers cloud: ${user.first_name} (${user.company_name}) - ${user.customer_id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `customers`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Customer.findAll({
        where: { customer_id: user.customer_id, isDeleted: false },
      });

      if (localUser.length === 0) {
        await Customer.create({
          customer_id: user.customer_id,
          type: user.type,
          status: user.status,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          company_address: user.company_address,
          country: user.country,
          civil_status: user.civil_status,
          date_birth: user.date_birth,
          gender: user.gender,
          mobile_no: user.mobile_no,
          job_position: user.job_position,
          tin: user.tin,
          company_name: user.company_name,
          company_nature: user.company_nature,
          company_email: user.company_email,
          notes: user.notes,
          balance: user.balance,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing customers to local: ${user.first_name} ${user.company_name} (${user.customer_id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Customer.update(
            {
              type: user.type,
              status: user.status,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              company_address: user.company_address,
              country: user.country,
              civil_status: user.civil_status,
              date_birth: user.date_birth,
              gender: user.gender,
              mobile_no: user.mobile_no,
              job_position: user.job_position,
              tin: user.tin,
              company_name: user.company_name,
              company_nature: user.company_nature,
              company_email: user.company_email,
              notes: user.notes,
              balance: user.balance,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                customer_id: user.customer_id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated customers in local: ${user.first_name} (${user.company_name}) - ${user.customer_id}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { CustomerData };
