import React from "react";

function FinishTab({
  finishedMaterialTab,
  totalDistributeCost,
  totalFinishedUnit,
  totalCosting,
}) {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm mb-3">
          <div className="w-100 d-flex align-items-center mt-3 mb-3">
            <h5>Production Details of Finished Product</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="thead-light">
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  {/* <th className="text-nowrap">
                                Processing Raw <br /> Materials Unit
                              </th>
                              <th>Defective Unit</th> */}
                  <th>QTY Produced </th>
                  <th>Total Costing</th>
                  <th>Average Price</th>
                  <th className="text-nowrap">
                    Final Average price of <br /> finished goods
                  </th>
                  {/* <th>Production Efficiency</th>
                              <th>Defective Unit (%)</th> */}
                </tr>
              </thead>
              <tbody>
                {finishedMaterialTab.map((data) => (
                  <tr key={data.product_id2}>
                    {/* Product Code */}
                    <td>{data.product_list.product_code}</td>
                    {/* Product Name */}
                    <td>{data.product_list.product_name}</td>
                    {/* Processing Raw Materials Unit */}
                    {/* <td>
                                  {Number(data.total_weight_in2).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td> */}
                    {/* Defective Unit */}
                    {/* <td>
                                  {Number(data.total_defective2).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td> */}
                    {/* Finished Unit */}
                    <td>
                      {Number(data.finishedUnit).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    {/* Total Costing */}
                    <td>
                      {Number(data.totalCosting || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    {/* Average Price */}
                    <td>
                      {Number(data.averagePrice || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    {/* Final Average price of finished goods */}
                    <td>
                      {Number(
                        data.averagePrice + totalDistributeCost || 0
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    {/* Production Efficiency */}
                    {/* <td>{data.production_efficiency2}</td> */}
                    {/* Defective Unit (%) */}
                    {/* <td>{data.defective_loss2}</td> */}
                  </tr>
                ))}
              </tbody>
              <tbody>
                <tr className="font-weight-bold table-primary">
                  <td className="text-right fw-bold" colspan="2">
                    Total Units:
                  </td>
                  {/* <td className="text-success fw-bold">
                                {Number(totalProcessingRawUnit).toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td className="text-success fw-bold">
                                {Number(totalDefectiveUnit).toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td> */}
                  <td className="text-success fw-bold">
                    {Number(totalFinishedUnit || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="text-success fw-bold">
                    {Number(totalCosting || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinishTab;
