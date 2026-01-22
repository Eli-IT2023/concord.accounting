import swal from "sweetalert";
import Select from "react-select";
import { selectCustomStyles } from "../../../../assets/global/selectCustomStyles";
import { Form, FloatingLabel } from "react-bootstrap";

const ProductionConsumableCreateTable = ({
  consumables,
  filteredConsumableOptions,
  stockConsumableProducts,
  setConsumables,
  shift,
  selectedWarehouse,
  shiftWarehouseRef,
  validated,
  onInputFloat,
  deleteItemConsumable,
  consumableToDelete,
  existingConsumables,
  addNewItemConsumable,
  edit,
}) => {
  return (
    <div className="mb-2 production-form-container-item">
      <div className="table-responsive">
        <table className="w-100 custom-datatable">
          <thead className="bg-light-custom thead-custom">
            <tr>
              <th className="p-2">Consumables</th>
              <th className="p-2">UOM</th>
              <th className="p-2">Current Stock</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Unit Price</th>
              <th className="p-2">Costing</th>
              <th className=""></th>
            </tr>
          </thead>
          <tbody>
            {consumables.map((data, index, array) => {
              const consumableOptions = filteredConsumableOptions(index).map(
                (item) => ({
                  value: item.product_id,
                  label: item.product_list?.product_name || "Unnamed Product",
                })
              );

              const costLongestLength = Math.max(
                ...array.map((item) => Number(item.cost).toFixed(2)?.length)
              );

              return (
                <tr className="custom-tr" key={`${data.stock_id}-${index}`}>
                  <td>
                    <Select
                      options={consumableOptions}
                      value={consumableOptions.find(
                        (item) => item?.value === data.stock_id
                      )}
                      onChange={(selectedOption) => {
                        const selected = selectedOption?.value;

                        const isExist = consumables.some(
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
                          const selectedProduct = stockConsumableProducts.find(
                            (product) =>
                              String(product.product_id) === String(selected)
                          );

                          if (selectedProduct) {
                            console.log("Selected Product:", selectedProduct); // Debugging

                            // Find in deleted consumables
                            const deletedProduct = consumableToDelete?.find(
                              (item) =>
                                item.prod_id === selectedProduct.product_id
                            );

                            // Find in the existing consumables
                            const findConsumable = existingConsumables?.find(
                              (item) =>
                                item.prod_id === selectedProduct.product_id
                            );

                            setConsumables((prev) =>
                              prev.map((item, i) =>
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
                                        (selectedProduct.totalStock || 0) +
                                        (deletedProduct?.weightIn ||
                                          findConsumable?.weightIn ||
                                          0),

                                      prod_price:
                                        selectedProduct.averagePrice || 0,
                                      weightIn: "", // Reset on selection
                                      cost: "", // Reset on selection
                                    }
                                  : item
                              )
                            );
                          }
                        }
                      }}
                      onMenuOpen={() => {
                        if (!shift || !selectedWarehouse) {
                          swal({
                            icon: "warning",
                            title: "Missing Fields",
                            text: "Please complete the production details above before selecting consumables or finished products.",
                          }).then(() => {
                            shiftWarehouseRef.current[!shift ? 0 : 1].focus();
                            shiftWarehouseRef.current[
                              !shift ? 0 : 1
                            ].showPicker();
                          });
                          return;
                        }

                        if (stockConsumableProducts.length === 0) {
                          swal({
                            icon: "warning",
                            title: "Warning",
                            text: "No consumables found. Please create consumables first to proceed.",
                          });
                          return;
                        }
                      }}
                      menuIsOpen={
                        stockConsumableProducts?.length === 0
                          ? false
                          : undefined
                      }
                      menuPortalTarget={document.body}
                      placeholder={`Select Consumables`}
                      styles={selectCustomStyles(true, validated)}
                      isSearchable
                      {...(edit !== undefined && { isDisabled: !edit })}
                      // required
                    />
                  </td>

                  {/* UOM */}
                  <td>
                    <input
                      type="text"
                      value={data.prod_uom}
                      readOnly
                      className="form-control form-control-sm custom-input p-2"
                    />
                  </td>

                  {/* Current Stock */}
                  <td>
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
                  <td>
                    <Form.Control
                      // required
                      type="text"
                      value={data.weightIn}
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

                        if (newWeight <= parseFloat(data.current_stock)) {
                          setConsumables((prev) =>
                            prev.map((item) =>
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
                          // alert(
                          //   "Weight cannot exceed current stock!"
                          // );
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
                      {...(edit !== undefined && { disabled: !edit })}
                      // pattern="^(?!0(\.0+)?$)(\d{1,3}(,\d{3})*|\d+)(\.\d+)?$" // will not allow 0
                      // required
                    />
                  </td>

                  {/* Unit Price */}
                  <td>
                    <input
                      type="text"
                      value={data.prod_price.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                      className="form-control form-control-sm production-td-width p-2"
                      readOnly
                    />
                  </td>

                  {/* Costing */}
                  <td>
                    <input
                      type="text"
                      value={data.cost.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      // onChange={(e) =>
                      //   handleInputChange("costing", e.target.value)
                      // }
                      readOnly
                      className="form-control form-control-sm p-2"
                      style={{
                        width: `${Math.max(80, costLongestLength * 10)}px`,
                      }}
                    />
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteItemConsumable(index, data)}
                      {...(edit === undefined
                        ? { disabled: consumables.length === 1 }
                        : {
                            disabled: consumables.length === 1 || !edit,
                          })}
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
      <div
        className={`w-100 ${
          edit !== undefined && !edit && "d-none"
        } d-flex justify-content-end mt-2 p-1`}
      >
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={addNewItemConsumable}
        >
          New Item
        </button>
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

export default ProductionConsumableCreateTable;
