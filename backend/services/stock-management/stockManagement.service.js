const sequelize = require("../../db/config/sequelize.config");
const { productsSummaryCTE } = require("./stockManagement.helper");

// For stock management products table
const getProductsSummary = async ({
  productCategory,
  warehouseId,
  productId,
  limit,
  offset,
  likeSearch,
}) => {
  // Get total count and paginated products
  const productSql = `
    ${productsSummaryCTE(warehouseId, productId, productCategory)}
    SELECT *, COUNT(*) OVER() AS totalCount FROM products_summary -- OVER() window clause applies before limit and offset
    WHERE 1=1 ${likeSearch ? `AND (${likeSearch})` : ""}
    LIMIT :limit OFFSET :offset;
    `;

  const products = await sequelize.query(productSql, {
    replacements: { productCategory, warehouseId, productId, limit, offset },
    type: sequelize.QueryTypes.SELECT,
  });

  return { count: products[0]?.totalCount || 0, products };
};

module.exports = {
  getProductsSummary,
};
