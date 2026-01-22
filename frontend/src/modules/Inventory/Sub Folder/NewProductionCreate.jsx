import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import { Form, FloatingLabel } from "react-bootstrap";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import { useDateValidation } from "../../../hooks/customHook/useDateValidation";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { useObserver } from "../../../hooks/customHook/useObserver";
import TotalCard from "./components/TotalCard";
import ProductionMaterialsCreateTable from "./components/ProductionMaterialsCreateTable";
import ProductionFinishedCreateTable from "./components/ProductionFinishedCreateTable";
import ProductionConsumableCreateTable from "./components/ProductionConsumableCreateTable";
const NewProductionCreate = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();

  const defaultDate = new Date();
  const [startDate, setStartDate] = useState(defaultDate);
  const [date, setDate] = useState(defaultDate); // Old date produce state

  const { dateValidation } = useDateValidation();
  const { containerRef, containerItemRefs, visible } = useObserver();

  // State for the first table
  const [validated, setValidated] = useState(false);
  const [production_id, setProduction_id] = useState("");
  const [description, setDescription] = useState("");
  const [machine, setMachine] = useState("");
  const [shift, setShift] = useState("");
  const [fetchWarehouse, setFetchWarehouse] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedConsumable, setSelectedConsumable] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [total, setTotal] = useState("");
  const [consumableMaxQuantity, setConsumableMaxQuantity] = useState(0);

  //States PRoduction
  const [stockConsumableProducts, setStockConsumableProducts] = useState([]);
  const [stock_raw_products, setStock_raw_products] = useState([]); // stocks management table fetch
  const [stock_finish_products, setStock_finish_products] = useState([]); // product table fetch
  const [consumableList, setConsumableList] = useState([]);

  const navigate = useNavigate();

  const [consumablesTotalWeight, setConsumablesTotalWeight] = useState(0);
  const [consumablesTotalCosting, setConsumablesTotalCosting] = useState(0);
  const [materialsTotalWeight, setMaterialsTotalWeight] = useState(0);
  const [materialsTotalCosting, setMaterialsTotalCosting] = useState(0);
  const [finishedTotalWeight, setFinishedTotalWeight] = useState(0);
  const [finishedTotalCosting, setFinishedTotalCosting] = useState(0);
  const [lastFocusedIndex, setLastFocusedIndex] = useState(null); // Last focused input field for produce
  const [lastFocusedIndexUnitPrice, setLastFocusedIndexUnitPrice] =
    useState(null); // Last focused input field for Unit Price

  const [consumables, setConsumables] = useState([
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

  // State for the first table
  const [raws, setRaws] = useState([
    {
      stock_id: "",
      vendor_id: "",
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

  // State for the second table
  const [finishedProductRows, setFinishedProductRows] = useState([
    {
      prod_id: "",
      prod_code: "",
      prod_name: "",
      prod_uom: "",
      produce: 0,
      current_stock: 0,
      costing: 0,
      unit_price: 0,
    },
  ]);

  const shiftWarehouseRef = useRef([]);

  // Fetch vendor with supplier code
  const fetchVendor = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/vendors/supplier-code`);

      const any = {
        label: "Any",
        value: "Any",
      };

      const options = res.data.map((item) => ({
        label: item.supplier_code,
        value: item.vendor_id,
      }));

      setVendorOptions([any, ...options]);
    } catch (error) {
      console.error(error);
    }
  };

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

  const fetchStockConsumables = async (warehouse_id) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/production/consumables/summary`,
        {
          params: {
            selectedWarehouse: warehouse_id,
          },
        }
      );

      if (res.data) {
        setStockConsumableProducts(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStockRaw = (warehouse_id) => {
    axios
      .get(BASE_URL + "/production/getRawProd", {
        params: {
          selectedWarehouse: warehouse_id,
          usage: "For Production Form",
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

  // Get the raw material stock based on specified warehouse and vendor id
  const fetchRawMaterialStock = async (warehouseId, vendorId) => {
    try {
      const res = await axios.get(`${BASE_URL}/production/getRawProd`, {
        params: {
          selectedWarehouse: warehouseId,
          usage: "For Production Form",
          vendorId,
        },
      });

      return res.data;
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStockFinish = (warehouse_id) => {
    axios
      .get(BASE_URL + "/production/getNewFinishProd", {
        params: {
          selectedWarehouse: warehouse_id,
          usage: "For Production Form",
        },
      })
      .then((res) => {
        setStock_finish_products(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchConsumables = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/production/consumables/list`);

      setConsumableList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchConsumableAmounts = async (consumableId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/production/consumables/${consumableId}/summary`
      );

      const { totalStock, averagePrice } = res.data;

      setQuantity(putComma(totalStock || 0));
      setAveragePrice(putComma(averagePrice || 0));
      setTotal(totalStock * averagePrice || 0);

      setConsumableMaxQuantity(totalStock);
    } catch (error) {
      console.error(error);
    }
  };

  const recalculateTotal = (quantity, averagePrice) => {
    setTotal(quantity * averagePrice);
  };

  // Put Comma to numbers
  const putComma = (num) => {
    let [integerPart, decimalPart] = String(num).split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    return formattedValue;
  };

  // Handle Quantity and Unit Price change
  const handleAmountChange = (value, setter) => {
    let inputValue = String(value).replace(/[^0-9.]/g, "");

    const formattedValue = putComma(inputValue);

    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    setter(cleanedValue);
  };

  // Handle supplier code change
  const handleSupplierCodeChange = async (selectedOption, index) => {
    const { prod_id: productId, prod_name: productName } = raws[index];
    const vendorId = selectedOption.value;
    const supplierCode = selectedOption.label;

    // Get the updated stock with the current selected warehouse and vendor
    const stockRawProducts = await fetchRawMaterialStock(
      selectedWarehouse,
      vendorId
    );

    const selectedProduct = stockRawProducts.find(
      (product) => product.product_id === productId
    );

    // Validation: prevent proceeding when the selected product does not exist for the chosen supplier
    if (!selectedProduct && productId) {
      swal({
        icon: "error",
        title: "No Raw Material Found",
        text: `No ${productName} found with supplier code ${supplierCode}`,
      });
      return;
    }

    setStock_raw_products(stockRawProducts); // Set new raw materials product with updated stock

    // Update vendor id, current stock, quantity and unit price for the selected row
    setRaws((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              vendor_id: vendorId,
              current_stock: selectedProduct?.totalStock || "",
              prod_price: selectedProduct?.averagePrice || "",
              weightIn: "",
            }
          : item
      )
    );
  };

  // For react select
  const onMenuOpen = () => {
    if (!shift || !selectedWarehouse) {
      swal({
        icon: "warning",
        title: "Missing Fields",
        text: "Please complete the production details above before selecting raw materials or finished products.",
      }).then(() => {
        shiftWarehouseRef.current[!shift ? 0 : 1].focus();
        shiftWarehouseRef.current[!shift ? 0 : 1].showPicker();
      });
      return;
    }
  };

  const menuIsOpen = !shift || !selectedWarehouse ? false : undefined; // For react select

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const addNewItemConsumable = () => {
    setConsumables((prev) => [
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

  const addNewItemRaw = () => {
    setRaws((prev) => [
      ...prev,
      {
        stock_id: "",
        vendor_id: "",
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

  const deleteItemConsumable = (indexToDelete) => {
    setConsumables((prev) =>
      prev.filter((_, index) => index !== indexToDelete)
    );
  };

  const deleteItemRaw = (indexToDelete) => {
    setRaws((prevRaws) =>
      prevRaws.filter((_, index) => index !== indexToDelete)
    );
  };

  // delete row for finish product
  const deleteFinishedProduct = (indexToDelete) => {
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
        current_stock: 0,
        costing: 0,
        unit_price: 0,
      },
    ]);
  };

  const filteredConsumableOptions = (index) => {
    const prodId = consumables
      .filter((_, i) => i !== index)
      .map((item) => item.prod_id);

    return stockConsumableProducts.filter(
      (item) => !prodId.includes(item.product_id)
    );
  };

  // const filteredRawProductOptions = (index) => {
  //   const prodId = raws
  //     .filter((_, i) => {
  //       return i !== index;
  //     })
  //     .map((item) => item.prod_id);

  //   const finishProdId = finishedProductRows.map((item) => item.prod_id);

  //   const productIdList = [...finishProdId, ...prodId];

  //   return stock_raw_products.filter((item) => {
  //     return !productIdList.includes(item.product_id);
  //   });
  // };

  // const filteredFinishedProductOptions = (index) => {
  //   const prodId = finishedProductRows
  //     .filter((_, i) => {
  //       return i !== index;
  //     })
  //     .map((item) => {
  //       return item.prod_id;
  //     });

  //   const rawsProdId = raws.map((item) => item.prod_id);

  //   const productIdList = [...rawsProdId, ...prodId];

  //   return stock_finish_products.filter((item) => {
  //     return !productIdList.includes(item.product_list.product_id);
  //   });
  // };

  const filteredRawProductOptions = (index) => {
    const prodId = raws
      .filter((_, i) => i !== index)
      .map((item) => item.prod_id);

    // Only filter out products already selected in other rows of Materials
    return stock_raw_products.filter(
      (item) => !prodId.includes(item.product_id)
    );
  };

  const filteredFinishedProductOptions = (index) => {
    const prodId = finishedProductRows
      .filter((_, i) => i !== index)
      .map((item) => item.prod_id);

    // Only filter out products already selected in other rows of Finished Product
    return stock_finish_products.filter(
      (item) => !prodId.includes(item.product_list.product_id)
    );
  };

  // Finished Product Unit Price
  const unitPrice =
    materialsTotalCosting && finishedTotalWeight
      ? parseFloat(
          String(materialsTotalCosting / finishedTotalWeight).replace(/,/g, "")
        ) || 0
      : 0;

  // Handle Create Production
  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const modifiedFinishedProductRows = finishedProductRows.map((item) => ({
      ...item,
      produce: parseFloat(String(item.produce).replace(/,/g, "")),
    }));

    const formatRaws = raws.map((item) => ({
      ...item,
      weightIn: parseFloat(String(item.weightIn).replace(/,/g, "")),
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
      // Check if the selected date falls within the range of any defined cutoff period
      dateValidation(date, setDate, "Start Date");
      dateValidation(date, setDate, "End Date");

      swal({
        title: "Create this new production?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/production/create_production_new`, {
              raws: formatRaws,
              finishedProductRows: modifiedFinishedProductRows,
              production_id,
              description,
              startDate,
              date, // date produce or end date
              shift,
              machine,
              selectedWarehouse,
              userLoggedID,
              consumableId: selectedConsumable,
              quantity,
              averagePrice,
              total,
              totalQuantity: materialsTotalWeight,
              totalProduce: finishedTotalWeight,
              consumables,
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

  // Transition from Material Table to Finished Table
  const scrollToSide = (productCategory) => {
    const container = containerRef.current;
    if (!container) return;

    const itemWidth = containerRef.current.getBoundingClientRect().width; // Current Width of table container

    container.scrollTo({
      ...(productCategory === "finished"
        ? { left: itemWidth }
        : { left: -itemWidth }),
      behavior: "smooth",
    });
  };

  // Helper functions
  const parseNumber = (num) => {
    return parseFloat(String(num || 0).replace(/,/g, ""));
  };

  const calculateTotal = (arr, key) => {
    return arr.reduce((acc, value) => acc + parseNumber(value[key]), 0);
  };

  // Calculate Consumable Total Weight
  const calculateConsumableTotalWeight = () => {
    setConsumablesTotalWeight(calculateTotal(consumables, "weightIn"));
  };

  // Calculate Consumable Total Costing
  const calculateConsumableTotalCosting = () => {
    setConsumablesTotalCosting(calculateTotal(consumables, "cost"));
  };

  // Calculate Materials Total Weight
  const calculateMaterialTotalWeight = () => {
    setMaterialsTotalWeight(calculateTotal(raws, "weightIn"));
  };

  // Calculate Materials Total Costing
  const calculateMaterialTotalCosting = () => {
    setMaterialsTotalCosting(calculateTotal(raws, "cost"));
  };

  // Calculate Finished Product Total Produce/Weight
  const calculateFinishedProductTotalWeight = () => {
    setFinishedTotalWeight(calculateTotal(finishedProductRows, "produce"));
  };

  // Calculate Finished Product Total Costing
  const calculateFinishedProductTotalCosting = () => {
    setFinishedTotalCosting(calculateTotal(finishedProductRows, "costing"));
  };

  // Calculate Finished Product Costing when Produce field change
  const recalculateCostingOnProduceChange = () => {
    setFinishedProductRows((prev) => {
      let changed = false;

      // Newly updated finished product
      const updated = prev.map((item, index) => {
        const produce = parseNumber(item.produce);

        const ratio = finishedTotalWeight
          ? materialsTotalCosting / finishedTotalWeight
          : 0;

        const newCosting = produce * ratio;

        if (newCosting !== item.costing) {
          changed = true;
        }

        return {
          ...item,
          unit_price: !produce ? 0 : unitPrice,
          costing: newCosting,
        };
      });

      // Only Set finished product when something actually changed
      // To avoid infinite rerenders
      return changed ? updated : prev;
    });
  };

  // Calculate Finished Product Costing when Unit price field change
  const recalculateCostingOnUnitPriceChange = () => {
    setFinishedProductRows((prev) => {
      let changed = false;

      const otherRowIndexes =
        lastFocusedIndexUnitPrice !== null
          ? prev.map((_, i) => i).filter((i) => i != lastFocusedIndexUnitPrice)
          : null;

      const totalCosting = prev.reduce((acc, value) => acc + value.costing, 0);

      const remainingCost = materialsTotalCosting - totalCosting; // Get the difference between Materials and Finished Product total costing

      const avgDistributedCost =
        otherRowIndexes?.length > 0
          ? remainingCost / otherRowIndexes?.length
          : 0; // Distribute the remaining cost evenly across all items in otherRowIndexes.

      // Newly updated finished product
      const updated = prev.map((item, index) => {
        const produce = parseNumber(item.produce);

        const unitPrice = parseNumber(item.unit_price);

        const totalCostingPerUnit = item.costing + avgDistributedCost; // Add the evenly distributed remaining cost to the item's original costing.

        const newUnitPrice = produce > 0 ? totalCostingPerUnit / produce : 0; // Get the Final new unit price per produce

        const shouldApplyUnitPrice = otherRowIndexes?.includes(index);

        const finalUnitPrice = shouldApplyUnitPrice ? newUnitPrice : unitPrice;

        if (finalUnitPrice < 0) validateUnitPrice();

        const newCosting = produce * finalUnitPrice;

        if (newCosting !== item.costing) changed = true;

        return {
          ...item,
          unit_price: finalUnitPrice,
          costing: newCosting,
        };
      });

      // Only Set finished product when something actually changed
      // To avoid infinite rerenders
      return changed ? updated : prev;
    });
  };

  // Send warning to user if Total Produce exceeds the Total Weight In
  const validateTotalProduce = () => {
    if (finishedTotalWeight > materialsTotalWeight) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("center-swal-text");
      wrapper.innerHTML = `The Total Produce cannot be greater than the total available weight <strong>(${materialsTotalWeight})</strong>, Please try again.`;
      swal({
        icon: "warning",
        title: "Weight Limit Exceeded",
        content: wrapper,
      }).then(() => {
        setLastFocusedIndex(null);
      });

      setFinishedProductRows((prev) =>
        prev.map((item, index) => {
          if (lastFocusedIndex == null) {
            return {
              ...item,
              unit_price: 0,
              produce: 0,
            };
          } else {
            return index === lastFocusedIndex
              ? {
                  ...item,
                  unit_price: 0,
                  produce: 0,
                }
              : item;
          }
        })
      );
    }
  };

  // Send warning to user if unit price happens to be negative
  const validateUnitPrice = () => {
    swal({
      icon: "warning",
      title: "Invalid Unit Price",
      text: "The entered unit price adjustment caused one or more items to have a negative unit price. Please try again.",
    }).then(() => {
      setFinishedProductRows((prev) => {
        return prev.map((item, index) => {
          return index === lastFocusedIndexUnitPrice
            ? {
                ...item,
                unit_price: 0,
                produce: 0,
              }
            : item;
        });
      });

      setLastFocusedIndexUnitPrice(null);
    });
  };

  // Get only the produce values from finishedProductRows
  const produces = useMemo(
    () => finishedProductRows.map((item) => item.produce),
    [finishedProductRows.map((item) => item.produce).join(",")]
  );

  // Get only the unit_price values from finishedProductRows
  const unitPrices = useMemo(
    () => finishedProductRows.map((item) => item.unit_price),
    [finishedProductRows]
  );

  useEffect(() => {
    fetchVendor();
    fetchLastCode();
    fetchWarehouse_function();
    fetchConsumables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    calculateConsumableTotalWeight(); // Consumable Total Weight In
    calculateConsumableTotalCosting(); // Consumable Total Costing
  }, [consumables]);

  useEffect(() => {
    calculateMaterialTotalWeight(); // Material Total Weight In
    calculateMaterialTotalCosting(); // Material Total Costing
  }, [raws]);

  useEffect(() => {
    calculateFinishedProductTotalWeight(); // Finished Product Total Produce
    calculateFinishedProductTotalCosting(); // Finished Product Total Costing
  }, [finishedProductRows]);

  // Commented kasi sa Suntech is nangyayari na mas marami ang produce kesa sa materials
  // useEffect(() => {
  //   validateTotalProduce();
  // }, [finishedProductRows, unitPrice]);

  useEffect(() => {
    recalculateCostingOnProduceChange(); // Handle Costing Calculation as Produce field Change
  }, [produces, unitPrice]);

  useEffect(() => {
    recalculateCostingOnUnitPriceChange(); // Handle Costing Calculation as Unit Price field Change
  }, [unitPrices]);

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, generateYears }, ref) => (
      <input
        type="text"
        className="form-control p-2 w-100"
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={() => {
          onClick();

          const date = new Date(value).getFullYear();

          generateYears(date); // Reset/Initialize Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
      />
    )
  );

  // Props for Consumable Table component
  const consumableTableProps = {
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
    addNewItemConsumable,
  };

  // Props for Material Table component
  const materialsTableProps = {
    raws,
    vendor: {
      vendorOptions,
      handleSupplierCodeChange,
      fetchRawMaterialStock,
    },
    onMenuOpen,
    menuIsOpen,
    selectedWarehouse,
    filteredRawProductOptions,
    setRaws,
    validated,
    onInputFloat,
    finishedProductRows,
    deleteItemRaw,
    addNewItemRaw,
  };

  // Props for Finished Product Table component
  const finishedTableProps = {
    finishedProductRows,
    filteredFinishedProductOptions,
    stock_finish_products,
    setFinishedProductRows,
    shift,
    selectedWarehouse,
    shiftWarehouseRef,
    validated,
    setLastFocusedIndex,
    lastFocusedIndexUnitPrice,
    setLastFocusedIndexUnitPrice,
    deleteFinishedProduct,
    addNewItemFinishProduct,
  };

  console.log(raws, "raw==");

  return (
    <div className="h-100 w-100 bg-white">
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
                  <span>Start Date</span>
                  <CustomDatePicker
                    label={"Production start date"}
                    selected={startDate ? new Date(startDate) : ""}
                    handleDateChange={(date) => {
                      setStartDate(date);
                      dateValidation(date, setStartDate, "Start Date");
                    }}
                    setter={setStartDate}
                    CustomInput={CustomInput}
                    isRequired={true}
                    validated={validated}
                    dateValidation={dateValidation}
                    dateAndTime={true}
                  />
                </div>
                <div className="col-sm mb-2">
                  <span>End Date</span>
                  <CustomDatePicker
                    label={"Production end date"}
                    selected={date ? new Date(date) : ""}
                    handleDateChange={(date) => {
                      setDate(date);
                      dateValidation(date, setDate, "End Date");
                    }}
                    setter={setDate}
                    CustomInput={CustomInput}
                    isRequired={true}
                    validated={validated}
                    dateValidation={dateValidation}
                    dateAndTime={true}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-sm mb-2">
                  <span>Shift Schedule</span>
                  <Form.Select
                    required
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    ref={(el) => (shiftWarehouseRef.current[0] = el)}
                  >
                    <option selected disabled value="">
                      Select Shift
                    </option>
                    <option value={"Day Shift"}>Day Shift</option>
                    <option value={"Night Shift"}>Night Shift</option>
                  </Form.Select>
                </div>
                <div className="col-sm mb-2">
                  <span>Machine</span>
                  <Form.Select
                    required
                    value={machine}
                    onChange={(e) => setMachine(e.target.value)}
                  >
                    <option selected disabled value="">
                      Select Machine
                    </option>
                    <option value={"Machine 1"}>Machine 1</option>
                    <option value={"Machine 2"}>Machine 2</option>
                    <option value={"Machine 3"}>Machine 3</option>
                  </Form.Select>
                </div>
                <div className="col-sm">
                  <span>Warehouse</span>
                  <Form.Select
                    required
                    value={selectedWarehouse}
                    onChange={(e) => {
                      fetchStockConsumables(e.target.value);
                      fetchStockRaw(e.target.value);
                      fetchStockFinish(e.target.value);
                      setSelectedWarehouse(e.target.value);
                      setRaws([
                        {
                          stock_id: "",
                          vendor_id: "",
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
                      setFinishedProductRows([
                        {
                          prod_id: "",
                          prod_code: "",
                          prod_name: "",
                          prod_uom: "",
                          produce: 0,
                          current_stock: 0,
                          costing: 0,
                          unit_price: 0,
                        },
                      ]);
                    }}
                    ref={(el) => (shiftWarehouseRef.current[1] = el)}
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
              </div>

              <div className="row">
                <div className="col-sm">
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

              {/* Controls */}
              {/* <div className="text-end">
                <span
                  className="cursor-pointer fs-5 text-muted me-1"
                  onClick={() => scrollToSide("materials")}
                >
                  {visible[0] ? "●" : "○"}
                </span>
                <span
                  className="cursor-pointer fs-5 text-muted"
                  onClick={() => scrollToSide("finished")}
                >
                  {visible[1] ? "●" : "○"}
                </span>
              </div> */}

              <div className="row gap-2 mt-3 mb-4">
                {/* For Consumables Totals */}
                <div className="col-sm">
                  <TotalCard
                    totalLabel={"Consumables Total"}
                    totalQuantity={consumablesTotalWeight}
                    totalCosting={consumablesTotalCosting}
                  />
                </div>

                {/* For Materials Totals */}
                <div className="col-sm">
                  <TotalCard
                    totalLabel={"Materials Total"}
                    totalQuantity={materialsTotalWeight}
                    totalCosting={materialsTotalCosting}
                  />
                </div>

                {/* For Finished Product Totals */}
                <div className="col-sm">
                  <TotalCard
                    totalLabel={"Finished Product Total"}
                    totalQuantity={finishedTotalWeight}
                    totalCosting={finishedTotalCosting}
                  />
                </div>
              </div>

              <div
                className="mt-1 production-form-container"
                ref={containerRef}
              >
                {/* Consumables Table */}
                <ProductionConsumableCreateTable {...consumableTableProps} />

                {/* Materials Table */}
                <ProductionMaterialsCreateTable {...materialsTableProps} />

                {/* Finished Product Table */}
                <ProductionFinishedCreateTable {...finishedTableProps} />
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

export default NewProductionCreate;
