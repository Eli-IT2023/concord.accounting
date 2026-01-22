import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import swal from "sweetalert";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import CustomDatePickerInput from "../../../utils/CustomerDateInput";
import "../../../assets/css/style.css";
import { format } from "date-fns";

const CreatePayable = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [warehouse, setWarehouse] = useState([]);
  const [product, setProduct] = useState([]);
  const [payableProduct, setPayableProduct] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [totalMoisture, setTotalMoisture] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [otherFees, setOtherFees] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [isPercent, setIsPercent] = useState(false);
  const [primary_discount, setPrimary_discount] = useState("");
  const [discountBackend, setDiscountBackend] = useState("");
  const [currency, setCurrency] = useState([]);
  const [containerNumber, setContainerNumber] = useState("");
  const [pier, setPier] = useState("");

  // const [userLoggedID, setUserLoggedID] = useState([]);
  // const decodeToken = () => {
  //   var token = localStorage.getItem("accessToken");
  //   if (typeof token === "string") {
  //     var decoded = jwtDecode(token);
  //     // console.log("DECODED TOKEN:", decoded);
  //     setUserLoggedID(decoded.id);
  //   }
  // };

  const userLoggedID = useDecodeToken();

  // Add this function to handle input changes
  const handleInputChange = (e) => {
    let value = e.target.value;

    if (value) {
      value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    setPrimary_discount(value);
    onInputFloat(e); // Assuming you still want to call this function
  };

  // Add this function to calculate the discount
  const calculateDiscount = () => {
    const formatDiscount = primary_discount.replace(/,/g, "");

    const numValue = parseFloat(formatDiscount);
    if (isNaN(numValue)) return setDiscountBackend(numValue);

    if (isPercent) {
      const discounted =
        (numValue / 100) *
        (parseFloat(totalWeight || 0) -
          parseFloat(totalMoisture || 0) -
          parseFloat(watch(`weighingFee`)?.replace(/,/g, "") || 0) -
          parseFloat(totalFees || 0));
      setDiscountBackend(discounted);
      // return numValue / 100;
    } else {
      setDiscountBackend(numValue);
      // return numValue;
    }
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const addNewFee = () => {
    setOtherFees([...otherFees, { feeName: "", feeAmount: "" }]);
  };

  const handleFeeChange = (index, field, value) => {
    const newOtherFees = otherFees.map((fee, i) =>
      i === index ? { ...fee, [field]: value } : fee
    );
    setOtherFees(newOtherFees);
  };
  const removeFee = (index) => {
    const newOtherFees = otherFees.filter((_, i) => i !== index);
    setOtherFees(newOtherFees);
  };

  const addNewItem = () => {
    append({
      product_vendor_id: "",
      productId: "",
      productCode: "",
      productName: "",
      moisture: "",
      moistureType: "%",
      weight: "",
      net_weight: 0,
      unitPrice: 0,
      totalPrice: 0,
    });
  };

  const dateToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
  };

  const { register, control, setValue, watch } = useForm({
    defaultValues: {
      transactionId: "",
      warehouseId: "",
      vendorId: "",
      modeOfPayment: "",
      customerType: "local",
      trackingNumber: "",
      dueDate: "",
      weightedQuantity: "",
      netWeight: "",
      weighingFee: "",
      purchaseDate: dateToday(),
      description: "",
      currencyId: "1",
      containerNumber: "",
      pier: "",
      currencyRate: "1",
      items: [
        {
          product_vendor_id: "",
          productId: "",
          productCode: "",
          productName: "",
          moistureType: "%",
          moisture: "",
          weight: "",
          net_weight: 0,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    },
  });

  const watchField = watch("currencyId");

  // Find the currency name
  const findCurrencyName = currency.find((item) => {
    if (watchField) {
      return item.id == watchField;
    }
  });

  // Conditionally add currency symbol to Total Weighted, Total Moisture, and Total Net Weight Amount
  const dynamicCurrencyOptions = (findCurrencyName) => {
    const currencyOptions1 = {
      style: "currency",
      currency: `${findCurrencyName?.currency_name}`,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    const currencyOptions2 = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    if (findCurrencyName) {
      return currencyOptions1;
    }

    return currencyOptions2;
  };

  //Function for formatting the number using userForm
  const formatNumber = (value) => {
    if (!value) return ""; // Handle empty input

    // Remove non-numeric characters except for the decimal point
    let inputValue = value.replace(/[^0-9.]/g, "");

    // Split into integer and decimal parts
    let [integerPart, decimalPart] = inputValue.split(".");

    // Format the integer part with commas
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Combine integer and decimal parts (if any)
    return decimalPart !== undefined
      ? `${integerPart}.${decimalPart}`
      : integerPart;
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  const itemsValues = useWatch({
    control,
    name: "items",
    defaultValue: [],
  });
  const calculateTotalMoisture = () => {
    const totalMoisture = itemsValues.reduce((acc, item) => {
      const moisture =
        parseFloat(item.moisture.toString()?.replace(/,/g, "")) || 0;
      const weight = parseFloat(item.weight.toString()?.replace(/,/g, "")) || 0;
      const unitPrice =
        parseFloat(item.unitPrice.toString()?.replace(/,/g, "")) || 0;

      if (item.moistureType === "%") {
        // Calculate percentage of (unitPrice * weight)
        return acc + (moisture / 100) * unitPrice * weight;
      } else {
        // Moisture is in peso, add directly
        return acc + moisture;
      }
    }, 0);

    setTotalMoisture(totalMoisture);
  };

  // const calculateNetWeight = (index) => {
  //   const weight =
  //     parseFloat(watch(`items.${index}.weight`)?.replace(/,/g, "")) || 0;
  //   const moisture =
  //     parseFloat(watch(`items.${index}.moisture`)?.replace(/,/g, "")) || 0;
  //   const unitPrice =
  //     parseFloat(watch(`items.${index}.unitPrice`)?.replace(/,/g, "")) || 0;
  //   const moisture_type = watch(`items.${index}.moistureType`);

  //   if (moisture_type === "%") {
  //     if (weight * (1 - moisture / 100) < 0) {
  //       swal({
  //         title: "Invalid Net Weight Amount.",
  //         text: "Net Weight Amount cannot be less than 0",
  //         button: true,
  //         icon: "error",
  //       }).then(() => {
  //         setValue(`items.${index}.moisture`, "");
  //         setValue(`items.${index}.net_weight`, 0);
  //       });
  //       return;
  //     }
  //   } else {
  //     if (weight - moisture / unitPrice < 0) {
  //       swal({
  //         title: "Invalid Net Weight Amount.",
  //         text: "Net Weight Amount cannot be less than 0",
  //         button: true,
  //         icon: "error",
  //       }).then(() => {
  //         setValue(`items.${index}.moisture`, "");
  //         setValue(`items.${index}.net_weight`, 0);
  //       });
  //       return;
  //     }
  //   }

  //   setValue(
  //     `items.${index}.net_weight`,
  //     moisture_type === "%"
  //       ? formatNumberWithCommas(weight * (1 - moisture / 100))
  //       : formatNumberWithCommas(weight - moisture / unitPrice)
  //   );

  //   return;
  // };

  const calculateNetWeight = (index) => {
    const weight =
      parseFloat(watch(`items.${index}.weight`)?.replace(/,/g, "")) || 0;
    const moisture =
      parseFloat(watch(`items.${index}.moisture`)?.replace(/,/g, "")) || 0;
    const unitPrice =
      parseFloat(watch(`items.${index}.unitPrice`)?.replace(/,/g, "")) || 0;
    const moisture_type = watch(`items.${index}.moistureType`);

    let netWeight;

    if (moisture_type === "%") {
      netWeight = weight * (1 - moisture / 100);
    } else {
      netWeight = weight - moisture / unitPrice;
    }

    // Ensure netWeight is not negative
    if (netWeight < 0) {
      swal({
        title: "Invalid Net Weight Amount.",
        text: "Net Weight Amount cannot be less than 0",
        button: true,
        icon: "error",
      }).then(() => {
        setValue(`items.${index}.moisture`, "");
        setValue(`items.${index}.net_weight`, 0);
        setValue(`items.${index}.totalPrice`, 0);
      });
      return;
    }

    // Format and set netWeight
    setValue(`items.${index}.net_weight`, formatNumberWithCommas(netWeight));

    // Calculate totalPrice (net_weight * unit_price)
    const totalPrice = netWeight * unitPrice;

    // Format and set totalPrice
    setValue(`items.${index}.totalPrice`, formatNumberWithCommas(totalPrice));
  };

  const calculateMoisture = (index, value) => {
    const weight =
      parseFloat(watch(`items.${index}.weight`)?.replace(/,/g, "")) || 0;
    let moisture =
      parseFloat(watch(`items.${index}.moisture`)?.replace(/,/g, "")) || 0;
    const unitPrice =
      parseFloat(watch(`items.${index}.unitPrice`)?.replace(/,/g, "")) || 0;
    const moisture_type = watch(`items.${index}.moistureType`);

    let netWeight = value;

    if (moisture_type === "%") {
      moisture = 100 * (1 - netWeight / weight).toFixed(2);
    } else {
      netWeight = weight - moisture / unitPrice;
    }

    // Ensure netWeight is not negative
    if (netWeight > weight) {
      swal({
        title: "Invalid Net Weight Amount.",
        text: "Net Weight Amount should not exceed weight amount",
        button: true,
        icon: "error",
      }).then(() => {
        setValue(`items.${index}.moisture`, "");
        setValue(`items.${index}.net_weight`, 0);
        setValue(`items.${index}.totalPrice`, 0);
      });
      return;
    }

    // Format and set netWeight
    setValue(`items.${index}.moisture`, formatNumberWithCommas(moisture));

    // Calculate totalPrice (net_weight * unit_price)
    const totalPrice = netWeight * unitPrice;

    // Format and set totalPrice
    setValue(`items.${index}.totalPrice`, formatNumberWithCommas(totalPrice));
  };

  useEffect(() => {
    const calculateTotalWeight = () => {
      const totalWeight = itemsValues.reduce((acc, item) => {
        const weight =
          parseFloat(item.weight.toString()?.replace(/,/g, "")) || 0;
        const unitPrice =
          parseFloat(item.unitPrice.toString()?.replace(/,/g, "")) || 0;
        console.log(unitPrice);
        return acc + weight * unitPrice;
      }, 0);
      setTotalWeight(totalWeight);
    };

    const calculateTotalFees = () => {
      const total = otherFees.reduce((acc, fee) => {
        const feeAmount = parseFloat(fee.feeAmount) || 0;
        return acc + feeAmount;
      }, 0);
      setTotalFees(total.toFixed(2));
    };

    calculateDiscount();

    calculateTotalMoisture();
    calculateTotalWeight();
    calculateTotalFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsValues, otherFees, isPercent, primary_discount, discountBackend]);

  const fetchWarehousData = () => {
    axios
      .get(BASE_URL + "/warehouse/getWarehouse")
      .then((res) => {
        setWarehouse(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const fetchLastCode = () => {
    axios
      .get(BASE_URL + "/payable/getCode")
      .then((res) => {
        setValue("transactionId", res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const resetTableProduct = () => {
    // Reset all product selections in the items array
    const itemsCount = watch("items").length;
    for (let i = 0; i < itemsCount; i++) {
      setValue(`items.${i}.product_vendor_id`, "");
      setValue(`items.${i}.productId`, "");
      setValue(`items.${i}.productCode`, "");
      setValue(`items.${i}.productName`, "");
      setValue(`items.${i}.unitPrice`, 0);
      setValue(`items.${i}.totalPrice`, 0);
    }
  };
  const fetchProductData = (value) => {
    const vendorId = value;
    axios
      .get(BASE_URL + "/payable/getProductData", {
        params: {
          vendorId,
        },
      })
      .then((res) => {
        setProduct(res.data);
        resetTableProduct();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchPayableProduct = (value) => {
    const vendorId = value;
    axios
      .get(BASE_URL + "/payable/getPayableProduct", {
        params: {
          vendorId,
        },
      })
      .then((res) => {
        setPayableProduct(res.data);
        console.log(payableProduct);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchVenderData = () => {
    axios
      .get(BASE_URL + "/vendors/fetchVendors")
      .then((res) => {
        setVendors(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchCurrency = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/currency/fetchCurrency`);
      setCurrency(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const [cutOff, setCutOff] = useState([]);

  const fetchLatestCutOff = () => {
    axios
      .get(BASE_URL + "/cutoff/getCurrentCutOff")
      .then((res) => {
        setCutOff(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const dateValidation = async (selectedDate, value) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      if (res.data == false) {
        swal({
          icon: "error",
          title: "Invalid Date Selection",
          text: "Please Create Cutoff for this Date",
          // buttons: false,
          // timer: 2000,
        }).then(() => {
          setValue(value, "");
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWarehousData();
    fetchVenderData();
    fetchLastCode();
    fetchLatestCutOff();
    fetchCurrency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //backend
  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const formatPrimaryDiscount = primary_discount.replace(/,/g, "");

    const weighingFee =
      parseFloat(watch("weighingFee")?.replace(/,/g, "")) || 0;

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      if (totalAmount === 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "center-swal-text";
        wrapper.innerHTML =
          "The Total Amount must be greater than zero. Please check your input.";
        swal({
          icon: "error",
          title: "Invalid Amount",
          content: wrapper,
        });
        return;
      }

      swal({
        title: "Create this new purchase?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const formData = new FormData(form);
          formData.append("otherFee", JSON.stringify(otherFees));
          formData.append("primary_discount", formatPrimaryDiscount);
          formData.append("isPercent", isPercent);
          formData.append("createdBy", userLoggedID);
          formData.append(
            "dueDate",
            watch("dueDate") ? format(watch("dueDate"), "yyyy-MM-dd") : ""
          );
          formData.append(
            "purchaseDate",
            watch("purchaseDate")
              ? format(watch("purchaseDate"), "yyyy-MM-dd")
              : ""
          );
          const data = Object.fromEntries(formData.entries());

          data.items = [];
          form.querySelectorAll('[name^="items"]').forEach((input) => {
            const matches = input.name.match(/^items\.(\d+)\.(.+)$/);
            if (matches) {
              const index = matches[1];
              const key = matches[2];
              if (!data.items[index]) data.items[index] = {};
              const modifiedValue = input.value?.replace(/,/g, "");
              data.items[index][key] = modifiedValue;

              // Calculate totalAmount and set it for each item
              const weight = parseFloat(
                data.items[index].weight?.replace(/,/g, "") || 0
              );
              const moisture = parseFloat(
                data.items[index].moisture?.replace(/,/g, "") || 0
              );
              const weighingFee =
                parseFloat(watch("weighingFee")?.replace(/,/g, "")) || 0;
              const discount = parseFloat(discountBackend) || 0;

              data.items[index].totalAmount =
                weight - moisture - weighingFee - discount;
            }
          });

          data.calculatedAmount = calculatedAmount; // Add to data object
          console.log(data);

          // Send data via Axios
          axios
            .post(`${BASE_URL}/payable/create`, data, {
              headers: {
                "Content-Type": "application/json",
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Purchase created successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("../purchases/payable");
                });
              }
              // else if (res.status === 201) {
              //   swal({
              //     title: "Opppss!",
              //     text: "Cutoff already posted for this date",
              //     icon: "warning",
              //     buttons: false,
              //     timer: 2000,
              //     dangerMode: true,
              //   });
              // }
              else {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact your support immediately",
                  icon: "error",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const [calculatedAmount, setCalculatedAmount] = useState(0);

  const totalAmount =
    parseFloat(totalWeight || 0) -
    parseFloat(totalMoisture || 0) -
    (parseFloat(watch("weighingFee")?.replace(/,/g, "")) || 0) -
    (totalFees || 0) -
    (discountBackend || 0);

  const calculateTotalWeightInKilo = itemsValues.reduce((total, value) => {
    return (
      total + (parseFloat(value.weight.toString()?.replace(/,/g, "")) || 0)
    );
  }, 0);

  const calculateTotalMoistureInKilo = itemsValues.reduce((total, value) => {
    // Get Moisture in peso
    const moistureInPeso = isNaN(
      (parseFloat(value.moisture) / parseFloat(value.unitPrice)) *
        parseFloat(value.weight)
    )
      ? 0
      : (parseFloat(value.moisture.toString()?.replace(/,/g, "")) /
          value.unitPrice.toString()?.replace(/,/g, "")) *
        parseFloat(value.weight.toString()?.replace(/,/g, ""));

    // Get Moisture in percentage
    const moistureInPercentage = isNaN(
      (parseFloat(value.moisture) / 100) * parseFloat(value.weight)
    )
      ? 0
      : (parseFloat(value.moisture.toString()?.replace(/,/g, "")) / 100) *
        parseFloat(value.weight.toString()?.replace(/,/g, ""));
    return value.moistureType == "%"
      ? total + moistureInPercentage
      : total + moistureInPeso;
  }, 0);

  const calculateTotalNetWeightInKilo = itemsValues.reduce((total, value) => {
    return total + parseFloat(value.net_weight.toString()?.replace(/,/g, ""));
  }, 0);

  const formatNumberWithCommas = (number) => {
    return new Intl.NumberFormat("en-US").format(number);
  };

  // List of currency symbol
  const currencySymbol = {
    PHP: "₱",
    JPY: "¥",
    USD: "$",
    EUR: "€",
    HKD: "HK$",
    CNY: "CN¥",
  };

  // Fetch Vendor then set the currency and currency rate based on vendor
  const fetchVendorCurrencyId = async (value) => {
    try {
      const res = await axios.get(`${BASE_URL}/vendors/fetchVendorsedit`, {
        params: {
          id: value,
        },
      });
      // Set currency
      const [vendor] = res.data;
      setValue("currencyId", vendor.currency_id);

      // Set currency rate
      const vendorCurrency = currency.find(
        (item) => item.id === vendor.currency_id
      );

      setValue("currencyRate", vendorCurrency.currency_rate);
    } catch (error) {
      console.error(error);
    }
  };

  // Custom input for DatePicker to Prevent user typing/input
  // const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
  //   <input
  //     type="text"
  //     className="form-control p-2 w-100"
  //     style={{
  //       cursor: "pointer",
  //       caretColor: "transparent",
  //     }}
  //     onClick={onClick}
  //     value={value}
  //     ref={ref}
  //     placeholder="Select Date"
  //     required
  //   />
  // ));

  // Set the calculated amount whenever totalAmount is calculated
  useEffect(() => {
    setCalculatedAmount(totalAmount);
  }, [
    totalWeight,
    totalMoisture,
    watch("weighingFee"),
    totalFees,
    discountBackend,
  ]);

  // Handle Total Amount negative value
  useEffect(() => {
    if (totalAmount < 0) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("center-swal-text");
      wrapper.innerHTML =
        "Transaction results in a negative total, due to fees with no usable product.";
      swal({
        icon: "warning",
        title: "Warning",
        content: wrapper,
        button: "OK",
        dangerMode: true,
      });
      return;
    }
  }, [totalAmount]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <Form noValidate validated={validated} onSubmit={add}>
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3">
              {" "}
              <Link to="/purchases/payable" className="text-dark mx-2">
                <i class="fa-solid fa-arrow-left"></i>
              </Link>
              PURCHASE DETAILS
            </span>
            <span>Current Cutoff: {cutOff.name}</span>
          </div>
        </div>
        <div className="row mx-auto p-2 mt-2">
          <div className="col-sm mb-2">
            <label htmlFor="transactionId">Transaction ID</label>
            <input
              type="text"
              id="transactionId"
              {...register("transactionId")}
              className="form-control p-2"
              readOnly
            />
          </div>
          <div className="col-sm mb-2">
            <label htmlFor="warehouseId">
              Receiving Warehouse <span className="text-danger">*</span>
            </label>
            <select
              required
              id="warehouseId"
              {...register("warehouseId")}
              className="form-select p-2"
            >
              <option value="" disabled>
                Select Warehouse
              </option>
              {warehouse.map((data) => (
                <option key={data.warehouse_id} value={data.warehouse_id}>
                  {data.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row mx-auto p-2">
          <div className="col-sm mb-2">
            <label htmlFor="vendorId">
              Vendor <span className="text-danger">*</span>
            </label>
            <select
              required
              id="vendorId"
              {...register("vendorId", {
                onChange: async (e) => {
                  fetchProductData(e.target.value);
                  fetchPayableProduct(e.target.value);
                  await fetchVendorCurrencyId(e.target.value);
                },
              })}
              className="form-select p-2"
            >
              <option value="" disabled>
                Select Vendor
              </option>
              {vendors.map((data) => (
                <option key={data.id} value={data.id}>
                  {data.company_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm mb-2">
            <label htmlFor="modeOfPayment">Mode of Payment</label>
            <select
              id="modeOfPayment"
              {...register("modeOfPayment")}
              className="form-select p-2"
            >
              <option value="" disabled>
                Select Payment
              </option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
            </select>
          </div>
        </div>
        <div className="row mx-auto p-2">
          <div className="col-sm mb-2 ">
            <div className="d-flex justify-content-center">
              <div
                className={`${
                  watch("currencyId") == "11111111-1111-1111-1111-111111111111"
                    ? "w-100"
                    : "w-50 me-3"
                } `}
              >
                <div className="mb-4">
                  <label htmlFor="currencyId">
                    Currency <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    id="currencyId"
                    // {...register("currencyId")}
                    {...register("currencyId", {
                      onChange: (e) => {
                        const selectedValue = e.target.value;

                        const curr = currency.find(
                          (data) => String(data.id) === String(selectedValue)
                        );
                        console.log("crr", curr);
                        console.log(selectedValue);

                        setValue("currencyId", selectedValue);
                        setValue("currencyRate", curr.currency_rate);
                      },
                    })}
                    className="form-select p-2"
                  >
                    <option value="" disabled>
                      Select Currency
                    </option>
                    {currency.map((data) => (
                      <option key={data.id} value={data.id}>
                        {data.currency_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {watch("currencyId") != "" &&
              watch("currencyId") ==
                "11111111-1111-1111-1111-111111111111" ? null : (
                <>
                  <div className="w-50">
                    <div className="mb-4">
                      <label htmlFor="currencyId">
                        Currency Rate <span className="text-danger">*</span>
                      </label>
                      <Form.Control
                        type="text"
                        name=""
                        onInput={onInputFloat}
                        id=""
                        className="form-control p-2"
                        {...register("currencyRate")}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="row mt-4">
              <div className="col-sm mb-3 d-flex flex-row justify-content-between">
                <div className="w-50 me-3">
                  <span>Container Number</span>
                  <Form.Control
                    type="text"
                    name=""
                    id=""
                    className="form-control p-2"
                    {...register("containerNumber")}
                  />
                </div>
                <div className="w-50">
                  <span>Pier</span>
                  <Form.Control
                    type="text"
                    name=""
                    id=""
                    className="form-control p-2"
                    {...register("pier")}
                  />
                </div>
              </div>
            </div>
            <label htmlFor="">Type</label>
            <div className="d-flex align-items-center justify-content-center mt-2 pt-2">
              <input
                type="radio"
                id="localPurchase"
                value="local"
                {...register("customerType")}
                className="me-2"
              />
              <label htmlFor="localPurchase" className="me-4">
                Local Purchase
              </label>
              <input
                type="radio"
                id="overseasPurchase"
                value="overseas"
                {...register("customerType")}
                className="me-2"
              />
              <label htmlFor="overseasPurchase">Overseas Purchase</label>
            </div>
            {watch("customerType") === "overseas" && (
              <div className="mt-4">
                <label htmlFor="trackingNumber">Tracking Number</label>
                <input
                  required
                  type="text"
                  id="trackingNumber"
                  {...register("trackingNumber")}
                  placeholder="Enter Tracking Number"
                  className="form-control p-2"
                />
              </div>
            )}
          </div>
          <div className="col-sm mb-2">
            <label htmlFor="dueDate">
              Due Date <span className="text-danger">*</span>
            </label>
            {/* <input
              type="date"
              id="dueDate"
              required
              {...register("dueDate", {
                // onChange: (e) => {
                //   if (e.target.value) {
                //     dateValidation(e.target.value, "dueDate");
                //   }
                // },
              })}
              className="form-control py-2 ps-2"
              style={{ paddingLeft: "1rem" }}
            /> */}
            <div>
              {/* <DatePicker
                selected={watch("dueDate")}
                onChange={(date) => {
                  setValue("dueDate", date, { shouldValidate: true });
                  dateValidation(date, "dueDate");
                }}
                dateFormat="MMM dd, yyyy"
                className="form-control p-2"
                customInput={<CustomInput />}
              /> */}
              <DatePicker
                selected={watch("dueDate")}
                onChange={(date) => {
                  setValue("dueDate", date, { shouldValidate: true });
                  dateValidation(date, "dueDate");
                }}
                dateFormat="MMM dd, yyyy"
                placeholderText="Select date"
                customInput={<CustomDatePickerInput />}
                name="from-date"
                id="from-date"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                popperPlacement="bottom"
                popperProps={{
                  positionFixed: true,
                }}
              />
            </div>
            <div className="mt-5">
              <label htmlFor="purchaseDate">
                Purchase Date <span className="text-danger">*</span>
              </label>
              {/* <input
                type="date"
                id="purchaseDate"
                required
                {...register("purchaseDate", {
                  onChange: (e) => {
                    if (e.target.value) {
                      dateValidation(e.target.value, "purchaseDate");
                    }
                  },
                })}
                className="form-control py-2 ps-2"
                style={{ paddingLeft: "1rem" }}
              /> */}
              <div>
                {/* <DatePicker
                  selected={watch("purchaseDate")}
                  onChange={(date) => {
                    setValue("purchaseDate", date, { shouldValidate: true });
                    dateValidation(date, "purchaseDate");
                  }}
                  dateFormat="MMM dd, yyyy"
                  className="form-control p-2"
                  customInput={<CustomInput />}
                /> */}
                <DatePicker
                  className="form-control p-2"
                  selected={watch("purchaseDate")}
                  onChange={(date) => {
                    setValue("purchaseDate", date, { shouldValidate: true });
                    dateValidation(date, "purchaseDate");
                  }}
                  dateFormat="MMM dd, yyyy"
                  placeholderText="Select date"
                  customInput={<CustomDatePickerInput />}
                  name="from-date"
                  id="from-date"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  popperPlacement="bottom"
                  popperProps={{
                    positionFixed: true,
                  }}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description">Remarks</label>
              <textarea
                id="description"
                {...register("description")}
                className="form-control p-2"
                rows={3}
              ></textarea>
            </div>
          </div>
        </div>
        <div className="w-100 mt-4 d-flex align-items-center">
          <span>Weight Details</span>
          <hr className="flex-grow-1 mx-3" />
        </div>

        <div className="row mx-auto p-2">
          {/* <div className="col-sm">
            <label htmlFor="weightedQuantity">
              Weighted Quantity <span className="text-primary">*</span>
            </label>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <div className="input-group-text p-3 text-secondary">kg</div>
              </div>
              <input
                type="text"
                onInput={onInputFloat}
                required
                {...register("weightedQuantity")}
                className="form-control p-2"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="col-sm">
            <label htmlFor="netWeight">
              Net Weight <span className="text-primary">*</span>
            </label>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <div className="input-group-text p-3 text-secondary">kg</div>
              </div>
              <input
                type="text"
                onInput={onInputFloat}
                required
                {...register("netWeight")}
                className="form-control p-2"
                placeholder="0.00"
              />
            </div>
          </div> */}
          <div className="col-sm">
            <label htmlFor="weighingFee">
              Weighing Fee <span className="text-danger">*</span>
            </label>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <div className="input-group-text p-3 text-secondary">
                  {currencySymbol[findCurrencyName?.currency_name ?? "PHP"]}
                </div>
              </div>
              <input
                type="text"
                onInput={onInputFloat}
                required
                {...register("weighingFee", {
                  onChange: (e) => {
                    const formattedValue = formatNumber(e.target.value);
                    setValue("weighingFee", formattedValue);
                  },
                })}
                // onChange={(e) =>
                //   setValue("weighingFee", formatNumber(e.target.value))
                // }
                className="form-control p-2"
                placeholder="0"
              />
            </div>
          </div>
          <div className="col-sm"></div>
        </div>
        <div className="w-100 mt-4">
          <label htmlFor="" className="mb-2">
            Item List
          </label>
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th className="p-2">Product Code</th>
                  <th className="p-2">
                    Product Name <span className="text-danger">*</span>
                  </th>
                  <th className="p-2">
                    Weight <span className="text-danger">*</span>
                  </th>
                  <th className="p-2">
                    Moisture <span className="text-danger">*</span>
                  </th>
                  <th className="p-2">Net Weight</th>
                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Unit Price
                  </th>

                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Subtotal
                  </th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="hidden"
                        {...register(`items.${index}.productId`)}
                        className="form-control form-control-sm p-2"
                        readOnly
                      />
                      <input
                        {...register(`items.${index}.productCode`)}
                        className="form-control form-control-sm p-2"
                        readOnly
                      />
                    </td>
                    <td>
                      <select
                        required
                        {...register(`items.${index}.product_vendor_id`)}
                        className="form-select form-select-sm p-2"
                        onChange={(e) => {
                          const selectedValue = String(e.target.value, 10);
                          const selectedProduct = product.find(
                            (p) => String(p.id) === selectedValue
                          );

                          const selectedPayableProduct =
                            payableProduct.findLast(
                              (p) => p.product_vendor_id === selectedValue
                            );

                          console.log(selectedPayableProduct);

                          if (selectedPayableProduct) {
                            setValue(
                              `items.${index}.unitPrice`,
                              formatNumberWithCommas(
                                selectedPayableProduct.unitPrice
                              )
                            );
                            console.log("payableProduct");
                          } else {
                            setValue(
                              `items.${index}.unitPrice`,
                              formatNumberWithCommas(
                                selectedProduct.product_price
                              )
                            );
                            console.log("product");
                          }

                          if (selectedProduct) {
                            setValue(
                              `items.${index}.productId`,
                              selectedProduct.product_list.product_id
                            );
                            setValue(
                              `items.${index}.productName`,
                              selectedProduct.product_list.product_name
                            );
                            setValue(
                              `items.${index}.productCode`,
                              selectedProduct.product_list.product_code
                            );
                            // setValue(
                            //   `items.${index}.unitPrice`,
                            //   selectedProduct.product_price
                            // );
                            // Trigger calculation for totalPrice
                            const weight = watch(`items.${index}.weight`);
                            setValue(
                              `items.${index}.totalPrice`,
                              weight * selectedProduct.product_price
                            );
                            const totalPrice = watch(
                              `items.${index}.totalPrice`
                            );
                            calculateTotalMoisture();
                          }
                        }}
                      >
                        <option value="" disabled>
                          Select Product
                        </option>
                        {product.map((data) => (
                          <option key={data.id} value={data.id}>
                            {data.product_list.product_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Weight */}
                    <td>
                      <input
                        required
                        type="text"
                        onInput={onInputFloat}
                        {...register(`items.${index}.weight`, {
                          onChange: (e) => {
                            const weight = formatNumber(e.target.value);
                            const unitPrice =
                              watch(`items.${index}.unitPrice`) || 0;

                            const formatWeight = parseFloat(
                              String(weight).replace(/,/g, "")
                            );

                            setValue(
                              `items.${index}.totalPrice`,
                              formatWeight * unitPrice
                            );

                            setValue(`items.${index}.weight`, weight);
                            calculateTotalMoisture();
                            calculateNetWeight(index);
                          },
                        })}
                        className="form-control form-control-sm p-2"
                        disabled={!watch(`items.${index}.productName`)}
                      />
                    </td>
                    {/* Moisture */}
                    <td>
                      {/* <input
                        type="text"
                        onInput={onInputFloat}
                        required
                        {...register(`items.${index}.moisture`)}
                        className="form-control form-control-sm p-2"
                      /> */}
                      <div className="input-group mb-3" key={item.id}>
                        <input
                          type="text"
                          onInput={onInputFloat}
                          {...register(`items.${index}.moisture`, {
                            onChange: (e) => {
                              let value = e.target.value;

                              if (parseFloat(value) > 100) {
                                swal({
                                  icon: "error",
                                  title: "Moisture should not exceed 100",
                                  text: "Percentage discount cannot exceed 100%.",
                                }).then(() => {
                                  e.target.value = "";
                                });

                                return;
                              }

                              // Remove non-numeric characters except a single decimal point
                              value = value.replace(/[^0-9.]/g, "");

                              // Ensure only one decimal point
                              const decimalCount = (value.match(/\./g) || [])
                                .length;
                              if (decimalCount > 1) {
                                value = value.slice(0, -1);
                              }

                              // Convert to float, but do not remove decimals prematurely
                              let numericValue = value ? parseFloat(value) : 0;

                              // Ensure moisture does not exceed 100
                              if (numericValue > 100) {
                                numericValue = 100;
                              }

                              // Ensure value is formatted correctly
                              const formattedValue = formatNumber(value); // Use `value` instead of `numericValue.toString()`

                              setValue(
                                `items.${index}.moisture`,
                                formattedValue
                              );
                              calculateTotalMoisture();
                              calculateNetWeight(index);
                            },
                          })}
                          required
                          className="form-control form-control-sm p-2"
                          disabled={!watch(`items.${index}.productName`)}
                        />

                        <span
                          style={{
                            cursor: !watch(`items.${index}.productName`)
                              ? "not-allowed"
                              : "pointer",
                          }}
                          // onClick={() => {
                          //   if (!watch(`items.${index}.productName`)) return;
                          //   const currentUnit = watch(
                          //     `items.${index}.moistureType`
                          //   );
                          //   const newUnit = currentUnit === "₱" ? "%" : "₱";
                          //   setValue(`items.${index}.moistureType`, newUnit);
                          //   calculateTotalMoisture(); // Recalculate after changing the unit
                          //   calculateNetWeight(index);
                          // }}
                          className="input-group-text"
                          id="basic-addon2"
                        >
                          {watch(`items.${index}.moistureType`)}
                        </span>
                        <input
                          type="hidden"
                          {...register(`items.${index}.moistureType`)}
                        />
                        <input
                          type="hidden"
                          {...register(`items.${index}.totalPrice`)}
                        />
                      </div>
                    </td>
                    {/* Net Weight */}
                    <td>
                      <input
                        required
                        type="text"
                        // readOnly
                        onInput={onInputFloat}
                        {...register(`items.${index}.net_weight`, {
                          onChange: (e) => {
                            calculateMoisture(index, e.target.value);
                          },
                        })}
                        className="form-control form-control-sm p-2"
                        disabled={!watch(`items.${index}.productName`)}
                      />
                    </td>
                    {/* <td>{`₱ ${watch(`items.${index}.unitPrice`)}`}</td>
                    <td>{`₱ ${watch(`items.${index}.totalPrice`)}`}</td> */}
                    <td
                      className={
                        roleType?.includes("Management") ? "" : "d-none"
                      }
                    >
                      <input
                        onInput={onInputFloat}
                        // {...register(`items.${index}.unitPrice`)}
                        {...register(`items.${index}.unitPrice`, {
                          onChange: (e) => {
                            const formattedValue = formatNumber(e.target.value);
                            setValue(
                              `items.${index}.unitPrice`,
                              formattedValue
                            );
                            calculateTotalMoisture();
                            calculateNetWeight(index);
                          },
                        })}
                        className="form-control form-control-sm p-2"
                        disabled={!watch(`items.${index}.productName`)}
                        // readOnly
                        // onChange={(e) => {
                        //   const unitPrice =
                        //     formatNumberWithCommas(e.target.value) || "";
                        //   setValue(`items.${index}.unitPrice`, unitPrice);
                        // }}
                      />
                    </td>
                    <td
                      className={
                        roleType?.includes("Management") ? "" : "d-none"
                      }
                    >
                      <input
                        {...register(`items.${index}.totalPrice`)}
                        className="form-control form-control-sm p-2"
                        readOnly
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          if (fields.length > 1) {
                            remove(index);
                          } else {
                            swal({
                              title: "Oops!",
                              text: "Cannot delete the last item",
                              icon: "warning",
                              buttons: false,
                              timer: 2000,
                              dangerMode: true,
                            });
                          }
                        }}
                        disabled={fields.length === 1}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-end mt-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={addNewItem}
            >
              New Item
            </button>
          </div>
        </div>
        <div
          className={`row mx-auto p-2 mt-4 ${
            roleType?.includes("Management") ? "" : "d-none"
          }`}
        >
          <div className="col-sm"></div>
          <div className="col-sm border-end">
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Weighted : </span>
              <span className="text-secondary">
                {calculateTotalWeightInKilo.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}{" "}
                (Kg)
              </span>
            </div>
            {/* <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Net Weight</span>
              <span className="text-secondary">
                {watch(`netWeight`) || "0.00"}
              </span>
            </div> */}
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Moisture :</span>
              <span className="text-danger">
                {calculateTotalMoistureInKilo.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}{" "}
                (Kg)
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Net Weight :</span>
              <span className="text-danger">
                {calculateTotalNetWeightInKilo.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}{" "}
                (Kg)
              </span>
            </div>
          </div>
          <div className="col-sm">
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Weighted Amount</span>
              <span className="text-secondary">
                {totalWeight.toLocaleString(
                  "en-US",
                  dynamicCurrencyOptions(findCurrencyName)
                )}
              </span>
            </div>
            {/* <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Net Weight</span>
              <span className="text-secondary">
                {watch(`netWeight`) || "0.00"}
              </span>
            </div> */}
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Amount of Moisture</span>
              <span className="text-danger">
                {totalMoisture.toLocaleString(
                  "en-US",
                  dynamicCurrencyOptions(findCurrencyName)
                )}
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Net Weight Amount</span>
              <span className="text-danger">
                {(totalWeight - totalMoisture).toLocaleString(
                  "en-US",
                  dynamicCurrencyOptions(findCurrencyName)
                )}
              </span>
            </div>

            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Weighing Fee</span>
              <span className="text-danger">
                {" "}
                {parseFloat(
                  watch("weighingFee")?.replace(/,/g, "") || 0
                ).toLocaleString(
                  "en-US",
                  dynamicCurrencyOptions(findCurrencyName)
                ) || "0.00"}
              </span>
            </div>

            {otherFees.map((fee, index) => (
              <div
                key={index}
                className="w-100 d-flex flex-row justify-content-between p-2"
              >
                <input
                  required
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Fee Name"
                  value={fee.feeName}
                  onChange={(e) =>
                    handleFeeChange(index, "feeName", e.target.value)
                  }
                />
                <input
                  required
                  type="text"
                  onInput={onInputFloat}
                  className="form-control form-control-sm text-danger"
                  placeholder="Fee Amount"
                  value={formatNumberWithCommas(fee.feeAmount)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, "");
                    handleFeeChange(index, "feeAmount", rawValue);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeFee(index)}
                >
                  X
                </button>
              </div>
            ))}
            <div className="w-100 d-flex flex-row justify-content-between p-2 border-bottom">
              <span>Other Fee</span>
              <button
                type="button"
                onClick={addNewFee}
                className="border-0 text-primary bg-white p-0"
              >
                Add
              </button>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Subtotal</span>
              <span className="text-secondary">
                {(
                  parseFloat(totalWeight) -
                  parseFloat(totalMoisture) -
                  (parseFloat(watch(`weighingFee`)?.replace(/,/g, "")) || 0) -
                  totalFees
                ).toLocaleString(
                  "en-US",
                  dynamicCurrencyOptions(findCurrencyName)
                )}
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span
                className="w-100"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setIsPercent(!isPercent);
                  calculateDiscount();
                }}
                id="basic-addon2"
              >
                Discount (
                <span className="mx-1 custom-font">
                  {isPercent === true
                    ? "%"
                    : currencySymbol[findCurrencyName?.currency_name || "PHP"]}
                </span>
                )
              </span>

              <Form.Control
                type="text"
                onInput={(e) => {
                  onInputFloat(e);
                  calculateDiscount();
                }}
                value={primary_discount}
                onChange={handleInputChange}
                placeholder="0.00"
                style={{
                  border: "none",
                  outline: "none",
                  maxWidth: "120px",
                  paddingRight: validated ? "2rem" : "0.5rem",
                }}
                className="form-control form-control-sm py-2 text-danger text-end fs-6 border-bottom"
              />
            </div>

            {/* <div>
              <h3>Other Fees:</h3>
              <pre>{JSON.stringify(otherFees, null, 2)}</pre>
            </div> */}
            <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
              <span className="text-white">Total Amount:</span>
              <span className="text-white text-underline">
                {totalAmount.toLocaleString(
                  "en-US",
                  dynamicCurrencyOptions(findCurrencyName)
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="w-100 text-end mb-3 mt-4">
          <button className="btn btn-primary title-button">Save</button>
        </div>
      </Form>
    </div>
  );
};

export default CreatePayable;
