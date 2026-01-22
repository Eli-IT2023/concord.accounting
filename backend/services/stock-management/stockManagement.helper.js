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

// Common Table Expression: calculates product summary including stockQuantity, totalPrice, and averagePrice
const productsSummaryCTE = (warehouseId, productId, productCategory) => {
  return `
  WITH products_summary AS (
    SELECT 
    ij.product_id, 
    ij.warehouse_id, 
    w.name AS warehouse_name, 
    pl.product_code, 
    pl.product_name, 
    pl.product_category, 
    pl.unit_of_measure, 
    pl.threshold, 
    ${stockQuantity} AS stock_quantity,
    -- If stock quantity is 0 the amount should be 0
    CASE 
      WHEN ${stockQuantity} = 0 THEN 0
      ELSE ${totalPrice}
    END AS total_price,
    ${totalPrice} / ${stockQuantity} AS average_price
    FROM inventory_journals ij
    INNER JOIN warehouses w ON w.warehouse_id = ij.warehouse_id
    INNER JOIN product_lists pl ON pl.product_id = ij.product_id
    WHERE 1=1
    ${productCategory ? "AND pl.product_category = :productCategory" : ""}
    ${productId ? "AND ij.product_id = :productId" : ""}
    ${warehouseId ? "AND ij.warehouse_id = :warehouseId" : ""}
    AND ij.isDeleted = false
    GROUP BY ij.product_id, ij.warehouse_id
  )
`;
};

module.exports = {
  productsSummaryCTE,
  likeFilter,
  castFilter,
};
