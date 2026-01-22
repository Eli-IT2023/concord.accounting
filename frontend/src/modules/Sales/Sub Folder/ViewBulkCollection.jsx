import React, { useState, useEffect } from "react";
import OldViewBulkCollection from "../components/LocalOverseas/OldViewBulkCollection";
import NewViewBulkCollection from "../components/LocalOverseas/NewViewBulkCollection";

const ViewBulkCollection = ({
  authrztn,
  setId,
  setIdToAdd,
  setEdit, // To determine if user is still editing then suddenly navigates to other page
  setRoute,
}) => {
  const [selectedValue, setSelectedValue] = useState("NEW");
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {selectedValue === "OLD" ? (
        <OldViewBulkCollection
          authrztn={authrztn}
          setId={setId}
          setIdToAdd={setIdToAdd}
          setEdit={setEdit} // To determine if user is still editing then suddenly navigates to other page
          setRoute={setRoute}
        />
      ) : selectedValue === "NEW" ? (
        <NewViewBulkCollection
          authrztn={authrztn}
          setId={setId}
          setIdToAdd={setIdToAdd}
          setEdit={setEdit} // To determine if user is still editing then suddenly navigates to other page
          setRoute={setRoute}
        />
      ) : null}
    </div>
  );
};

export default ViewBulkCollection;
