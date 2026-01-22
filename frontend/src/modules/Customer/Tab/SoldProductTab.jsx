import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";

function SoldProductTab({ customerId }) {
  // Initialize server pagination with API endpoint
  const pagination = useServerPagination(
    `${BASE_URL}/customer/getSoldProducts/${customerId}`,
    10,
    {}
  );

  const [soldProducts, setSoldProducts] = useState([]);

  // Transform pagination data to match display format
  useEffect(() => {
    if (pagination.data && pagination.data.length > 0) {
      setSoldProducts(pagination.data);
    } else {
      setSoldProducts([]);
    }
  }, [pagination.data]);

  const handleRemoveProduct = (index, productId) => {
    swal({
      title: "Are you sure?",
      text: "Do you want to remove this product?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          // Send delete request to backend
          await axios.delete(
            `${BASE_URL}/customer/removeSoldProduct/${customerId}/${productId}`
          );

          // Remove from local state
          setSoldProducts(soldProducts.filter((_, i) => i !== index));

          // Refresh pagination data
          pagination.refreshData();

          swal({
            title: "Removed!",
            text: "Product has been removed.",
            icon: "success",
          });
        } catch (error) {
          swal({
            icon: "error",
            title: "Error",
            text: error.response?.data?.message || "Failed to remove product",
          });
        }
      }
    });
  };

  if (pagination.loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th className="p-2">Product Code</th>
              <th className="p-2">Product Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Unit of Measurement</th>
              <th className="p-2">Sell Price</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {soldProducts.length > 0 ? (
              soldProducts.map((product, index) => (
                <tr key={`${product.id}-${index}`}>
                  <td className="p-2">{product.product_code}</td>
                  <td className="p-2">{product.product_name}</td>
                  <td className="p-2">{product.category}</td>
                  <td className="p-2">{product.unit_of_measure}</td>
                  <td className="p-2">
                    ₱ {parseFloat(product.unit_price).toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveProduct(index, product.id)}
                      title="Remove product"
                    >
                      <i className="fa fa-times"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-3">
                  <em>No sold products found</em>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls {...pagination} />
    </div>
  );
}

export default SoldProductTab;
