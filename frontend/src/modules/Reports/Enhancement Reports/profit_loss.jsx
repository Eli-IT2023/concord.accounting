import React, { useState, useEffect } from "react";
import OldPL from "./components/ProfitLossReport/oldP&L";
import NewPL from "./components/ProfitLossReport/newP&L";
const Profit_Loss = ({ authrztn }) => {
  const [displayComponent] = useState("NEW");

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {displayComponent === "OLD" ? (
        <OldPL authrztn={authrztn} />
      ) : displayComponent === "NEW" ? (
        <NewPL authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default Profit_Loss;
