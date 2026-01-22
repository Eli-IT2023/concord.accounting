import React from "react";
import Select from "react-select";
import swal from "sweetalert";
import { selectCustomStyles } from "../../../../assets/global/selectCustomStyles";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";

const TagTab = ({
  newItemList,
  productFetch,
  productData,
  productTagVendorList,
  validated,
  pagination,
  onInputFloat,
  vendorProductRemove,
  addNewItem,
  setNewItemList,
  setProductFetch,
}) => {
  const productOptions = productData.map((item) => ({
    value: item.product_id,
    label: item.product_name,
  }));

  const handleProductChange = (selectedOption, index, data) => {
    const selectedProductId = selectedOption?.value;

    const existingProduct = [
      ...newItemList,
      ...productTagVendorList,
    ].find(
      (product) =>
        String(product.product_id) === String(selectedProductId) ||
        String(product.prod_id) === String(selectedProductId)
    );

    if (existingProduct) {
      swal({
        title: "Oppss!",
        text: "You cannot add product already exist",
        icon: "error",
        buttons: false,
        timer: 2000,
      });
      return;
    }

    const selectedProduct = productData.find(
      (product) => String(product.product_id) === String(selectedProductId)
    );

    if (selectedProduct) {
      setNewItemList((prevProductFetch) => {
        const updatedFetch = prevProductFetch.map((item, i) =>
          index === i
            ? {
                ...item,
                prod_id: selectedProduct.product_id,
                prod_code: selectedProduct.product_code,
                prod_name: selectedProduct.product_name,
                prod_cat: selectedProduct.product_category,
                prod_uom: selectedProduct.unit_of_measure,
                vendor_prod_id: item.vendor_prod_id,
                vendor_prod_price: item.vendor_prod_price,
                vendor_prod_status: item.vendor_prod_status,
                type: item.type,
              }
            : item
        );
        return updatedFetch;
      });
    }
  };

  const handlePriceChange = (newPrice, data) => {
    setProductFetch((prevProductFetch) =>
      prevProductFetch.map((item, i) =>
        data.prod_code === item.prod_code
          ? { ...item, vendor_prod_price: newPrice }
          : item
      )
    );

    setNewItemList((prevProductFetch) =>
      prevProductFetch.map((item, i) =>
        data.prod_code === item.prod_code
          ? { ...item, vendor_prod_price: newPrice }
          : item
      )
    );
  };

  return (
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th className="p-2">Product Code</th>
            <th className="p-2">Product Name</th>
            <th className="p-2">Category</th>
            <th className="p-2">Unit of Measurement</th>
            <th className="p-2">Sell Price</th>
            <th className="p-2">Status</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {[...newItemList, ...productFetch].map((data, index) => (
            <tr key={index}>
              <td>{data.prod_code}</td>
              <td>
                <Select
                  options={productOptions}
                  value={productOptions.find(
                    (item) => item.value === data.prod_id
                  )}
                  onChange={(selectedOption) =>
                    handleProductChange(selectedOption, index, data)
                  }
                  placeholder={`Select Product`}
                  styles={selectCustomStyles(data.prod_id, validated)}
                  menuPortalTarget={document.body}
                  isDisabled={data.type === "old"}
                  isSearchable
                />
              </td>
              <td>{data.prod_cat}</td>
              <td>{data.prod_uom}</td>
              <td>
                <input
                  type="text"
                  onInput={onInputFloat}
                  value={data.vendor_prod_price}
                  onChange={(e) =>
                    handlePriceChange(e.target.value, data)
                  }
                  className="form-control"
                />
              </td>
              <td>
                <span
                  style={{
                    color:
                      data.vendor_prod_status === "Active" ? "green" : "red",
                    border: `1px solid ${
                      data.vendor_prod_status === "Active" ? "green" : "red"
                    }`,
                    padding: "2px 15px",
                    borderRadius: "12px",
                    display: "inline-block",
                  }}
                >
                  {data.vendor_prod_status}
                </span>
              </td>
              <td>
                <button
                  className={`btn d-flex align-items-center justify-content-center ${
                    data.vendor_prod_status === "Active"
                      ? "btn-outline-danger custom-btn-danger"
                      : "btn-outline-primary custom-btn-primary"
                  }`}
                  onClick={() =>
                    vendorProductRemove(
                      data.prod_id,
                      data.vendor_prod_id,
                      data.vendor_prod_status,
                      index,
                      data.type
                    )
                  }
                  style={{
                    cursor: "pointer",
                    fontSize: "16px",
                    background: "none",
                  }}
                >
                  <i
                    className={`fa-solid ${
                      data.vendor_prod_status === "Active"
                        ? "fa-times fs-5"
                        : "fa-check fs-5"
                    }`}
                  ></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-end mt-2">
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={addNewItem}
        >
          New Item
        </button>
      </div>
      <PaginationControls {...pagination} />
    </div>
  );
};

export default TagTab;