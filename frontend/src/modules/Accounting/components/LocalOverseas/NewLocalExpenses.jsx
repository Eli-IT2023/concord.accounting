import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThreeDot } from "react-loading-indicators";
import { Tab, Tabs } from "react-bootstrap";
const LocalOverseasExpensesTab = lazy(() =>
  import("./LocalOverseasExpensesTab")
);

const NewLocalExpenses = ({ authrztn }) => {
  const [activeTab, setActiveTab] = useState("local");

  const localOverseasProps = {
    authrztn,
    activeTab,
  };

  return (
    <div className="h-100 w-100 bg-white custom-container">
      <>
        <Suspense
          fallback={
            <div className="loading-container">
              <ThreeDot
                variant="brick-stack"
                color="#6290FE"
                size="large"
                text="Loading Data..."
                textColor=""
              />
            </div>
          }
        >
          {" "}
          <Tabs
            transition={false}
            mountOnEnter
            unmountOnExit={false}
            activeKey={activeTab}
            onSelect={(tab) => setActiveTab(tab)}
            id="status-tabs"
            className="mb-3"
          >
            <Tab eventKey="local" title="Local">
              <LocalOverseasExpensesTab {...localOverseasProps} />
            </Tab>
            <Tab eventKey="overseas" title="Overseas">
              <LocalOverseasExpensesTab {...localOverseasProps} />
            </Tab>
          </Tabs>
        </Suspense>
      </>
    </div>
  );
};

export default NewLocalExpenses;
