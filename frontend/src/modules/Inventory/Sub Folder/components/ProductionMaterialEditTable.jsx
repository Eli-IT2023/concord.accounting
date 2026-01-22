import swal from "sweetalert";
import Select from "react-select";
import { selectCustomStyles } from "../../../../assets/global/selectCustomStyles";
import { Form, FloatingLabel } from "react-bootstrap";

const ProductionMaterialEditTable = ({
  raws,
  vendor,
  selectedWarehouse,
  filteredRawProductOptions,
  stock_raw_products,
  setMaterialToDelete,
  materialToDelete,
  setRaws,
  validated,
  edit,
  onInputFloat,
  finishedProductRows,
  deleteItemRaw,
  addNewItemRaw,
}) => {
  return (
    <div
      className="mb-2 production-form-container-item"
      //   ref={(el) => (containerItemRefs.current[0] = el)}
    >
      <div className="table-responsive">
        <table className="w-100">
          <thead className="bg-light-custom thead-custom">
            <tr>
              <th className="p-2">Supplier Code</th>
              <th className="p-2">Materials</th>
              <th className="p-2">UOM</th>
              <th className="p-2">Current Stock</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Unit Price</th>
              <th className="p-2">Costing</th>
              <th className=""></th>
            </tr>
          </thead>
          <tbody>
            {raws.map((data, index, array) => {
              const rawProductOptions = filteredRawProductOptions(index).map(
                (item) => ({
                  value: item.product_id,
                  label: item.product_list?.product_name || "Unnamed Product",
                })
              );

              const costLongestLength = Math.max(
                ...array.map((item) => Number(item.cost).toFixed(2)?.length)
              );

              // For value of the vendor
              const vendorValue = vendor.vendorOptions.find(
                (item) => item.value === data.vendor_id
              );

              return (
                <tr className="custom-tr" key={`${data.stock_id}-${index}`}>
                  <td>
                    <Select
                      options={vendor.vendorOptions}
                      value={vendorValue}
                      onChange={(selectedOption) =>
                        vendor.handleSupplierCodeChange(selectedOption, index)
                      }
                      placeholder={`Select Supplier Code`}
                      styles={selectCustomStyles(data.vendor_id, validated)}
                      menuPortalTarget={document.body} // prevent UI bug
                      isSearchable
                      required
                      isDisabled={!edit}
                    />
                  </td>
                  <td className="custom-td">
                    <Select
                      options={rawProductOptions}
                      value={rawProductOptions.find(
                        (item) => item?.value === data.stock_id
                      )}
                      onChange={async (selectedOption) => {
                        const selected = selectedOption?.value;

                        const isExist = raws.some(
                          (mother) =>
                            String(mother.stock_id) === String(selected)
                        );

                        if (isExist) {
                          swal({
                            title: "Oppss!",
                            text: "You cannot add product that already exists",
                            icon: "error",
                            buttons: false,
                            timer: 2000,
                          });
                        } else {
                          const stock_raw_products =
                            await vendor.fetchRawMaterialStock(
                              selectedWarehouse,
                              data.vendor_id
                            );

                          const selectedProduct = stock_raw_products.find(
                            (product) =>
                              String(product.product_id) === String(selected)
                          );

                          if (!data.newItem) {
                            setMaterialToDelete((prev) => [...prev, data]);
                          }

                          if (selectedProduct) {
                            console.log("Selected Product:", selectedProduct); // Debugging

                            const deletedProduct = materialToDelete?.find(
                              (item) =>
                                item.prod_id === selectedProduct.product_id
                            );

                            setRaws((prevRaws) =>
                              prevRaws.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      stock_id: selectedProduct.product_id,
                                      prod_id: selectedProduct.product_id,
                                      prod_code:
                                        selectedProduct.product_list
                                          ?.product_code || "",
                                      prod_name:
                                        selectedProduct.product_list
                                          ?.product_name || "",
                                      prod_uom:
                                        selectedProduct.product_list
                                          ?.unit_of_measure || "",
                                      current_stock:
                                        selectedProduct.totalStock || 0,
                                      prod_price:
                                        selectedProduct.averagePrice || 0,
                                      weightIn: "", // Reset on selection
                                      cost: "", // Reset on selection
                                      newItem: true,
                                    }
                                  : item
                              )
                            );
                          }
                        }
                      }}
                      menuPortalTarget={document.body}
                      placeholder={`Select Materials`}
                      styles={selectCustomStyles(data.stock_id, validated)}
                      isDisabled={!edit && data.vendor_id}
                      isSearchable
                      required
                    />
                  </td>
                  {/* UOM */}
                  <td className="custom-td">
                    <input
                      type="text"
                      value={data.prod_uom}
                      readOnly
                      className="form-control form-control-sm custom-input p-2"
                    />
                  </td>
                  {/* Current Stock */}
                  <td className="custom-td">
                    <input
                      type="text"
                      value={data.current_stock.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      readOnly
                      className="form-control form-control-sm custom-input p-2"
                    />
                  </td>
                  {/* Weight In */}
                  <td className="custom-td">
                    <Form.Control
                      required
                      type="text"
                      value={data.weightIn}
                      disabled={!edit}
                      onInput={onInputFloat}
                      onChange={(e) => {
                        const newWeight = parseFloat(e.target.value) || 0;

                        let inputValue = String(e.target.value).replace(
                          /[^0-9.]/g,
                          ""
                        );

                        let [integerPart, decimalPart] = inputValue.split(".");

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

                        let finishRawsWeight =
                          newWeight / finishedProductRows.length;

                        let finishInputValue = String(finishRawsWeight).replace(
                          /[^0-9.]/g,
                          ""
                        );

                        let [integerPartFinish, decimalPartFinish] =
                          finishInputValue.split(".");

                        if (integerPartFinish) {
                          integerPartFinish = integerPartFinish.replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ","
                          );
                        }

                        let formattedValueFinish =
                          decimalPartFinish !== undefined
                            ? `${integerPartFinish}.${decimalPartFinish}`
                            : integerPartFinish;

                        if (newWeight <= parseFloat(data.current_stock)) {
                          setRaws((prevRaws) =>
                            prevRaws.map((item) =>
                              item.stock_id === data.stock_id
                                ? {
                                    ...item,
                                    weightIn: cleanedValue,
                                    cost:
                                      newWeight * parseFloat(data.prod_price), // Ensure cost is updated
                                  }
                                : item
                            )
                          );
                        } else {
                          swal({
                            title: "Oppss!",
                            text: "Weight cannot exceed current stock!",
                            icon: "error",
                            buttons: false,
                            timer: 2000,
                          });
                        }
                      }}
                      className="form-control form-control-sm custom-input p-2"
                      pattern="^(?!0(\.0+)?$)(\d{1,3}(,\d{3})*|\d+)(\.\d+)?$" // will not allow 0
                    />
                  </td>
                  {/* Unit Price */}
                  <td className="custom-td">
                    <input
                      type="text"
                      value={data.prod_price.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                      className="form-control form-control-sm p-2"
                      readOnly
                    />
                  </td>
                  {/* Costing */}
                  <td className="custom-td">
                    <input
                      type="text"
                      value={data.cost.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      // style={{
                      //   width: `${Math.max(80, costLongestLength * 10)}px`,
                      // }}
                      readOnly
                      className="form-control form-control-sm p-2"
                    />
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteItemRaw(index, data)}
                      disabled={raws?.length === 1 || !edit}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
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
              onClick={addNewItemRaw}
            >
              New Item
            </button>
          </>
        ) : null}
      </div>
      {/* <div className="d-flex gap-4 mt-2 text-white flex-row justify-content-evenly px-3 total-amount-container-production align-items-center rounded">
                  <div>
                    <p className="mb-0">
                      Total Weight In:{" "}
                      <span>
                        {materialsTotalWeight.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </span>{" "}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0">
                      Total Costing:{" "}
                      <span>
                        {materialsTotalCosting.toLocaleString("en-US", {
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

export default ProductionMaterialEditTable;
