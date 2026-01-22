// initializeDefaults.js
const {
  ProductList,
  StockManagement,
  accountlist_sub3,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");
const {
  accountlist_base_subject,
} = require("../db/models/ModelsBySubject/associations_sub");

async function initializeDefaults() {
  const product_id_val = "11111111-1111-1111-1111-111111111111";
  let product_migrate_id = "";
  let stockProduct_id = "";
  const isProductMigration = await ProductList.findOne({
    where: { product_id: product_id_val },
  });

  if (!isProductMigration) {
    const is_prod_exist = await ProductList.create({
      product_id: product_id_val,
      product_code: "000000",
      product_name: "Product Migration Only",
      product_category: "Finish Product",
      unit_of_measure: "Kilogram",
      status: "Inactive",
      threshold: 0,
    });

    product_migrate_id = is_prod_exist.product_id;
  } else {
    product_migrate_id = isProductMigration.product_id;
  }

  const isStockProductMigration = await StockManagement.findOne({
    where: { stock_management_id: "11111111-1111-1111-1111-111111111111" },
  });

  if (!isStockProductMigration) {
    const is_prod_exist = await StockManagement.create({
      stock_management_id: "11111111-1111-1111-1111-111111111111",
      product_id: product_migrate_id,
      warehouse_id: "11111111-1111-1111-1111-111111111111",
      stock: 0,
      in: 0,
      price: 0,
      price_in: 0,
      vendor_id: null,
      date_in: new Date(),
      transaction_number: "Migration",
      module_in_from: "Migration",
      isDeleted: false,
    });

    product_migrate_id = "11111111-1111-1111-1111-111111111111";
  } else {
    product_migrate_id = isStockProductMigration.stock_management_id;
  }

  let Liasub2_id = "";
  const isLiaExist = await accountlist_base_subject.findOne({
    where: {
      subject_name: "Other Customer Accounts",
      module_type: "Liabilities Account",
    },
  });

  if (!isLiaExist) {
    const created_Lia = await accountlist_base_subject.create({
      subject_name: "Other Customer Accounts",
      subject_type: "Cash",
      module_type: "Liabilities Account",
    });

    Liasub2_id = created_Lia.id;
  } else {
    Liasub2_id = isLiaExist.id;
  }

  let Assetsub2_id = "";
  const isAssetExist = await accountlist_base_subject.findOne({
    where: {
      subject_name: "Other Customer Accounts",
      module_type: "Asset Account",
    },
  });

  if (!isAssetExist) {
    const created_Asset = await accountlist_base_subject.create({
      subject_name: "Other Customer Accounts",
      subject_type: "Cash",
      module_type: "Asset Account",
    });

    Assetsub2_id = created_Asset.id;
  } else {
    Assetsub2_id = isAssetExist.id;
  }

  let migrate_id_Account2 = "";
  const isExistMigrateAccount = await accountlist_base_subject.findOne({
    where: {
      subject_name: "Migration Account",
      module_type: "Owner's Equity Account",
    },
  });

  if (!isExistMigrateAccount) {
    const created_MIgrate = await accountlist_base_subject.create({
      subject_name: "Migration Account",
      subject_type: "Cash",
      module_type: "Owner's Equity Account",
      isDeleted: true,
    });

    migrate_id_Account2 = created_MIgrate.id;
  } else {
    migrate_id_Account2 = isExistMigrateAccount.id;
  }

  let migrate_id_Account3 = "";
  const isExistMigrateAccount3 = await accountlist_sub3.findOne({
    where: {
      account_name: "Migration Account",
      account_list_base_sub_id: migrate_id_Account2,
    },
  });

  if (!isExistMigrateAccount3) {
    const created_MIgrate3 = await accountlist_sub3.create({
      account_list_base_sub_id: migrate_id_Account2,
      account_name: "Migration Account",
      amount: 0,
      currency_id: "11111111-1111-1111-1111-111111111111",
      investment_amount: 0,
      created_by: "11111111-1111-1111-1111-111111111111",
      isDeleted: false,
    });

    migrate_id_Account3 = created_MIgrate3.id;
  } else {
    migrate_id_Account3 = isExistMigrateAccount3.id;
  }

  return {
    product_migrate_id,
    Liasub2_id,
    Assetsub2_id,
    migrate_id_Account2,
    migrate_id_Account3,
  };
}

module.exports = { initializeDefaults };
