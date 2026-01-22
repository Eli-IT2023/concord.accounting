import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThreeDot } from "react-loading-indicators";
import { Tab, Tabs } from "react-bootstrap";
import OldViewPayLocalExpenses from "../components/LocalOverseas/OldViewPayLocalExpenses";
import NewViewPayLocalExpenses from "../components/LocalOverseas/NewViewPayLocalExpenses";

const ViewLocalPayExpenses = ({
  authrztn,
  setId,
  setIdToAdd,
  setEdit, // To determine if user is still editing then suddenly navigates to other page
  setRoute,
}) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <>
      {selectedValue === "OLD" ? (
        <OldViewPayLocalExpenses
          authrztn={authrztn}
          setId={setId}
          setIdToAdd={setIdToAdd}
          setEdit={setEdit} // To determine if user is still editing then suddenly navigates to other page
          setRoute={setRoute}
        />
      ) : selectedValue === "NEW" ? (
        <NewViewPayLocalExpenses
          authrztn={authrztn}
          setId={setId}
          setIdToAdd={setIdToAdd}
          setEdit={setEdit} // To determine if user is still editing then suddenly navigates to other page
          setRoute={setRoute}
        />
      ) : null}
    </>
  );
};

export default ViewLocalPayExpenses;
