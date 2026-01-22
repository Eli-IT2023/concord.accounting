import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import axios from "axios";
import BASE_URL from "../../../../assets/global/url";
import swal from "sweetalert";

const BackloadModal = ({ show, onHide, invoiceId, transactionId }) => {
  const backloadPagination = useServerPagination(
    `${BASE_URL}/invoice/backload/items-to-return`,
    10
  );
  const [itemsToReturn, setItemsToReturn] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    if (show && invoiceId && transactionId) {
      getItemsToReturn(invoiceId, transactionId);
    }
  }, [show, invoiceId, transactionId]);

  useEffect(() => {
    if (backloadPagination.data) {
      setItemsToReturn(
        backloadPagination.data.map((item) => {
          const salesInvoiceId = item.sales_invoice_id;
          const salesTransactionNumber = item.sales_invoice.transaction_id;
          const productId = item.stock_management?.product_list?.product_id;
          const productName = item.stock_management?.product_list?.product_name;
          const unitPrice = item.unit_price;
          const netWeight = item.net_weight;
          const quantity = item.quantity;
          const moisture = item.moisture || 0;
          const staticNetWeight = item.static_net_weight;

          return {
            salesInvoiceId,
            salesTransactionNumber,
            productId,
            productName,
            netWeight: netWeight,
            quantity: quantity,
            quantityToReturn: "",
            unitPrice,
            moisture,
            static_netWeight: staticNetWeight,
          };
        })
      );
      setSelectedItems(new Set());
    }
  }, [backloadPagination.data]);

  // Quantity = Quantity - Return
  // Net Weight = (Quantity - Return) × (1 - moisture)
  const calculateValues = (originalQuantity, returnQuantity, moisture) => {
    const moistureDecimal = moisture / 100; // Convert percentage to decimal
    const newQuantity = originalQuantity - returnQuantity;
    const newNetWeight = newQuantity * (1 - moistureDecimal);

    return {
      newQuantity,
      newNetWeight,
    };
  };

  // Original Weight = static_net_weight ÷ (1 − Moisture)
  // Total Returned = Original Weight - Current Quantity
  const calculateTotalReturned = (
    staticNetWeight,
    currentQuantity,
    moisture
  ) => {
    const moistureDecimal = moisture / 100; // Convert percentage to decimal
    const originalWeight = staticNetWeight / (1 - moistureDecimal);
    const totalReturned = originalWeight - currentQuantity;
    return totalReturned;
  };

  const getItemsToReturn = (salesInvoiceId, salesTransactionNumber) => {
    try {
      backloadPagination.updateParams({
        salesInvoiceId,
        salesTransactionNumber,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReturnProduct = async (product) => {
    try {
      const returnQuantity = parseFloat(
        String(product.quantityToReturn).replace(/,/g, "")
      );

      const { newQuantity, newNetWeight } = calculateValues(
        product.quantity,
        returnQuantity,
        product.moisture
      );

      const productWithCalculatedValues = {
        ...product,
        quantityToReturn: returnQuantity,
        calculatedQuantity: newQuantity,
        calculatedNetWeight: newNetWeight,
        unitPrice: product.unitPrice,
      };

      const res = await axios.post(
        `${BASE_URL}/invoice/backload/return-product`,
        {
          product: productWithCalculatedValues,
        }
      );
      if (res.status === 200) {
        swal({
          icon: "success",
          title: "Return Successful",
          text: `Product has been returned.`,
          timer: 3000,
          buttons: false,
        }).then(() => {
          getItemsToReturn(
            product.salesInvoiceId,
            product.salesTransactionNumber
          );
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        const soldQuantity = error.response.data.soldQuantity;
        const wrapper = document.createElement("div");
        wrapper.classList.add("center-swal-text");
        wrapper.innerHTML = `The return quantity exceeds the sold quantity <strong>(${soldQuantity.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )})</strong>`;
        swal({
          icon: "error",
          title: "Invalid Quantity To Return",
          content: wrapper,
        });
      }

      console.error(error);
    }
  };

  const handleBulkReturn = () => {
    if (selectedItems.size === 0) {
      swal({
        icon: "warning",
        title: "No Items Selected",
        text: "Please select at least one item to return.",
      });
      return;
    }

    const itemsWithValidQuantity = Array.from(selectedItems).filter((index) => {
      const item = itemsToReturn[index];
      const parseNumber = (num) =>
        parseFloat(String(num || 0).replace(/,/g, ""));
      return parseNumber(item.quantityToReturn) > 0;
    });

    if (itemsWithValidQuantity.length === 0) {
      swal({
        icon: "warning",
        title: "Invalid Quantities",
        text: "All selected items must have a return quantity greater than zero.",
      });
      return;
    }

    swal({
      icon: "warning",
      title: "Confirm Product Return",
      text: `Are you sure you want to return ${itemsWithValidQuantity.length} product(s)? This action cannot be undone.`,
      buttons: ["Cancel", "Yes, Return"],
      dangerMode: true,
    }).then(async (confirm) => {
      if (confirm) {
        for (const index of itemsWithValidQuantity) {
          await handleReturnProduct(itemsToReturn[index]);
        }
      }
    });
  };

  const toggleItemSelection = (index) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(index)) {
      newSelectedItems.delete(index);
    } else {
      newSelectedItems.add(index);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleClose = () => {
    setItemsToReturn([]);
    setSelectedItems(new Set());
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title className="text-primary fw-bold">Backload</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="overflow-auto">
          <div
            style={{ maxHeight: "80vh", overscrollBehaviorBlock: "contain" }}
            className="overflow-auto"
          >
            <table className="table table-bordered table-striped table-responsive text-center text-nowrap">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(
                            new Set(itemsToReturn.map((_, index) => index))
                          );
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                      checked={
                        selectedItems.size === itemsToReturn.length &&
                        itemsToReturn.length > 0
                      }
                    />
                  </th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Moisture (%)</th>
                  <th>Net Weight</th>
                  <th>Quantity to Return</th>
                  <th>Total Returned</th>
                </tr>
              </thead>
              <tbody>
                <TransitionGroup component={null}>
                  {itemsToReturn.map((item, index) => {
                    const returnQuantity = parseFloat(
                      String(item.quantityToReturn || 0).replace(/,/g, "")
                    );

                    const { newQuantity, newNetWeight } =
                      returnQuantity > 0
                        ? calculateValues(
                            item.quantity,
                            returnQuantity,
                            item.moisture
                          )
                        : {
                            newQuantity: item.quantity,
                            newNetWeight: item.netWeight,
                          };

                    // Calculate total returned using the new formula
                    const totalReturned = calculateTotalReturned(
                      item.static_netWeight,
                      item.quantity,
                      item.moisture
                    );

                    return (
                      <CSSTransition
                        key={index}
                        timeout={300}
                        classNames="table-row"
                      >
                        <tr key={index}>
                          <td className="align-middle">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(index)}
                              onChange={() => toggleItemSelection(index)}
                            />
                          </td>
                          <td className="align-middle">{item.productName}</td>
                          <td className="align-middle">
                            {item.quantity.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="align-middle">
                            {item.moisture.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            %
                          </td>
                          <td className="align-middle">
                            {item.netWeight.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="align-middle">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="0.00"
                              value={item.quantityToReturn}
                              onChange={(e) => {
                                const value = e.target.value;

                                let inputValue = String(value).replace(
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
                                  /^0+,|^0+/,
                                  ""
                                );

                                setItemsToReturn((prev) => {
                                  const updatedItems = prev.map(
                                    (returnItem, returnItemIndex) => {
                                      if (returnItemIndex !== index)
                                        return returnItem;

                                      return {
                                        ...returnItem,
                                        quantityToReturn: cleanedValue,
                                      };
                                    }
                                  );

                                  return updatedItems;
                                });
                              }}
                            />
                          </td>
                          <td className="align-middle bg-light">
                            {totalReturned.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      </CSSTransition>
                    );
                  })}
                </TransitionGroup>
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-end">
            <Button
              variant="primary"
              onClick={handleBulkReturn}
              disabled={selectedItems.size === 0}
            >
              Return Selected Items ({selectedItems.size})
            </Button>
          </div>
          <div className="pb-2">
            <PaginationControls {...backloadPagination} />
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default BackloadModal;
