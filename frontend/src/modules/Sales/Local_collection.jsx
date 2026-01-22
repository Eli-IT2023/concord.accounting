import { useState } from "react";
import OldLocalCollection from "./components/LocalOverseas/OldLocalCollection";
import NewLocalCollection from "./components/LocalOverseas/NewLocalCollection";

const Local_collection = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {selectedValue === "OLD" ? (
        <OldLocalCollection authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewLocalCollection authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default Local_collection;
