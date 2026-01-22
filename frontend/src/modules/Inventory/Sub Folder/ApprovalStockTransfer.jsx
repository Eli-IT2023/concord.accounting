import React, { useState, useEffect } from "react";
import OldApprovalStockTransfer from "./components/StockTransfer/OldApprovalStockTransfer";
import NewApprovalStockTransfer from "./components/StockTransfer/NewApprovalStockTransfer";

const CreateStockTransfer = () => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <>
        {selectedValue === "OLD" ? (
          <OldApprovalStockTransfer />
        ) : selectedValue === "NEW" ? (
          <NewApprovalStockTransfer />
        ) : null}
      </>
    </div>
  );
};

export default CreateStockTransfer;
