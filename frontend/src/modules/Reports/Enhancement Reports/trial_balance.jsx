import { useState } from "react";
import OldTrialBalance from "./components/TrialBalance/OldTrialBalance";
import NewTrialBalance from "./components/TrialBalance/NewTrialBalance";

const TrialBalance1 = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 bg-white rounded">
      {selectedValue === "OLD" ? (
        <OldTrialBalance authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewTrialBalance authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default TrialBalance1;
