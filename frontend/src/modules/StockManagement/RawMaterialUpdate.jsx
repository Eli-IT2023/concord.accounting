import React, { useState, useEffect } from "react";
import OldRawMaterialUpdate from "./components/ViewProduct/OldRawMaterialUpdate";
import NewRawMaterialUpdate from "./components/ViewProduct/NewRawMaterialUpdate";

const RawMaterialUpdate = () => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 bg-white custom-container mt-2">
      <>
        {selectedValue === "OLD" ? (
          <OldRawMaterialUpdate />
        ) : selectedValue === "NEW" ? (
          <NewRawMaterialUpdate />
        ) : null}
      </>
    </div>
  );
};

export default RawMaterialUpdate;
