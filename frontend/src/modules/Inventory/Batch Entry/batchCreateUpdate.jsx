import "@fortawesome/fontawesome-free/css/all.min.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import axios from "axios";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { Form, Modal } from "react-bootstrap";
import { MultiSelect } from "react-multi-select-component";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import {
  CollapsibleContainer,
  useCollapsibleSections,
} from "../../../hooks/customHook/useCollapsibleSections";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import "../../styles/accounting.css";
const BatchEntryCreateUpdate = ({ authrztn }) => {
  const navigate = useNavigate();
  const { toggleSection, isOpen } = useCollapsibleSections();
  const userLoggedID = useDecodeToken();
  const { id, postProduction } = useParams();
  const [validated, setValidated] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [mixerData, setMixerData] = useState([]);
  const [salesInvoiceData, setSalesInvoiceData] = useState([]);
  const [selectedMixer, setSelectedMixer] = useState([]);
  const [selectedSalesInvoice, setSelectedSalesInvoice] = useState([]);
  const [transactionId, setTransactionId] = useState("");
  const [openRows, setOpenRows] = useState(null);
  const [openProductRows, setOpenProductRows] = useState(null);
  const [productSalesData, setProductSalesData] = useState({});
  const [rawMaterialsData, setRawMaterialsData] = useState({});
  const [showRawMaterials, setShowRawMaterials] = useState(false);
  const [availableRawMaterials, setAvailableRawMaterials] = useState([]);
  const [selectedMaterialToReplace, setSelectedMaterialToReplace] = useState(
    []
  );
  const [currentRawMaterials, setCurrentRawMaterials] = useState([]);
  const [selectedReplacements, setSelectedReplacements] = useState(new Set());
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [modalMode, setModalMode] = useState("replace");
  const [formData, setFormData] = useState({
    batchName: "",
    batchStatus: "For-Printing",
    batchRemarks: "",
    postProductionStatus: "",
    startDate: null,
    endDate: null,
  });

  const [costItems, setCostItems] = useState([]);
  const costAddNewItem = () => {
    const newItem = {
      id: Date.now(),
      costType: "",
      amount: "0",
      remarks: "",
    };
    setCostItems([...costItems, newItem]);
  };

  const costUpdateItem = (id, field, value) => {
    setCostItems(
      costItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const costRemoveItem = (id) => {
    setCostItems(costItems.filter((item) => item.id !== id));
  };

  const handleBatchFieldsChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchTransactionCode = () => {
    const now = new Date();
    const manilaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const formattedDateTime = manilaTime
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);
    const randomTwoDigits = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");

    const prefix = "B";
    const customTransactionId = `${prefix}-${formattedDateTime}${randomTwoDigits}`;
    setTransactionId(customTransactionId);
  };

  const fetchMixerData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/batchEntry/mixerForBatchEntry`);
      setMixerData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSalesInvoiceData = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/batchEntry/salesDRForBatchEntry`,
        {
          params: {
            batchEntryId: id, // only if updating
          },
        }
      );

      setSalesInvoiceData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const mixerOptions = mixerData.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const salesOptions = salesInvoiceData.map((item) => ({
    label: item.delivery_number,
    value: item.sales_invoice_id,
  }));

  const fetchSpecificBatchEntryData = async (batchEntryId) => {
    try {
      if (salesInvoiceData.length === 0) {
        // console.log("Sales invoice data not loaded yet, fetching...");
        await fetchSalesInvoiceData();
      }

      const response = await axios.get(
        `${BASE_URL}/batchEntry/getSpecificBatchEntry`,
        {
          params: { id: batchEntryId },
        }
      );

      if (response.data) {
        const data = response.data;

        setTransactionId(data.batch_transaction_number);
        setFormData({
          batchName: data.batch_name || "",
          batchStatus: data.status || "",
          batchRemarks: data.batch_remarks || "",
          startDate: data.start_date ? dayjs(data.start_date) : null,
          endDate: data.end_date ? dayjs(data.end_date) : null,
        });

        const mixers =
          data.batch_entry_tag_mixers
            ?.filter(
              (mixer) => !mixer.isDeleted && mixer.mixer && mixer.mixer.name
            )
            .map((mixer) => ({
              id: mixer.id,
              label: mixer.mixer.name,
              value: mixer.mixer.id,
            })) || [];

        setSelectedMixer(mixers);

        const salesInvoices =
          data.batch_entry_tag_invoices
            ?.filter(
              (invoice) =>
                !invoice.isDeleted &&
                invoice.sales_invoice &&
                invoice.sales_invoice.delivery_number &&
                invoice.sales_invoice.delivery_number.trim() !== ""
            )
            .map((invoice) => ({
              id: invoice.id,
              label: invoice.sales_invoice.delivery_number,
              value: invoice.sales_invoice.sales_invoice_id,
            })) || [];

        setSelectedSalesInvoice(salesInvoices);

        const costs =
          data.batch_entry_tag_costs
            ?.filter((cost) => !cost.isDeleted)
            .map((cost) => ({
              id: cost.id,
              costType: cost.cost_type || "",
              amount: cost.cost_amount?.toString() || "0",
              remarks: cost.remarks || "",
            })) || [];

        setCostItems(costs);

        if (salesInvoices.length > 0) {
          const rawMaterials =
            data.batch_entry_tag_raw_materials
              ?.filter((raw) => !raw.isDeleted)
              .map((raw) => {
                const isReplacement = raw.is_replacement;
                const materialData = isReplacement
                  ? raw.replacement_material
                  : raw.original_material;

                const productData = materialData?.product_list;

                return {
                  id: raw.id,
                  product_tag_vendor_id: materialData?.id,
                  original_product_tag_vendor_id:
                    raw.original_product_tag_vendor_id,
                  replacement_product_tag_vendor_id:
                    raw.replacement_product_tag_vendor_id,
                  is_replacement: raw.is_replacement,
                  editableQuantity: raw.quantity_required,
                  totalQuantityRequired: raw.quantity_required,
                  status: raw.status,
                  product_tag_vendor: {
                    ...materialData,
                    product_list: productData,
                    vendor: materialData?.vendor,
                  },

                  originalMaterial: isReplacement
                    ? {
                        product_tag_vendor_id: raw.original_material?.id,
                        product_code:
                          raw.original_material?.product_list?.product_code ||
                          raw.original_material?.product_list?.client_code,
                        product_name:
                          raw.original_material?.product_list?.product_name,
                        product_category:
                          raw.original_material?.product_list?.product_category,
                        packaging_name:
                          raw.original_material?.product_list?.prod_packaging
                            ?.packaging_name,
                      }
                    : null,
                };
              }) || [];

          setCurrentRawMaterials(rawMaterials);
        }
      } else {
        console.error("No data received from API");
      }
    } catch (error) {
      console.error("Error fetching batch entry:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      swal({
        title: "Error",
        text:
          "Failed to fetch batch entry data: " +
          (error.response?.data?.message || error.message),
        icon: "error",
        buttons: false,
        timer: 3000,
      });
    }
  };

  // upon clicking ng sales invoice row to be fetched ang data ng product
  const handleRowToggle = async (salesInvoiceId) => {
    try {
      if (!productSalesData[salesInvoiceId]) {
        const res = await axios.get(
          BASE_URL + "/batchEntry/productSalesForBatchEntry",
          {
            params: { salesInvoiceId: salesInvoiceId },
          }
        );

        // Store the data for this specific invoice
        setProductSalesData((prev) => ({
          ...prev,
          [salesInvoiceId]: res.data,
        }));
      }

      setOpenRows((prevOpenRow) =>
        prevOpenRow === salesInvoiceId ? null : salesInvoiceId
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowProductToggle = async (prodId, salesInvoiceId) => {
    try {
      const key = `${salesInvoiceId}_${prodId}`;
      if (!rawMaterialsData[key]) {
        const res = await axios.get(
          BASE_URL + "/batchEntry/productRawMaterials",
          {
            params: { prodId: prodId },
          }
        );

        // Store the raw materials data
        setRawMaterialsData((prev) => ({
          ...prev,
          [key]: res.data,
        }));
      }

      setOpenProductRows((prevOpenRowProd) =>
        prevOpenRowProd === prodId ? null : prodId
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([fetchMixerData(), fetchSalesInvoiceData()]);

        fetchTransactionCode();

        if (id) {
          setIsUpdate(true);
          await fetchSpecificBatchEntryData(id);
        } else {
          setIsUpdate(false);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();
  }, [id]);

  const fetchAvailableRawMaterials = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/batchEntry/getRawMaterialsForBatchEntry`
      );
      setAvailableRawMaterials(res.data);
    } catch (error) {
      console.error("Error fetching available raw materials:", error);
    }
  };

  const fetchAllRawMaterials = async (selectedInvoices) => {
    try {
      const allRawMaterials = [];

      for (const invoice of selectedInvoices) {
        const matchedData = salesInvoiceData.find(
          (item) => item.sales_invoice_id === invoice.value
        );

        if (matchedData) {
          let productSalesForInvoice =
            productSalesData[matchedData.sales_invoice_id];

          if (!productSalesForInvoice) {
            const productRes = await axios.get(
              BASE_URL + "/batchEntry/productSalesForBatchEntry",
              {
                params: { salesInvoiceId: matchedData.sales_invoice_id },
              }
            );
            productSalesForInvoice = productRes.data;
            setProductSalesData((prev) => ({
              ...prev,
              [matchedData.sales_invoice_id]: productRes.data,
            }));
          }

          for (const product of productSalesForInvoice) {
            const rawMaterialKey = `${matchedData.sales_invoice_id}_${product.product_id}`;

            let rawMaterialsForProduct = rawMaterialsData[rawMaterialKey];

            if (!rawMaterialsForProduct) {
              const rawRes = await axios.get(
                BASE_URL + "/batchEntry/productRawMaterials",
                {
                  params: { prodId: product.product_id },
                }
              );
              rawMaterialsForProduct = rawRes.data;

              setRawMaterialsData((prev) => ({
                ...prev,
                [rawMaterialKey]: rawRes.data,
              }));
            }

            rawMaterialsForProduct.forEach((rawMaterial) => {
              const quantityRequired = product.quantity * rawMaterial.weight;

              const displayCode =
                rawMaterial.product_tag_vendor?.product_list?.product_code ||
                rawMaterial.product_tag_vendor?.product_list?.client_code;

              const existingIndex = allRawMaterials.findIndex(
                (item) =>
                  item.product_tag_vendor_id ===
                  rawMaterial.product_tag_vendor_id
              );

              if (existingIndex !== -1) {
                allRawMaterials[existingIndex].totalQuantityRequired +=
                  quantityRequired;
                allRawMaterials[existingIndex].editableQuantity +=
                  quantityRequired;
              } else {
                // If new, add to the array
                allRawMaterials.push({
                  ...rawMaterial,
                  totalQuantityRequired: quantityRequired,
                  editableQuantity: quantityRequired,
                  originalQuantity: product.quantity,
                  productName: product.product_list?.product_name,
                  deliveryNumber: matchedData.delivery_number,
                  status: "Original",
                });
              }
            });
          }
        }
      }

      setCurrentRawMaterials(allRawMaterials);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  const handleQuantityChange = (productTagVendorId, inputValue) => {
    // Remove commas
    const cleanedValue = inputValue.replace(/,/g, "");

    // Parse float
    const parsedValue = parseFloat(cleanedValue);

    // Format with commas
    const formattedValue = isNaN(parsedValue)
      ? ""
      : parsedValue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

    setCurrentRawMaterials((prevMaterials) =>
      prevMaterials.map((material) =>
        material.product_tag_vendor_id === productTagVendorId
          ? {
              ...material,
              editableQuantity: formattedValue, // for display
              rawQuantity: parsedValue || 0, // for DB usage
            }
          : material
      )
    );
  };
  const handleReplaceRawMaterial = async (productTagVendorId) => {
    try {
      const materialToReplace = currentRawMaterials.find(
        (material) => material.product_tag_vendor_id === productTagVendorId
      );

      if (materialToReplace) {
        setSelectedMaterialToReplace(materialToReplace);
        setModalMode("replace");
        const currentMaterialId = materialToReplace.product_tag_vendor_id;
        setSelectedReplacements(new Set([currentMaterialId]));

        if (availableRawMaterials.length === 0) {
          await fetchAvailableRawMaterials();
        }

        setShowRawMaterials(true);
      }
    } catch (error) {
      console.error("Error preparing replacement modal:", error);
    }
  };

  const handleAddRawMaterial = async () => {
    try {
      setModalMode("additional");
      setSelectedMaterialToReplace(null);
      setSelectedReplacements(new Set());

      if (availableRawMaterials.length === 0) {
        await fetchAvailableRawMaterials();
      }

      setShowRawMaterials(true);
    } catch (error) {
      console.error("Error preparing additional material modal:", error);
    }
  };

  const handleCheckboxChange = (materialId, isChecked) => {
    setSelectedReplacements((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(materialId);
      } else {
        newSet.delete(materialId);
      }
      return newSet;
    });
  };

  const confirmReplacement = () => {
    if (
      modalMode === "replace" &&
      selectedMaterialToReplace &&
      selectedReplacements.size > 0
    ) {
      const selectedReplacementIds = Array.from(selectedReplacements);
      const originalId = selectedMaterialToReplace.product_tag_vendor_id;
      const newReplacementId = selectedReplacementIds.find(
        (id) => id !== originalId
      );

      if (newReplacementId) {
        const newRawMaterial = availableRawMaterials.find(
          (material) => material.id === newReplacementId
        );

        if (newRawMaterial) {
          setCurrentRawMaterials((prevMaterials) =>
            prevMaterials.map((material) =>
              material.product_tag_vendor_id === originalId
                ? {
                    ...material,
                    original_product_tag_vendor_id: originalId,
                    product_tag_vendor: newRawMaterial,
                    product_tag_vendor_id: newRawMaterial.id,
                    status: "Replaced",
                    is_replacement: true,
                    originalMaterial: {
                      product_tag_vendor_id:
                        selectedMaterialToReplace.product_tag_vendor_id,
                      product_code:
                        selectedMaterialToReplace.product_tag_vendor
                          ?.product_list?.product_code ||
                        selectedMaterialToReplace.product_tag_vendor
                          ?.product_list?.client_code,
                      product_name:
                        selectedMaterialToReplace.product_tag_vendor
                          ?.product_list?.product_name,
                      product_category:
                        selectedMaterialToReplace.product_tag_vendor
                          ?.product_list?.product_category,
                      packaging_name:
                        selectedMaterialToReplace.product_tag_vendor
                          ?.product_list?.prod_packaging?.packaging_name,
                      replaced_at: new Date().toLocaleString(),
                    },
                    replacementHistory: [
                      ...(material.replacementHistory || []),
                      {
                        from: {
                          product_tag_vendor_id:
                            selectedMaterialToReplace.product_tag_vendor_id,
                          product_code:
                            selectedMaterialToReplace.product_tag_vendor
                              ?.product_list?.product_code ||
                            selectedMaterialToReplace.product_tag_vendor
                              ?.product_list?.client_code,
                          product_name:
                            selectedMaterialToReplace.product_tag_vendor
                              ?.product_list?.product_name,
                        },
                        to: {
                          product_tag_vendor_id: newRawMaterial.id,
                          product_code:
                            newRawMaterial.product_list?.product_code ||
                            newRawMaterial.product_list?.client_code,
                          product_name:
                            newRawMaterial.product_list?.product_name,
                        },
                        replaced_at: new Date().toLocaleString(),
                      },
                    ],
                  }
                : material
            )
          );
        }
      }
    }

    closeModal();
  };

  const confirmAdditional = () => {
    if (modalMode === "additional" && selectedReplacements.size > 0) {
      const selectedMaterialIds = Array.from(selectedReplacements);

      // Filter out materials that already exist in currentRawMaterials (both Original and Additional)
      const existingMaterialIds = currentRawMaterials.map(
        (material) => material.product_tag_vendor_id
      );

      const newMaterials = selectedMaterialIds
        .filter((materialId) => !existingMaterialIds.includes(materialId))
        .map((materialId) => {
          const rawMaterial = availableRawMaterials.find(
            (material) => material.id === materialId
          );

          if (rawMaterial) {
            return {
              product_tag_vendor_id: rawMaterial.id,
              product_tag_vendor: rawMaterial,
              totalQuantityRequired: 0,
              editableQuantity: 0,
              status: "Additional",
              is_additional: true,
              deliveryNumber: null,
              productName: null,
              originalQuantity: 0,
            };
          }
          return null;
        })
        .filter((material) => material !== null);

      if (newMaterials.length > 0) {
        setCurrentRawMaterials((prevMaterials) => [
          ...prevMaterials,
          ...newMaterials,
        ]);
      }

      const duplicateMaterialIds = selectedMaterialIds.filter((materialId) =>
        existingMaterialIds.includes(materialId)
      );

      if (duplicateMaterialIds.length > 0) {
        const duplicateMaterialNames = duplicateMaterialIds.map(
          (materialId) => {
            const material = availableRawMaterials.find(
              (m) => m.id === materialId
            );
            return material?.product_list?.product_name || "Unknown";
          }
        );

        alert(
          `The following materials already exist in the raw materials list and were not added:\n${duplicateMaterialNames.join(
            "\n"
          )}`
        );
      }
    }

    closeModal();
  };

  const handleDeleteMaterial = (productTagVendorId) => {
    const materialToDelete = currentRawMaterials.find(
      (material) => material.product_tag_vendor_id === productTagVendorId
    );

    if (materialToDelete) {
      const materialName =
        materialToDelete.product_tag_vendor?.product_list?.product_name ||
        "this material";
      const materialStatus = materialToDelete.status;

      swal({
        title: "Are you sure?",
        text: `Do you want to delete "${materialName}" (${materialStatus})?`,
        icon: "warning",
        buttons: ["Cancel", "Delete"],
        dangerMode: true,
      }).then((willDelete) => {
        if (willDelete) {
          setCurrentRawMaterials((prevMaterials) =>
            prevMaterials.filter(
              (material) =>
                material.product_tag_vendor_id !== productTagVendorId
            )
          );

          if (openDropdownId === productTagVendorId) {
            setOpenDropdownId(null);
          }

          swal("Deleted!", `"${materialName}" has been removed.`, "success");
        }
      });
    }
  };

  const closeModal = () => {
    setShowRawMaterials(false);
    setSelectedMaterialToReplace(null);
    setSelectedReplacements(new Set());
    setModalMode("replace");
  };

  const getFilteredAvailableRawMaterials = () => {
    if (modalMode === "additional") {
      const existingMaterialIds = currentRawMaterials.map(
        (material) => material.product_tag_vendor_id
      );

      return availableRawMaterials.filter(
        (material) => !existingMaterialIds.includes(material.id)
      );
    }

    return availableRawMaterials;
  };

  const getModalTitle = () => {
    if (modalMode === "replace") {
      return `Replace Raw Material ${
        selectedMaterialToReplace
          ? `(${
              selectedMaterialToReplace.product_tag_vendor?.product_list
                ?.product_code ||
              selectedMaterialToReplace.product_tag_vendor?.product_list
                ?.client_code
            })`
          : ""
      }`;
    }
    return "Add Additional Raw Materials";
  };

  const getConfirmButtonText = () => {
    if (modalMode === "replace") {
      return `Confirm Replacement (${selectedReplacements.size} selected)`;
    }
    return `Add Materials (${selectedReplacements.size} selected)`;
  };

  const handleConfirm = () => {
    if (modalMode === "replace") {
      confirmReplacement();
    } else {
      confirmAdditional();
    }
  };

  const toggleDropdown = (materialId) => {
    setOpenDropdownId((prevId) => (prevId === materialId ? null : materialId));
  };

  const filteredAvailableRawMaterials = getFilteredAvailableRawMaterials();

  const handleDeliveryReceiptChange = (selectedValues) => {
    setSelectedSalesInvoice(selectedValues);
    if (selectedValues.length > 0) {
      fetchAllRawMaterials(selectedValues);
    } else {
      setCurrentRawMaterials([]);
    }
  };

  const handleSubmitFormulation = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      const confirmMessage = isUpdate
        ? "Update this batch entry?"
        : "Create this new batch entry?";

      swal({
        title: confirmMessage,
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const endpoint = isUpdate
            ? `${BASE_URL}/batchEntry/updateBatchEntry`
            : `${BASE_URL}/batchEntry/createBatchEntry`;

          const requestData = {
            transaction_id: transactionId,
            batch_name: formData.batchName,
            batch_status: formData.batchStatus,
            batch_remarks: formData.batchRemarks,
            production_status: formData.postProductionStatus,
            start_date: formData.startDate
              ? formData.startDate.toISOString()
              : null,
            end_date: formData.endDate ? formData.endDate.toISOString() : null,

            mixer_ids: selectedMixer.map((mixer) => ({
              value: mixer.value,
              ...(isUpdate && mixer.id && { tag_id: mixer.id }),
            })),
            sales_invoice_ids: selectedSalesInvoice.map((invoice) => ({
              value: invoice.value,
              ...(isUpdate && invoice.id && { tag_id: invoice.id }),
            })),
            rawMaterials: currentRawMaterials.map((material) => {
              const baseMaterial = {
                quantity_required: parseFloat(material.editableQuantity) || 0,
                status: material.status,

                ...(isUpdate && material.id && { tag_id: material.id }),
              };

              if (
                material.is_replacement &&
                material.original_product_tag_vendor_id
              ) {
                // replaced material
                return {
                  ...baseMaterial,
                  original_product_tag_vendor_id:
                    material.original_product_tag_vendor_id,
                  replacement_product_tag_vendor_id:
                    material.product_tag_vendor_id,
                  is_replacement: true,
                };
              } else {
                // original material or additional
                return {
                  ...baseMaterial,
                  original_product_tag_vendor_id:
                    material.product_tag_vendor_id,
                  replacement_product_tag_vendor_id: null,
                  is_replacement: false,
                };
              }
            }),
            cost_items: costItems.map((item) => ({
              cost_type: item.costType,
              amount: parseFloat(item.amount) || 0,
              remarks: item.remarks,
              ...(isUpdate && item.id && { tag_id: item.id }),
            })),
            userLoggedID,
          };

          if (isUpdate) {
            requestData.id = id;
          }
          axios
            .post(endpoint, requestData)
            .then((res) => {
              if (res.status === 200) {
                const successMessage = isUpdate
                  ? "Batch entry updated successfully"
                  : "Batch entry created successfully";

                swal({
                  title: "Success",
                  text: successMessage,
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  if (postProduction === "isPostProduction") {
                    navigate("/inventory/post-production");
                    window.scrollTo(0, 0);
                  } else {
                    navigate("/inventory/batch-entry");
                    window.scrollTo(0, 0);
                  }
                });
              } else if (res.status === 205) {
                swal({
                  title: "Error",
                  text: "",
                  icon: "error",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
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
            .catch((err) => {
              swal({
                title: "Request Failed",
                text: err.response?.data?.message || "Unknown error occurred",
                icon: "error",
                timer: 2000,
              });
            });
        }
      });
    }
    setValidated(true);
  };

  const [selectedSearchType, setSelectedSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSearchTypeMaterials, setSelectedSearchTypeMaterials] =
    useState("all");
  const [searchQueryMaterials, setSearchQueryMaterials] = useState("");

  const [selectedSearchTypeCost, setSelectedSearchTypeCost] = useState("all");
  const [searchQueryCost, setSearchQueryCost] = useState("");
  const salesInvoiceSearchPlaceholders = {
    all: "Search by all fields",
    transaction_id: "Search by Transaction ID",
    destination: "Search by Destination",
    delivery_receipt: "Search by Delivery Receipt",
    customer: "Search by Customer",
    invoice_date: "Search by Invoice Date",
    amount: "Search by Amount",
  };

  const materialsSearchPlaceholders = {
    all: "Search by all fields",
    product_code: "Search by Product Code",
    product_name: "Search by Product Name",
    supplier: "Search by Supplier",
    uom: "Search by UOM",
    status: "Search by Status",
  };

  const costSearchPlaceholders = {
    all: "Search by all fields",
    costType: "Search by Cost Type",
    amount: "Search by Amount",
    remarks: "Search by Remarks",
  };

  const handleSelect = (type) => {
    setSelectedSearchType(type);
    setSearchQuery("");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectMaterials = (type) => {
    setSelectedSearchTypeMaterials(type);
    setSearchQueryMaterials("");
  };

  const handleSearchChangeMaterials = (e) => {
    setSearchQueryMaterials(e.target.value);
  };

  const handleSelectCost = (type) => {
    setSelectedSearchTypeCost(type);
    setSearchQueryCost("");
  };

  const handleSearchChangeCost = (e) => {
    setSearchQueryCost(e.target.value);
  };

  const filteredSalesInvoice = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedSalesInvoice;
    }

    return selectedSalesInvoice.filter((selected) => {
      const matchedData = salesInvoiceData.find(
        (item) => item.sales_invoice_id === selected.value
      );

      if (!matchedData) return false;

      const query = searchQuery.toLowerCase();

      switch (selectedSearchType) {
        case "transaction_id":
          return matchedData.transaction_id?.toLowerCase().includes(query);
        case "destination":
          return matchedData.destination?.toLowerCase().includes(query);
        case "delivery_receipt":
          return matchedData.delivery_number?.toLowerCase().includes(query);
        case "customer":
          return matchedData.customer?.company_name
            ?.toLowerCase()
            .includes(query);
        case "invoice_date":
          return matchedData.invoice_date?.toLowerCase().includes(query);
        case "amount":
          return matchedData.net_amount?.toString().includes(query);
        case "all":
        default:
          return (
            matchedData.transaction_id?.toLowerCase().includes(query) ||
            matchedData.destination?.toLowerCase().includes(query) ||
            matchedData.delivery_number?.toLowerCase().includes(query) ||
            matchedData.customer?.company_name?.toLowerCase().includes(query) ||
            matchedData.invoice_date?.toLowerCase().includes(query) ||
            matchedData.net_amount?.toString().includes(query)
          );
      }
    });
  }, [selectedSalesInvoice, salesInvoiceData, searchQuery, selectedSearchType]);

  const filteredMaterials = useMemo(() => {
    if (!searchQueryMaterials.trim()) {
      return currentRawMaterials;
    }

    return currentRawMaterials.filter((material) => {
      const query = searchQueryMaterials.toLowerCase();

      const productCode = (
        material.product_tag_vendor?.product_list?.product_code ||
        material.product_tag_vendor?.product_list?.client_code ||
        ""
      ).toLowerCase();

      const productName = (
        material.product_tag_vendor?.product_list?.product_name || ""
      ).toLowerCase();

      const supplier = (
        material.product_tag_vendor?.vendor?.company_name || ""
      ).toLowerCase();

      const uom = (
        material.product_tag_vendor?.product_list?.prod_packaging
          ?.packaging_name || ""
      ).toLowerCase();

      const status = (material.status || "").toLowerCase();

      switch (selectedSearchType) {
        case "product_code":
          return productCode.includes(query);
        case "product_name":
          return productName.includes(query);
        case "supplier":
          return supplier.includes(query);
        case "uom":
          return uom.includes(query);
        case "status":
          return status.includes(query);
        case "all":
        default:
          return (
            productCode.includes(query) ||
            productName.includes(query) ||
            supplier.includes(query) ||
            uom.includes(query) ||
            status.includes(query)
          );
      }
    });
  }, [currentRawMaterials, searchQueryMaterials, selectedSearchTypeMaterials]);

  const filteredCost = useMemo(() => {
    if (!searchQueryCost.trim()) {
      return costItems;
    }

    const query = searchQueryCost.toLowerCase();

    return costItems.filter((item) => {
      switch (selectedSearchTypeCost) {
        case "costType":
          return item.costType.toLowerCase().includes(query);
        case "amount":
          return item.amount.toString().includes(query);
        case "remarks":
          return item.remarks.toLowerCase().includes(query);
        case "all":
        default:
          return (
            item.costType.toLowerCase().includes(query) ||
            item.amount.toString().includes(query) ||
            item.remarks.toLowerCase().includes(query)
          );
      }
    });
  }, [costItems, searchQueryCost, selectedSearchTypeCost]);

  const [fetchPostProduction, setFetchPostProduction] = useState([]);

  useEffect(() => {
    if (postProduction === "isPostProduction") {
      axios
        .get(`${BASE_URL}/PostProduction/getPostProductionInBatchEntry/${id}`)
        .then((res) => {
          const data = res.data?.[0];
          if (data?.pp_batch_entry_id?.[0]?.status) {
            setFormData((prev) => ({
              ...prev,
              postProductionStatus: data.pp_batch_entry_id[0].status,
            }));
          }
          setFetchPostProduction(res.data);
        })
        .catch((err) => {
          console.error("Failed to fetch post production data:", err);
        });
    }
  }, [postProduction, id]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <Form noValidate validated={validated} onSubmit={handleSubmitFormulation}>
        <div className="w-100 p-2 d-flex flex-column justify-content-center">
          <div className="w-100 d-flex flex-row justify-content-between">
            <span className="fs-3">
              <Link
                to={
                  postProduction === "isPostProduction"
                    ? "/inventory/post-production"
                    : "/inventory/batch-entry"
                }
                className="text-dark mx-2"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </Link>

              {postProduction === "isPostProduction"
                ? "BATCH ALLOCATION"
                : isUpdate
                ? "UPDATE BATCH ALLOCATION"
                : "CREATE BATCH ALLOCATION"}
            </span>
            {postProduction === "isPostProduction" ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  navigate(`/inventory/production-loss/${id}`);
                  window.scrollTo(0, 0);
                }}
              >
                Preview Losses
              </button>
            ) : (
              isUpdate && (
                <div className="dropdown dropdown-button">
                  <button
                    className="border-0"
                    type="button"
                    id="dropdownMenuButton1"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bx bx-dots-horizontal fs-4"></i>
                  </button>
                  <ul
                    className="dropdown-menu"
                    aria-labelledby="dropdownMenuButton1"
                  >
                    <li>
                      <span
                        className="dropdown-item"
                        style={{ color: "red", cursor: "pointer" }}
                      >
                        Cancel Transaction
                      </span>
                    </li>
                    <li>
                      <span
                        className="dropdown-item"
                        style={{ cursor: "pointer" }}
                      >
                        Edit Details
                      </span>
                    </li>
                  </ul>
                </div>
              )
            )}
          </div>

          <div className="d-flex badge fw-medium ">
            <span className="px-2 py-1 bg-primary text-white fs-6">
              BATCH NO
            </span>
            <span className="px-2 py-1 bg-secondary text-white fs-6">
              {transactionId}
            </span>
          </div>
        </div>

        <div className="container-fluid mt-3">
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Batch Name <span className="text-danger">*</span>
              </span>
              <Form.Control
                name="batchName"
                className="custom-form-height"
                value={formData.batchName}
                onChange={handleBatchFieldsChange}
                required
                readOnly={
                  postProduction === "isPostProduction" ||
                  formData.batchStatus === "Printed"
                }
              />
            </div>

            <div className="col-sm mb-3">
              <span>
                Mixer <span className="text-danger">*</span>
              </span>
              <div
                className="custom-multi-select"
                style={{ position: "relative" }}
              >
                <MultiSelect
                  className={
                    formData.batchStatus === "Printed" ||
                    postProduction === "isPostProduction"
                      ? "isPrinted"
                      : ""
                  }
                  options={mixerOptions}
                  value={selectedMixer}
                  onChange={
                    postProduction === "isPostProduction"
                      ? () => {}
                      : setSelectedMixer
                  }
                  labelledBy="Select Mixer"
                  required
                  style={{ width: "50px" }}
                  disabled={
                    postProduction === "isPostProduction" ||
                    formData.batchStatus === "Printed"
                  }
                  overrideStrings={{
                    selectSomeItems:
                      postProduction === "isPostProduction"
                        ? "Selection locked"
                        : "Select Mixer",
                  }}
                />
              </div>
              {selectedMixer.length === 0 && validated && (
                <div className="text-danger" style={{ fontSize: "12px" }}>
                  Please select at least one mixer.
                </div>
              )}
            </div>

            <div className="col-sm">
              <span>
                {postProduction === "isPostProduction"
                  ? "Batch Entry Status"
                  : "Status"}
                <span className="text-danger">*</span>
              </span>
              <Form.Control
                name="batchStatus"
                value={formData.batchStatus}
                onChange={handleBatchFieldsChange}
                className="custom-form-height"
                required
                disabled
              />
              {/* <option value="" selected disabled>
                  Select Status
                </option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Post Production">Post Production</option>
                <option value="Declined">Declined</option> */}
            </div>
          </div>

          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Batch Remarks</span> <span className="text-danger">*</span>
              <Form.Control
                name="batchRemarks"
                className="custom-form-height"
                value={formData.batchRemarks}
                onChange={handleBatchFieldsChange}
                required
                readOnly={
                  postProduction === "isPostProduction" ||
                  formData.batchStatus === "Printed"
                }
              />
            </div>

            <div className="col-sm">
              <span>
                Delivery Receipt <span className="text-danger">*</span>
              </span>
              <div
                className="custom-multi-select"
                style={{ position: "relative" }}
              >
                <MultiSelect
                  className={
                    formData.batchStatus === "Printed" ||
                    postProduction === "isPostProduction"
                      ? "isPrinted"
                      : ""
                  }
                  options={salesOptions}
                  value={selectedSalesInvoice}
                  onChange={
                    postProduction === "isPostProduction"
                      ? () => {}
                      : handleDeliveryReceiptChange
                  }
                  labelledBy="Select Invoice"
                  style={{ width: "50px" }}
                  required
                  disabled={
                    postProduction === "isPostProduction" ||
                    formData.batchStatus === "Printed"
                  }
                  overrideStrings={{
                    selectSomeItems:
                      postProduction === "isPostProduction"
                        ? "Selection locked"
                        : "Select Delivery Receipt",
                  }}
                />
              </div>
              {selectedSalesInvoice.length === 0 && validated && (
                <div className="text-danger" style={{ fontSize: "12px" }}>
                  Please select at least one delivery receipt.
                </div>
              )}
            </div>

            <div className="col-sm">
              {selectedSalesInvoice.map((selected) => {
                const matchedData = salesInvoiceData.find(
                  (item) => item.sales_invoice_id === selected.value
                );

                let invoiceValue = "N/A";

                if (matchedData) {
                  if (
                    matchedData.sales_invoice &&
                    matchedData.sales_invoice.trim() !== ""
                  ) {
                    invoiceValue = matchedData.sales_invoice;
                  }

                  // else if (
                  //   matchedData.delivery_number &&
                  //   matchedData.delivery_number.trim() !== ""
                  // ) {
                  //   invoiceValue = "N/A";
                  // }
                }

                return (
                  <React.Fragment key={selected.value}>
                    <span>Sales Invoice</span>
                    <Form.Control
                      value={invoiceValue}
                      disabled
                      className="custom-form-height mb-2"
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="row mx-auto">
            <div className="col-sm">
              {postProduction === "isPostProduction" ? (
                <>
                  <span>
                    Post-Production Status
                    <span className="text-danger">*</span>
                  </span>
                  <Form.Select
                    className="custom-form-height"
                    name="postProductionStatus"
                    value={formData.postProductionStatus}
                    onChange={handleBatchFieldsChange}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Post-Production">Post-Production</option>
                    <option value="Re-Production">Re-Production</option>
                    <option value="Production">Production</option>
                  </Form.Select>
                </>
              ) : null}
            </div>

            <div className="col-sm"></div>
            <div className="col-sm"></div>
          </div>
        </div>

        <CollapsibleContainer
          title="Schedules"
          toggleSection={toggleSection}
          isOpen={isOpen}
        >
          <div
            className="row mx-auto"
            style={{
              maxHeight: isOpen ? "1000px" : "0px",
              overflow: "hidden",
              transition:
                "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
              opacity: isOpen ? 1 : 0,
            }}
          >
            <div className="col-sm batchSchedule">
              <span>
                Start Date <span className="text-danger">*</span>
              </span>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["DateTimePicker"]}>
                  <DateTimePicker
                    // label="Start Date&Time"
                    className={
                      formData.batchStatus === "Printed" ||
                      postProduction === "isPostProduction"
                        ? "isPrinted"
                        : ""
                    }
                    value={formData.startDate}
                    onChange={(value) => handleDateChange("startDate", value)}
                    slotProps={{
                      textField: {
                        error: validated && !formData.startDate,
                        helperText: validated && !formData.startDate ? "" : "",
                      },
                    }}
                    readOnly={
                      postProduction === "isPostProduction" ||
                      formData.batchStatus === "Printed"
                    }
                    style={{
                      backgroundColor:
                        postProduction === "isPostProduction" ? "#E9ECEF" : "",
                    }}
                    // style={{postProduction === "isPostProduction" ? "background: #333" : ""}}
                  />
                </DemoContainer>
              </LocalizationProvider>
            </div>

            <div className="col-sm batchSchedule">
              <span>
                End Date <span className="text-danger">*</span>
              </span>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["DateTimePicker"]}>
                  <DateTimePicker
                    // label="End Date&Time"
                    className={
                      formData.batchStatus === "Printed" ||
                      postProduction === "isPostProduction"
                        ? "isPrinted"
                        : ""
                    }
                    value={formData.endDate}
                    onChange={(value) => handleDateChange("endDate", value)}
                    slotProps={{
                      textField: {
                        error: validated && !formData.endDate,
                        helperText: validated && !formData.endDate ? "" : "",
                      },
                    }}
                    readOnly={
                      postProduction === "isPostProduction" ||
                      formData.batchStatus === "Printed"
                    }
                  />
                </DemoContainer>
              </LocalizationProvider>
            </div>
          </div>
        </CollapsibleContainer>

        {/* table of customer list */}
        <CollapsibleContainer
          title="Customer List"
          toggleSection={toggleSection}
          isOpen={isOpen}
        >
          <div className="row p-2">
            <div className="col-sm">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    salesInvoiceSearchPlaceholders[selectedSearchType] ||
                    "Search..."
                  }
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {Object.entries(salesInvoiceSearchPlaceholders).map(
                    ([key, label]) => (
                      <li key={key}>
                        <button
                          className="dropdown-item"
                          onClick={() => handleSelect(key)}
                          type="button"
                        >
                          {label}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
            <div className="col-sm"></div>
          </div>

          {searchQuery && (
            <div className="px-2 pb-2">
              <small className="text-muted">
                Sales Invoice: Showing {filteredSalesInvoice.length} of{" "}
                {selectedSalesInvoice.length} results
              </small>
            </div>
          )}

          <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents">
            <div className="table-responsive">
              <table aria-label="collapsible table" className="table">
                <thead>
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    ></th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Transaction ID
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Destination
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Delivery Receipt
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Customer
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Invoice Date
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Amount
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesInvoice.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          textAlign: "center",
                          padding: "60px 20px",
                          backgroundColor: "#f8f9fa",
                          border: "none",
                          color: "#6c757d",
                        }}
                      >
                        <div>
                          <i
                            className={
                              searchQuery ? "fas fa-search" : "fas fa-inbox"
                            }
                            style={{
                              fontSize: "32px",
                              marginBottom: "12px",
                              opacity: 0.4,
                            }}
                          ></i>
                          <div
                            style={{ fontSize: "16px", marginBottom: "4px" }}
                          >
                            {searchQuery
                              ? `No results found for "${searchQuery}"`
                              : "No delivery receipts selected"}
                          </div>
                          <small style={{ color: "#9ca3af" }}>
                            {searchQuery
                              ? "Try adjusting your search terms or search type"
                              : "Select delivery receipts to populate this table"}
                          </small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSalesInvoice.map((selected) => {
                      const matchedData = salesInvoiceData.find(
                        (item) => item.sales_invoice_id === selected.value
                      );

                      if (!matchedData) {
                        return (
                          <tr key={selected.value}>
                            <td
                              colSpan="7"
                              style={{
                                textAlign: "center",
                                padding: "20px",
                                backgroundColor: "#ECF8F9",
                              }}
                            >
                              No data found for selected invoice
                            </td>
                          </tr>
                        );
                      }

                      const currentProductSalesData =
                        productSalesData[matchedData.sales_invoice_id] || [];

                      return (
                        <React.Fragment key={matchedData.sales_invoice_id}>
                          <tr>
                            <td style={{ backgroundColor: "#ECF8F9" }}>
                              <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={() =>
                                  handleRowToggle(matchedData.sales_invoice_id)
                                }
                              >
                                {openRows === matchedData.sales_invoice_id ? (
                                  <KeyboardArrowUpIcon
                                    style={{ fontSize: 25 }}
                                  />
                                ) : (
                                  <KeyboardArrowDownIcon
                                    style={{ fontSize: 25 }}
                                  />
                                )}
                              </IconButton>
                            </td>
                            <td style={{ backgroundColor: "#ECF8F9" }}>
                              {matchedData.transaction_id}
                            </td>
                            <td style={{ backgroundColor: "#ECF8F9" }}>
                              {matchedData.destination}
                            </td>
                            <td style={{ backgroundColor: "#ECF8F9" }}>
                              {matchedData.delivery_number}
                            </td>
                            <td style={{ backgroundColor: "#ECF8F9" }}>
                              {matchedData.customer?.company_name}
                            </td>
                            <td style={{ backgroundColor: "#ECF8F9" }}>
                              {matchedData.invoice_date}
                            </td>
                            <td style={{ backgroundColor: "#ECF8F9" }}>
                              {matchedData.net_amount?.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                          <tr>
                            <td
                              colSpan="7"
                              style={{ paddingBottom: 0, paddingTop: 0 }}
                            >
                              <Collapse
                                in={openRows === matchedData.sales_invoice_id}
                                timeout="auto"
                                unmountOnExit
                              >
                                <table
                                  style={{
                                    width: "100%",
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      <th
                                        style={{ backgroundColor: "#F4F4F4" }}
                                      ></th>
                                      <th
                                        style={{ backgroundColor: "#F4F4F4" }}
                                      >
                                        Product Code
                                      </th>
                                      <th
                                        style={{ backgroundColor: "#F4F4F4" }}
                                      >
                                        Product Name
                                      </th>
                                      <th
                                        style={{ backgroundColor: "#F4F4F4" }}
                                      >
                                        Quantity Ordered
                                      </th>
                                      <th
                                        style={{ backgroundColor: "#F4F4F4" }}
                                      >
                                        Unit Price
                                      </th>
                                      <th
                                        style={{ backgroundColor: "#F4F4F4" }}
                                      >
                                        Discount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentProductSalesData.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan="7"
                                          style={{
                                            textAlign: "center",
                                            padding: "20px",
                                          }}
                                        >
                                          {openRows ===
                                          matchedData.sales_invoice_id
                                            ? "Loading products..."
                                            : "No products found"}
                                        </td>
                                      </tr>
                                    ) : (
                                      currentProductSalesData.map((item) => {
                                        const rawMaterialKey = `${matchedData.sales_invoice_id}_${item.product_id}`;
                                        const currentRawMaterials =
                                          rawMaterialsData[rawMaterialKey] ||
                                          [];

                                        return (
                                          <React.Fragment key={item.id}>
                                            <tr>
                                              <td>
                                                <IconButton
                                                  aria-label="expand row"
                                                  size="small"
                                                  onClick={() =>
                                                    handleRowProductToggle(
                                                      item.product_id,
                                                      matchedData.sales_invoice_id
                                                    )
                                                  }
                                                >
                                                  {openProductRows ===
                                                  item.product_id ? (
                                                    <KeyboardArrowUpIcon
                                                      style={{ fontSize: 25 }}
                                                    />
                                                  ) : (
                                                    <KeyboardArrowDownIcon
                                                      style={{ fontSize: 25 }}
                                                    />
                                                  )}
                                                </IconButton>
                                              </td>
                                              <td>
                                                {item.product_list
                                                  ?.product_code ||
                                                  item.product_list
                                                    ?.client_code ||
                                                  "N/A"}
                                              </td>
                                              <td>
                                                {
                                                  item.product_list
                                                    ?.product_name
                                                }
                                              </td>
                                              <td>{item.quantity}</td>
                                              <td>
                                                {item.unit_price?.toLocaleString(
                                                  "en-US",
                                                  {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  }
                                                )}
                                              </td>
                                              <td>
                                                {item.discount_item?.toLocaleString(
                                                  "en-US",
                                                  {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  }
                                                )}
                                              </td>
                                            </tr>
                                            {/* Raw Materials */}
                                            <tr>
                                              <td
                                                colSpan="7"
                                                style={{
                                                  paddingBottom: 0,
                                                  paddingTop: 0,
                                                }}
                                              >
                                                <Collapse
                                                  in={
                                                    openProductRows ===
                                                    item.product_id
                                                  }
                                                  timeout="auto"
                                                  unmountOnExit
                                                >
                                                  <table
                                                    style={{
                                                      width: "100%",
                                                      backgroundColor:
                                                        "#F9F9F9",
                                                    }}
                                                  >
                                                    <thead>
                                                      <tr>
                                                        <th>Product Code</th>
                                                        <th>Product Name</th>
                                                        <th>
                                                          Product Category
                                                        </th>
                                                        <th>Supplier</th>
                                                        <th>UOM</th>
                                                        <th>
                                                          Quantity Required
                                                        </th>
                                                        <th>Stock Availble</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {currentRawMaterials.length ===
                                                      0 ? (
                                                        <tr>
                                                          <td
                                                            colSpan="6"
                                                            style={{
                                                              textAlign:
                                                                "center",
                                                              padding: "20px",
                                                            }}
                                                          >
                                                            {openProductRows ===
                                                            item.product_id
                                                              ? "Loading raw materials..."
                                                              : "No raw materials found"}
                                                          </td>
                                                        </tr>
                                                      ) : (
                                                        currentRawMaterials.map(
                                                          (
                                                            rawMaterial,
                                                            index
                                                          ) => (
                                                            <tr
                                                              key={
                                                                rawMaterial.product_tag_vendor_id ||
                                                                `raw-material-${index}`
                                                              }
                                                            >
                                                              <td>
                                                                {rawMaterial
                                                                  .product_tag_vendor
                                                                  ?.product_list
                                                                  ?.product_code ||
                                                                  rawMaterial
                                                                    .product_tag_vendor
                                                                    ?.product_list
                                                                    ?.client_code}
                                                              </td>
                                                              <td>
                                                                {
                                                                  rawMaterial
                                                                    .product_tag_vendor
                                                                    ?.product_list
                                                                    ?.product_name
                                                                }
                                                              </td>
                                                              <td>
                                                                {
                                                                  rawMaterial
                                                                    .product_tag_vendor
                                                                    ?.product_list
                                                                    ?.product_category
                                                                }
                                                              </td>
                                                              <td>
                                                                {
                                                                  rawMaterial
                                                                    .product_tag_vendor
                                                                    ?.vendor
                                                                    ?.company_name
                                                                }
                                                              </td>

                                                              <td>
                                                                {rawMaterial
                                                                  .product_tag_vendor
                                                                  ?.product_list
                                                                  ?.prod_packaging
                                                                  ?.packaging_name ||
                                                                  "N/A"}
                                                              </td>
                                                              <td>
                                                                {item.quantity *
                                                                  rawMaterial.weight}
                                                              </td>
                                                              <td>Soon...</td>
                                                            </tr>
                                                          )
                                                        )
                                                      )}
                                                    </tbody>
                                                  </table>
                                                </Collapse>
                                              </td>
                                            </tr>
                                          </React.Fragment>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </Collapse>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleContainer>

        {/* table of materials preview */}
        <CollapsibleContainer
          title="Materials"
          toggleSection={toggleSection}
          isOpen={isOpen}
        >
          <div className="row p-2">
            <div className="col-sm">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    materialsSearchPlaceholders[selectedSearchTypeMaterials] ||
                    "Search materials..."
                  }
                  value={searchQueryMaterials}
                  onChange={handleSearchChangeMaterials}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {Object.entries(materialsSearchPlaceholders).map(
                    ([key, label]) => (
                      <li key={key}>
                        <button
                          className="dropdown-item"
                          onClick={() => handleSelectMaterials(key)}
                          type="button"
                        >
                          {label}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
            <div className="col-sm"></div>
          </div>

          {searchQueryMaterials && (
            <div className="px-2 pb-2">
              <small className="text-muted">
                Raw Materials: Showing {filteredMaterials.length} of{" "}
                {currentRawMaterials.length} results
              </small>
            </div>
          )}

          <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents">
            <div className="table-responsive">
              <table aria-label="collapsible table" className="table">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      PRODUCT CODE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      PRODUCT NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      SUPPLIER
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      UOM
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      QUANTITY REQUIRED
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      STOCK AVAILABLE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      STATUS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      ACTION
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        style={{
                          textAlign: "center",
                          padding: "60px 20px",
                          backgroundColor: "#f8f9fa",
                          border: "none",
                          color: "#6c757d",
                        }}
                      >
                        <div>
                          <i
                            className={
                              searchQueryMaterials
                                ? "fas fa-search"
                                : "fas fa-inbox"
                            }
                            style={{
                              fontSize: "32px",
                              marginBottom: "12px",
                              opacity: 0.4,
                            }}
                          ></i>
                          <div
                            style={{ fontSize: "16px", marginBottom: "4px" }}
                          >
                            {searchQueryMaterials
                              ? `No results found for "${searchQueryMaterials}"`
                              : "No raw materials to display"}
                          </div>
                          <small style={{ color: "#9ca3af" }}>
                            {searchQueryMaterials
                              ? "Try adjusting your search terms or search type"
                              : "Select delivery receipts to see required raw materials"}
                          </small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((material, index) => {
                      const getStatusBadge = (status) => {
                        switch (status) {
                          case "Original":
                            return "text-success";
                          case "Replaced":
                            return "text-danger";
                          case "Additional":
                            return "text-primary";
                          default:
                            return "text-secondary";
                        }
                      };

                      return (
                        <React.Fragment key={material.product_tag_vendor_id}>
                          <tr>
                            <td>
                              <span className="text-primary fw-medium">
                                {material.product_tag_vendor?.product_list
                                  ?.product_code ||
                                  material.product_tag_vendor?.product_list
                                    ?.client_code ||
                                  "N/A"}
                              </span>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium">
                                  {material.product_tag_vendor?.product_list
                                    ?.product_name || "N/A"}
                                </div>
                                <small className="text-muted">
                                  Category:{" "}
                                  {material.product_tag_vendor?.product_list
                                    ?.product_category || "N/A"}
                                </small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium">
                                  {material.product_tag_vendor?.vendor
                                    ?.company_name || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium">
                                  {material.product_tag_vendor?.product_list
                                    ?.prod_packaging?.packaging_name || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                value={material.editableQuantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    material.product_tag_vendor_id,
                                    e.target.value
                                  )
                                }
                                readOnly={
                                  postProduction === "isPostProduction" ||
                                  formData.batchStatus === "Printed"
                                }
                                step="0.01"
                                min="0"
                                required
                              />
                            </td>
                            <td>
                              <span className="fw-medium">{0}</span>
                            </td>
                            <td>
                              <span className={getStatusBadge(material.status)}>
                                {material.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-primary me-1"
                                  title="Exchange/Replace Raw Material"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleReplaceRawMaterial(
                                      material.product_tag_vendor_id
                                    );
                                  }}
                                  type="button"
                                  disabled={
                                    postProduction === "isPostProduction" ||
                                    formData.batchStatus === "Printed"
                                  }
                                >
                                  <i className="fas fa-exchange-alt"></i>
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  title={
                                    material.status === "Original"
                                      ? "Cannot delete original materials"
                                      : "Delete Material"
                                  }
                                  onClick={() => {
                                    if (material.status !== "Original") {
                                      handleDeleteMaterial(
                                        material.product_tag_vendor_id
                                      );
                                    }
                                  }}
                                  type="button"
                                  disabled={material.status === "Original"}
                                  style={{
                                    opacity:
                                      material.status === "Original" ? 0.5 : 1,
                                    cursor:
                                      material.status === "Original"
                                        ? "not-allowed"
                                        : "pointer",
                                  }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                                {/* Dropdown toggle for replacement history */}
                                {material.status === "Replaced" &&
                                  material.originalMaterial && (
                                    <IconButton
                                      aria-label="expand row"
                                      size="small"
                                      onClick={() =>
                                        toggleDropdown(
                                          material.product_tag_vendor_id
                                        )
                                      }
                                      style={{
                                        padding: "4px",
                                        border: "1px solid gray",
                                        marginLeft: "2px",
                                        borderTopRightRadius: "4px",
                                        borderBottomRightRadius: "4px",
                                        borderTopLeftRadius: "0",
                                        borderBottomLeftRadius: "0",
                                      }}
                                    >
                                      {openDropdownId ===
                                      material.product_tag_vendor_id ? (
                                        <KeyboardArrowUpIcon
                                          style={{ fontSize: 20 }}
                                        />
                                      ) : (
                                        <KeyboardArrowDownIcon
                                          style={{ fontSize: 20 }}
                                        />
                                      )}
                                    </IconButton>
                                  )}
                              </div>
                            </td>
                          </tr>

                          {/* Collapsible row for replacement history */}
                          {material.status === "Replaced" &&
                            material.originalMaterial && (
                              <tr>
                                <td
                                  colSpan="7"
                                  style={{ padding: 0, border: "none" }}
                                >
                                  <Collapse
                                    in={
                                      openDropdownId ===
                                      material.product_tag_vendor_id
                                    }
                                    timeout="auto"
                                    unmountOnExit
                                  >
                                    <div
                                      style={{
                                        padding: "16px",
                                        backgroundColor: "#f8f9fa",
                                      }}
                                    >
                                      <h6 className="mb-3">
                                        Original Material Details
                                      </h6>
                                      <table
                                        className="table table-sm"
                                        style={{ marginBottom: 0 }}
                                      >
                                        <thead>
                                          <tr>
                                            <th>Product Code</th>
                                            <th>Product Name</th>
                                            <th>Category</th>
                                            <th>UOM</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td>
                                              {
                                                material.originalMaterial
                                                  .product_code
                                              }
                                            </td>
                                            <td>
                                              {
                                                material.originalMaterial
                                                  .product_name
                                              }
                                            </td>
                                            <td>
                                              {
                                                material.originalMaterial
                                                  .product_category
                                              }
                                            </td>
                                            <td>
                                              {material.originalMaterial
                                                .packaging_name || "N/A"}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </Collapse>
                                </td>
                              </tr>
                            )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-100 d-flex justify-content-end mt-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={handleAddRawMaterial}
              disabled={
                postProduction === "isPostProduction" ||
                formData.batchStatus === "Printed"
              }
            >
              New Item
            </button>
          </div>
        </CollapsibleContainer>

        {/* table of cost */}
        <CollapsibleContainer
          title="Cost"
          toggleSection={toggleSection}
          isOpen={isOpen}
        >
          <div className="row p-2">
            <div className="col-sm">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    costSearchPlaceholders[selectedSearchTypeCost] ||
                    "Search..."
                  }
                  value={searchQueryCost}
                  onChange={handleSearchChangeCost}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {Object.entries(costSearchPlaceholders).map(
                    ([key, label]) => (
                      <li key={key}>
                        <button
                          className="dropdown-item"
                          onClick={() => handleSelectCost(key)}
                          type="button"
                        >
                          {label}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
            <div className="col-sm"></div>
          </div>

          {searchQueryCost && (
            <div className="px-2 pb-2">
              <small className="text-muted">
                Cost Items: Showing {filteredCost.length} of {costItems.length}{" "}
                results
              </small>
            </div>
          )}
          <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Cost Type
                      <i
                        className="fas fa-sort"
                        style={{ marginLeft: "4px", fontSize: "12px" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Amount
                      <i
                        className="fas fa-sort"
                        style={{ marginLeft: "4px", fontSize: "12px" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      Remarks
                      <i
                        className="fas fa-sort"
                        style={{ marginLeft: "4px", fontSize: "12px" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#FAFAFA" }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCost.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          textAlign: "center",
                          padding: "60px 20px",
                          backgroundColor: "#f8f9fa",
                          border: "none",
                          color: "#6c757d",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "32px",
                              marginBottom: "12px",
                              opacity: 0.4,
                            }}
                          >
                            📦
                          </div>
                          <div
                            style={{ fontSize: "16px", marginBottom: "4px" }}
                          >
                            {searchQueryCost
                              ? `No results found for "${searchQueryCost}"`
                              : "No cost items to display"}
                          </div>
                          <small style={{ color: "#9ca3af" }}>
                            {searchQueryCost
                              ? "Try adjusting your search terms or search type"
                              : "Add cost items to populate this table"}
                          </small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCost.map((item) => (
                      <tr key={item.id}>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #dee2e6",
                          }}
                        >
                          <input
                            type="text"
                            value={item.costType}
                            onChange={(e) =>
                              costUpdateItem(
                                item.id,
                                "costType",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100%",

                              fontSize: "14px",
                            }}
                            className="form-control"
                            required
                            readOnly={
                              postProduction === "isPostProduction" ||
                              formData.batchStatus === "Printed"
                            }
                          />
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #dee2e6",
                          }}
                        >
                          <input
                            type="text"
                            value={item.amount}
                            onChange={(e) =>
                              costUpdateItem(item.id, "amount", e.target.value)
                            }
                            style={{
                              width: "120px",

                              fontSize: "14px",
                            }}
                            className="form-control"
                            required
                            readOnly={
                              postProduction === "isPostProduction" ||
                              formData.batchStatus === "Printed"
                            }
                          />
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #dee2e6",
                          }}
                        >
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) =>
                              costUpdateItem(item.id, "remarks", e.target.value)
                            }
                            style={{
                              width: "100%",

                              fontSize: "14px",
                            }}
                            className="form-control"
                            readOnly={
                              postProduction === "isPostProduction" ||
                              formData.batchStatus === "Printed"
                            }
                            required
                          />
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #dee2e6",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              className="btn btn-outline-primary"
                              disabled={
                                postProduction === "isPostProduction" ||
                                formData.batchStatus === "Printed"
                              }
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              disabled={
                                postProduction === "isPostProduction" ||
                                formData.batchStatus === "Printed"
                              }
                              onClick={() => costRemoveItem(item.id)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-100 d-flex justify-content-end mt-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={costAddNewItem}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#0b5ed7")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
              disabled={
                postProduction === "isPostProduction" ||
                formData.batchStatus === "Printed"
              }
            >
              New Item
            </button>
          </div>
        </CollapsibleContainer>

        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-sm mb-2"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm">
              <div className="row">
                <div className="col-sm mb-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    type="button"
                    onClick={() => {
                      const link =
                        postProduction === "isPostProduction"
                          ? "/inventory/post-production"
                          : "/inventory/batch-entry";
                      navigate(link);
                      window.scrollTo(0, 0);
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <div className="col-sm">
                  <button
                    className="btn btn-primary w-100"
                    type="submit"
                    disabled={
                      postProduction === "isPostProduction" ||
                      formData.batchStatus === "Printed"
                    }
                  >
                    {isUpdate ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>

      <Modal show={showRawMaterials} size="xl" onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>{getModalTitle()}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search raw materials..."
              onChange={(e) => {
                console.log("Search:", e.target.value);
              }}
            />
          </div>

          {modalMode === "additional" && (
            <div className="alert alert-info mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Materials that already exist in the raw materials list are hidden
              to prevent duplicates.
            </div>
          )}

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table aria-label="collapsible table" className="table">
              <thead className="bg-light sticky-top">
                <tr>
                  <th width="50">Select</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Packaging</th>
                </tr>
              </thead>
              <tbody>
                {filteredAvailableRawMaterials.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      {availableRawMaterials.length === 0 ? (
                        <>
                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></div>
                          Loading available raw materials...
                        </>
                      ) : modalMode === "additional" ? (
                        "All available raw materials are already in the raw materials list."
                      ) : (
                        "No raw materials available."
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredAvailableRawMaterials.map((material) => {
                    const isCurrentMaterial =
                      selectedMaterialToReplace &&
                      material.id ===
                        selectedMaterialToReplace.product_tag_vendor_id;

                    return (
                      <tr
                        key={material.id}
                        className={
                          selectedReplacements.has(material.id)
                            ? "table-active"
                            : ""
                        }
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedReplacements.has(material.id)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                material.id,
                                e.target.checked
                              )
                            }
                            className="form-check-input"
                          />
                        </td>
                        <td>
                          <span
                            className={`fw-medium ${
                              isCurrentMaterial ? "text-primary" : ""
                            }`}
                          >
                            {material.product_list?.product_code ||
                              material.product_list?.client_code ||
                              "N/A"}
                            {isCurrentMaterial && (
                              <small className="badge bg-primary ms-2">
                                Current
                              </small>
                            )}
                          </span>
                        </td>
                        <td>{material.product_list?.product_name}</td>
                        <td>{material.vendor?.company_name}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {material.product_list?.product_category}
                          </span>
                        </td>
                        <td>
                          {material.product_list?.prod_packaging
                            ?.packaging_name || "N/A"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={selectedReplacements.size === 0}
          >
            {getConfirmButtonText()}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
export default BatchEntryCreateUpdate;
