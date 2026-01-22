import React, { useState, useEffect } from "react";
import OldCreateStockTransfer from "./components/StockTransfer/OldCreateStockTransfer";
import NewCreateStockTransfer from "./components/StockTransfer/NewCreateStockTransfer";

const CreateStockTransfer = () => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <>
        {selectedValue === "OLD" ? (
          <OldCreateStockTransfer />
        ) : selectedValue === "NEW" ? (
          <NewCreateStockTransfer />
        ) : null}
      </>
    </div>
  );
};

export default CreateStockTransfer;
