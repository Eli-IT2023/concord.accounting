import React from "react";

function CostTab({
  directCostsTab,
  totalFinishedUnit,
  totalDirectCosts,
  totalDistributeCost,
}) {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm mb-3">
          <div className="w-100 d-flex align-items-center mt-3 mb-3">
            <h5>Production Details of Direct Costs</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="thead-light">
                <tr>
                  <th>Expenses Category</th>
                  <th>Direct Costs</th>
                  <th>Cost to Distribute</th>
                </tr>
              </thead>
              <tbody>
                {directCostsTab.map((data) => (
                  <tr key={data.id}>
                    {/* Expenses Category */}
                    <td>{data.sub_type}</td>
                    {/* Direct Costs */}
                    <td>
                      {data.directCosts.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    {/* Distribute the cost */}
                    <td>
                      {(totalFinishedUnit
                        ? data.directCosts / totalFinishedUnit
                        : 0
                      ).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tbody>
                <tr className="font-weight-bold table-primary">
                  <td className="text-right fw-bold">Total Direct Costs:</td>
                  {/* Total of Direct Costs */}
                  <td className="text-success fw-bold">
                    {totalDirectCosts.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  {/* Total of Distribute cost */}
                  <td className="text-success fw-bold">
                    {totalDistributeCost.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CostTab;
