import React from "react";
import { Form } from "react-bootstrap";
import swal from "sweetalert";
import Select from "react-select";
import { selectCustomStyles } from "../../../../assets/global/selectCustomStyles";

const ProductionFinishedEditTable = ({
  finishedProductRows,
  filteredFinishedProductOptions,
  stock_finish_products,
  setFinishedProductRows,
  validated,
  edit,
  setLastFocusedIndex,
  lastFocusedIndexUnitPrice,
  setLastFocusedIndexUnitPrice,
  deleteFinishedProduct,
  addNewItemFinishProduct,
}) => {
  return (
    <div
      className="mb-2 production-form-container-item"
      //   ref={(el) => (containerItemRefs.current[1] = el)}
    >
      <div className="table-responsive">
        <table className="w-100 custom-datatable">
          <thead className="bg-light-custom thead-custom">
            <tr className="custom-tr">
              <th className="custom-th p-2">Finished Product</th>
              <th className="custom-th p-2">Current Stock</th>
              <th className="custom-th p-2">Qty Produce</th>
              <th className="custom-th p-2">Unit Price</th>
              <th className="custom-th p-2">Costing</th>
              <th className="custom-th p-2">UOM</th>
              <th className="custom-th p-2"></th>
              <th className="custom-th p-2"></th>
            </tr>
          </thead>
          <tbody className="custom-tbody">
            {finishedProductRows.map((data, index) => {
              const finishedProductOptions = filteredFinishedProductOptions(
                index
              ).map((item) => ({
                value: item.product_list.product_id,
                label: item.product_list.product_name,
              }));

              return (
                <React.Fragment key={index}>
                  <>
                    <tr className="custom-tr">
                      <td className="custom-td">
                        <Select
                          options={finishedProductOptions}
                          value={finishedProductOptions.find(
                            (item) => item?.value === data.prod_id
                          )}
                          onChange={(selectedOption) => {
                            const selected = selectedOption?.value;

                            const isExist = finishedProductRows.find(
                              (mother) =>
                                String(mother.prod_id) === String(selected)
                            );

                            if (isExist) {
                              swal({
                                title: "Oppss!",
                                text: "You cannot add product already exist",
                                icon: "error",
                                buttons: false,
                                timer: 2000,
                              });
                            } else {
                              const selectedProduct =
                                stock_finish_products.find(
                                  (product) =>
                                    String(product.product_list.product_id) ===
                                    String(selected)
                                );

                              if (selectedProduct) {
                                setFinishedProductRows((prevProductFetch) => {
                                  const updatedFetch = prevProductFetch.map(
                                    (item, i) =>
                                      // item.prod_id === data.prod_id
                                      i === index
                                        ? {
                                            ...item,
                                            prod_id:
                                              selectedProduct.product_list
                                                .product_id,
                                            prod_code:
                                              selectedProduct.product_list
                                                .product_code,
                                            prod_name:
                                              selectedProduct.product_list
                                                .product_name,
                                            prod_uom:
                                              selectedProduct.product_list
                                                .unit_of_measure,
                                            produce: 0,
                                            current_stock:
                                              selectedProduct.totalStock,
                                            costing: 0,
                                            unit_price: 0,
                                          }
                                        : item
                                  );
                                  return updatedFetch;
                                });
                              }
                            }
                          }}
                          menuPortalTarget={document.body}
                          placeholder={`Select Finished Product`}
                          styles={selectCustomStyles(data.prod_id, validated)}
                          isSearchable
                          isDisabled={!edit}
                          required
                        />
                      </td>
                      {/* Finished Product Current Stock */}
                      <td>
                        <Form.Control
                          type="text"
                          value={data.current_stock?.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                          name="finished-product-current-stock"
                          id="finished-product-currenct-stock"
                          className="form-control form-control-sm custom-input p-2"
                          required
                          readOnly
                        />
                      </td>
                      {/* Finished Product Produce */}
                      <td className="custom-td">
                        <Form.Control
                          type="text"
                          required
                          disabled={!edit || !data.prod_id}
                          value={data.produce.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          onFocus={() => setLastFocusedIndex(index)}
                          onBlur={(e) => {
                            const nextEl = e.relatedTarget;
                            if (!nextEl?.classList?.contains("swal-button")) {
                              setLastFocusedIndex(null);
                            }
                          }}
                          onChange={(e) => {
                            let inputValue = String(e.target.value).replace(
                              /[^0-9.]/g,
                              ""
                            );

                            let [integerPart, decimalPart] =
                              inputValue.split(".");

                            if (integerPart) {
                              integerPart = integerPart.replace(
                                /\B(?=(\d{3})+(?!\d))/g,
                                ","
                              );
                            }

                            let formattedValue =
                              decimalPart !== undefined
                                ? `${integerPart}.${decimalPart}`
                                : integerPart;

                            const cleanedValue = formattedValue.replace(
                              /^0+(?=\d)/,
                              ""
                            ); // Remove leading zeros and comma

                            // Convert formatted value back to number for calculations
                            const numericValue =
                              parseFloat(formattedValue.replace(/,/g, "")) || 0;
                            setFinishedProductRows((prevRows) =>
                              prevRows.map((product) =>
                                product.prod_id == data.prod_id
                                  ? {
                                      ...product,
                                      produce: cleanedValue,
                                    }
                                  : product
                              )
                            );
                          }}
                          className="form-control form-control-sm custom-input p-2"
                          pattern="^(?!0(\.0+)?$)(\d{1,3}(,\d{3})*|\d+)(\.\d+)?$" // will not allow 0
                        />
                      </td>
                      {/* Finished Product Unit Price */}
                      <td>
                        <Form.Control
                          type="text"
                          value={
                            lastFocusedIndexUnitPrice === index
                              ? data.unit_price
                              : data.unit_price?.toLocaleString("en-US", {
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                })
                          }
                          onFocus={() => setLastFocusedIndexUnitPrice(index)}
                          onBlur={(e) => {
                            const nextEl = e.relatedTarget;
                            if (!nextEl?.classList?.contains("swal-button")) {
                              setLastFocusedIndexUnitPrice(null);
                            }
                          }}
                          onChange={(e) => {
                            let inputValue = String(e.target.value).replace(
                              /[^0-9.]/g,
                              ""
                            );

                            let [integerPart, decimalPart] =
                              inputValue.split(".");

                            if (integerPart) {
                              integerPart = integerPart.replace(
                                /\B(?=(\d{3})+(?!\d))/g,
                                ","
                              );
                            }

                            let formattedValue =
                              decimalPart !== undefined
                                ? `${integerPart}.${decimalPart}`
                                : integerPart;

                            // Convert formatted value back to number for calculations
                            const numericValue =
                              parseFloat(formattedValue.replace(/,/g, "")) || 0;

                            setFinishedProductRows((prevRows) =>
                              prevRows.map((product) => {
                                return product.prod_id == data.prod_id
                                  ? {
                                      ...product,
                                      unit_price: formattedValue,
                                    }
                                  : product;
                              })
                            );
                          }}
                          name="finished-product-unit-price"
                          id="finished-product-unit-price"
                          className="form-control form-control-sm custom-input p-2"
                          required
                          readOnly={!edit || !data.prod_id}
                        />
                      </td>
                      {/* Finished Product Costing */}
                      <td>
                        <Form.Control
                          type="text"
                          value={data.costing?.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                          name="finished-product-costing"
                          id="finished-product-costing"
                          className="form-control form-control-sm production-td-width p-2"
                          required
                          readOnly
                        />
                      </td>
                      {/* Finished Product UOM */}
                      <td className="custom-td p-0">
                        <input
                          type="text"
                          value={data.prod_uom}
                          readOnly
                          className="form-control form-control-sm production-td-width p-2"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteFinishedProduct(index)}
                          disabled={finishedProductRows?.length === 1 || !edit}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    </tr>
                  </>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="w-100 d-flex justify-content-end mt-2 p-1">
        {edit ? (
          <>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={addNewItemFinishProduct}
            >
              New Item
            </button>
          </>
        ) : null}
      </div>
      {/* <div className="d-flex gap-4 mt-2 text-white flex-row justify-content-evenly px-3 total-amount-container-production align-items-center rounded">
                  <div>
                    <p className="mb-0">
                      Total Produce:{" "}
                      <span>
                        {finishedTotalWeight.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-0">
                      Total Costing:{" "}
                      <span>
                        {finishedTotalCosting.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </p>
                  </div>
                </div> */}
    </div>
  );
};

export default ProductionFinishedEditTable;
