import React, { useState, useEffect } from "react";
import OldCountingCreate from "./components/InventoryCounting/OldCountingCreate";
import NewCountingCreate from "./components/InventoryCounting/NewCountingCreate";

const CountingCreate = () => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <>
        {selectedValue === "OLD" ? (
          <OldCountingCreate />
        ) : selectedValue === "NEW" ? (
          <NewCountingCreate />
        ) : null}
      </>
    </div>
  );
};

export default CountingCreate;
