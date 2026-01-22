import React, { useState, useEffect } from "react";
import { FloatingLabel, Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import Select from "react-select";
import { useDateValidation } from "../../../hooks/customHook/useDateValidation";
function OldProductionUpdate({ authrztn }) {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [dateProduce, setDateProduce] = useState("");
  const { dateValidation } = useDateValidation();

  const [rawMaterials, setRawMaterials] = useState([]);
  const [validated, setValidated] = useState(false);
  const [finishProducts, setFinishProducts] = useState([]);

  const [production, setProduction] = useState([]);
  const [productionId, setProductionId] = useState("");
  const [description, setDescription] = useState("");
  const [wareHouseID, setWareHouseID] = useState("");
  const [shift, setShift] = useState("");
  const [status, setStatus] = useState("");

  const [trigger, setTrigger] = useState(0);

  const [edit, setEdit] = useState(false);

  //States PRoduction
  const [stock_raw_products, setStock_raw_products] = useState([]); // stocks management table fetch
  const [stock_finish_products, setStock_finish_products] = useState([]); // product table fetch

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

  const [materialToDelete, setMaterialToDelete] = useState([]);

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
        newItem: true,
      },
    ]);
  };

  console.log(materialToDelete, "material to delete");

  const addNewItemFinishProduct = () => {
    setFinishedProductRows((prev) => [
      ...prev,
      {
        newItem: true,
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
          },
        ],
      },
    ]);
  };

  const recalculateProduce = () => {
    // Recalculate and update the 'produce' value for each finished product row
    setFinishedProductRows((prev) => {
      const updated = prev.map((item) => {
        // Sum up all 'newWeight' values from raw materials
        const netWeightSum = item.raw_used.reduce((acc, rawProduct) => {
          return acc + rawProduct.newWeight;
        }, 0);

        // Update the 'produce' field with the calculated total
        return {
          ...item,
          produce: netWeightSum,
        };
      });

      return updated;
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

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const deleteItemRaw = (indexToDelete, data) => {
    // setTrigger(trigger + 1);
    setRaws((prevRaws) =>
      prevRaws.filter((_, index) => index !== indexToDelete)
    );

    setFinishedProductRows((prev) => {
      const updated = prev.map((item) => {
        const [productToRemove] = item.raw_used.filter(
          (rawProduct) => rawProduct.raw_product_id === data.prod_id
        );

        return {
          ...item,
          produce: item.produce - (productToRemove?.weightIn || 0),
          raw_used: item.raw_used.filter(
            (rawProduct) =>
              rawProduct.raw_product_id !== productToRemove?.raw_product_id
          ),
        };
      });

      return updated;
    });

    recalculateProduce();

    if (!data.newItem) {
      setMaterialToDelete((prev) => [...prev, data]);
    }
  };

  console.log(finishedProductRows, "finished======");

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

      const otherExistingRawUsed = prevProductFetch.find((finished) => {
        return finished.raw_used.some((rawProduct) => {
          return rawProduct.raw_product_id === paramsProductId;
        });
      });

      const updatedRows = prevProductFetch.map((product, i) => {
        if (i !== productIndex) return product;

        const distributedWeight = !otherExistingRawUsed
          ? selectedWeightIn
          : selectedWeightIn / prevProductFetch.length || 1;

        const updatedRawUsed = product.raw_used.map((raw, j) =>
          j === rawIndex
            ? {
                ...raw,
                raw_stock_id: newRawStockId,
                raw_product_id: paramsProductId,
                prod_name: prod_name,
                weightIn: distributedWeight,
                newWeight: distributedWeight,
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

        return prevRows.map((product) => {
          return {
            ...product,
            raw_used: product.raw_used
              // .filter(
              //   (item) =>
              //     !materialToDelete
              //       .filter(
              //         (item) =>
              //           !raws.map((raw) => raw.prod_id).includes(item.prod_id)
              //       ) // Filter out materials that still exist in 'raws' — keep only those that should be deleted
              //       .map((rawProduct) => rawProduct.prod_id)
              //       .includes(item.raw_product_id)
              // )
              .map((raw) => {
                const selectedRaw = raws.find(
                  (rawItem) => rawItem.stock_id == raw.raw_stock_id
                );

                const selectedWeightIn = selectedRaw
                  ? parseFloat(
                      String(selectedRaw.weightIn).replace(/,/g, "")
                    ) || 0
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
          };
        });
      });

      recalculateProduce();
    }
  }, [trigger]); // trigger state kasi di pwede finishProductionRows ilalagay mag infinite loop

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

      console.log("Current Raw", currentRawUsed);

      const selectedProduct = formatRaws.find(
        (product) =>
          String(currentRawUsed.raw_stock_id) === String(product.stock_id)
      );

      if (!selectedProduct) return prevRows;

      const calculateTotalRawMaterialUsage = (rawMaterialId, updatedRows) => {
        const combinedRows = finishedProductRows.map((product) => {
          const updatedProduct = updatedRows.find(
            (updated) => updated.prod_id === product.prod_id
          );
          return updatedProduct || product;
        });

        return combinedRows.reduce((total, product) => {
          const usedAmount = product.raw_used.reduce((subTotal, raw) => {
            if (String(raw.raw_stock_id) === String(rawMaterialId)) {
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
        currentRawUsed.raw_stock_id,
        newRows
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
        if (totalUsedAfter > selectedProduct.weightIn) {
          swal({
            title: "Oppss!",
            text: `Weight cannot exceed total available raw material: ${formattedWeightIn}`,
            icon: "error",
            buttons: false,
            timer: 2000,
          });
          currentRawUsed[field] = formattedWeightIn;
          return prevRows;
        }

        currentRawUsed[field] = formattedVal;
        currentRawUsed.costing = numericVal * selectedProduct.prod_price;
        currentRawUsed.newWeight = "";
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

            //commented dapat d mag calculate pag netweight, dapat sa weight in lang
            // currentRawUsed.costing = 0;
            // newRows[finishedProductIndex].produce = calculateTotalProduce(
            //   newRows[finishedProductIndex].raw_used
            // );
            return newRows;
          }
          //commented dapat d mag calculate pag netweight, dapat sa weight in lang
          // currentRawUsed.costing = numericVal * selectedProduct.prod_price;
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
          //commented dapat d mag calculate pag netweight, dapat sa weight in lang
          // currentRawUsed.costing = numericVal * selectedProduct.prod_price;
        }
        // commented since may auto calculation na sila ng LLoss tru produce and gagamit lang to if gusto nila customize ang net weight pero just information nlng wala na calculation
        // Update the produce value based on total net weights
        // newRows[finishedProductIndex].produce = calculateTotalProduce(
        //   newRows[finishedProductIndex].raw_used
        // );
      }

      return newRows;
    });
  };

  const calculateTotalProduce = (rawUsedArray) => {
    return rawUsedArray.reduce((total, raw) => {
      return total + (parseFloat(String(raw.newWeight).replace(/,/g, "")) || 0);
    }, 0);
  };

  const deleteRawUsed = (finishedProductIndex, rawUsedIndex) => {
    setTrigger(trigger + 1);
    // setFinishedProductRows((prevRows) => {
    //   const newRows = [...prevRows];
    //   const rawUsed = newRows[finishedProductIndex].raw_used;

    //   // Only delete if there's more than one item
    //   if (rawUsed.length > 1) {
    //     rawUsed.splice(rawUsedIndex, 1);
    //     // Recalculate produce after deletion
    //     newRows[finishedProductIndex].produce = calculateTotalProduce(rawUsed);
    //   }

    //   return newRows;
    // });
    setFinishedProductRows((prevRows) => {
      const updated = prevRows.map((item, i) => {
        if (i !== finishedProductIndex) return item;

        // Exclude Raw Used Selected Index
        const filteredRawUsed = item.raw_used?.filter((rawProduct, index) => {
          return index !== rawUsedIndex;
        });

        return {
          ...item,
          produce: calculateTotalProduce(filteredRawUsed),
          raw_used: filteredRawUsed,
        };
      });

      // Return updated Finished Product
      return updated;
    });
  };

  const fetchStockRaw = (warehouse_id) => {
    axios
      .get(BASE_URL + "/production/getRawProd", {
        params: {
          selectedWarehouse: warehouse_id,
          usage: "For Production Details",
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
                    newItem: true,
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

  const validRawMaterials = raws.filter((raw) => raw.stock_id && raw.prod_name);

  const fetchInventoryCounting = () => {
    axios
      .get(`${BASE_URL}/production/getProductionDetails/${id}`)
      .then((res) => {
        setProduction(res.data);
        setProductionId(res.data.production_id);
        setDescription(res.data.desc || "");
        setDateProduce(res.data.date_produce);
        setShift(res.data.shift);
        setWareHouseID(res.data.warehouse_id);
        fetchStockRaw(res.data.warehouse_id);
        setStatus(res.data.status);
        fetchRawMaterials(res.data.warehouse_id);
        console.log(res.data);
      })
      .catch((error) => {
        console.error("Error fetching production details: ", error);
      });
  };

  useEffect(() => {
    fetchInventoryCounting();
  }, [id]);

  const handleUpdateProduction = async (e) => {
    try {
      e.preventDefault();
      const form = e.currentTarget;

      const modifiedFinishedProductRows = finishedProductRows.map((item) => ({
        ...item,
        produce: parseFloat(String(item.produce).replace(/,/g, "")),
        raw_used: item.raw_used.map((raw) => ({
          ...raw,
          weightIn: parseFloat(String(raw.weightIn).replace(/,/g, "")),
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
          Object.keys(finalTotals).length && // Ensure both objects have the same number of keys
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
            timer: 2000,
            dangerMode: true,
          });

          return;
        }

        console.log(finishedProductRows, "finish product");
        console.log(raws);

        console.log(raws.filter((item) => item.newItem === true));

        swal({
          title: "Update this production?",
          text: "",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        })
          .then(async (confirmed) => {
            if (confirmed) {
              const res = await axios.put(
                `${BASE_URL}/production/updateProduction`,
                {
                  raws: formatRaws,
                  finishedProductRows: modifiedFinishedProductRows,
                  productionId,
                  description,
                  dateProduce,
                  wareHouseID,
                  shift,
                  userLoggedID,
                  id,
                  materialToDelete,
                }
              );

              if (res.status == 200) {
                swal({
                  title: "Success",
                  text: "Production updated successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("../inventory/productions");
                });
              }
            }
          })
          .catch((error) => {
            if (error.response && error.response.status === 409) {
              swal({
                icon: "error",
                title: "Oppss!",
                text: error.response.data.message,
                timer: 2000,
                buttons: false,
              });
              return;
            }
          });
      }
      setValidated(true);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRawMaterials = async (wareHouseID) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/production/getProductionRawUsed/${id}`,
        {
          params: {
            warehouse_id: wareHouseID,
          },
        }
      );
      console.log(wareHouseID);
      console.log("cost", response.data);

      // // Process and merge duplicate product IDs while calculating average price
      // const mergedRaws = response.data.reduce((acc, raw) => {
      //   const productId = raw.product_id || "";

      //   if (!productId) return acc;

      //   const existing = acc.find((item) => item.prod_id === productId);

      //   if (existing) {
      //     existing.current_stock += raw.stock_management.stock || 0;
      //     existing.total_price += raw.stock_management.price || 0;
      //     existing.occurrences += 1;
      //     existing.prod_price = existing.total_price / existing.occurrences;
      //     existing.cost = existing.prod_price * existing.weightIn;
      //   } else {
      //     const weightIn = raw.weight_in || 0;
      //     const prodPrice = raw.stock_management.price || 0;
      //     const currentStock = raw.stock_management.stock || 0;
      //     const totalPrice = prodPrice;
      //     const avgPrice = totalPrice || 0; // Avoid division by zero

      //     acc.push({
      //       stock_id: productId || "",
      //       prod_id: productId,
      //       prod_code: raw.stock_management.product_list?.product_code || "",
      //       prod_name: raw.stock_management.product_list?.product_name || "",
      //       prod_uom:
      //         raw.stock_management.product_list?.unit_of_measure || "",
      //       current_stock: currentStock,
      //       total_price: totalPrice,
      //       prod_price: avgPrice,
      //       occurrences: 1,
      //       weightIn: weightIn,
      //       cost: avgPrice * weightIn,
      //     });
      //   }

      //   return acc;
      // }, []);

      // const formattedData = response.data.map((item) => ({
      //   stock_id: item.product_id,
      //   prod_id: item.product_id,
      //   prod_code: item.product_list?.product_code || "",
      //   prod_name: item.stock_management.product_list?.product_name || "",
      //   prod_uom: item.stock_management.product_list?.unit_of_measure || "",
      //   current_stock: item.total_stock || 0,
      //   prod_price: item.production_price || 0,
      //   weightIn: item.weight_in || 0,
      //   cost: item.stock_management?.price * item.weight_in || 0,
      // }));

      const productMap = new Map();

      response.data.forEach((item) => {
        const productId = item.product_id;
        const weightIn = item.weight_in || 0;
        const price = item.stock_management?.price || 0;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            stock_id: item.product_id,
            prod_id: item.product_id,
            prod_code: item.product_list?.product_code || "",
            prod_name: item.stock_management?.product_list?.product_name || "",
            prod_uom:
              item.stock_management?.product_list?.unit_of_measure || "",
            // current_stock: item.total_stock + weightIn || 0,
            current_stock:
              item.total_stock +
              (item.production.status === "Rejected" ? 0 : weightIn || 0),
            prod_price: item.production_price || 0,
            production_id: item.production_id,
            weightIn: weightIn,
            // cost: price * weightIn,
            cost: 0,
            priceSum: price,
            itemCount: 1,
          });
        } else {
          const existing = productMap.get(productId);
          existing.weightIn += weightIn;
          // existing.cost += price * weightIn;
          existing.priceSum += price;
          existing.itemCount += 1;
          existing.current_stock += weightIn;
          productMap.set(productId, existing);
        }
      });

      const mergedData = Array.from(productMap.values());

      for (const [productId, product] of productMap.entries()) {
        product.cost = product.prod_price * product.weightIn;
        console.log(product, "product=====");

        productMap.set(productId, product);
      }

      setRaws(mergedData);

      fetchProductionFinishProduct(mergedData);

      // setRaws(formattedData);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  console.log(raws, "raws");

  useEffect(() => {
    // fetchRawMaterials();
  }, [id]);

  useEffect(() => {
    fetchStockFinish();
  }, []);

  const fetchProductionFinishProduct = async (raws) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/production/getProductionFinishProduct/${id}`
      );
      const formattedProducts = response.data.map((product) => {
        return {
          prod_finish_raw_id: product.id,
          prod_id: product.product_id || "",
          prod_code: product.product_list?.product_code || "",
          product_name: product.product_list?.product_name || "",
          prod_uom: product.product_list?.unit_of_measure || "",
          produce: product.produce || 0,
          raw_used:
            product.production_finish_raw_useds?.map((raw) => {
              // Find corresponding product in `raws` state
              const matchingRaw = raws.find(
                (r) => r.prod_id === raw.production_raw_used.product_id
              );

              console.log("Matching", matchingRaw);
              console.log("Names");

              const avgPrice = matchingRaw ? matchingRaw.prod_price : 0;

              return {
                prod_finish_raw_id: raw.id,
                prod_name:
                  raw.production_raw_used.product_list.product_name || "",
                raw_stock_id: raw.production_raw_used.product_id || "",
                raw_product_id:
                  String(raw.production_raw_used.product_id) || "",
                weightIn: raw.weight_in || 0,
                newWeight: raw.net_weight || 0,
                avgPrice: avgPrice,
                costing: avgPrice * (raw.net_weight || 0),
              };
            }) || [],
        };
      });

      console.log(formattedProducts);
      setFinishedProductRows(formattedProducts);
      // setFinishProducts(response.data);
    } catch (error) {
      console.error("Error production finish product:", error);
    }
  };

  useEffect(() => {
    fetchProductionFinishProduct();
  }, []);

  const handleReject = async (event) => {
    event.preventDefault();
    try {
      swal({
        title: "Reject this production?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (confirmed) => {
        if (confirmed) {
          const response = await axios.put(
            `${BASE_URL}/production/rejectProduction/${id}`,
            {
              raws,
              finishedProductRows,
              wareHouseID,
              transactionId: productionId,
            }
          );

          if (response.status == 200) {
            swal({
              title: "Success",
              text: "Production rejected successfully",
              icon: "success",
              buttons: false,
              timer: 2000,
              dangerMode: true,
            }).then(() => {
              navigate("../inventory/productions");
            });
          }
        } else {
          swal.close();
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleApprove = async (event) => {
    event.preventDefault();
    try {
      swal({
        title: "Approve this production?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (confirmed) => {
        if (confirmed) {
          const response = await axios.put(
            `${BASE_URL}/production/approveProduction/${id}`,
            {
              raws,
              finishedProductRows,
              wareHouseID,
            }
          );

          if (response.status == 200) {
            swal({
              title: "Success",
              text: "Production rejected successfully",
              icon: "success",
              buttons: false,
              timer: 2000,
              dangerMode: true,
            }).then(() => {
              navigate("../inventory/productions");
            });
          }
        } else {
          swal.close();
        }
      });
    } catch (error) {
      console.error(error);
    }
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
      disabled={!edit}
      required
    />
  ));

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Productions-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">
                <Link to="/inventory/productions" className="text-dark me-2">
                  <i class="fa-solid fa-arrow-left"></i>
                </Link>
                PRODUCTION DETAILS
              </span>
            </div>
          </div>
          <Form
            noValidate
            validated={validated}
            onSubmit={handleUpdateProduction}
          >
            <div className="container-fluid mt-3">
              <div className="row">
                <div className="col-sm mb-2">
                  <span>Production ID</span>
                  <input
                    type="text"
                    name=""
                    value={productionId}
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="col-sm mb-2">
                  <span>Product Description</span>
                  <input
                    type="text"
                    name=""
                    value={description}
                    disabled={!edit}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-control"
                    placeholder="Enter Description"
                  />
                </div>
                <div className="col-sm"></div>
              </div>
              <div className="row">
                <div className="col-sm mb-2">
                  <span>Date Produce</span>
                  {/* <input
                    type="date"
                    name=""
                    value={dateProduce}
                    disabled={!edit}
                    onChange={(e) => setDateProduce(e.target.value)}
                    required
                    className="form-control"
                  /> */}
                  <div className="position-relative">
                    <DatePicker
                      selected={dateProduce}
                      onChange={(date) => {
                        setDateProduce(date);
                        dateValidation(date, setDateProduce, "Date Produce");
                      }}
                      dateFormat="MMM/dd/yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput />}
                    />
                    <i
                      class="fa-solid fa-calendar-week calendar-position"
                      style={{
                        right: `${validated ? "2rem" : "1rem"}`,
                        top: "0.8rem",
                      }}
                    ></i>
                  </div>
                </div>
                <div className="col-sm mb-2">
                  <span>Shift Schedule</span>
                  <Form.Select
                    required
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    disabled={!edit}
                  >
                    <option selected disabled value="">
                      Select Shift
                    </option>
                    <option value={"Shift 1"}>Shift 1</option>
                    <option value={"Shift 2"}>Shift 2</option>
                    <option value={"Shift 3"}>Shift 3</option>
                  </Form.Select>
                </div>
                <div className="col-sm"></div>
              </div>
            </div>

            <div className="row mx-0 mt-4">
              <div className="col-sm mb-2">
                <div className="table-responsive">
                  <table className="w-100 custom-datatable">
                    <thead className="bg-light-custom thead-custom">
                      <tr>
                        <th className="p-2">Materials</th>
                        <th className="p-2">UOM</th>
                        <th className="p-2">Current Stock</th>
                        <th className="p-2">Weight In</th>
                        <th className="p-2">Costing</th>
                        <th className=""></th>
                      </tr>
                    </thead>
                    <tbody>
                      {raws.map((data, index) => {
                        const rawProductOptions = filteredRawProductOptions(
                          index
                        ).map((item) => ({
                          value: item.product_id,
                          label:
                            item.product_list?.product_name ||
                            "Unnamed Product",
                        }));
                        return (
                          <tr
                            className="custom-tr"
                            key={`${data.stock_id}-${index}`}
                          >
                            <td className="custom-td">
                              {/* <div className="position-relative">
                              <select
                                required
                                disabled={!edit}
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
                                                newItem: true,
                                              }
                                            : item
                                        )
                                      );
                                    }
                                  }
                                }}
                                value={data.stock_id}
                                className="form-select form-select-sm custom-select no-validation-icon text-truncate py-2 pe-4"
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
                              <i
                                className={`fa-solid fa-angle-down ${
                                  !edit && "d-none"
                                }`}
                                style={{
                                  position: "absolute",
                                  top: "0.9rem",
                                  right: "0.8rem",
                                  fontSize: "0.8rem",
                                }}
                              ></i>
                            </div> */}
                              <Select
                                options={rawProductOptions}
                                value={rawProductOptions.find(
                                  (item) => item?.value === data.stock_id
                                )}
                                onChange={(selectedOption) => {
                                  const selected = selectedOption?.value;

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

                                      const deletedProduct =
                                        materialToDelete.find(
                                          (item) =>
                                            item.prod_id ===
                                            selectedProduct.product_id
                                        );

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
                                                  (selectedProduct.totalStock ||
                                                    0) +
                                                  (deletedProduct?.weightIn ||
                                                    0),
                                                prod_price:
                                                  selectedProduct.averagePrice ||
                                                  0,
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
                                styles={selectCustomStyles(
                                  data.stock_id,
                                  validated
                                )}
                                isDisabled={!edit}
                                isSearchable
                                required
                              />
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
                                disabled={!edit}
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

                                  const rawUsed = finishedProductRows.filter(
                                    (item) =>
                                      item.raw_used
                                        .map(
                                          (rawProduct) =>
                                            rawProduct.raw_product_id
                                        )
                                        .includes(data.prod_id)
                                  );

                                  let formattedValue =
                                    decimalPart !== undefined
                                      ? `${integerPart}.${decimalPart}`
                                      : integerPart;

                                  let finishRawsWeight =
                                    newWeight / rawUsed?.length;

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
                                                    (newWeight /
                                                      rawUsed?.length) *
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
                              />
                            </td>
                            <td className="text-center">
                              {edit ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => deleteItemRaw(index, data)}
                                    disabled={raws.length === 1}
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </>
                              ) : null}
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
                      {finishedProductRows.map((data, index) => {
                        const finishedProductOptions =
                          filteredFinishedProductOptions(index).map((item) => ({
                            value: item.product_id,
                            label: item.product_name,
                          }));

                        return (
                          <React.Fragment key={index}>
                            <>
                              <tr className="custom-tr">
                                <td className="custom-td" colSpan="2">
                                  <Select
                                    options={finishedProductOptions}
                                    value={finishedProductOptions.find(
                                      (item) => item?.value === data.prod_id
                                    )}
                                    onChange={(selectedOption) => {
                                      const selected = selectedOption?.value;

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
                                    menuPortalTarget={document.body}
                                    placeholder={`Select Finished Product`}
                                    styles={selectCustomStyles(
                                      data.prod_id,
                                      validated
                                    )}
                                    isSearchable
                                    isDisabled={!edit}
                                    required
                                  />
                                </td>
                                <td className="custom-td">
                                  <Form.Control
                                    type="text"
                                    required
                                    disabled={!edit}
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
                                      // console.log(inputValue, "input value");

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
                                        parseFloat(
                                          formattedValue.replace(/,/g, "")
                                        ) || 0;
                                      setFinishedProductRows((prevRows) =>
                                        prevRows.map((product) =>
                                          product.prod_id == data.prod_id
                                            ? {
                                                ...product,
                                                produce: formattedValue,
                                                raw_used: product.raw_used.map(
                                                  (rawItem) => {
                                                    // Get current weights as numbers
                                                    const currentItemWeight =
                                                      parseFloat(
                                                        String(
                                                          rawItem.newWeight
                                                        ).replace(/,/g, "")
                                                      ) || 0;
                                                    const currentProduceValue =
                                                      parseFloat(
                                                        String(
                                                          product.produce
                                                        ).replace(/,/g, "")
                                                      ) || 0;

                                                    // Calculate total weightIn for this product
                                                    const totalWeightIn =
                                                      product.raw_used.reduce(
                                                        (sum, item) => {
                                                          const itemWeightIn =
                                                            parseFloat(
                                                              String(
                                                                item.weightIn
                                                              ).replace(
                                                                /,/g,
                                                                ""
                                                              )
                                                            ) || 0;
                                                          return (
                                                            sum + itemWeightIn
                                                          );
                                                        },
                                                        0
                                                      );

                                                    // Check if produce exceeds total raw materials weight
                                                    if (
                                                      numericValue >
                                                        totalWeightIn &&
                                                      totalWeightIn > 0
                                                    ) {
                                                      // Use original weightIn when produce exceeds total raw materials
                                                      const weightIn =
                                                        parseFloat(
                                                          String(
                                                            rawItem.weightIn
                                                          ).replace(/,/g, "")
                                                        ) || 0;
                                                      return {
                                                        ...rawItem,
                                                        newWeight:
                                                          weightIn.toFixed(2),
                                                      };
                                                    }

                                                    // If current produce value is 0, set weights proportionally to new value
                                                    if (
                                                      currentProduceValue === 0
                                                    ) {
                                                      // If we're going from 0 to some value, distribute based on weightIn or equally
                                                      const weightIn =
                                                        parseFloat(
                                                          String(
                                                            rawItem.weightIn
                                                          ).replace(/,/g, "")
                                                        ) || 0;

                                                      if (totalWeightIn > 0) {
                                                        // Use weightIn proportions
                                                        const proportion =
                                                          weightIn /
                                                          totalWeightIn;
                                                        const newWeight =
                                                          numericValue *
                                                          proportion;
                                                        return {
                                                          ...rawItem,
                                                          newWeight:
                                                            newWeight.toFixed(
                                                              2
                                                            ),
                                                        };
                                                      } else {
                                                        // Distribute equally if no weightIn values
                                                        const equalShare =
                                                          numericValue /
                                                          product.raw_used
                                                            .length;
                                                        return {
                                                          ...rawItem,
                                                          newWeight:
                                                            equalShare.toFixed(
                                                              2
                                                            ),
                                                        };
                                                      }
                                                    }

                                                    // Use weightIn as the base for proportional calculations
                                                    const weightIn =
                                                      parseFloat(
                                                        String(
                                                          rawItem.weightIn
                                                        ).replace(/,/g, "")
                                                      ) || 0;

                                                    // Calculate the ratio based on total weightIn vs numericValue
                                                    const proportion =
                                                      totalWeightIn > 0
                                                        ? weightIn /
                                                          totalWeightIn
                                                        : 1 /
                                                          product.raw_used
                                                            .length;
                                                    const newWeight =
                                                      numericValue * proportion;

                                                    return {
                                                      ...rawItem,
                                                      newWeight:
                                                        newWeight.toFixed(2),
                                                    };
                                                  }
                                                ),
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
                                  {finishedProductRows.length > 1 && edit && (
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
                              {data.raw_used.map((raw_used, rawIndex) => {
                                const rawOptions = (() => {
                                  const stockId = data.raw_used
                                    .filter((_, i) => i !== rawIndex)
                                    .map((item) => item.raw_stock_id);

                                  const filtered = validRawMaterials.filter(
                                    (item) => {
                                      return !stockId.includes(
                                        item.stock_id.toString()
                                      );
                                    }
                                  );

                                  return filtered.map((item) => ({
                                    value: item.stock_id,
                                    label: item.prod_name,
                                    params_product_id: item.prod_id,
                                  }));
                                })();

                                return (
                                  <tr key={rawIndex}>
                                    <td>
                                      <Select
                                        options={rawOptions}
                                        value={rawOptions.find(
                                          (item) =>
                                            item?.value ===
                                            raw_used.raw_stock_id
                                        )}
                                        onChange={(selectedOption) => {
                                          // const selectedOption =
                                          //   e.target.selectedOptions[0];
                                          // const paramsProductId =
                                          //   selectedOption.getAttribute(
                                          //     "params_product_id"
                                          //   );
                                          handleRawProductChange(
                                            index,
                                            rawIndex,
                                            selectedOption?.value,
                                            // paramsProductId // Pass as fourth parameter
                                            selectedOption.params_product_id
                                          );
                                        }}
                                        menuPortalTarget={document.body}
                                        placeholder={`Select Raw`}
                                        styles={selectCustomStyles(
                                          rawOptions.find(
                                            (item) =>
                                              item?.value ===
                                              raw_used.raw_stock_id
                                          ),
                                          validated
                                        )}
                                        isSearchable
                                        isDisabled={!edit}
                                        required
                                      />
                                    </td>
                                    <td>
                                      <FloatingLabel
                                        controlId="floatingInput"
                                        label="Weight In"
                                        className="mb-3"
                                      >
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
                                          disabled={!edit}
                                          onChange={(e) =>
                                            handleRawProductInputChange(
                                              index,
                                              rawIndex,
                                              "weightIn",
                                              e.target.value
                                            )
                                          }
                                          className="form-control form-control-sm custom-input"
                                        />
                                      </FloatingLabel>
                                    </td>
                                    <td className="custom-td">
                                      <FloatingLabel
                                        controlId="floatingInput"
                                        label="Net Weight"
                                        className="mb-3"
                                      >
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
                                          disabled={!edit}
                                          required
                                          onChange={(e) =>
                                            handleRawProductInputChange(
                                              index,
                                              rawIndex,
                                              "newWeight",
                                              e.target.value
                                            )
                                          }
                                          className="form-control form-control-sm custom-input "
                                        />
                                      </FloatingLabel>
                                    </td>
                                    <td className="custom-td">
                                      <FloatingLabel
                                        controlId="floatingInput"
                                        label="Costing"
                                        className="mb-3"
                                      >
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
                                          className={`form-control form-control-sm custom-input ${
                                            edit ? "bg-white" : ""
                                          }`}
                                        />
                                      </FloatingLabel>
                                    </td>
                                    <td className="text-center">
                                      {edit ? (
                                        <>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() =>
                                              deleteRawUsed(index, rawIndex)
                                            }
                                            disabled={
                                              data.raw_used.length === 1
                                            }
                                          >
                                            <i className="fa-solid fa-trash"></i>
                                          </button>
                                        </>
                                      ) : null}
                                    </td>
                                  </tr>
                                );
                              })}
                            </>

                            <tr className="border-bottom">
                              <td colSpan="5">
                                <div className="w-100 d-flex justify-content-end mt-2 p-1">
                                  {edit ? (
                                    <>
                                      <button
                                        className="btn btn-primary btn-sm"
                                        type="button"
                                        onClick={() =>
                                          addNewItemRawFinish(index)
                                        }
                                      >
                                        +
                                      </button>
                                    </>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
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
              </div>
            </div>

            <div className="w-100 d-flex justify-content-end my-5 p-1">
              {status != "Pending" ? null : (
                <>
                  {!edit ? (
                    <>
                      <div className="w-25 text-end">
                        {authrztn.includes("Productions-Edit") && (
                          <button
                            className="btn btn-primary me-2 w-25"
                            onClick={(e) => {
                              e.preventDefault();
                              setEdit(true);
                            }}
                            // disabled
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn-danger me-2 w-25"
                          onClick={handleReject}
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-success w-25"
                          onClick={handleApprove}
                        >
                          Approve
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-25 text-end">
                        <button
                          className="btn btn-secondary me-2 w-25"
                          onClick={(e) => {
                            e.preventDefault();
                            swal({
                              icon: "warning",
                              title: "Are you sure?",
                              text: "Your changes will not be saved",
                              dangerMode: true,
                              buttons: ["Cancel", "OK"],
                            }).then((confirmed) => {
                              if (confirmed) {
                                fetchInventoryCounting();
                                fetchProductionFinishProduct();
                                setEdit(false);
                                return;
                              }
                            });
                            return;
                          }}
                        >
                          Cancel
                        </button>
                        <button className="btn btn-primary w-25" type="submit">
                          Update
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </Form>

          {/* <div className="row mt-4">
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
                    {rawMaterials.length > 0 ? (
                      rawMaterials.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2">
                            {item.stock_management.product_list.product_name}
                          </td>
                          <td className="p-2">
                            {item.stock_management.product_list.unit_of_measure}
                          </td>
                          <td className="p-2">
                            {item.stock_management.stock.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </td>
                          <td className="p-2">
                            {item.weight_in.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2">{item.costing}</td>
                          <td className="p-2"></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center p-2">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-sm mb-2">
            <div className="table-responsive">
              <table className="w-100 custom-datatable2">
                <thead className="bg-light-custom thead-custom">
                  <tr className="custom-tr">
                    <th className="custom-th p-2">Finished Product</th>
                    <th className="custom-th p-2">Produce</th>
                    <th className="custom-th p-2">UOM</th>
                  </tr>
                </thead>
                <tbody className="custom-tbody">
                  {finishProducts.length > 0 ? (
                    finishProducts.map((item, index) => (
                      <tr key={index}>
                        <td className="p-2">
                          {item.product_list.product_name}
                        </td>
                        <td className="p-2">
                          {item.produce.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-2">
                          {item.product_list.unit_of_measure}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center p-2">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div> */}
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
}

export default OldProductionUpdate;
