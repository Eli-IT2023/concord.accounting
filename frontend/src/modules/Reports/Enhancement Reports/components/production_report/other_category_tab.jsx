import React, { useState, useEffect } from "react";
import BASE_URL from "../../../../../assets/global/url";
import axios from "axios";
function OtherCategory({
  thisFromdate,
  thisTodate,
  categoryName,
  selectedCutoff_id,
}) {
  const [categoryData, setCategoryData] = useState([]);

  const totalProduced = categoryData.reduce(
    (acc, value) => acc + value.totalWeight,
    0
  );

  const totalCosting = categoryData.reduce(
    (acc, value) => acc + value.totalCosting,
    0
  );

  useEffect(() => {
    axios
      .get(BASE_URL + "/report_production/fetchOtherCateory", {
        params: {
          selectedCutoff_id,
          categoryName,
        },
      })
      .then((res) => {
        setCategoryData(res.data);
      });

    //eslint-disable-next-line
  }, [thisFromdate, thisTodate]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm mb-3">
          <div className="w-100 d-flex align-items-center mt-3 mb-3">
            <h5>Production Details of Raw Materials</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="thead-light">
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Processed Unit</th>
                  <th>Average Unit Price</th>
                  <th>Total Costing / Raw Materials</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((data) => (
                  <tr key={data.product_id}>
                    {/* Product Code */}
                    <td>{data.product_list.product_code}</td>
                    {/* Raw Materials Name */}
                    <td>{data.product_list.product_name}</td>
                    {/* Processing Unit */}
                    <td>
                      {data.totalWeight?.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    {/* Average Unit Price */}
                    <td>
                      {data.averageUnitPrice?.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    {/* Total Costing / Raw Materials */}
                    <td>
                      {data.totalCosting?.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tbody>
                <tr className="font-weight-bold table-primary">
                  <td colspan="2" className="text-right fw-bold">
                    Total Processing Unit:
                  </td>
                  <td className="text-success fw-bold">
                    {Number(totalProduced).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td></td>
                  <td className="text-success fw-bold">
                    {totalCosting.toLocaleString("en-US", {
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

export default OtherCategory;
