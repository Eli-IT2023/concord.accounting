const sequelize = require("../../db/config/sequelize.config");
const { productsSummary } = require("./stockTransfer.helper");

// For stock management products table
const getProductsSummary = async ({
  module = "Stock transfer", // Default to Stock transfer module
  productCategory,
  warehouseId,
  productId,
  limit,
  offset,
  likeSearch,
  productIdList,
  operator,
}) => {
  // Early return to avoid invalid IN () query and unnecessary DB call
  if (!productIdList.length && operator === "IN")
    return { count: 0, products: [] };

  const hasProductIdList = Array.isArray(productIdList) && productIdList.length;

  // prettier-ignore
  // Get total count and paginated products
  const productSql = `
    WITH products_summary AS (
      ${productsSummary(warehouseId, productId, productCategory)}
    )
    SELECT *, 
    COUNT(*) OVER() AS totalCount FROM products_summary -- OVER() window clause applies before limit and offset
    WHERE 1=1 
      ${likeSearch ? `AND (${likeSearch})` : ""}
      ${hasProductIdList ? `AND product_id ${operator} (${productIdList.join(", ")}) ` : ""}
      ${module === "Stock transfer" ? "AND stock_quantity > 0" : ""}
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
