import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import { Form } from "react-bootstrap";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
const ProductionsForm = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  // State for the first table
  const [validated, setValidated] = useState(false);
  const [production_id, setProduction_id] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState("");
  const [fetchWarehouse, setFetchWarehouse] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [trigger, setTrigger] = useState(0);

  //States PRoduction
  const [stock_raw_products, setStock_raw_products] = useState([]); // stocks management table fetch
  const [stock_finish_products, setStock_finish_products] = useState([]); // product table fetch

  const navigate = useNavigate();
  // State for the first table
  const [raws, setRaws] = useState([
    {
      stock_id: "",
      prod_id: "",
      prod_code: "",
      prod_name: "",
      prod_uom: "",
      current_stock: "",
      prod_price: "",
      weightIn: 0,
      cost: "",
    },
  ]);

  const fetchLastCode = () => {
    axios
      .get(BASE_URL + "/production/getCode")
      .then((res) => {
        setProduction_id(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchWarehouse_function = () => {
    axios
      .get(BASE_URL + "/warehouse/getWarehouse")
      .then((res) => {
        setFetchWarehouse(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const x = stock_raw_products.filter((item) => {
    return !raws.map((item) => item.prod_id).includes(item.product_id);
  });
  console.log(x, "==========");

  const fetchStockRaw = (warehouse_id) => {
    axios
      .get(BASE_URL + "/production/getRawProd", {
        params: {
          selectedWarehouse: warehouse_id,
        },
      })
      .then((res) => {
        setStock_raw_products(res.data);
        console.log(
          "*****-------------------------------------------------*res.data: ",
          res.data
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchStockFinish = () => {
    axios
      .get(BASE_URL + "/production/getFinishProd")
      .then((res) => {
        setStock_finish_products(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchLastCode();
    fetchStockFinish();
    fetchWarehouse_function();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const validRawMaterials = raws.filter((raw) => raw.stock_id && raw.prod_name);

  // State for the second table
  const [finishedProductRows, setFinishedProductRows] = useState([
    {
      prod_id: "",
      prod_code: "",
      prod_name: "",
      prod_uom: "",
      produce: 0,
      raw_used: [
        {
          raw_stock_id: "",
          raw_product_id: "",
          weightIn: "",
          newWeight: "",
          costing: "",
          prod_name: "",
        },
      ],
    },
  ]);

  const addNewItemRaw = () => {
    setRaws((prev) => [
      ...prev,
      {
        stock_id: "",
        prod_id: "",
        prod_code: "",
        prod_name: "",
        prod_uom: "",
        current_stock: "",
        prod_price: "",
        weightIn: 0,
        cost: "",
      },
    ]);
  };

  const deleteItemRaw = (indexToDelete) => {
    setTrigger(trigger + 1);
    setRaws((prevRaws) =>
      prevRaws.filter((_, index) => index !== indexToDelete)
    );
  };

  // delete row for finish product
  const deleteFinishedProduct = (indexToDelete) => {
    setTrigger(trigger + 1);
    setFinishedProductRows((prevRows) => {
      // Don't delete if it's the only row
      if (prevRows.length === 1) {
        return prevRows;
      }
      return prevRows.filter((_, index) => index !== indexToDelete);
    });
  };

  const addNewItemFinishProduct = () => {
    setFinishedProductRows((prev) => [
      ...prev,
      {
        prod_id: "",
        prod_code: "",
        prod_name: "",
        prod_uom: "",
        produce: 0,
        raw_used: [
          {
            raw_stock_id: "",
            raw_product_id: "",
            weightIn: "",
            newWeight: "",
            costing: "",
            prod_name: "",
          },
        ],
      },
    ]);
  };

  const addNewItemRawFinsih = (finishedProductIndex) => {
    setFinishedProductRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[finishedProductIndex].raw_used.push({
        raw_stock_id: "",
        raw_product_id: "",
        weightIn: "",
        newWeight: "",
        costing: "",
      });
      console.log("New rows after adding:", newRows);
      return newRows;
    });
  };

  const addNewItemRawFinish = (index) => {
    setFinishedProductRows((prevProductFetch) => {
      const currentRawMaterials = prevProductFetch[index].raw_used;

      const isRawMaterialExist = currentRawMaterials.some(
        (raw) => raw.raw_stock_id === ""
      );

      if (!isRawMaterialExist) {
        const updatedProductRows = prevProductFetch.map((item, i) =>
          i === index
            ? {
                ...item,
                raw_used: [
                  ...item.raw_used,
                  {
                    raw_stock_id: "",
                    raw_product_id: "",
                    weightIn: "",
                    newWeight: "",
                    costing: "",
                    prod_name: "",
                  },
                ],
              }
            : item
        );
        return updatedProductRows;
      }
      return prevProductFetch;
    });
  };

  const filteredRawProductOptions = (index) => {
    const prodId = raws
      .filter((_, i) => {
        return i !== index;
      })
      .map((item) => item.prod_id);

    console.log(prodId);

    return stock_raw_products.filter((item) => {
      return !prodId.includes(item.product_id);
    });
  };

  const filteredFinishedProductOptions = (index) => {
    const prodId = finishedProductRows
      .filter((_, i) => {
        return i !== index;
      })
      .map((item) => {
        return item.prod_id;
      });

    return stock_finish_products.filter((item) => {
      return !prodId.includes(item.product_id);
    });
  };

  // const handleRawProductChange = (
  //   finishedProductIndex,
  //   rawUsedIndex,
  //   value
  // ) => {
  //   setFinishedProductRows((prevRows) => {
  //     const newRows = [...prevRows];
  //     const selectedRaw = raws.find((raw) => raw.stock_id === value);
  //     newRows[finishedProductIndex].raw_used[rawUsedIndex] = {
  //       ...newRows[finishedProductIndex].raw_used[rawUsedIndex],
  //       raw_stock_id: value,
  //       maxWeightIn: selectedRaw ? selectedRaw.weightIn : 0,
  //       weightIn: 0, // Reset weightIn when a new raw is selected
  //     };
  //     return newRows;
  //   });
  // };

  const handleRawProductChange = (
    productIndex,
    rawIndex,
    newRawStockId,
    paramsProductId,
    prod_name
  ) => {
    setFinishedProductRows((prevProductFetch) => {
      const currentRawMaterials = prevProductFetch[productIndex].raw_used;

      const isRawMaterialExist = currentRawMaterials.some(
        (raw, i) => raw.raw_stock_id === newRawStockId && i !== rawIndex
      );

      setTrigger(trigger + 1);

      if (isRawMaterialExist) {
        swal({
          title: "Oppss!",
          text: "This raw material is already selected for this product.",
          icon: "error",
          buttons: false,
          timer: 2000,
        });
        return prevProductFetch;
      }

      const selectedRaw = raws.find((raw) => raw.stock_id == newRawStockId);
      const selectedWeightIn = selectedRaw
        ? parseFloat(String(selectedRaw.weightIn).replace(/,/g, "")) || 0
        : 0;

      const selectedPrice = selectedRaw
        ? parseFloat(String(selectedRaw.prod_price).replace(/,/g, "")) || 0
        : 0;

      const updatedRows = prevProductFetch.map((product, i) => {
        if (i !== productIndex) return product;

        const updatedRawUsed = product.raw_used.map((raw, j) =>
          j === rawIndex
            ? {
                ...raw,
                raw_stock_id: newRawStockId,
                raw_product_id: paramsProductId,
                prod_name: prod_name,
                weightIn: selectedWeightIn / prevProductFetch.length || 1,
                newWeight: selectedWeightIn / prevProductFetch.length || 1,
                costing: selectedWeightIn * selectedPrice,
              }
            : raw
        );

        const totalNewWeight = updatedRawUsed.reduce(
          (sum, raw) =>
            sum + (parseFloat(String(raw.newWeight).replace(/,/g, "")) || 0),
          0
        );

        return {
          ...product,
          raw_used: updatedRawUsed,
          produce: totalNewWeight,
        };
      });

      return updatedRows;
    });
  };

  // Add this helper function to calculate total produce from raw materials
  const calculateTotalProduce = (rawUsedArray) => {
    return rawUsedArray.reduce((total, raw) => {
      return total + (parseFloat(String(raw.newWeight).replace(/,/g, "")) || 0);
    }, 0);
  };
  useEffect(() => {
    if (finishedProductRows.length >= 1) {
      console.log("Tiigeeringg");

      setFinishedProductRows((prevRows) => {
        const stockCount = {};
        prevRows.forEach((product) => {
          product.raw_used.forEach((raw) => {
            stockCount[raw.raw_stock_id] =
              (stockCount[raw.raw_stock_id] || 0) + 1;
          });
        });

        return prevRows.map((product) => ({
          ...product,
          raw_used: product.raw_used.map((raw) => {
            const selectedRaw = raws.find(
              (rawItem) => rawItem.stock_id == raw.raw_stock_id
            );

            const selectedWeightIn = selectedRaw
              ? parseFloat(String(selectedRaw.weightIn).replace(/,/g, "")) || 0
              : 0;

            const selectedPrice = selectedRaw
              ? parseFloat(selectedRaw.prod_price) || 0
              : 0;

            // Divide weight and costing by how many times the raw_stock_id appears
            const divisor = stockCount[raw.raw_stock_id] || 1;

            return {
              ...raw,
              weightIn: selectedWeightIn / divisor,
              newWeight: selectedWeightIn / divisor,
              costing: (selectedWeightIn / divisor) * selectedPrice,
            };
          }),
        }));
      });
    }
  }, [trigger, raws]); // trigger state kasi di pwede finishProductionRows ilalagay mag infinite loop

  // Update handleRawProductInputChange function
  const handleRawProductInputChange = (
    finishedProductIndex,
    rawUsedIndex,
    field,
    value
  ) => {
    setFinishedProductRows((prevRows) => {
      const newRows = [...prevRows];
      const currentRawUsed =
        newRows[finishedProductIndex].raw_used[rawUsedIndex];

      // To remove commas
      const formatRaws = raws.map((item) => ({
        ...item,
        weightIn: parseFloat(String(item.weightIn).replace(/,/g, "")),
      }));

      console.log("Format Raw", formatRaws);

      const selectedProduct = formatRaws.find(
        (product) =>
          String(currentRawUsed.raw_stock_id) === String(product.stock_id)
      );

      if (!selectedProduct) return prevRows;

      console.log("Finished Product", finishedProductRows);

      // Function to calculate total usage of raw material across all products
      const calculateTotalRawMaterialUsage = (rawMaterialId) => {
        return finishedProductRows.reduce((total, product) => {
          const usedAmount = product.raw_used.reduce((subTotal, raw) => {
            if (raw.raw_stock_id === rawMaterialId) {
              return (
                subTotal +
                parseFloat(String(raw.weightIn).replace(/,/g, "") || 0)
              );
            }
            return subTotal;
          }, 0);
          return total + usedAmount;
        }, 0);
      };

      const totalUsedBefore = calculateTotalRawMaterialUsage(
        currentRawUsed.raw_stock_id
      );

      const currentUsage = parseFloat(
        String(currentRawUsed.weightIn).replace(/,/g, "") || 0
      );

      const newUsage = parseFloat(String(value).replace(/,/g, "") || 0);
      const totalUsedAfter = totalUsedBefore - currentUsage + newUsage;

      if (field === "weightIn") {
        if (value === "") {
          currentRawUsed[field] = "";
          return newRows;
        }

        const numValue = value.replace(/[^0-9.]/g, "");
        const numericVal = parseFloat(numValue);

        if (isNaN(numericVal)) {
          return prevRows; // Handle invalid input
        }

        const formattedWeightIn = String(selectedProduct.weightIn).replace(
          /\B(?=(\d{3})+(?!\d))/g,
          ","
        );

        // const formattedVal = String(numValue).replace(
        //   /\B(?=(\d{3})+(?!\d))/g,
        //   ","
        // );

        let inputValue = String(numValue).replace(/[^0-9.]/g, "");

        let [integerPart, decimalPart] = inputValue.split(".");

        if (integerPart) {
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let formattedVal =
          decimalPart !== undefined
            ? `${integerPart}.${decimalPart}`
            : integerPart;

        // Check if total used exceeds the available weight
        // if (totalUsedAfter > selectedProduct.weightIn) {
        //   swal({
        //     title: "Oppss!",
        //     text: `Weight cannot exceed total available raw material: ${formattedWeightIn}`,
        //     icon: "error",
        //     buttons: false,
        //     timer: 2000,
        //   });
        //   currentRawUsed[field] = formattedWeightIn;
        //   return prevRows;
        // }

        currentRawUsed[field] = formattedVal;
      } else {
        if (value === "") {
          currentRawUsed[field] = "";
          currentRawUsed.costing = 0; // Reset costing if no weight
          newRows[finishedProductIndex].produce = calculateTotalProduce(
            newRows[finishedProductIndex].raw_used
          );
          return newRows;
        }

        // Input net weight
        const numValue = value.replace(/[^0-9.]/g, "");
        const numericVal = parseFloat(numValue);

        // const formattedVal = String(numValue).replace(
        //   /\B(?=(\d{3})+(?!\d))/g,
        //   ","
        // );

        let inputValue = String(numValue).replace(/[^0-9.]/g, "");

        let [integerPart, decimalPart] = inputValue.split(".");

        if (integerPart) {
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let formattedVal =
          decimalPart !== undefined
            ? `${integerPart}.${decimalPart}`
            : integerPart;

        const formatCurrentRawUsedWeight = String(
          currentRawUsed.weightIn
        ).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (isNaN(numValue)) {
          return prevRows; // Handle invalid input
        }
        currentRawUsed[field] = formattedVal;

        // Calculate costing
        if (selectedProduct) {
          if (numericVal > currentRawUsed.weightIn) {
            swal({
              title: "Oppss!",
              text: `Net Weight cannot exceed the input weightIn: ${formatCurrentRawUsedWeight}`,
              icon: "error",
              buttons: false,
              timer: 2000,
            });
            currentRawUsed[field] = 0;
            currentRawUsed.costing = 0;
            newRows[finishedProductIndex].produce = calculateTotalProduce(
              newRows[finishedProductIndex].raw_used
            );
            return newRows;
          }
          currentRawUsed.costing = numericVal * selectedProduct.prod_price;
        }
      }

      if (field === "newWeight") {
        const numValue = value.replace(/[^0-9.]/g, "");
        const numericVal = parseFloat(numValue);

        // const formattedVal = String(numValue).replace(
        //   /\B(?=(\d{3})+(?!\d))/g,
        //   ","
        // );

        let inputValue = String(numValue).replace(/[^0-9.]/g, "");

        let [integerPart, decimalPart] = inputValue.split(".");

        if (integerPart) {
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let formattedVal =
          decimalPart !== undefined
            ? `${integerPart}.${decimalPart}`
            : integerPart;

        const formatCurrentRawUsedWeight = String(
          currentRawUsed.weightIn
        ).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (isNaN(numValue)) {
          return prevRows;
        }

        // Update the newWeight
        currentRawUsed[field] = formattedVal;

        // Calculate costing
        if (selectedProduct) {
          if (
            numericVal >
            parseFloat(String(currentRawUsed.weightIn).replace(/,/g, ""))
          ) {
            swal({
              title: "Oppss!",
              text: `Net Weight cannot exceed the input weightIn: ${formatCurrentRawUsedWeight}`,
              icon: "error",
              buttons: false,
              timer: 2000,
            });
            currentRawUsed[field] = formatCurrentRawUsedWeight;
            return prevRows;
          }
          currentRawUsed.costing = numericVal * selectedProduct.prod_price;
        }

        // Update the produce value based on total net weights
        newRows[finishedProductIndex].produce = calculateTotalProduce(
          newRows[finishedProductIndex].raw_used
        );
      }

      return newRows;
    });
  };

  console.log(raws, "raws======");
  console.log(finishedProductRows);
  console.log(production_id);

  useEffect(() => {
    console.log("Raws", raws);
    console.log("Finish", finishedProductRows);
  }, [finishedProductRows, raws]);

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const modifiedFinishedProductRows = finishedProductRows.map((item) => ({
      ...item,
      produce: parseFloat(String(item.produce).replace(/,/g, "")),
      raw_used: item.raw_used.map((raw) => ({
        ...raw,
        weightIn: parseFloat(String(raw.weightIn).replace(/,/g, "")),
        newWeight: parseFloat(String(raw.newWeight).replace(/,/g, "")),
      })),
    }));

    const formatRaws = raws.map((item) => ({
      ...item,
      weightIn: parseFloat(String(item.weightIn).replace(/,/g, "")),
    }));

    const totalWeightInRaws = formatRaws.reduce((acc, item) => {
      if (!acc[item.prod_id]) {
        acc[item.prod_id] = 0;
      }
      acc[item.prod_id] += item.weightIn;
      return acc;
    }, {});

    const totalFinishedRows = finishedProductRows.map((item) => {
      const groupedRawUsed = item.raw_used.reduce((acc, raw) => {
        const rawProdId = raw.raw_product_id;
        const weightIn = parseFloat(String(raw.weightIn).replace(/,/g, ""));

        if (!acc[rawProdId]) {
          acc[rawProdId] = { id: rawProdId, total: weightIn };
        } else {
          acc[rawProdId].total += weightIn;
        }

        return acc;
      }, {});

      return {
        raw_used: Object.values(groupedRawUsed),
      };
    });
    const finalTotals = totalFinishedRows
      .flatMap((item) => item.raw_used)
      .reduce((acc, raw) => {
        if (!raw.id) return acc;

        if (!acc[raw.id]) {
          acc[raw.id] = { id: raw.id, total: raw.total };
        } else {
          acc[raw.id].total += raw.total;
        }
        return acc;
      }, {});

    const mergedRawUsed = Object.values(finalTotals);

    const isValid =
      Object.keys(totalWeightInRaws).length ===
        Object.keys(finalTotals).length &&
      mergedRawUsed.every((raw) => {
        const expectedTotal = totalWeightInRaws[raw.id];
        return expectedTotal !== undefined && expectedTotal === raw.total;
      });

    const findProductName = (id) => {
      const product = raws.find((item) => item.prod_id == id);

      console.log("Find namee", product);
      return product ? product.prod_name : "Unknown";
    };
    const totalWeightWithNames = Object.keys(totalWeightInRaws).map((id) => ({
      id,
      name: findProductName(id),
      total: totalWeightInRaws[id],
    }));

    const finalTotalsWithNames = Object.values(finalTotals).map((item) => ({
      id: item.id,
      name: findProductName(item.id),
      total: item.total,
    }));

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      if (!isValid) {
        const generateSwalTable = () => {
          let table = `
            <table style="border: 1px solid #ddd; width:100%; text-align:center; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 8px;">Name</th>
                  <th style="padding: 8px;">Raw Material Weigh In</th>
                  <th style="padding: 8px; ">Finished Product Raw</th>
                </tr>
              </thead>
              <tbody>`;

          totalWeightWithNames.forEach((weightItem) => {
            const finalItem = finalTotalsWithNames.find(
              (final) => final.id === weightItem.id
            );
            const finalTotal = finalItem ? finalItem.total : 0;

            table += `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${weightItem.name}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${weightItem.total}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${finalTotal}</td>
              </tr>`;
          });

          table += `
              </tbody>
            </table>`;

          return table;
        };

        swal({
          title: "Please use all the raw materials in weight in",
          text: "",
          content: (() => {
            const div = document.createElement("div");
            div.innerHTML = generateSwalTable();
            return div;
          })(),
          icon: "warning",
          // timer: 2000,
          dangerMode: true,
        });

        return;
      }

      swal({
        title: "Create this new production?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          console.log("Finished", finishedProductRows);
          console.log("Raws", raws);

          axios
            .post(`${BASE_URL}/production/create_production`, {
              raws: formatRaws,
              finishedProductRows: modifiedFinishedProductRows,
              production_id,
              description,
              date,
              shift,
              selectedWarehouse,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Production created successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("../inventory/productions");
                });
              } else {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact your support immediately",
                  icon: "error",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                });
              }
            })
            .catch((error) => {
              if (error.response && error.response.status == 409) {
                swal({
                  title: "Oopps!",
                  text: "Action is prohibited because the date provided for the Date produce has already passed the posted cutoff.",
                  icon: "error",
                  button: true,
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  // Update deleteRawUsed function
  const deleteRawUsed = (finishedProductIndex, rawUsedIndex) => {
    setTrigger(trigger + 1);
    setFinishedProductRows((prevRows) => {
      const newRows = [...prevRows];
      const rawUsed = newRows[finishedProductIndex].raw_used;

      // Only delete if there's more than one item
      if (rawUsed.length > 1) {
        rawUsed.splice(rawUsedIndex, 1);
        // Recalculate produce after deletion
        newRows[finishedProductIndex].produce = calculateTotalProduce(rawUsed);
      }

      return newRows;
    });
  };

  const calculateTotalRawMaterialUsage = (rawMaterialId) => {
    return finishedProductRows.reduce((total, product) => {
      const usedAmount = product.raw_used.reduce((subTotal, raw) => {
        if (raw.raw_stock_id === rawMaterialId) {
          return subTotal + parseFloat(raw.weightIn || 0);
        }
        return subTotal;
      }, 0);
      return total + usedAmount;
    }, 0);
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control p-2 w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      placeholder="Select Date"
      required
    />
  ));

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Productions-Add") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">
                <Link to="/inventory/productions" className="text-dark me-2">
                  <i class="fa-solid fa-arrow-left"></i>
                </Link>
                PRODUCTION FORM
              </span>
            </div>
          </div>

          <Form noValidate validated={validated} onSubmit={add}>
            <div className="container-fluid mt-3">
              <div className="row">
                <div className="col-sm mb-2">
                  <span>Production ID</span>
                  <input
                    type="text"
                    name=""
                    id=""
                    className="form-control"
                    readOnly
                    value={production_id}
                  />
                </div>

                <div className="col-sm mb-2">
                  <span>Date Produce</span>
                  {/* <input
                    type="date"
                    name=""
                    id=""
                    required
                    onChange={(e) => setDate(e.target.value)}
                    className="form-control"
                    value={date}
                  /> */}
                  <div>
                    <DatePicker
                      selected={date}
                      onChange={(date) => {
                        setDate(date);
                      }}
                      dateFormat="MMM dd, yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput />}
                    />
                  </div>
                </div>

                <div className="col-sm"></div>
              </div>
              <div className="row">
                <div className="col-sm mb-2">
                  <span>Shift Schedule</span>
                  <Form.Select
                    required
                    onChange={(e) => setShift(e.target.value)}
                  >
                    <option selected disabled value="">
                      Select Shift
                    </option>
                    <option value={"Shift 1"}>Shift 1</option>
                    <option value={"Shift 2"}>Shift 2</option>
                    <option value={"Shift 3"}>Shift 3</option>
                  </Form.Select>
                </div>
                <div className="col-sm">
                  <span>Select Warehouse</span>
                  <Form.Select
                    required
                    value={selectedWarehouse}
                    onChange={(e) => {
                      fetchStockRaw(e.target.value);
                      setSelectedWarehouse(e.target.value);
                    }}
                  >
                    <option disabled value="">
                      Select Warehouse
                    </option>
                    {fetchWarehouse.map((data) => (
                      <option id={data.warehouse_id} value={data.warehouse_id}>
                        {data.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-sm"></div>
              </div>

              <div className="row">
                <div className="col-sm mb-2">
                  <span>Product Description</span>
                  <input
                    type="text"
                    name=""
                    id=""
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                    className="form-control"
                    placeholder="Enter Description"
                  />
                </div>
              </div>

              <div className="row mt-4">
                <div className="col-sm mb-2">
                  <div className="table-responsive">
                    <table className="w-100 custom-datatable">
                      <thead className="bg-light-custom thead-custom">
                        <tr>
                          <th className="p-2">Raw Materials</th>
                          <th className="p-2">UOM</th>
                          <th className="p-2">Current Stock</th>
                          <th className="p-2">Weight In</th>
                          <th className="p-2">Costing</th>
                          <th className=""></th>
                        </tr>
                      </thead>
                      <tbody>
                        {raws.map((data, index) => (
                          <tr
                            className="custom-tr"
                            key={`${data.stock_id}-${index}`}
                          >
                            <td className="custom-td">
                              <select
                                required
                                onChange={(e) => {
                                  const selected = e.target.value;

                                  const isExist = raws.some(
                                    (mother) =>
                                      String(mother.stock_id) ===
                                      String(selected)
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
                                    const selectedProduct =
                                      stock_raw_products.find(
                                        (product) =>
                                          String(product.product_id) ===
                                          String(selected)
                                      );

                                    if (selectedProduct) {
                                      console.log(
                                        "Selected Product:",
                                        selectedProduct
                                      ); // Debugging

                                      setRaws((prevRaws) =>
                                        prevRaws.map((item, i) =>
                                          i === index
                                            ? {
                                                ...item,
                                                stock_id:
                                                  selectedProduct.product_id,
                                                prod_id:
                                                  selectedProduct.product_id,
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
                                                  selectedProduct.totalStock ||
                                                  0,
                                                prod_price:
                                                  selectedProduct.averagePrice ||
                                                  0,
                                                weightIn: "", // Reset on selection
                                                cost: "", // Reset on selection
                                              }
                                            : item
                                        )
                                      );
                                    }
                                  }
                                }}
                                value={data.stock_id}
                                className="form-select form-select-sm custom-select p-2"
                              >
                                <option value="" disabled>
                                  Select Raw Product
                                </option>
                                {filteredRawProductOptions(index).map(
                                  (stock) => (
                                    <option
                                      key={stock.stock_management_id}
                                      value={stock.product_id}
                                    >
                                      {stock.product_list?.product_name ||
                                        "Unnamed Product"}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>
                            <td className="custom-td">
                              <input
                                type="text"
                                value={data.prod_uom}
                                // onChange={(e) =>
                                //   handleInputChange("costing", e.target.value)
                                // }
                                readOnly
                                className="form-control form-control-sm custom-input p-2"
                              />
                            </td>

                            <td className="custom-td">
                              <input
                                type="text"
                                value={data.current_stock.toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                                readOnly
                                className="form-control form-control-sm custom-input p-2"
                              />
                            </td>
                            <td className="custom-td">
                              <input
                                required
                                type="text"
                                value={data.weightIn}
                                onInput={onInputFloat}
                                onChange={(e) => {
                                  const newWeight =
                                    parseFloat(e.target.value) || 0;

                                  let inputValue = String(
                                    e.target.value
                                  ).replace(/[^0-9.]/g, "");

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

                                  let finishRawsWeight =
                                    newWeight / finishedProductRows.length;

                                  let finishInputValue = String(
                                    finishRawsWeight
                                  ).replace(/[^0-9.]/g, "");

                                  let [integerPartFinish, decimalPartFinish] =
                                    finishInputValue.split(".");

                                  if (integerPartFinish) {
                                    integerPartFinish =
                                      integerPartFinish.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                      );
                                  }

                                  let formattedValueFinish =
                                    decimalPartFinish !== undefined
                                      ? `${integerPartFinish}.${decimalPartFinish}`
                                      : integerPartFinish;

                                  if (
                                    newWeight <= parseFloat(data.current_stock)
                                  ) {
                                    setRaws((prevRaws) =>
                                      prevRaws.map((item) =>
                                        item.stock_id === data.stock_id
                                          ? {
                                              ...item,
                                              weightIn: formattedValue,
                                              cost:
                                                newWeight *
                                                parseFloat(data.prod_price), // Ensure cost is updated
                                            }
                                          : item
                                      )
                                    );

                                    setFinishedProductRows((prevRows) =>
                                      prevRows.map((finishedRow) => {
                                        const updatedRawUsed =
                                          finishedRow.raw_used.map((raw) =>
                                            raw.raw_product_id == data.stock_id
                                              ? {
                                                  ...raw,
                                                  weightIn:
                                                    formattedValueFinish,
                                                  newWeight:
                                                    formattedValueFinish,
                                                  costing:
                                                    newWeight *
                                                    parseFloat(data.prod_price),
                                                }
                                              : raw
                                          );

                                        const totalNewWeight =
                                          updatedRawUsed.reduce(
                                            (sum, raw) =>
                                              sum +
                                              (parseFloat(
                                                String(raw.newWeight).replace(
                                                  /,/g,
                                                  ""
                                                )
                                              ) || 0),
                                            0
                                          );

                                        return {
                                          ...finishedRow,
                                          raw_used: updatedRawUsed,
                                          produce: totalNewWeight,
                                        };
                                      })
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
                              />
                            </td>

                            <td className="custom-td">
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
                                className="form-control form-control-sm custom-input p-2"
                                style={{
                                  width: `${Math.max(
                                    80,
                                    data.cost.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }).length * 10
                                  )}px`,
                                }}
                              />
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteItemRaw(index)}
                                disabled={raws.length === 1}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="w-100 d-flex justify-content-end mt-2 p-1">
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      onClick={addNewItemRaw}
                    >
                      New Item
                    </button>
                  </div>
                </div>
                <div className="col-sm mb-2">
                  <div className="table-responsive">
                    <table className="w-100 custom-datatable2">
                      <thead className="bg-light-custom thead-custom">
                        <tr className="custom-tr">
                          <th className="custom-th p-2">Finished Product</th>
                          <th className="custom-th p-2"></th>
                          <th className="custom-th p-2">Produce</th>
                          <th className="custom-th p-2">UOM</th>
                          <th className="custom-th p-2"></th>
                          <th className="custom-th p-2"></th>
                        </tr>
                      </thead>
                      <tbody className="custom-tbody">
                        {finishedProductRows.map((data, index) => (
                          <React.Fragment key={index}>
                            <>
                              <tr className="custom-tr">
                                <td className="custom-td" colSpan="2">
                                  <Form.Select
                                    value={data.prod_id}
                                    className="form-select form-select-sm custom-select p-2"
                                    required
                                    onChange={(e) => {
                                      const selected = e.target.value;

                                      const isExist = finishedProductRows.find(
                                        (mother) =>
                                          String(mother.prod_id) ===
                                          String(selected)
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
                                              String(product.product_id) ===
                                              String(selected)
                                          );

                                        if (selectedProduct) {
                                          setFinishedProductRows(
                                            (prevProductFetch) => {
                                              const updatedFetch =
                                                prevProductFetch.map(
                                                  (item, i) =>
                                                    // item.prod_id === data.prod_id
                                                    i === index
                                                      ? {
                                                          ...item,
                                                          prod_id:
                                                            selectedProduct.product_id,
                                                          prod_code:
                                                            selectedProduct.product_code,
                                                          prod_name:
                                                            selectedProduct.product_name,
                                                          prod_uom:
                                                            selectedProduct.unit_of_measure,
                                                          produce: item.produce,
                                                        }
                                                      : item
                                                );
                                              return updatedFetch;
                                            }
                                          );
                                        }
                                      }
                                    }}
                                  >
                                    <option value="" disabled selected>
                                      Select Finished Product
                                    </option>
                                    {filteredFinishedProductOptions(index).map(
                                      (finish_prod) => (
                                        <option
                                          key={finish_prod.product_id}
                                          value={finish_prod.product_id}
                                        >
                                          {finish_prod.product_name}
                                        </option>
                                      )
                                    )}
                                  </Form.Select>
                                </td>
                                <td className="custom-td">
                                  <Form.Control
                                    type="text"
                                    required
                                    value={data.produce.toLocaleString(
                                      "en-US",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                    onChange={(e) => {
                                      let inputValue = String(
                                        e.target.value
                                      ).replace(/[^0-9.]/g, "");

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

                                      setFinishedProductRows((prevRows) =>
                                        prevRows.map((product) =>
                                          product.prod_id == data.prod_id
                                            ? {
                                                ...product,
                                                produce: formattedValue,
                                              }
                                            : product
                                        )
                                      );
                                    }}
                                    className="form-control form-control-sm custom-input p-2"
                                  />
                                </td>
                                <td className="custom-td">
                                  <input
                                    type="text"
                                    value={data.prod_uom}
                                    readOnly
                                    className="form-control form-control-sm custom-input p-2"
                                  />
                                </td>
                                <td>
                                  {finishedProductRows.length > 1 && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() =>
                                        deleteFinishedProduct(index)
                                      }
                                    >
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  )}
                                </td>
                              </tr>

                              {/* Finished product raw materials */}
                              {data.raw_used.map((raw_used, rawIndex) => (
                                <tr key={rawIndex}>
                                  <td>
                                    <Form.Select
                                      value={raw_used.raw_stock_id}
                                      required
                                      // onChange={(e) =>
                                      //   handleRawProductChange( //dito nag start ang raw  stock
                                      //     index,
                                      //     rawIndex,
                                      //     e.target.value
                                      //   )
                                      // }
                                      onChange={(e) => {
                                        const selectedOption =
                                          e.target.selectedOptions[0];
                                        const paramsProductId =
                                          selectedOption.getAttribute(
                                            "params_product_id"
                                          );

                                        handleRawProductChange(
                                          index,
                                          rawIndex,
                                          e.target.value,
                                          paramsProductId, // Pass as fourth parameter,
                                          raw_used.prod_name
                                        );
                                      }}
                                      className="form-select form-select-sm custom-select p-2"
                                    >
                                      <option value="" disabled selected>
                                        Select Raw
                                      </option>
                                      {(() => {
                                        const stockId = data.raw_used
                                          .filter((_, i) => i !== rawIndex)
                                          .map((item) => item.raw_stock_id);

                                        return validRawMaterials.filter(
                                          (item) => {
                                            return !stockId.includes(
                                              item.stock_id.toString()
                                            );
                                          }
                                        );
                                      })().map((raw) => (
                                        <option
                                          key={raw.stock_id}
                                          value={raw.stock_id}
                                          params_product_id={raw.prod_id}
                                        >
                                          {raw.prod_name}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={raw_used.weightIn.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                      required
                                      placeholder="QTY use"
                                      onChange={(e) =>
                                        handleRawProductInputChange(
                                          index,
                                          rawIndex,
                                          "weightIn",
                                          e.target.value
                                        )
                                      }
                                      className="form-control form-control-sm custom-input p-2"
                                    />
                                  </td>
                                  <td className="custom-td">
                                    <Form.Control
                                      type="text"
                                      placeholder="Net Weight"
                                      value={raw_used.newWeight.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                      required
                                      onChange={(e) =>
                                        handleRawProductInputChange(
                                          index,
                                          rawIndex,
                                          "newWeight",
                                          e.target.value
                                        )
                                      }
                                      className="form-control form-control-sm custom-input p-2"
                                    />
                                  </td>
                                  <td className="custom-td">
                                    <input
                                      type="text"
                                      placeholder="Costing"
                                      value={raw_used.costing.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                      readOnly
                                      className="form-control form-control-sm custom-input p-2"
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() =>
                                        deleteRawUsed(index, rawIndex)
                                      }
                                      disabled={data.raw_used.length === 1}
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </>

                            <tr className="border-bottom">
                              <td colSpan="5">
                                <div className="w-100 d-flex justify-content-end mt-2 p-1">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    type="button"
                                    onClick={() => addNewItemRawFinish(index)}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="w-100 d-flex justify-content-end mt-2 p-1">
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      onClick={addNewItemFinishProduct}
                    >
                      New Item
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-100 d-flex justify-content-end my-5 p-1">
              <button className="btn btn-success btn-sm" type="submit">
                Save Production
              </button>
            </div>
          </Form>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default ProductionsForm;
