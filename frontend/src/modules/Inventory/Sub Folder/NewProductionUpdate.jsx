import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
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
import CustomDatePicker from "../../../components/CustomDatePicker";
import { useObserver } from "../../../hooks/customHook/useObserver";
import TotalCard from "./components/TotalCard";
import ProductionMaterialEditTable from "./components/ProductionMaterialEditTable";
import ProductionFinishedEditTable from "./components/ProductionFinishedEditTable";
import ProductionConsumableCreateTable from "./components/ProductionConsumableCreateTable";
function NewProductionUpdate({ authrztn }) {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const shiftWarehouseRef = useRef();
  const [vendorOptions, setVendorOptions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [dateProduce, setDateProduce] = useState(""); // End date
  const { dateValidation } = useDateValidation();
  const { containerRef, containerItemRefs, visible } = useObserver();

  const [rawMaterials, setRawMaterials] = useState([]);
  const [validated, setValidated] = useState(false);
  const [finishProducts, setFinishProducts] = useState([]);

  const [production, setProduction] = useState([]);
  const [productionId, setProductionId] = useState("");
  const [description, setDescription] = useState("");
  const [wareHouseID, setWareHouseID] = useState("");
  const [fetchWarehouse, setFetchWarehouse] = useState([]);
  const [shift, setShift] = useState("");
  const [machine, setMachine] = useState("");
  const [status, setStatus] = useState("");

  const [trigger, setTrigger] = useState(0);

  const [edit, setEdit] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [total, setTotal] = useState("");
  const [consumableMaxQuantity, setConsumableMaxQuantity] = useState(0);

  //States PRoduction
  const [stockConsumableProducts, setStockConsumableProducts] = useState([]);
  const [stock_raw_products, setStock_raw_products] = useState([]); // stocks management table fetch
  const [stock_finish_products, setStock_finish_products] = useState([]); // product table fetch
  const [consumableList, setConsumableList] = useState([]);

  const [consumablesTotalWeight, setConsumablesTotalWeight] = useState(0);
  const [consumablesTotalCosting, setConsumablesTotalCosting] = useState(0);
  const [materialToDelete, setMaterialToDelete] = useState([]);
  const [consumableToDelete, setConsumableToDelete] = useState([]);
  const [materialsTotalWeight, setMaterialsTotalWeight] = useState(0);
  const [materialsTotalCosting, setMaterialsTotalCosting] = useState(0);
  const [finishedTotalWeight, setFinishedTotalWeight] = useState(0);
  const [finishedTotalCosting, setFinishedTotalCosting] = useState(0);
  const [lastFocusedIndex, setLastFocusedIndex] = useState(null); // Last focused input field for produce
  const [lastFocusedIndexUnitPrice, setLastFocusedIndexUnitPrice] =
    useState(null); // Last focused input field for Unit Price
  const [firstMount, setFirstMount] = useState(true);
  const [existingRaw, setExistingRaw] = useState([]);
  const [existingConsumables, setExistingConsumables] = useState([]); // Initial values upon editing
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

  const [raws, setRaws] = useState([
    {
      stock_id: "",
      vendor_id: "",
      supplier_code: "",
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
        supplier_code: "",
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
        current_stock: 0,
        costing: 0,
        unit_price: 0,
      },
    ]);
  };

  // Finished Product Unit Price
  const unitPrice =
    materialsTotalCosting && finishedTotalWeight
      ? parseFloat(
          String(materialsTotalCosting / finishedTotalWeight).replace(/,/g, "")
        ) || 0
      : 0;

  const filteredConsumableOptions = (index) => {
    const prodId = consumables
      .filter((_, i) => i !== index)
      .map((item) => item.prod_id);

    return stockConsumableProducts.filter(
      (item) => !prodId.includes(item.product_id)
    );
  };

  const filteredRawProductOptions = (index) => {
    const prodId = raws
      .filter((_, i) => i !== index)
      .map((item) => item.prod_id);

    // Only exclude products already selected in the raw materials table
    return stock_raw_products.filter((item) => {
      return !prodId.includes(item.product_id);
    });
  };

  const filteredFinishedProductOptions = (index) => {
    const prodId = finishedProductRows
      .filter((_, i) => i !== index)
      .map((item) => item.prod_id);

    // Only exclude products already selected in the finished products table
    return stock_finish_products.filter((item) => {
      return !prodId.includes(item.product_list.product_id);
    });
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const deleteItemConsumable = (indexToDelete, data) => {
    setConsumables((prev) =>
      prev.filter((_, index) => index !== indexToDelete)
    );

    const findConsumable = existingConsumables.find(
      (item) => item.prod_id === data.prod_id
    );

    if (!findConsumable) return;

    setConsumableToDelete((prev) => [...prev, findConsumable]);
  };

  const deleteItemRaw = (indexToDelete, data) => {
    // setTrigger(trigger + 1);
    setRaws((prevRaws) =>
      prevRaws.filter((_, index) => index !== indexToDelete)
    );

    const findRaw = existingRaw.find((item) => item.prod_id === data.prod_id);

    if (!findRaw) return;

    if (!data.newItem) {
      setMaterialToDelete((prev) => [...prev, findRaw]);
    }
  };

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

  // To Initialize the consumable display
  const fetchConsumables = async (warehouseId) => {
    try {
      const res = await axios.get(`${BASE_URL}/production/consumables/${id}`, {
        params: {
          warehouseId,
        },
      });

      const { productId, unitPrice, quantity, total, maxQuantity } = res.data;

      setSelectedConsumable(productId);
      setQuantity(putComma(quantity || 0));
      setAveragePrice(putComma(unitPrice || 0));
      setTotal(total ?? 0);

      setConsumableMaxQuantity(maxQuantity); // Initialize Max Quantity for selected consumable
    } catch (error) {
      console.error(error);

      if (error.response && error.response.status === 404) {
        setSelectedConsumable(null);
        setQuantity("");
        setAveragePrice("");
        setTotal("");
      }
    }
  };

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

  // To get the List of Consumable for Dropdown select
  const fetchConsumableList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/production/consumables/list`);

      setConsumableList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // To get the amount details of the selected consumable
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

  const validRawMaterials = raws.filter((raw) => raw.stock_id && raw.prod_name);

  const fetchInventoryCounting = () => {
    axios
      .get(`${BASE_URL}/production/getProductionDetails/${id}`)
      .then((res) => {
        const quantity = putComma(res.data.quantity);
        const averagePrice = putComma(res.data.average_price);
        const total = putComma(res.data.total);

        setProduction(res.data);
        setProductionId(res.data.production_id);
        setDescription(res.data.desc || "");
        setStartDate(res.data.start_date);
        setDateProduce(res.data.date_produce);
        setShift(res.data.shift);
        setMachine(res.data.machine);
        setWareHouseID(res.data.warehouse_id);
        fetchConsumables(res.data.warehouse_id);
        fetchStockFinish(res.data.warehouse_id);
        fetchStockRaw(res.data.warehouse_id);
        fetchStockConsumables(res.data.warehouse_id);
        setStatus(res.data.status);
        // fetchRawMaterials(res.data.warehouse_id);
        fetchExistingConsumable(res.data.warehouse_id);
        getRawMaterials(res.data.warehouse_id, res.data.status);
      })
      .catch((error) => {
        console.error("Error fetching production details: ", error);
      });
  };

  // Handle supplier code change
  const handleSupplierCodeChange = async (selectedOption, index) => {
    const { prod_id: productId, prod_name: productName } = raws[index];
    const supplierCode = selectedOption.label;
    const vendorId = selectedOption.value;

    // Get the updated stock with the current selected warehouse and vendor
    const stockRawProducts = await fetchRawMaterialStock(wareHouseID, vendorId);

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

  const handleUpdateProduction = async (e) => {
    try {
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
                `${BASE_URL}/production/updateProductionNew`,
                {
                  raws: formatRaws,
                  finishedProductRows: modifiedFinishedProductRows,
                  productionId,
                  description,
                  startDate,
                  dateProduce,
                  wareHouseID,
                  shift,
                  machine,
                  userLoggedID,
                  id,
                  materialToDelete,
                  consumableId: selectedConsumable,
                  quantity,
                  averagePrice,
                  total,
                  totalQuantity: materialsTotalWeight,
                  totalProduce: finishedTotalWeight,
                  consumables,
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

  const fetchExistingConsumable = async (warehouseId) => {
    try {
      const productionId = id;
      const res = await axios.get(
        `${BASE_URL}/production/consumables/${productionId}`,
        {
          params: {
            warehouseId,
          },
        }
      );

      if (res.data.length) {
        const consumables = res.data.map((item) => {
          const weightIn = item.weight_in;
          const addWeightIn = status === "Rejected" ? 0 : weightIn || 0;

          return {
            stock_id: item.product_id,
            prod_id: item.product_id,
            prod_code: item.product_code,
            prod_name: item.product_name,
            prod_uom: item.unit_of_measure,
            current_stock: item.totalStock + addWeightIn,
            prod_price: item.production_price,
            weightIn: weightIn,
            cost: item.costing,
          };
        });

        setConsumables(consumables);
        setExistingConsumables(consumables);
      }
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

      const productMap = new Map();

      response.data.forEach((item) => {
        const productId = item.product_id;
        const weightIn = item.weight_in || 0;
        const price = item.stock_management?.price || 0;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            stock_id: item.product_id,
            vendor_id: item.vendor_id,
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

        productMap.set(productId, product);
      }

      setRaws(mergedData);
      setExistingRaw(mergedData);

      fetchProductionFinishProduct(mergedData);

      // setRaws(formattedData);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  const getRawMaterials = async (warehouseId, status) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/production/raw-materials/${id}`,
        {
          params: {
            warehouseId,
            status,
          },
        }
      );

      // Build raw materials for "raws" state
      const rawMaterials = res.data.map((item) => ({
        stock_id: item.product_id,
        vendor_id: item.vendor_id,
        supplier_code: item.supplier_code,
        prod_id: item.product_id,
        prod_code: item.product_code,
        prod_name: item.product_name,
        prod_uom: item.uom,
        current_stock: item.current_stock,
        prod_price: item.unit_price,
        weightIn: item.quantity,
        cost: item.costing,
      }));

      setRaws(rawMaterials);
      setExistingRaw(rawMaterials);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProductionFinishProduct = async (raws) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/production/getProductionFinishProductNew/${id}`
      );

      const formattedProducts = response.data.map((item) => {
        return {
          prod_finish_raw_id: item["production_finish_products.id"],
          prod_id: item["production_finish_products.product_id"] || "",
          prod_code: item.product_code || "",
          product_name: item.product_name || "",
          prod_uom: item.unit_of_measure || "",
          produce: item["production_finish_products.produce"] || 0,
          current_stock: item.totalStock,
          unit_price: item["production_finish_products.unit_price"] || 0,
          costing: item["production_finish_products.costing"] || 0,
        };
      });

      setFinishedProductRows(formattedProducts);
      // setFinishProducts(response.data);
    } catch (error) {
      console.error("Error production finish product:", error);
    }
  };

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
      })
        .then(async (confirmed) => {
          if (confirmed) {
            const response = await axios.put(
              `${BASE_URL}/production/approveProductionNew/${id}`,
              {
                raws,
                finishedProductRows,
                wareHouseID,
                selectedConsumable,
                quantity,
                dateProduce,
                productionCode: productionId,
                consumables,
              }
            );

            if (response.status === 200) {
              swal({
                title: "Success",
                text: "Production Approved successfully",
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
        })
        .catch((error) => {
          // Error response for consumables
          if (error.response && error.response.status === 409) {
            const availableStock = error.response.data.availableStock;
            const productName = error.response.data.productName;
            const wrapper = document.createElement("div");
            wrapper.classList.add("center-swal-text");
            wrapper.innerHTML = `You are trying to use more than the available consumable stock for <strong>${productName}</strong>. 
            Current available: <strong>(${putComma(availableStock)})</strong>.`;
            swal({
              icon: "error",
              title: "Insufficient Consumable Stock",
              content: wrapper,
            });
            return;
          }

          // Error response for raw materials
          if (error.response && error.response.status === 400) {
            const text = error.response.data.error;
            swal({
              icon: "error",
              title: "Insufficient Raw Material Stock",
              text,
            });
          }
        });
    } catch (error) {
      console.error(error);
    }
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
    if (
      finishedTotalWeight &&
      materialsTotalWeight &&
      finishedTotalWeight > materialsTotalWeight
    ) {
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
    fetchProductionFinishProduct();
    fetchWarehouse_function();
    fetchConsumableList();
    fetchVendor();
  }, []);

  useEffect(() => {
    fetchInventoryCounting();
  }, [id]);

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

          generateYears(date); // Reset/Initialize Year List based on selected date
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        disabled={!edit}
        required
      />
    )
  );

  console.log(raws);

  // Props for Consumable Table component
  const consumableTableProps = {
    consumables,
    filteredConsumableOptions,
    stockConsumableProducts,
    setConsumables,
    shift,
    selectedWarehouse: wareHouseID,
    shiftWarehouseRef,
    validated,
    onInputFloat,
    deleteItemConsumable,
    consumableToDelete,
    existingConsumables,
    addNewItemConsumable,
    edit,
  };

  // Props for Material Table component
  const materialsTableProps = {
    raws,
    vendor: {
      vendorOptions,
      handleSupplierCodeChange,
      fetchRawMaterialStock,
    },
    selectedWarehouse: wareHouseID,
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
  };

  // Props for Finished Product Table component
  const finishedTableProps = {
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
  };

  return (
    <div className="h-100 w-100 bg-white custom-container">
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
                    selected={dateProduce ? new Date(dateProduce) : ""}
                    handleDateChange={(date) => {
                      setDateProduce(date);
                      dateValidation(date, setDateProduce, "End Date");
                    }}
                    setter={setDateProduce}
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
                    disabled={!edit}
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
                    disabled={!edit}
                  >
                    <option selected disabled value="">
                      Select Machine
                    </option>
                    <option value={"Machine 1"}>Machine 1</option>
                    <option value={"Machine 2"}>Machine 2</option>
                    <option value={"Machine 3"}>Machine 3</option>
                  </Form.Select>
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
              </div>
              {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                <div className="row">
                  <div className="col-sm">
                    <span>Warehouse</span>
                    <Form.Select
                      required
                      value={wareHouseID}
                      onChange={(e) => {
                        fetchStockConsumables(e.target.value);
                        fetchStockRaw(e.target.value);
                        fetchStockFinish(e.target.value);
                        setWareHouseID(e.target.value);
                      }}
                      disabled
                    >
                      <option disabled value="">
                        Select Warehouse
                      </option>
                      {fetchWarehouse.map((data) => (
                        <option
                          id={data.warehouse_id}
                          value={data.warehouse_id}
                        >
                          {data.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              )}
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

            <div className="container-fluid">
              <div className="row gap-2 mb-4 mt-3">
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
            </div>

            <div className="container-fluid">
              <div
                className="mt-1 production-form-container"
                ref={containerRef}
              >
                {/* For Consumables Table */}
                <ProductionConsumableCreateTable {...consumableTableProps} />

                {/* For Materials Table */}
                <ProductionMaterialEditTable {...materialsTableProps} />

                {/* For Finished Product Table */}
                <ProductionFinishedEditTable {...finishedTableProps} />
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

export default NewProductionUpdate;
