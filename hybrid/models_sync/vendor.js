const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Vendors } = require("../../backend/db/models/associations.js");

const VendorsData = async () => {
  try {
    const localUsers = await Vendors.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.expenses_one_id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `vendors` WHERE id  = :id  ",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`vendors\` (
                id, company_name, company_nature, company_email, company_address, company_city, company_country, company_designation, fname, lname, mname, civil_status, dob, gender, contact, contact2, tin_number, position, currency_id , status, isArchive, createdAt, updatedAt
              ) VALUES (
                :id, :company_name, :company_nature, :company_email, :company_address, :company_city, :company_country, :company_designation, :fname, :lname, :mname,  :civil_status, :dob, :gender, :contact, :contact2, :tin_number, :position, :currency_id , :status, :isArchive, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              company_name: user.company_name,
              company_nature: user.company_nature,
              company_email: user.company_email,
              company_address: user.company_address,
              company_city: user.company_city,
              company_country: user.company_country,
              company_designation: user.company_designation,
              fname: user.fname,
              lname: user.lname,
              mname: user.mname,
              civil_status: user.civil_status,
              dob: user.dob,
              gender: user.gender,
              contact: user.contact,
              contact2: user.contact2,
              tin_number: user.tin_number,
              position: user.position,
              currency_id: user.currency_id,
              status: user.status,
              isArchive: user.isArchive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing  vendors to cloud: ${user.fname} ${user.company_name} (${user.id})`
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
            `UPDATE vendors SET
                 company_name = :company_name,
                company_nature = :company_nature,
                company_email = :company_email,
                company_address = :company_address,
                company_city = :company_city,
                company_country = :company_country,
                company_designation = :company_designation,
                fname = :fname,
                lname = :lname,
                mname = :mname,
                civil_status = :civil_status,
                dob = :dob,
                gender = :gender,
                contact = :contact,
                contact2 = :contact2,
                tin_number = :tin_number,
                position = :position,
                currency_id = :currency_id,
                status = :status,
                isArchive = :isArchive,
                updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                company_name: user.company_name,
                company_nature: user.company_nature,
                company_email: user.company_email,
                company_address: user.company_address,
                company_city: user.company_city,
                company_country: user.company_country,
                company_designation: user.company_designation,
                fname: user.fname,
                lname: user.lname,
                mname: user.mname,
                civil_status: user.civil_status,
                dob: user.dob,
                gender: user.gender,
                contact: user.contact,
                contact2: user.contact2,
                tin_number: user.tin_number,
                position: user.position,
                currency_id: user.currency_id,
                status: user.status,
                isArchive: user.isArchive,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated in vendors cloud: ${user.fname} (${user.company_name}) - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `vendors`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Vendors.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Vendors.create({
          id: user.id,
          company_name: user.company_name,
          company_nature: user.company_nature,
          company_email: user.company_email,
          company_address: user.company_address,
          company_city: user.company_city,
          company_country: user.company_country,
          company_designation: user.company_designation,
          fname: user.fname,
          lname: user.lname,
          mname: user.mname,
          civil_status: user.civil_status,
          dob: user.dob,
          gender: user.gender,
          contact: user.contact,
          contact2: user.contact2,
          tin_number: user.tin_number,
          position: user.position,
          currency_id: user.currency_id,
          status: user.status,
          isArchive: user.isArchive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing vendors to local: ${user.fname} ${user.company_name} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Vendors.update(
            {
              company_name: user.company_name,
              company_nature: user.company_nature,
              company_email: user.company_email,
              company_address: user.company_address,
              company_city: user.company_city,
              company_country: user.company_country,
              company_designation: user.company_designation,
              fname: user.fname,
              lname: user.lname,
              mname: user.mname,
              civil_status: user.civil_status,
              dob: user.dob,
              gender: user.gender,
              contact: user.contact,
              contact2: user.contact2,
              tin_number: user.tin_number,
              position: user.position,
              currency_id: user.currency_id,
              status: user.status,
              isArchive: user.isArchive,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated vendors in local: ${user.fname} (${user.company_name}) - ${user.id}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { VendorsData };
