// Sql like filter
const likeFilter = (col, searchText) => `${col} LIKE '%${searchText}%'`;

// Sql cast filter
const castFilter = (col, searchText) =>
  `CAST(${col} AS CHAR) LIKE '%${searchText}%'`;

// Final inventory quantity
const stockQuantity = `
(
  SUM(
    COALESCE(
      CASE
        WHEN type = "in" THEN ij.quantity
        ELSE 0
      END, 
    0)
  )
  -
  SUM(
    COALESCE(
      CASE
        WHEN type = "out" THEN ij.quantity
        ELSE 0
      END, 
    0)
  )
)
`;

// Final inventory amount
const totalPrice = `
(
  SUM(
    COALESCE(
      CASE
        WHEN type = "in" THEN ij.unit_price * ij.quantity
        ELSE 0
      END, 
    0)
  )
  -
  SUM(
    COALESCE(
      CASE
        WHEN type = "out" THEN ij.unit_price * ij.quantity
        ELSE 0
      END, 
    0)
  )
)
`;

// Calculates product summary including stockQuantity, totalPrice, and averagePrice
const productsSummary = (warehouseId, productId, productCategory) => {
  return `
  SELECT 
    ij.product_id, 
    ij.warehouse_id, 
    pl.product_code, 
    pl.product_name, 
    pl.product_category, 
    ${stockQuantity} AS stock_quantity,
    ${totalPrice} / ${stockQuantity} AS average_price,
    NULL AS quantity_to_transfer,
    NULL AS actual_count,
    ${totalPrice} / ${stockQuantity} AS actual_price
    FROM inventory_journals ij
    INNER JOIN product_lists pl ON pl.product_id = ij.product_id
    WHERE 1=1
    ${productCategory ? "AND pl.product_category = :productCategory" : ""}
    ${productId ? "AND ij.product_id = :productId" : ""}
    ${warehouseId ? "AND ij.warehouse_id = :warehouseId" : ""}
    AND ij.isDeleted = false
    GROUP BY ij.product_id, ij.warehouse_id
`;
};

module.exports = {
  productsSummary,
  likeFilter,
  castFilter,
};
