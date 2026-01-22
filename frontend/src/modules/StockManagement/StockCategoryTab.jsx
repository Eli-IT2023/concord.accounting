import React, { useState, useEffect } from "react";
import OldStockCategoryTab from "./components/StockCategoryTab/OldStockCategoryTab";
import NewStockCategoryTab from "./components/StockCategoryTab/NewStockCategoryTab";

const StockCategoryTab = ({ category }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 bg-white custom-container mt-2">
      <>
        {selectedValue === "OLD" ? (
          <OldStockCategoryTab category={category} />
        ) : selectedValue === "NEW" ? (
          <NewStockCategoryTab category={category} />
        ) : null}
      </>
    </div>
  );
};

export default StockCategoryTab;
