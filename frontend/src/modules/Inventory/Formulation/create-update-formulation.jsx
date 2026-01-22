import axios from "axios";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Button,
  Form,
  Modal,
  OverlayTrigger,
  Tooltip,
  Tab,
  Tabs,
} from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { ThreeDot } from "react-loading-indicators";
import { useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import dayjs from "dayjs";
import Select from "react-select";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import { NumericFormat } from "react-number-format";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { v4 as uuidv4 } from "uuid";

const CreateUpdateFormulation2 = ({ authrztn }) => {
  const uuid = uuidv4();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isUpdate, setIsUpdate] = useState(false);
  const userLoggedID = useDecodeToken();
  const debounceTimeout = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [packagingData, setPackagingData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [showInstructions, setShowInstructions] = useState({});
  const [materialsModal, setMaterialsModal] = useState(false);
  const [parameterModal, setParameterModal] = useState(false);
  const [formulationData, setFormulationData] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(0);

  const pagination = useServerPagination(
    `${BASE_URL}/formulation/getMaterials`,
    10
  );
  const rawProductPagination = useServerPagination(
    `${BASE_URL}/formulation/getRawProductListMaterials`,
    10
  );
  const finishedProductPagination = useServerPagination(
    `${BASE_URL}/formulation/getFinishedProductListMaterials`,
    10
  );
  const paginationParameter = useServerPagination(
    `${BASE_URL}/formulation/getParameters`,
    10
  );
  const physicalPagination = useServerPagination(
    `${BASE_URL}/formulation/getPhysicalAttributes`,
    10
  );

  const [currentParameterCategory, setCurrentParameterCategory] =
    useState("Chemical");
  const [physicalModal, setPhysicalModal] = useState(false);

  const fetchParameters = useCallback(() => {
    paginationParameter.refreshData();
    paginationParameter.updateParams({ category: currentParameterCategory });
  }, [currentParameterCategory, paginationParameter]);

  const fetchPhysicalAttributes = useCallback(() => {
    physicalPagination.refreshData();
  }, [physicalPagination]);

  const fetchMaterials = useCallback(() => {
    const params = {};
    if (isUpdate && id) {
      params.formulationId = id;
    }
    pagination.refreshData();
    pagination.updateParams(params);
  }, [isUpdate, id, pagination]);

  const fetchRawMaterials = useCallback(() => {
    const params = {};
    if (isUpdate && id) {
      params.formulationId = id;
    }
    rawProductPagination.refreshData();
    rawProductPagination.updateParams(params);
  }, [isUpdate, id, rawProductPagination]);

  const fetchFinishedMaterials = useCallback(() => {
    const params = {};
    if (isUpdate && id) {
      params.formulationId = id;
    }
    finishedProductPagination.refreshData();
    finishedProductPagination.updateParams(params);
  }, [isUpdate, id, finishedProductPagination]);

  const hasFetchedInitialData = useRef(false);

  useEffect(() => {
    if (id) {
      fetchMaterials();
      fetchRawMaterials();
      fetchFinishedMaterials();
    }
  }, [id]);

  // useEffect(() => {
  //   if (materialsModal) {
  //     fetchMaterials();
  //     fetchRawMaterials();
  //     fetchFinishedMaterials();
  //   }
  // }, [materialsModal]);

  useEffect(() => {
    if (parameterModal) {
      fetchParameters();
    }
  }, [parameterModal]); // Only depends on parameterModal

  useEffect(() => {
    if (physicalModal) {
      fetchPhysicalAttributes();
    }
  }, [physicalModal]); // Only depends on physicalModal

  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState([]);
  const [selectedFinishedMaterials, setSelectedFinishedMaterials] = useState(
    []
  );

  const [selectedParameters, setSelectedParameters] = useState([]);
  const [selectedPhysical, setSelectedPhysical] = useState([]);

  const [selectAllPhysical, setSelectAllPhysical] = useState(false);
  const [deletedRemarks, setDeletedRemarks] = useState([]);
  const [currentProductName, setCurrentProductName] = useState("");
  const [currentSuffix, setCurrentSuffix] = useState("");

  const [isExistingFormulation, setIsExistingFormulation] = useState(false);

  const handleProductNameOnChange = (productName) => {
    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      setCurrentProductName(productName);
    }, 555);
  };

  const handleSuffixOnChange = (suffix) => {
    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      setCurrentSuffix(suffix);
    }, 555);
  };

  useEffect(() => {
    const checkNameAndSuffix = async () => {
      // Disable validation if in update mode
      if (isUpdate) {
        setIsExistingFormulation(false);
        return;
      }

      // If product name is empty, no validation needed
      if (!currentProductName) {
        setIsExistingFormulation(false);
        return;
      }

      // If product name exists and suffix is empty - THIS IS NOW ALLOWED
      // Only validate if both are provided
      if (currentProductName && currentSuffix) {
        try {
          const res = await axios.get(
            `${BASE_URL}/product/fetchProductNameAndSuffix`,
            {
              params: {
                productName: currentProductName,
                suffix: currentSuffix,
                isUpdate: isUpdate.toString(),
                id,
              },
            }
          );

          if (res.data.success) {
            if (res.data.exists) {
              const confirmed = await swal({
                icon: "warning",
                title: "Oops!",
                text: `Product Name with the same Suffix already exists.`,
                button: "OK",
                dangerMode: true,
                closeOnClickOutside: false,
                closeOnEsc: false,
              });

              if (confirmed) {
                const suffixInput = document.getElementById("suffixInput");
                const pNameInput = document.getElementById("productNameInput");

                if (!isUpdate) {
                  suffixInput.value = "";
                  setCurrentSuffix("");
                  // Don't clear product name - just suffix
                } else {
                  setIsExistingFormulation(true);
                  window.scrollTo(0, 0);
                }
              }
            } else {
              setIsExistingFormulation(false);
            }
          }
        } catch (err) {
          console.error("Error checking product:", err);
        }
      }
    };

    checkNameAndSuffix();
  }, [currentProductName, currentSuffix, isUpdate, id]);

  // Replace the existing checkProductCode function with this new implementation
  const checkProductCode = async (e, productCode, suffix = "") => {
    // Disable validation if in update mode
    if (isUpdate) return;

    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        // Only validate on input if BOTH product code AND suffix are provided
        if (productCode && suffix) {
          const res = await axios.get(
            `${BASE_URL}/product/fetchProductCodeAndSuffix`,
            {
              params: {
                productCode: productCode,
                suffix: suffix,
              },
            }
          );

          if (res.data.success && res.data.data) {
            console.log("Product code with suffix exists:", res.data.data);

            const confirmed = await swal({
              icon: "warning",
              title: "Oops!",
              text: `Product Code with this Suffix already exists.`,
              button: "OK",
              dangerMode: true,
              closeOnClickOutside: false,
              closeOnEsc: false,
            });

            if (confirmed) {
              e.target.value = "";
            }
          }
        }
        // If only product code is provided (no suffix), do NOT validate on input
        // We'll validate on save instead
      } catch (err) {
        console.error("Error checking product:", err);
      }
    }, 500);
  };

  // Add a new function to validate product code on save (for product codes without suffix)
  const validateProductCodeOnSave = async (productCode, suffix = "") => {
    try {
      // First check if product exists without considering suffix
      const res = await axios.get(`${BASE_URL}/product/fetchProductCode`, {
        params: { id: productCode },
      });

      if (res.data.success && res.data.data) {
        console.log("Product exists:", res.data.data);

        // If product exists, check if it's with or without suffix
        const existingProduct = res.data.data;
        const existingSuffix = existingProduct.suffix || "";

        // CASE 1: Product exists WITHOUT suffix and we're trying to save WITHOUT suffix
        if (!suffix && !existingSuffix) {
          return {
            exists: true,
            message: `Product Code "${productCode}" already exists. Please add a suffix to differentiate.`,
            requiresSuffix: true, // Add this flag to indicate suffix is required
          };
        }

        // CASE 2: Product exists WITH suffix and we're trying to save WITHOUT suffix
        if (!suffix && existingSuffix) {
          return {
            exists: true,
            message: `Product Code "${productCode}" already exists with suffix "${existingSuffix}". Please add a different suffix.`,
            requiresSuffix: true, // Add this flag
          };
        }

        // CASE 3: Product exists WITHOUT suffix and we're trying to save WITH suffix
        if (suffix && !existingSuffix) {
          // This is allowed - same product code with different suffix
          return { exists: false };
        }

        // CASE 4: Both have suffixes and they're the same
        if (suffix && existingSuffix && suffix === existingSuffix) {
          return {
            exists: true,
            message: `Product Code "${productCode}" with suffix "${suffix}" already exists.`,
          };
        }

        // CASE 5: Both have suffixes and they're different - this is allowed
        if (suffix && existingSuffix && suffix !== existingSuffix) {
          return { exists: false };
        }

        return { exists: false };
      }
      return { exists: false };
    } catch (err) {
      console.error("Error checking product on save:", err);
      return { exists: false, error: err };
    }
  };

  const toggleInstruction = (uuid, materialType = "vendor") => {
    setShowInstructions((prev) => ({
      ...prev,
      [`${materialType}-${uuid}`]: !prev[`${materialType}-${uuid}`],
    }));
  };

  const { register, control, setValue, getValues, watch } = useForm({
    defaultValues: {
      productCode: "",
      clientCode: "",
      productName: "",
      productCategory: "Finish Product",
      packaging_id: "",
      remarks: "",
      suffix: "",
      weight: 0,
      srp_amount: "",
      threshold: null,
    },
  });

  const fetchPackging = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataPackaging`);
      setPackagingData(res.data);
      console.log(res.data, "packaging");
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSource = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataSource`);
      setSourceData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRemarksHistory = async (productId) => {
    try {
      await axios
        .get(BASE_URL + "/formulation/getRemarksHistory", {
          params: {
            product_id: productId,
          },
        })
        .then((res) => {
          if (res.data) {
            setRemarksHistoryData(res.data);

            if (res.data.length > 0) {
              setValue("remarks", res.data[0].remarks);
              setOriginalRemarks(res.data[0].remarks);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching remarks history:", error);
        });
    } catch (error) {
      console.error("Error fetching remarks history:", error);
    }
  };

  const [originalProductName, setOriginalProductName] = useState("");
  const [originalSuffix, setOriginalSuffix] = useState("");

  const fetchFormulationData = async (formulationId) => {
    try {
      setIsLoading(true);

      const response = await axios.get(
        `${BASE_URL}/formulation/getSpecificFormulation`,
        { params: { id: formulationId } }
      );

      if (response.data) {
        const data = response.data;
        console.log(data, "THIS IS THE RESPONSE");
        setFormulationData(data);
        setOriginalProductName(data.product_name || "");
        setOriginalSuffix(data.suffix || "");

        setValue("productCode", data.product_code || "");
        setValue("clientCode", data.client_code || "");
        setValue("productName", data.product_name || "");
        setValue("productCategory", "Finish Product");
        setValue("packaging_id", data.packaging_id?.toString() || "");
        setValue("srp_amount", data.srp_amount || "");
        setValue("suffix", data.suffix || "");
        setValue("weight", data.weight || 0);
        setValue("threshold", data.threshold || "");
        setCurrentSuffix(data.suffix || "");

        if (data.remarksHistory && data.remarksHistory.length > 0) {
          setValue("remarks", data.remarksHistory[0].remarks);
          setOriginalRemarks(data.remarksHistory[0].remarks);
          setRemarksHistoryData(data.remarksHistory);
        } else {
          setValue("remarks", data.remarks || "");
          setOriginalRemarks(data.remarks || "");
        }

        const materialsResponse = await fetchFormulationMaterials(
          formulationId
        );

        console.log(materialsResponse, "MATERIALS RESPONSE");

        setSelectedMaterials(materialsResponse.vendorMaterials);
        setSelectedRawMaterials(materialsResponse.rawMaterials);
        setSelectedFinishedMaterials(materialsResponse.finishedMaterials);

        if (data.materials && Array.isArray(data.materials)) {
          console.log(data.materials, "DITO MGA MATERIALS");
          setSelectedMaterials((prev) =>
            prev.map((item) => {
              const dbItem = data.materials.find(
                (m) =>
                  (m.product_tag_vendor_id === item.product_tag_vendor_id ||
                    m.product_id === item.product_id) &&
                  m.category === "Vendor Product"
              );
              return dbItem
                ? {
                    ...item,
                    composition: dbItem.composition,
                    qualified: dbItem.isAdded,
                    instruction: dbItem.instruction,
                    isFromFormulation: true,
                  }
                : item;
            })
          );

          setSelectedRawMaterials((prev) =>
            prev.map((item) => {
              const dbItem = data.materials.find(
                (m) =>
                  m.category === "Raw Product" &&
                  m.product_id === item.product_id
              );
              return dbItem
                ? {
                    ...item,
                    composition: dbItem.composition,
                    qualified: dbItem.isAdded,
                    instruction: dbItem.instruction,
                    isFromFormulation: true,
                  }
                : item;
            })
          );

          setSelectedFinishedMaterials((prev) =>
            prev.map((item) => {
              const dbItem = data.materials.find(
                (m) =>
                  m.category === "Finished Product" &&
                  m.product_id === item.product_id
              );
              return dbItem
                ? {
                    ...item,
                    composition: dbItem.composition,
                    qualified: dbItem.isAdded,
                    instruction: dbItem.instruction,
                    isFromFormulation: true,
                  }
                : item;
            })
          );
        }

        if (data.parameters && Array.isArray(data.parameters)) {
          setSelectedParameters(
            data.parameters.map((item) => ({
              ...item,
              finishParamTagId: item.finishParamTagId,
              isDeleted: item.isDeleted,
              uom: item.uom || "",
              value: item.value || "",
              category: item.category || "Chemical",
              isFromFormulation: true,
            }))
          );
        }

        if (data.physicalAttributes && Array.isArray(data.physicalAttributes)) {
          setSelectedPhysical(
            data.physicalAttributes.map((item) => ({
              ...item,
              id: item.id,
              physical_id: item.physical_id,
              isDeleted: item.isDeleted,
              attribute: item.attribute || "",
              description: item.description || "",
              isFromFormulation: true,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching formulation:", error);
      swal({
        title: "Error",
        text:
          "Failed to fetch formulation data: " +
          (error.response?.data?.message || error.message),
        icon: "error",
        buttons: false,
        timer: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (id) {
        setIsUpdate(true);
        fetchFormulationData(id).then(() => {
          fetchRemarksHistory(id);
        });
      } else {
      }
      fetchPackging();
      fetchSource();
    });

    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (pagination.data) {
      const activeItems = pagination.data.filter(
        (item) => item.status === "Active"
      );
      const allSelected = activeItems.every((item) => isItemSelected(item));
      setSelectAllMaterials(allSelected);
    }

    console.log(selectedMaterials, "THIS IS THE MATERIALS RIGHT NOW");
  }, [selectedMaterials, pagination.data]);

  useEffect(() => {
    if (rawProductPagination.data) {
      const activeItems = rawProductPagination.data.filter(
        (item) => item.status === "Active"
      );
      const allSelected = activeItems.every((item) => isItemRawSelected(item));
      setSelectAllRawMaterials(allSelected);
    }
  }, [selectedRawMaterials, rawProductPagination.data]);

  useEffect(() => {
    if (finishedProductPagination.data) {
      const activeItems = finishedProductPagination.data.filter(
        (item) => item.status === "Active"
      );
      const allSelected = activeItems.every((item) =>
        isItemFinishedSelected(item)
      );
      setSelectAllFinishedMaterials(allSelected);
    }
  }, [selectedFinishedMaterials, finishedProductPagination.data]);

  const handleCheckSelectProduct = (item, isChecked) => {
    // console.log(item, "THIS IS ITEM DATA");
    setSelectedMaterials((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_tag_vendor_id === item.id || i.id === item.id
      );

      if (isChecked) {
        if (existingIndex >= 0) {
          // Update existing item
          return prev.map((i) =>
            i.product_tag_vendor_id === item.id || i.id === item.id
              ? {
                  ...i,
                  isDeleted: false,
                  composition: i.composition || 0,
                  qualified: i.qualified || false,
                  instruction: i.instruction || "",
                  uuid: i.uuid || uuidv4(),
                }
              : i
          );
        } else {
          // Add new item
          return [
            ...prev,
            {
              ...item,
              id: item.id || null, // Preserve existing ID if available
              formulation_material_id: item.formulation_material_id || null, // Add this line
              isDeleted: false,
              composition: 0,
              qualified: false,
              instruction: "",
              uuid: uuidv4(),
              category: "Vendor Product",
              product_code:
                item.product_code || item.fpu_product_id?.product_code,
              client_code: item.client_code || item.fpu_product_id?.client_code,
              product_name:
                item.product_name || item.fpu_product_id?.product_name,
              company_name:
                item.company_name || item.fpu_vendor_id?.company_name,
              materialCategory: "Vendor Product",
            },
          ];
        }
      } else {
        // Remove or mark as deleted
        if (existingIndex >= 0) {
          if (prev[existingIndex].isFromFormulation) {
            // Keep in list but mark as deleted if it's from formulation
            return prev.map((i) =>
              i.product_tag_vendor_id === item.id || i.id === item.id
                ? { ...i, isDeleted: true }
                : i
            );
          } else {
            // Remove completely if it's not from formulation
            return prev.filter(
              (i) => i.product_tag_vendor_id !== item.id && i.id !== item.id
            );
          }
        }
        return prev;
      }
    });
  };

  // Fix for handleCheckSelectRawProduct
  const handleCheckSelectRawProduct = (item, isChecked) => {
    setSelectedRawMaterials((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_id === item.product_id || i.id === item.product_id
      );

      if (isChecked) {
        if (existingIndex >= 0) {
          // Update existing item
          return prev.map((i) =>
            i.product_id === item.product_id || i.id === item.product_id
              ? {
                  ...i,
                  isRawDeleted: false,
                  composition: i.composition || 0,
                  qualified: i.qualified || false,
                  instruction: i.instruction || "",
                  uuid: i.uuid || uuidv4(),
                }
              : i
          );
        } else {
          // Add new item
          return [
            ...prev,
            {
              ...item,
              isRawDeleted: false,
              composition: 0,
              qualified: false,
              instruction: "",
              uuid: uuidv4(),
              category: "Raw Product",
              product_code: item.product_code,
              client_code: item.client_code,
              product_name: item.product_name,
              materialCategory: "Raw Product",
            },
          ];
        }
      } else {
        // Remove or mark as deleted
        if (existingIndex >= 0) {
          if (prev[existingIndex].isFromFormulation) {
            // Keep in list but mark as deleted if it's from formulation
            return prev.map((i) =>
              i.product_id === item.product_id || i.id === item.product_id
                ? { ...i, isRawDeleted: true }
                : i
            );
          } else {
            // Remove completely if it's not from formulation
            return prev.filter(
              (i) =>
                i.product_id !== item.product_id && i.id !== item.product_id
            );
          }
        }
        return prev;
      }
    });
  };

  // Fix for handleCheckSelectFinishedProduct
  const handleCheckSelectFinishedProduct = (item, isChecked) => {
    setSelectedFinishedMaterials((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_id === item.product_id || i.id === item.product_id
      );

      if (isChecked) {
        if (existingIndex >= 0) {
          // Update existing item
          return prev.map((i) =>
            i.product_id === item.product_id || i.id === item.product_id
              ? {
                  ...i,
                  isFinishedDeleted: false,
                  composition: i.composition || 0,
                  qualified: i.qualified || false,
                  instruction: i.instruction || "",
                  uuid: i.uuid || uuidv4(),
                }
              : i
          );
        } else {
          // Add new item
          return [
            ...prev,
            {
              ...item,
              isFinishedDeleted: false,
              composition: 0,
              qualified: false,
              instruction: "",
              uuid: uuidv4(),
              category: "Finished Product",
              product_code: item.product_code,
              client_code: item.client_code,
              product_name: item.product_name,
              materialCategory: "Finished Product",
            },
          ];
        }
      } else {
        // Remove or mark as deleted
        if (existingIndex >= 0) {
          if (prev[existingIndex].isFromFormulation) {
            // Keep in list but mark as deleted if it's from formulation
            return prev.map((i) =>
              i.product_id === item.product_id || i.id === item.product_id
                ? { ...i, isFinishedDeleted: true }
                : i
            );
          } else {
            // Remove completely if it's not from formulation
            return prev.filter(
              (i) =>
                i.product_id !== item.product_id && i.id !== item.product_id
            );
          }
        }
        return prev;
      }
    });
  };

  const [selectAllMaterials, setSelectAllMaterials] = useState(false);
  const [selectAllRawMaterials, setSelectAllRawMaterials] = useState(false);
  const [selectAllFinishedMaterials, setSelectAllFinishedMaterials] =
    useState(false);

  const handleSelectAllMaterials = (e) => {
    const isChecked = e.target.checked;
    setSelectAllMaterials(isChecked);

    if (isChecked) {
      const activeItems =
        pagination.data?.filter((item) => item.status === "Active") || [];
      activeItems.forEach((item) => {
        if (!isItemSelected(item)) {
          handleCheckSelectProduct(item, true);
        }
      });
    } else {
      selectedMaterials.forEach((item) => {
        if (!item.isDeleted && !item.isFromFormulation) {
          handleCheckSelectProduct(item, false);
        }
      });
    }
  };

  const handleSelectAllRawMaterials = (e) => {
    const isChecked = e.target.checked;
    setSelectAllRawMaterials(isChecked);

    if (isChecked) {
      const activeItems =
        rawProductPagination.data?.filter((item) => item.status === "Active") ||
        [];
      activeItems.forEach((item) => {
        if (!isItemRawSelected(item)) {
          handleCheckSelectRawProduct(item, true);
        }
      });
    } else {
      selectedRawMaterials.forEach((item) => {
        if (!item.isRawDeleted && !item.isFromFormulation) {
          handleCheckSelectRawProduct(item, false);
        }
      });
    }
  };

  const handleSelectAllFinishedMaterials = (e) => {
    const isChecked = e.target.checked;
    setSelectAllFinishedMaterials(isChecked);

    if (isChecked) {
      const activeItems =
        finishedProductPagination.data?.filter(
          (item) => item.status === "Active"
        ) || [];
      activeItems.forEach((item) => {
        if (!isItemFinishedSelected(item)) {
          handleCheckSelectFinishedProduct(item, true);
        }
      });
    } else {
      selectedFinishedMaterials.forEach((item) => {
        if (!item.isFinishedDeleted && !item.isFromFormulation) {
          handleCheckSelectFinishedProduct(item, false);
        }
      });
    }
  };

  const isItemSelected = (item) => {
    return selectedMaterials.some(
      (i) =>
        (i.product_tag_vendor_id === item.id || i.id === item.id) &&
        !i.isDeleted
    );
  };

  // Fix for isItemRawSelected
  const isItemRawSelected = (item) => {
    return selectedRawMaterials.some(
      (i) =>
        (i.product_id === (item.product_id || item.id) ||
          i.id === (item.product_id || item.id)) &&
        !i.isRawDeleted
    );
  };

  // Fix for isItemFinishedSelected
  const isItemFinishedSelected = (item) => {
    return selectedFinishedMaterials.some(
      (i) =>
        (i.product_id === (item.product_id || item.id) ||
          i.id === (item.product_id || item.id)) &&
        !i.isFinishedDeleted
    );
  };

  const [selectAllParameters, setSelectAllParameters] = useState(false);

  const handleSelectAllParameters = (e) => {
    const isChecked = e.target.checked;
    setSelectAllParameters(isChecked);

    const activeItems =
      paginationParameter.data?.filter(
        (item) =>
          item.status === "Active" && item.category === currentParameterCategory
      ) || [];

    if (isChecked) {
      activeItems.forEach((item) => {
        if (!isParameterSelected(item)) {
          handleCheckSelectParameter(item, true);
        }
      });
    } else {
      selectedParameters.forEach((item) => {
        if (!item.isDeleted && item.category === currentParameterCategory) {
          handleCheckSelectParameter(item, false);
        }
      });
    }
  };
  const handleCheckSelectParameter = (item, isChecked) => {
    setSelectedParameters((prev) => {
      const existing = prev.find((i) => i.id === item.id);

      if (isChecked) {
        if (existing) {
          // When restoring a previously deleted parameter, reset its values
          return prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  isDeleted: false,
                  value: 0, // Reset value to 0
                  uom: item.uom || "", // Reset to original uom
                  category: item.category,
                }
              : i
          );
        } else {
          // Add new item with default values
          return [
            ...prev,
            {
              ...item,
              isDeleted: false,
              value: 0,
              uom: item.uom || "",
              category: item.category,
            },
          ];
        }
      } else {
        // When deleting, mark as deleted but keep all data
        return prev.map((i) =>
          i.id === item.id ? { ...i, isDeleted: true } : i
        );
      }
    });
  };

  const handleSelectAllPhysical = (e) => {
    const isChecked = e.target.checked;
    setSelectAllPhysical(isChecked);

    const activeItems =
      physicalPagination.data?.filter((item) => item.status === "Active") || [];

    if (isChecked) {
      // Add all active items that aren't already selected
      const itemsToAdd = activeItems
        .filter(
          (item) =>
            !selectedPhysical.some(
              (sp) => sp.physical_id === item.physical_id && !sp.isDeleted
            )
        )
        .map((item) => ({
          id: item.id || null,
          physical_id: item.physical_id,
          attribute: item.attribute,
          isDeleted: false,
          description: "",
        }));

      // Keep existing selected items and add new ones
      setSelectedPhysical((prev) => [
        ...prev.filter((item) => !item.isDeleted),
        ...itemsToAdd,
      ]);
    } else {
      // Mark all active items as deleted, but keep them in the array
      setSelectedPhysical((prev) =>
        prev.map((item) =>
          activeItems.some((ai) => ai.physical_id === item.physical_id)
            ? { ...item, isDeleted: true }
            : item
        )
      );
    }
  };

  const handleCheckSelectPhysical = (item, isChecked) => {
    setSelectedPhysical((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.physical_id === item.physical_id
      );

      if (isChecked) {
        if (existingIndex >= 0) {
          // Update existing item
          return prev.map((i) =>
            i.physical_id === item.physical_id
              ? {
                  ...i,
                  isDeleted: false,
                  description: "",
                  attribute: item.attribute, // Ensure name is preserved
                  physical_id: item.physical_id, // Ensure ID is preserved
                  createdAt: item.createdAt,
                }
              : i
          );
        } else {
          // Add new item
          return [
            ...prev,
            {
              id: item.id || null,
              physical_id: item.physical_id,
              attribute: item.attribute,
              isDeleted: false,
              description: "",
              createdAt: item.createdAt,
            },
          ];
        }
      } else {
        if (existingIndex >= 0) {
          // Mark as deleted but keep in array
          return prev.map((i) =>
            i.physical_id === item.physical_id ? { ...i, isDeleted: true } : i
          );
        }
        return prev;
      }
    });
  };

  const isPhysicalSelected = (item) =>
    selectedPhysical.some(
      (i) => i.physical_id === item.physical_id && !i.isDeleted
    );

  useEffect(() => {
    if (pagination.data) {
      const activeItems = pagination.data.filter(
        (item) => item.status === "Active"
      );
      const allSelected =
        activeItems.length > 0 &&
        activeItems.every((item) => isItemSelected(item));
      setSelectAllMaterials(allSelected);
    }
  }, [selectedMaterials, pagination.data]);

  useEffect(() => {
    if (rawProductPagination.data) {
      const activeItems = rawProductPagination.data.filter(
        (item) => item.status === "Active"
      );
      const allSelected =
        activeItems.length > 0 &&
        activeItems.every((item) => isItemRawSelected(item));
      setSelectAllRawMaterials(allSelected);
    }
  }, [selectedRawMaterials, rawProductPagination.data]);

  useEffect(() => {
    if (finishedProductPagination.data) {
      const activeItems = finishedProductPagination.data.filter(
        (item) => item.status === "Active"
      );
      const allSelected =
        activeItems.length > 0 &&
        activeItems.every((item) => isItemFinishedSelected(item));
      setSelectAllFinishedMaterials(allSelected);
    }
  }, [selectedFinishedMaterials, finishedProductPagination.data]);

  useEffect(() => {
    if (paginationParameter.data) {
      const activeItems = paginationParameter.data.filter(
        (item) => item.status === "Active"
      );
      const allSelected =
        activeItems.length > 0 &&
        activeItems.every((item) => isParameterSelected(item));
      setSelectAllParameters(allSelected);
    }
  }, [selectedParameters, paginationParameter.data]);

  const handleInputChange = (uuid, value, materialType = "vendor") => {
    // two decimal places
    const decimalRegex = /^\d*\.?\d{0,2}$/;

    if (!decimalRegex.test(value)) return;

    const numValue = value === "" ? 0 : Number(value);

    if (isNaN(numValue)) {
      return;
    }

    // Calculate current total from all material types
    const vendorTotal = selectedMaterials
      .filter((item) => item.isDeleted === false && item.uuid !== uuid)
      .reduce((sum, item) => sum + (Number(item.composition) || 0), 0);

    const rawTotal = selectedRawMaterials
      .filter((item) => item.isRawDeleted === false && item.uuid !== uuid)
      .reduce((sum, item) => sum + (Number(item.composition) || 0), 0);

    const finishedTotal = selectedFinishedMaterials
      .filter((item) => item.isFinishedDeleted === false && item.uuid !== uuid)
      .reduce((sum, item) => sum + (Number(item.composition) || 0), 0);

    const currentTotal = vendorTotal + rawTotal + finishedTotal;

    if (currentTotal + numValue > 100) {
      swal({
        icon: "warning",
        title: "Composition Limit Exceeded",
        text: "The total composition cannot exceed 100%.",
      });

      // Reset the composition for the specific material type
      if (materialType === "vendor") {
        setSelectedMaterials((prev) =>
          prev.map((item) =>
            item.uuid === uuid ? { ...item, composition: 0 } : item
          )
        );
      } else if (materialType === "raw") {
        setSelectedRawMaterials((prev) =>
          prev.map((item) =>
            item.uuid === uuid ? { ...item, composition: 0 } : item
          )
        );
      } else if (materialType === "finished") {
        setSelectedFinishedMaterials((prev) =>
          prev.map((item) =>
            item.uuid === uuid ? { ...item, composition: 0 } : item
          )
        );
      }
    } else {
      // Update the composition for the specific material type
      if (materialType === "vendor") {
        setSelectedMaterials((prev) =>
          prev.map((item) =>
            item.uuid === uuid ? { ...item, composition: value } : item
          )
        );
      } else if (materialType === "raw") {
        setSelectedRawMaterials((prev) =>
          prev.map((item) =>
            item.uuid === uuid ? { ...item, composition: value } : item
          )
        );
      } else if (materialType === "finished") {
        setSelectedFinishedMaterials((prev) =>
          prev.map((item) =>
            item.uuid === uuid ? { ...item, composition: value } : item
          )
        );
      }
    }
  };

  const calculateTotalComposition = () => {
    const vendorTotal = selectedMaterials
      .filter((item) => item.isDeleted === false)
      .reduce((sum, item) => sum + (Number(item.composition) || 0), 0);

    const rawTotal = selectedRawMaterials
      .filter((item) => item.isRawDeleted === false)
      .reduce((sum, item) => sum + (Number(item.composition) || 0), 0);

    const finishedTotal = selectedFinishedMaterials
      .filter((item) => item.isFinishedDeleted === false)
      .reduce((sum, item) => sum + (Number(item.composition) || 0), 0);

    return vendorTotal + rawTotal + finishedTotal;
  };

  const countActiveProducts = () => {
    const vendorCount = selectedMaterials.filter(
      (item) => item.isDeleted === false
    ).length;
    const rawCount = selectedRawMaterials.filter(
      (item) => item.isRawDeleted === false
    ).length;
    const finishedCount = selectedFinishedMaterials.filter(
      (item) => item.isFinishedDeleted === false
    ).length;

    return vendorCount + rawCount + finishedCount;
  };

  const handleParameterInputChange = (paramId, uom) => {
    setSelectedParameters((prev) =>
      prev.map((item) => (item.id === paramId ? { ...item, uom: uom } : item))
    );
  };

  const handleParameterValueInputChange = (paramId, value) => {
    setSelectedParameters((prev) =>
      prev.map((item) =>
        item.id === paramId ? { ...item, value: value } : item
      )
    );
  };

  const handleParameterSelectedChange = (paramId, category) => {
    setSelectedParameters((prev) =>
      prev.map((item) =>
        item.id === paramId ? { ...item, category: category } : item
      )
    );
  };

  const handlePhysicalTextAreaChange = (attributeId, description) => {
    setSelectedPhysical((prev) =>
      prev.map((item) =>
        item.physical_id === attributeId
          ? { ...item, description: description }
          : item
      )
    );
  };

  const handleTextareaChange = (uuid, value, materialType = "vendor") => {
    if (materialType === "vendor") {
      setSelectedMaterials((prev) =>
        prev.map((item) =>
          item.uuid === uuid ? { ...item, instruction: value } : item
        )
      );
    } else if (materialType === "raw") {
      setSelectedRawMaterials((prev) =>
        prev.map((item) =>
          item.uuid === uuid ? { ...item, instruction: value } : item
        )
      );
    } else if (materialType === "finished") {
      setSelectedFinishedMaterials((prev) =>
        prev.map((item) =>
          item.uuid === uuid ? { ...item, instruction: value } : item
        )
      );
    }
  };

  const handleCheckboxChange = (uuid, checked, materialType = "vendor") => {
    if (materialType === "vendor") {
      setSelectedMaterials((prev) =>
        prev.map((item) =>
          item.uuid === uuid ? { ...item, qualified: checked } : item
        )
      );
    } else if (materialType === "raw") {
      setSelectedRawMaterials((prev) =>
        prev.map((item) =>
          item.uuid === uuid ? { ...item, qualified: checked } : item
        )
      );
    } else if (materialType === "finished") {
      setSelectedFinishedMaterials((prev) =>
        prev.map((item) =>
          item.uuid === uuid ? { ...item, qualified: checked } : item
        )
      );
    }
  };

  const isParameterSelected = (item) => {
    const selectedItem = selectedParameters.find((i) => i.id === item.id);
    return selectedItem ? !selectedItem.isDeleted : false;
  };

  const watchedWeight = watch("weight");

  useEffect(() => {
    const numWeight = Number(watchedWeight) || 0;
    setCurrentWeight(numWeight);
  }, [watchedWeight]);

  const totalWeight = getValues("weight");
  const totalTargetWeight = useMemo(() => {
    const vendorWeight = selectedMaterials
      .filter((item) => !item.isDeleted)
      .reduce(
        (sum, item) => sum + (Number(item.composition) / 100) * currentWeight,
        0
      );

    const rawWeight = selectedRawMaterials
      .filter((item) => !item.isRawDeleted)
      .reduce(
        (sum, item) => sum + (Number(item.composition) / 100) * currentWeight,
        0
      );

    const finishedWeight = selectedFinishedMaterials
      .filter((item) => !item.isFinishedDeleted)
      .reduce(
        (sum, item) => sum + (Number(item.composition) / 100) * currentWeight,
        0
      );

    return vendorWeight + rawWeight + finishedWeight;
  }, [
    selectedMaterials,
    selectedRawMaterials,
    selectedFinishedMaterials,
    currentWeight,
  ]);

  const calculateTargetWeight = useCallback(
    (composition) => {
      const comp = Number(composition) || 0;
      return Number(((comp / 100) * currentWeight).toFixed(2));
    },
    [currentWeight]
  );

  // validation for material
  const [materialsValidationError, setMaterialsValidationError] =
    useState(false);
  const [materialsValidationMessage, setMaterialsValidationMessage] =
    useState("");

  // validation for packaging
  // Add this state near your other validation states
  const [packagingValidation, setPackagingValidation] = useState({
    touched: false,
    valid: false,
    error: null,
  });

  // Add this function to validate packaging
  const validatePackaging = () => {
    const packagingId = getValues("packaging_id");
    if (!packagingId) {
      setPackagingValidation({
        touched: true,
        valid: false,
        error: "Packaging is required",
      });
      return false;
    }

    setPackagingValidation({
      touched: true,
      valid: true,
      error: null,
    });
    return true;
  };

  // Update the packaging onChange handler
  const handlePackagingChange = (selectedOption) => {
    const newValue = selectedOption?.value || "";
    setValue("packaging_id", newValue);

    // Validate immediately when user makes a selection
    if (newValue) {
      setPackagingValidation({
        touched: true,
        valid: true,
        error: null,
      });
    } else {
      setPackagingValidation({
        touched: true,
        valid: false,
        error: "Packaging is required",
      });
    }
  };

  const handleSubmitFormulation = (e) => {
    e.preventDefault();

    // Reset validation states
    setMaterialsValidationError(false);
    setMaterialsValidationMessage("");

    // Validate packaging
    const isPackagingValid = validatePackaging();
    if (!isPackagingValid) {
      swal({
        icon: "error",
        title: "Missing Required Field",
        text: "Please select a packaging type",
      });
      setValidated(true);
      return;
    }

    const form = e.currentTarget;
    const allMaterials = getAllSelectedMaterials();

    // Get form values
    const formData = getValues();
    const productCode = formData.productCode;
    const suffix = formData.suffix || "";
    const productName = formData.productName;

    // Skip product code validation if in update mode
    if (!isUpdate) {
      // Only validate product code if NOT in update mode
      validateProductCodeOnSave(productCode, suffix)
        .then((validationResult) => {
          if (validationResult.exists) {
            // If product code exists and requires a suffix
            if (validationResult.requiresSuffix && !suffix) {
              swal({
                icon: "warning",
                title: "Suffix Required",
                text: validationResult.message,
                button: "OK",
                dangerMode: true,
                closeOnClickOutside: false,
                closeOnEsc: false,
              }).then(() => {
                // Focus on suffix input
                const suffixInput = document.getElementById("suffixInput");
                if (suffixInput) {
                  suffixInput.focus();
                  suffixInput.style.outline = "2px solid red";
                }
              });
              return; // Stop submission
            }

            // Regular duplicate error
            swal({
              icon: "warning",
              title: "Oops!",
              text: validationResult.message,
              button: "OK",
              dangerMode: true,
              closeOnClickOutside: false,
              closeOnEsc: false,
            }).then(() => {
              // Clear the product code input after user clicks OK
              const productCodeInput =
                document.getElementById("productCodeInput");
              if (productCodeInput) {
                productCodeInput.value = "";
                setValue("productCode", "");
              }
            });
            // Don't proceed with submission if product code exists
          } else {
            proceedWithFormSubmission(e, form, allMaterials, formData);
          }
        })
        .catch((error) => {
          console.error("Validation error:", error);
          // On error, still proceed with submission
          proceedWithFormSubmission(e, form, allMaterials, formData);
        });
    } else {
      // If in update mode, skip product code validation and proceed directly
      proceedWithFormSubmission(e, form, allMaterials, formData);
    }
  };

  // Extract the submission logic into a separate function
  const proceedWithFormSubmission = (e, form, allMaterials, formData) => {
    // Check if any materials are selected
    if (allMaterials.length === 0) {
      setMaterialsValidationError(true);
      setMaterialsValidationMessage("At least one material must be selected");

      swal({
        icon: "error",
        title: "Missing Materials",
        text: "Please select at least one material from the product list.",
      });

      // Scroll to materials section
      const materialsSection = document.getElementById(
        "formulation-table-materials"
      );
      if (materialsSection) {
        materialsSection.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      setValidated(true);
      return;
    }

    // Check if composition totals 100%
    const totalComposition = calculateTotalComposition();
    if (Math.abs(totalComposition - 100) > 0.01) {
      setMaterialsValidationError(true);
      setMaterialsValidationMessage(
        `Total composition must equal 100%. Current total: ${totalComposition.toFixed(
          2
        )}%`
      );

      swal({
        icon: "error",
        title: "Composition Error",
        text: `Total composition must equal 100%. Current total: ${totalComposition.toFixed(
          2
        )}%`,
      });

      setValidated(true);
      return;
    }

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
        ? "Update this formulation?"
        : "Create this new finish goods?";

      swal({
        title: confirmMessage,
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const formData = getValues();

          // Prepare materials data with all required fields
          const filteredSelectedMaterials = getAllSelectedMaterials().map(
            (item, index) => {
              const baseMaterial = {
                index: index + 1,
                uuid: item.uuid,
                formulation_material_id: item.formulation_material_id || null, // For existing materials
                product_id: item.product_id || null, // Add this line
                category:
                  item.materialType === "vendor"
                    ? "Vendor Product"
                    : item.materialType === "raw"
                    ? "Raw Product"
                    : "Finished Product",
                composition: Number(item.composition) || 0,
                isAdded: item.qualified || false,
                targetWeight:
                  (Number(item.composition) / 100) * Number(totalWeight) || 0,
                instruction: item.instruction || "",
              };

              if (item.materialType === "vendor") {
                baseMaterial.product_tag_vendor_id = item.vendor_id;
              }

              console.log(baseMaterial, "ETO UNG BASE MATERIAL");

              return baseMaterial;
            }
          );

          const filteredParams = selectedParameters.filter(
            (item) => item.isDeleted === false
          );

          const filteredPhysical = selectedPhysical.filter(
            (item) => item.isDeleted === false
          );

          const remarksData = {
            currentRemark: {
              remarks: formData.remarks || "",
              id:
                isUpdate && remarksHistoryData.length > 0
                  ? remarksHistoryData[0].id
                  : null,
            },
            previousRemarks:
              isUpdate && remarksHistoryData.length > 1
                ? remarksHistoryData.slice(1).map((r) => ({
                    id: r.id,
                    remarks: r.remarks,
                  }))
                : [],
            deletedRemarks: isUpdate ? deletedRemarks : [],
          };

          const endpoint = isUpdate
            ? `${BASE_URL}/formulation/updateFormulation`
            : `${BASE_URL}/formulation/createFinishGoods`;

          const requestData = {
            formData,
            userLoggedID,
            remarksData,
            selectedMaterials: filteredSelectedMaterials,
            selectedParameters: filteredParams,
            selectedPhysical: filteredPhysical,
          };

          // Detailed console logging
          console.group("Formulation Submission Data");
          console.log("Form Data:", formData);
          console.log("User ID:", userLoggedID);

          console.group("Materials Data");
          filteredSelectedMaterials.forEach((material, index) => {
            console.group(`Material ${index + 1}`);

            console.log("UUID:", material.uuid);
            console.log("Type:", material.materialType);
            console.log("Product ID:", material.product_id);
            console.log("Vendor ID:", material.product_tag_vendor_id);
            console.log("Category:", material.category);
            console.log("Composition (%):", material.composition);
            console.log("Is Added:", material.isAdded);
            console.log("Target Weight (g):", material.targetWeight);
            console.log("Instruction:", material.instruction);
            console.groupEnd();
          });
          console.groupEnd();

          console.log("Parameters:", filteredParams);
          console.log("Physical Attributes:", filteredPhysical);
          console.log("Remarks Data:", remarksData);
          console.groupEnd();

          if (isUpdate) {
            requestData.productId = id;
          }

          console.log("requestData", requestData);

          // Submit the form
          axios
            .post(endpoint, requestData)
            .then((res) => {
              if (res.status === 200) {
                const successMessage = isUpdate
                  ? "Formulation updated successfully"
                  : "Finish Goods created successfully";

                swal({
                  title: "Success",
                  text: successMessage,
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("/inventory/formulation");
                  window.scrollTo(0, 0);
                });
              } else if (res.status === 205) {
                swal({
                  title: "Insufficient Stock",
                  text: "Some materials have insufficient stock to create this formulation.",
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
            .catch((error) => {
              console.error("Submission error:", error);
              swal({
                title: "Submission Failed",
                text:
                  error.response?.data?.message ||
                  error.message ||
                  "An unexpected error occurred",
                icon: "error",
                buttons: false,
                timer: 3000,
              });
            });
        }
      });
    }
    setValidated(true);
  };

  // Replace the delete button onClick handler in your main table with this logic:
  const handleDeleteMaterial = (item, materialType) => {
    if (materialType === "vendor") {
      setSelectedMaterials((prev) =>
        prev.map((i) => (i.uuid === item.uuid ? { ...i, isDeleted: true } : i))
      );
    } else if (materialType === "raw") {
      setSelectedRawMaterials((prev) =>
        prev.map((i) =>
          i.uuid === item.uuid ? { ...i, isRawDeleted: true } : i
        )
      );
    } else if (materialType === "finished") {
      setSelectedFinishedMaterials((prev) =>
        prev.map((i) =>
          i.uuid === item.uuid ? { ...i, isFinishedDeleted: true } : i
        )
      );
    }
  };

  const shouldSuffixBeReadOnly = useCallback(() => {
    if (!isUpdate) return false;
    const currentProductName = getValues("productName");
    const currentSuffix = getValues("suffix");
    return (
      currentProductName === originalProductName &&
      currentSuffix &&
      currentSuffix.trim() !== ""
    );
  }, [isUpdate, getValues, originalProductName]);

  const [showRemarksHistoryModal, setShowRemarksHistoryModal] = useState(false);
  const [remarksHistoryData, setRemarksHistoryData] = useState([]);
  const [originalRemarks, setOriginalRemarks] = useState([]);

  const handleShowRemarksHistory = () => {
    // Fetch the price history
    fetchRemarksHistory(id); // id is from useParams()
    setShowRemarksHistoryModal(true);
  };

  const handleDeleteRemarks = (remarksId) => {
    if (deletedRemarks.includes(remarksId)) return;
    setDeletedRemarks((prevIds) => {
      const updatedIds = [...prevIds, remarksId];
      console.log("Updated deletedRemarks:", updatedIds);
      return updatedIds;
    });
  };

  const handleRestoreRemarks = (remarksId) => {
    if (!deletedRemarks.includes(remarksId)) return;
    setDeletedRemarks((prevIds) => prevIds.filter((id) => id !== remarksId));
  };

  const handleClose = () => {
    setShowRemarksHistoryModal(false);
  };

  useEffect(() => {
    if (physicalPagination.data) {
      const activeItems = physicalPagination.data.filter(
        (item) => item.status === "Active"
      );
      const allSelected =
        activeItems.length > 0 &&
        activeItems.every((item) => isPhysicalSelected(item));
      setSelectAllPhysical(allSelected);
    }
  }, [selectedPhysical, physicalPagination.data]);

  useEffect(() => {
    if (paginationParameter.data) {
      const activeItems = paginationParameter.data.filter(
        (item) =>
          item.status === "Active" && item.category === currentParameterCategory
      );

      const allSelected =
        activeItems.length > 0 &&
        activeItems.every((item) => isParameterSelected(item));

      setSelectAllParameters(allSelected);
    }
  }, [selectedParameters, paginationParameter.data, currentParameterCategory]);

  const renderSource = (item) => {
    if (item.source && typeof item.source === "object" && item.source.name) {
      return item.source.name;
    }
    if (item.sourceName) {
      return item.sourceName;
    }
    if (typeof item.source === "string") {
      return item.source;
    }
    return "";
  };

  // for fetching the products
  const fetchFormulationMaterials = async (formulationId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/formulation/getFormulationMaterials`,
        {
          params: { formulationId },
        }
      );

      const materials = response.data || [];

      console.log(materials, "FETCH FORMULATION MATERIALS");

      return {
        vendorMaterials: materials
          .filter((item) => item.category === "Vendor Product")
          .map((item) => ({
            ...item,
            isDeleted: false,
            composition: item.composition || 0,
            qualified: item.isAdded || false,
            instruction: item.instruction || "",
            uuid: uuidv4(),
            isFromFormulation: true,
            product_tag_vendor_id: item.id,
            product_code: item.product_code,
            client_code: item.client_code,
            product_name: item.product_name,
            company_name: item.company_name,
          })),
        rawMaterials: materials
          .filter((item) => item.category === "Raw Product")
          .map((item) => ({
            ...item,
            isRawDeleted: false,
            composition: item.composition || 0,
            qualified: item.isAdded || false,
            instruction: item.instruction || "",
            uuid: uuidv4(),
            isFromFormulation: true,
            product_id: item.product_id,
            product_code: item.product_code,
            client_code: item.client_code,
            product_name: item.product_name,
          })),
        finishedMaterials: materials
          .filter((item) => item.category === "Finished Product")
          .map((item) => ({
            ...item,
            isFinishedDeleted: false,
            composition: item.composition || 0,
            qualified: item.isAdded || false,
            instruction: item.instruction || "",
            uuid: uuidv4(),
            isFromFormulation: true,
            product_id: item.product_id,
            product_code: item.product_code,
            client_code: item.client_code,
            product_name: item.product_name,
          })),
      };
    } catch (error) {
      console.error("Error fetching formulation materials:", error);
      return {
        vendorMaterials: [],
        rawMaterials: [],
        finishedMaterials: [],
      };
    }
  };

  const handleDuplicateFormulation = () => {
    const formData = getValues();

    // Check if there's any data to duplicate
    const fieldsToCheck = [
      formData.clientCode,
      formData.productName,
      formData.packaging_id,
      formData.remarks,
    ];

    const isAllEmpty = fieldsToCheck.every((value) => {
      return value === "" || value === null || value === undefined;
    });

    if (isAllEmpty) {
      swal({
        title: "Error",
        text: "No data to duplicate!",
        icon: "error",
        buttons: false,
        timer: 1500,
      });
      return;
    }

    // Prepare materials data
    const allMaterials = [
      ...selectedMaterials
        .filter((item) => !item.isDeleted)
        .map((item) => ({
          ...item,
          category: "Vendor Product",
          materialType: "vendor",
        })),
      ...selectedRawMaterials
        .filter((item) => !item.isRawDeleted)
        .map((item) => ({
          ...item,
          category: "Raw Product",
          materialType: "raw",
        })),
      ...selectedFinishedMaterials
        .filter((item) => !item.isFinishedDeleted)
        .map((item) => ({
          ...item,
          category: "Finished Product",
          materialType: "finished",
        })),
    ];

    // Prepare parameters and physical attributes
    const duplicatedParameters = selectedParameters
      .filter((item) => !item.isDeleted)
      .map((item) => ({ ...item }));

    const duplicatedPhysical = selectedPhysical
      .filter((item) => !item.isDeleted)
      .map((item) => ({ ...item }));

    const payload = {
      duplicatedData: {
        productCode: formData.productCode, // Reset product code as it should be unique
        clientCode: formData.clientCode || "",
        productName: formData.productName || "",
        productCategory: "Finish Product",
        packaging_id: formData.packaging_id?.toString() || "",
        srp_amount: formData.srp_amount || "",
        weight: formData.weight || 0,
        remarks: formData.remarks || "",
        threshold: formData.threshold || null,
      },
      duplicatedMaterials: allMaterials,
      duplicatedParameters,
      duplicatedPhysical,
    };

    // Store in session storage
    sessionStorage.setItem("duplicateFormulation", JSON.stringify(payload));

    // Open in new tab
    window.open("/inventory/formulation/duplicate", "_blank");
  };
  useEffect(() => {
    if (formulationData && packagingData.length > 0) {
      setValue("packaging_id", formulationData.packaging_id?.toString() || "");
    }
  }, [formulationData, packagingData, setValue]);

  const getAllSelectedMaterials = () => {
    return [
      ...selectedMaterials
        .filter((item) => !item.isDeleted)
        .map((item) => ({ ...item, materialType: "vendor" })),
      ...selectedRawMaterials
        .filter((item) => !item.isRawDeleted)
        .map((item) => ({ ...item, materialType: "raw" })),
      ...selectedFinishedMaterials
        .filter((item) => !item.isFinishedDeleted)
        .map((item) => ({ ...item, materialType: "finished" })),
    ].sort((a, b) => a.index - b.index);
  };

  useEffect(() => {
    if (isUpdate) {
      // Handle pre-checked vendor products
      if (pagination.data.length > 0) {
        const preCheckedMaterials = pagination.data.filter(
          (item) => item.isSelected
        );

        console.log(preCheckedMaterials, "THIS IS PRECHECKED MATS");

        setSelectedMaterials((prev) => {
          const existingIds = prev.map((m) => m.id);
          const newMaterials = preCheckedMaterials
            .filter((item) => !existingIds.includes(item.id))
            .map((item) => ({
              ...item,
              composition: item.composition || 0,
              targetWeight: item.targetWeight || 0,
              instruction: item.instruction || "",
              isAdded: item.isAdded || false,
            }));
          return [...prev, ...newMaterials];
        });
      }

      // Handle pre-checked raw products
      if (rawProductPagination.data.length > 0) {
        const preCheckedRawMaterials = rawProductPagination.data.filter(
          (item) => item.isSelected
        );
        setSelectedRawMaterials((prev) => {
          const existingIds = prev.map((m) => m.id);
          const newMaterials = preCheckedRawMaterials
            .filter((item) => !existingIds.includes(item.id))
            .map((item) => ({
              ...item,
              composition: item.composition || 0,
              targetWeight: item.targetWeight || 0,
              instruction: item.instruction || "",
              isAdded: item.isAdded || false,
            }));
          return [...prev, ...newMaterials];
        });
      }

      // Handle pre-checked finished products
      if (finishedProductPagination.data.length > 0) {
        const preCheckedFinishedMaterials =
          finishedProductPagination.data.filter((item) => item.isSelected);
        setSelectedFinishedMaterials((prev) => {
          const existingIds = prev.map((m) => m.id);
          const newMaterials = preCheckedFinishedMaterials
            .filter((item) => !existingIds.includes(item.id))
            .map((item) => ({
              ...item,
              composition: item.composition || 0,
              targetWeight: item.targetWeight || 0,
              instruction: item.instruction || "",
              isAdded: item.isAdded || false,
            }));
          return [...prev, ...newMaterials];
        });
      }
    }
  }, [
    isUpdate,
    pagination.data,
    rawProductPagination.data,
    finishedProductPagination.data,
  ]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {isLoading ? (
        <div className="loading-container">
          <ThreeDot
            variant="brick-stack"
            color="#6290FE"
            size="large"
            text="Loading Data..."
            textColor=""
          />
        </div>
      ) : authrztn.includes("Productions-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom2">
              <span className="fs-3">
                <button
                  onClick={() => navigate("/inventory/formulation")}
                  className="text-dark border-0"
                  style={{ background: "none" }}
                >
                  <i className="bx bx-arrow-back"></i>
                </button>
                {isUpdate ? "UPDATE FINISHED GOODS" : "CREATE FINISHED GOODS"}
              </span>
            </div>
            <div>
              <button
                className="btn btn-primary d-flex align-items-center title-button"
                onClick={handleDuplicateFormulation}
              >
                <i className="bx bx-copy fs-5 me-1"></i> Duplicate Formulation
              </button>
            </div>
          </div>
          <Form
            noValidate
            validated={validated}
            onSubmit={handleSubmitFormulation}
          >
            <div className="container-fluid mt-4">
              {/* {materialsValidationError && (
                <div
                  className="alert alert-warning alert-dismissible fade show"
                  role="alert"
                >
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Material Selection Required:</strong>{" "}
                  {materialsValidationMessage}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMaterialsValidationError(false)}
                  ></button>
                </div>
              )} */}
              <div className="row mb-3">
                <div className="col-sm-5">
                  <label htmlFor="cutoff">
                    Product Code
                    <span className="text-danger ps-1">*</span>
                  </label>
                  <input
                    placeholder="Enter Product Code"
                    type="text"
                    name=""
                    id="productCodeInput"
                    readOnly={isUpdate}
                    required
                    className="form-control p-3"
                    {...register("productCode", {
                      onChange: (e) => {
                        // Only validate if NOT in update mode
                        if (!isUpdate) {
                          const productCode = e.target.value;
                          const suffix = watch("suffix") || "";
                          // Only validate on input if suffix is also provided
                          if (suffix) {
                            checkProductCode(e, productCode, suffix);
                          }
                        }
                      },
                    })}
                  />
                </div>
                <div className="col-sm-1 d-flex flex-column justify-content-evenly">
                  <label htmlFor="cutoff">
                    Suffix
                    {/* Remove the asterisk - suffix is not required by default */}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    readOnly={shouldSuffixBeReadOnly()}
                    // Remove required attribute - suffix is optional by default
                    required={false}
                    id="suffixInput"
                    className="form-control p-3"
                    style={{
                      letterSpacing: "0.5px",
                      width: "100%",
                      minWidth: "50px",
                      fontSize: "0.9rem",
                      // Only show red outline if not in update mode and there's an existing formulation
                      ...(!isUpdate &&
                        isExistingFormulation &&
                        !shouldSuffixBeReadOnly() && {
                          outline: "2px solid red",
                        }),
                    }}
                    {...register("suffix", {
                      // Update validation - make suffix optional
                      validate: (value) => {
                        // Skip validation in update mode
                        if (isUpdate) return true;

                        // Suffix is always optional for input
                        if (value && !/^[A-Z0-9]{0,6}$/i.test(value)) {
                          return "Suffix must be alphanumeric and up to 6 characters";
                        }
                        return true;
                      },
                    })}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/[^A-Za-z0-9]/g, "")
                        .toUpperCase()
                        .slice(0, 6);
                      e.target.value = value;
                      handleSuffixOnChange(value);

                      // Only validate product code with suffix if NOT in update mode
                      if (!isUpdate) {
                        const productCode = getValues("productCode");
                        const productCodeInput =
                          document.getElementById("productCodeInput");
                        if (productCode && value) {
                          checkProductCode(
                            { target: productCodeInput },
                            productCode,
                            value
                          );
                        }
                      }
                    }}
                  />
                </div>

                <div className="col-sm-6">
                  <label htmlFor="cutoff">Product Category</label>

                  <Form.Select id="productCategory" className="p-3" disabled>
                    <option value="Finish Product" selected>
                      Finish Product
                    </option>
                  </Form.Select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-sm-6">
                  <label htmlFor="cutoff">
                    Product Name
                    <span className="text-danger ps-1">*</span>
                  </label>
                  <input
                    type="text"
                    name=""
                    id="productNameInput"
                    {...register("productName", {
                      onChange: (e) =>
                        handleProductNameOnChange(e.target.value),
                    })}
                    required
                    style={
                      isExistingFormulation ? { outline: "2px solid red" } : {}
                    }
                    className="form-control p-3"
                    placeholder="Enter Product Name"
                  />
                </div>

                {/* <div className="col-sm-6">
                  <label htmlFor="cutoff">
                    Packaging
                    <span className="text-danger ps-1">*</span>
                  </label>
                  <Form.Select
                    className="form-select p-3"
                    id="packaging_id"
                    {...register("packaging_id")}
                    required
                  >
                    <option disabled value="">
                      Select Packaging
                    </option>
                    {packagingData.map((data, index) => (
                      <option key={index} value={data.id}>
                        {data.packaging_name} ({data.unit_quantity}
                        {data.unit})
                      </option>
                    ))}
                  </Form.Select>
                </div> */}
                {/* Packaging Select Field with Enhanced Validation */}
                <div className="col-sm-6">
                  <label htmlFor="cutoff">
                    Packaging
                    <span className="text-danger ps-1">*</span>
                  </label>
                  <Select
                    options={packagingData.map((data) => ({
                      label: `${data.packaging_name} - (${data.unit_quantity}${data.unit})`,
                      value: data.id,
                    }))}
                    value={
                      watch("packaging_id")
                        ? {
                            label: `${
                              packagingData.find(
                                (data) => data.id === watch("packaging_id")
                              )?.packaging_name || ""
                            } - (${
                              packagingData.find(
                                (data) => data.id === watch("packaging_id")
                              )?.unit_quantity || ""
                            }${
                              packagingData.find(
                                (data) => data.id === watch("packaging_id")
                              )?.unit || ""
                            })`,
                            value: watch("packaging_id"),
                          }
                        : null
                    }
                    onChange={handlePackagingChange}
                    placeholder="Select Packaging"
                    isSearchable
                    isClearable
                    required
                    styles={{
                      control: (provided, state) => {
                        let borderColor = "#ced4da"; // Default gray
                        let borderWidth = "1px";

                        // Apply validation styling
                        if (packagingValidation.touched) {
                          if (!packagingValidation.valid) {
                            // Red border for invalid/required field
                            borderColor = "#DC3545";
                            borderWidth = "1px";
                          } else if (packagingValidation.valid) {
                            // Green border for valid field
                            borderColor = "#198754";
                            borderWidth = "1px";
                          }
                        }

                        // Add focus state
                        if (state.isFocused) {
                          if (!packagingValidation.valid) {
                            borderColor = "#DC3545";
                          } else {
                            borderColor = "#198754";
                          }
                        }

                        return {
                          ...provided,
                          paddingBlock: "0.6rem",
                          borderColor: borderColor,
                          borderWidth: borderWidth,
                          boxShadow: state.isFocused
                            ? `0 0 0 0.25rem rgba(${
                                borderColor === "#DC3545"
                                  ? "220, 53, 69"
                                  : "25, 135, 84"
                              }, 0.25)`
                            : "none",
                          "&:hover": {
                            borderColor: borderColor,
                          },
                          transition:
                            "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                        };
                      },
                      menu: (provided) => ({
                        ...provided,
                        position: "absolute",
                        zIndex: 9999,
                        width: "auto",
                        minWidth: "100%",
                      }),
                      menuPortal: (provided) => ({
                        ...provided,
                        zIndex: 9999,
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        padding: "8px 12px",
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                      }),
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    menuShouldBlockScroll={true}
                  />
                  {/* Validation Error Message */}
                  {/* {packagingValidation.touched && packagingValidation.error && (
                    <div className="text-danger small mt-1">
                      <i className="fas fa-exclamation-circle me-1"></i>
                      {packagingValidation.error}
                    </div>
                  )} */}
                  {/* Success Message */}
                  {/* {packagingValidation.touched && packagingValidation.valid && (
                    <div className="text-success small mt-1">
                      <i className="fas fa-check-circle me-1"></i>
                      Packaging selected
                    </div>
                  )} */}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-sm">
                  <label htmlFor="cutoff">Suggested Retail Price</label>
                  <div className="input-group">
                    <Controller
                      name="srp_amount"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <NumericFormat
                          className="form-control p-3"
                          thousandSeparator={true}
                          placeholder="Enter SRP (e.g. 1,000.00)"
                          value={value || 0}
                          onValueChange={(values) => {
                            onChange(values.floatValue); // Pass the raw float value to react-hook-form
                          }}
                          isAllowed={(values) => {
                            const { floatValue } = values;
                            return (
                              floatValue === undefined ||
                              (floatValue >= 0 && floatValue <= 9999999999)
                            );
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="col-sm">
                  <label htmlFor="cutoff">Target Weight</label>
                  <div className="input-group">
                    <Controller
                      name="weight"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <NumericFormat
                          className="form-control p-3"
                          thousandSeparator={true}
                          placeholder="Enter Weight"
                          value={value || 0}
                          onValueChange={(values) => {
                            // Use the raw value from the input to handle decimal input correctly
                            const rawValue = values.value;

                            if (rawValue === "") {
                              onChange(0);
                            } else if (rawValue === ".") {
                              onChange("0.");
                            } else {
                              // Allow the raw input to pass through for proper decimal handling
                              onChange(rawValue);
                            }
                          }}
                          allowLeadingZeros={true}
                          decimalScale={3}
                          isAllowed={(values) => {
                            const { floatValue, value } = values;

                            // Allow empty input and decimal point
                            if (value === "" || value === ".") {
                              return true;
                            }

                            // Allow valid numeric values within range
                            return (
                              floatValue === undefined ||
                              (floatValue >= 0.001 && floatValue <= 9999999999)
                            );
                          }}
                        />
                      )}
                    />
                    <div className="input-group-prepend">
                      <div className="input-group-text h-100">
                        <label>Kilogram(s)</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-sm">
                  {/* REMARKS  */}
                  <span className="pb-1">
                    Remarks{" "}
                    {isUpdate && (
                      <button
                        title="Remarks History"
                        type="button"
                        className={`btn btn-sm p-0 ms-1 position-relative ${
                          deletedRemarks.length > 0
                            ? "text-danger"
                            : "text-dark"
                        }`}
                        style={{
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          boxShadow: "none",
                        }}
                        onClick={() => handleShowRemarksHistory()}
                        onMouseOver={(e) => {
                          e.currentTarget.querySelector("i").style.opacity =
                            "0.7";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.querySelector("i").style.opacity =
                            "1";
                        }}
                      >
                        <i className="fa-solid fa-clock-rotate-left fs-6"></i>
                        {remarksHistoryData.length - 1 > 0 && (
                          <span
                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary"
                            style={{
                              fontSize: "0.5rem",
                              padding: "0.16.5rem 0.25rem",
                            }}
                          >
                            {remarksHistoryData.length - 1}
                          </span>
                        )}
                        {deletedRemarks.length > 0 && (
                          <span
                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                            style={{
                              fontSize: "0.5rem",
                              padding: "0.16.5rem 0.25rem",
                            }}
                          >
                            {deletedRemarks.length}
                          </span>
                        )}
                      </button>
                    )}
                  </span>

                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Leave a remark"
                    {...register("remarks")}
                    value={watch("remarks") || ""}
                    onChange={(e) => {
                      setValue("remarks", e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="row mb-3 mt-5 d-flex">
                <span className="text-decoration-underline mb-3">
                  THRESHOLD NOTIFICATION
                </span>
                <div className="col-md-6">
                  <Form.Label htmlFor="threshold">
                    Critical Inventory Threshold
                  </Form.Label>

                  <div className="input-group">
                    <Controller
                      name="threshold"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <NumericFormat
                          className="form-control p-3"
                          thousandSeparator={true}
                          placeholder="Enter Threshold"
                          // required
                          value={value || ""}
                          onValueChange={(values) => {
                            onChange(values.floatValue); // Pass the raw float value to react-hook-form
                          }}
                          isAllowed={(values) => {
                            const { floatValue } = values;
                            return (
                              floatValue === undefined ||
                              floatValue <= 9999999999
                            );
                          }}
                        />
                      )}
                    />
                    <div className="input-group-prepend">
                      <div className="input-group-text h-100">
                        <label>Kilogram(s)</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6"></div>
              </div>
            </div>
            <div className="table-responsive mt-5">
              <div className="w-100 d-flex align-items-center mb-2">
                <span>Material List</span>
                <hr className="flex-grow-1 mx-3" />
              </div>
              <table
                className="table table-bordered table-hover"
                id="formulation-table-materials"
                style={
                  materialsValidationError
                    ? { border: "2px solid #dc3545", borderRadius: "4px" }
                    : {}
                }
              >
                <thead className="table-light">
                  <tr>
                    <th className="text-center">NO.</th>
                    <th className="text-center">CATEGORY</th>
                    <th className="text-center">PRODUCT CODE</th>
                    <th className="text-center">PRODUCT NAME</th>
                    <th className="text-center">SUPPLIER</th>
                    <th className="text-center">
                      COMPOSITION
                      <span className="text-danger ps-1">*</span>
                    </th>
                    <th className="text-center">ADDED</th>
                    <th className="text-center">TARGET WEIGHT</th>
                    <th className="text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllSelectedMaterials().map((item, i) => {
                    const materialType =
                      item.category === "Vendor Product"
                        ? "vendor"
                        : item.category === "Raw Product"
                        ? "raw"
                        : "finished";

                    const categoryName = item.category || "Unknown";

                    return (
                      <React.Fragment key={`${materialType}-${item.uuid}`}>
                        <tr>
                          <td className="text-center">{item.index || i + 1}</td>
                          <td className="text-center">
                            <span
                              className={`badge bg-${
                                materialType === "vendor"
                                  ? "primary"
                                  : materialType === "raw"
                                  ? "warning text-dark"
                                  : "success"
                              }`}
                            >
                              {categoryName}
                            </span>
                          </td>
                          <td className="text-center">
                            {item.product_code || item.client_code || "---"}
                          </td>
                          <td className="text-center">
                            {item.product_name || "---"}
                          </td>
                          <td className="text-center">
                            {materialType === "vendor"
                              ? item.company_name || "---"
                              : "---"}
                          </td>
                          <td className="text-center">
                            <div className="input-group">
                              <input
                                type="text"
                                inputMode="decimal"
                                pattern="^\d*\.?\d{0,2}$"
                                className="form-control p-3"
                                value={item.composition || ""}
                                required
                                onChange={(e) =>
                                  handleInputChange(
                                    item.uuid,
                                    e.target.value,
                                    materialType
                                  )
                                }
                              />
                              <div className="input-group-prepend">
                                <div className="input-group-text h-100">
                                  <label>%</label>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center align-items-center mt-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                style={{ padding: "0.8rem" }}
                                checked={item.qualified || false}
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    item.uuid,
                                    e.target.checked,
                                    materialType
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className="text-center">
                            {calculateTargetWeight(item.composition)}kg
                          </td>
                          <td className="text-center">
                            <i
                              className="fas fa-trash"
                              style={{
                                cursor: "pointer",
                                color: "red",
                                fontSize: "1.5rem",
                              }}
                              onClick={() =>
                                handleDeleteMaterial(item, materialType)
                              }
                            ></i>
                            <i
                              className="fa-solid fa-circle-info ms-2"
                              onClick={() =>
                                toggleInstruction(item.uuid, materialType)
                              }
                              style={{
                                cursor: "pointer",
                                color: "#3590ae",
                                fontSize: "1.7rem",
                              }}
                            ></i>
                          </td>
                        </tr>
                        {showInstructions[`${materialType}-${item.uuid}`] && (
                          <tr>
                            <td
                              colSpan="9"
                              style={{ backgroundColor: "#D3D3D3" }}
                            >
                              <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Leave Instruction here"
                                value={item.instruction || ""}
                                onChange={(e) =>
                                  handleTextareaChange(
                                    item.uuid,
                                    e.target.value,
                                    materialType
                                  )
                                }
                              ></textarea>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="w-100 d-flex justify-content-start mt-2">
              <button
                className={`btn btn-sm ${
                  materialsValidationError
                    ? "btn-outline-danger"
                    : "btn-primary"
                }`}
                type="button"
                onClick={() => setMaterialsModal(true)}
              >
                <i
                  className={`fas ${
                    materialsValidationError
                      ? "fa-exclamation-triangle"
                      : "fa-plus"
                  } me-1`}
                ></i>
                {materialsValidationError
                  ? "Select Materials Required"
                  : "New Item"}
              </button>
              {/* {materialsValidationError && (
                <button
                  className="btn btn-sm btn-link text-danger ms-2"
                  type="button"
                  onClick={() => {
                    setMaterialsModal(true);
                    // Set active tab to raw products by default
                    setTimeout(() => {
                      const tabElement = document.querySelector(
                        '[data-rr-ui-event-key="productList"]'
                      );
                      if (tabElement) tabElement.click();
                    }, 100);
                  }}
                >
                  <i className="fas fa-arrow-right me-1"></i>
                  Click here to select
                </button>
              )} */}
            </div>

            <div className="row mt-3">
              <div className="col-sm"></div>
              <div className="col-sm"></div>
              <div className="col-sm">
                <div
                  className="w-100 d-flex flex-row justify-content-between p-2 mb-1"
                  style={{ backgroundColor: "#d6ebf2" }}
                >
                  <span>Record Counts</span>
                  <span className="text-secondary">
                    {countActiveProducts()} Product(s)
                  </span>
                </div>
                <div
                  className="w-100 d-flex flex-row justify-content-between p-2 mb-1"
                  style={{ backgroundColor: "#d6ebf2" }}
                >
                  <span>Total Target Weight</span>
                  <span className="text-secondary">
                    {Number(totalTargetWeight || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{" "}
                    kg
                  </span>
                </div>
                <div
                  className="w-100 d-flex flex-row justify-content-between p-2"
                  style={{ backgroundColor: "#d6ebf2" }}
                >
                  <span>Total Composition</span>
                  <span className="text-secondary">
                    {calculateTotalComposition()}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="d-flex justify-content-between">
                <span className="me-2">Physical Attributes</span>
                <div
                  onClick={() => setPhysicalModal(true)}
                  className="btn btn-primary d-flex flex-row align-items-center"
                >
                  <i className="bx bx-plus fs-5"></i>
                </div>
              </div>

              <div className="table-responsive mt-2">
                <table className="table table-bordered table-striped table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center">NO.</th>
                      <th className="text-center">ATTRIBUTE NAME</th>
                      <th className="text-center">DESCRIPTION</th>
                      {/* <th className="text-center">DATE CREATED</th> */}
                      <th className="text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPhysical
                      .filter((item) => !item.isDeleted)
                      .map((item, i) => (
                        <tr key={i}>
                          <td className="text-center">{i + 1}</td>
                          <td className="text-center">{item.attribute}</td>
                          <td className="text-center">
                            <textarea
                              className="form-control"
                              rows="2"
                              value={item.description || ""}
                              onChange={(e) =>
                                handlePhysicalTextAreaChange(
                                  item.physical_id,
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          {/* Date Created */}
                          {/* <td className="text-center">
                            {new Date(item.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td> */}
                          <td className="text-center">
                            <i
                              className="fas fa-trash"
                              style={{
                                cursor: "pointer",
                                color: "red",
                                fontSize: "1.5rem",
                              }}
                              onClick={() =>
                                handleCheckSelectPhysical(
                                  item,
                                  !isPhysicalSelected(item)
                                )
                              }
                            ></i>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CHEMICAL PARAMETERS TABLE */}
            <div className="mt-5">
              <div
                className="w-100 d-flex align-items-center"
                style={{
                  paddingInline: "0.75rem",
                }}
              >
                <hr className="flex-grow-1 mx-2" />
              </div>
              <div className="d-flex justify-content-between">
                <span className="me-2">Chemical Parameters</span>

                <div>
                  <div
                    onClick={() => {
                      setCurrentParameterCategory("Chemical");
                      setParameterModal(true);
                    }}
                    className="btn btn-primary d-flex flex-row align-items-center"
                  >
                    <i className="bx bx-plus fs-5"></i>
                  </div>
                </div>
              </div>

              <div className="table-responsive mt-2">
                <table className="table table-bordered table-striped table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center">NO.</th>
                      <th className="text-center">SPECIFICATION NAME</th>
                      <th className="text-center">UNIT OF MEASURE</th>
                      <th className="text-center">VALUE</th>
                      <th className="text-center d-none">CATEGORY</th>
                      {/* <th className="text-center">DATE CREATED</th> */}
                      <th className="text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParameters
                      .filter(
                        (item) =>
                          !item.isDeleted && item.category === "Chemical"
                      )
                      .map((item, i) => (
                        <tr key={i}>
                          <td className="text-center">{i + 1}</td>
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control p-3"
                                value={item.uom || ""}
                                required
                                readOnly
                                onChange={(e) =>
                                  handleParameterInputChange(
                                    item.id,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control p-3"
                                value={item.value || ""}
                                required
                                onChange={(e) =>
                                  handleParameterValueInputChange(
                                    item.id,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className="text-center d-none">
                            <div className="input-group">
                              <select
                                value={item.category || ""}
                                className="form-select p-3"
                                onChange={(e) =>
                                  handleParameterSelectedChange(
                                    item.id,
                                    e.target.value
                                  )
                                }
                              >
                                <option>Chemical</option>
                                <option>Microbiological</option>
                              </select>
                            </div>
                          </td>
                          {/* Date created */}
                          {/* <td className="text-center">
                            {new Date(item.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td> */}
                          <td className="text-center">
                            <i
                              className="fas fa-trash"
                              style={{
                                cursor: "pointer",
                                color: "red",
                                fontSize: "1.5rem",
                              }}
                              onClick={() =>
                                handleCheckSelectParameter(
                                  item,
                                  !isParameterSelected(item)
                                )
                              }
                            ></i>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MICROBIOLOGICAL PARAMETERS TABLE */}
            <div className="mt-5">
              <div
                className="w-100 d-flex align-items-center"
                style={{
                  paddingInline: "0.75rem",
                }}
              >
                <hr className="flex-grow-1 mx-2" />
              </div>
              <div className="d-flex justify-content-between">
                <span className="me-2">Microbiological Parameters</span>

                <div
                  onClick={() => {
                    setCurrentParameterCategory("Microbiological");
                    setParameterModal(true);
                  }}
                  className="btn btn-primary d-flex flex-row align-items-center"
                >
                  <i className="bx bx-plus fs-5"></i>
                </div>
              </div>

              <div className="table-responsive mt-2">
                <table className="table table-bordered table-striped table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center">NO.</th>
                      <th className="text-center">SPECIFICATION NAME</th>
                      <th className="text-center">UNIT OF MEASURE</th>
                      <th className="text-center">VALUE</th>
                      <th className="text-center d-none">CATEGORY</th>
                      {/* <th className="text-center">DATE CREATED</th> */}
                      <th className="text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParameters
                      .filter(
                        (item) =>
                          !item.isDeleted && item.category === "Microbiological"
                      )
                      .map((item, i) => (
                        <tr key={i}>
                          <td className="text-center">{i + 1}</td>
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control p-3"
                                value={item.uom || ""}
                                required
                                readOnly
                                onChange={(e) =>
                                  handleParameterInputChange(
                                    item.id,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control p-3"
                                value={item.value || ""}
                                required
                                onChange={(e) =>
                                  handleParameterValueInputChange(
                                    item.id,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className="text-center d-none">
                            <div className="input-group">
                              <select
                                value={item.category || ""}
                                className="form-select p-3"
                                onChange={(e) =>
                                  handleParameterSelectedChange(
                                    item.id,
                                    e.target.value
                                  )
                                }
                              >
                                <option>Chemical</option>
                                <option>Microbiological</option>
                              </select>
                            </div>
                          </td>
                          {/* <td className="text-center">
                            {new Date(item.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td> */}
                          <td className="text-center">
                            <i
                              className="fas fa-trash"
                              style={{
                                cursor: "pointer",
                                color: "red",
                                fontSize: "1.5rem",
                              }}
                              onClick={() =>
                                handleCheckSelectParameter(
                                  item,
                                  !isParameterSelected(item)
                                )
                              }
                            ></i>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

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
                          setDeletedRemarks([]);
                          setCurrentSuffix("");
                          setCurrentProductName("");
                          navigate(`/inventory/formulation`);
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
                        disabled={isUpdate && isExistingFormulation}
                        title={
                          getAllSelectedMaterials().length === 0
                            ? "Please select at least one material"
                            : ""
                        }
                      >
                        {isUpdate ? "Update" : "Save"}
                        {getAllSelectedMaterials().length === 0 && (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id="material-tooltip">
                                Please select at least one material
                              </Tooltip>
                            }
                          >
                            <i className="fas fa-exclamation-circle ms-2 text-warning"></i>
                          </OverlayTrigger>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
          {/* Materials Modal */}
          <Modal
            size="xl"
            show={materialsModal}
            onHide={() => setMaterialsModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Raw & Consumable Material Lists</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Tabs
                defaultActiveKey="productList"
                id="material-tabs"
                className="mb-3 w-100"
              >
                {/* <Tab eventKey="vendorProductList" title="Vendor Products" className="">
                  <div className="row mb-3">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search"
                        onChange={(e) =>
                          pagination.setSearchTerm(e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ width: "50px" }}>
                            <div className="d-flex justify-content-center align-items-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectAllMaterials}
                                onChange={handleSelectAllMaterials}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </th>
                          <th className="text-center">Product Code</th>
                          <th className="text-center">Product Name</th>
                          <th className="text-center">UOM</th>
                          <th className="text-center">Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagination.loading ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              <ThreeDot
                                variant="brick-stack"
                                color="#6290FE"
                                size="medium"
                                text="Loading materials..."
                              />
                            </td>
                          </tr>
                        ) : pagination.error ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center text-danger py-4"
                            >
                              <i className="fas fa-exclamation-circle me-2"></i>
                              Failed to load materials
                            </td>
                          </tr>
                        ) : pagination.data?.filter(
                            (item) => item.status === "Active"
                          ).length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center text-muted py-4"
                            >
                              No vendor materials found
                            </td>
                          </tr>
                        ) : (
                          pagination.data
                            ?.filter((item) => item.status === "Active")
                            .map((item) => {
                              const isSelected = isItemSelected(item);
                              const isFromFormulation = selectedMaterials.some(
                                (m) =>
                                  (m.product_tag_vendor_id === item.id ||
                                    m.id === item.id) &&
                                  m.isFromFormulation
                              );

                              return (
                                <tr
                                  key={item.id}
                                  onClick={(e) => {
                                    if (e.target.type !== "checkbox") {
                                      handleCheckSelectProduct(
                                        item,
                                        !isSelected
                                      );
                                    }
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isFromFormulation
                                      ? "#f8f9fa"
                                      : "inherit",
                                  }}
                                >
                                  <td>
                                    <div className="d-flex justify-content-center align-items-center">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          handleCheckSelectProduct(
                                            item,
                                            e.target.checked
                                          );
                                          e.stopPropagation();
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        // disabled={isFromFormulation}
                                      />
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    {item.product_code ||
                                      item.client_code ||
                                      "---"}
                                  </td>
                                  <td className="text-center">
                                    {item.product_name || "---"}
                                  </td>
                                  <td className="text-center">
                                    {item.packaging_name || "---"}
                                  </td>
                                  <td className="text-center">
                                    {item.company_name || "---"}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-end mt-2">
                    <PaginationControls {...pagination} />
                  </div>
                </Tab> */}

                <Tab eventKey="productList" title="Raw Product List">
                  <div className="row mb-3">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search"
                        onChange={(e) =>
                          rawProductPagination.setSearchTerm(e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ width: "50px" }}>
                            <div className="d-flex justify-content-center align-items-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectAllRawMaterials}
                                onChange={handleSelectAllRawMaterials}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </th>
                          <th className="text-center">Product Code</th>
                          <th className="text-center">Product Name</th>
                          <th className="text-center">UOM</th>
                          <th className="text-center">Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rawProductPagination.loading ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              <ThreeDot
                                variant="brick-stack"
                                color="#6290FE"
                                size="medium"
                                text="Loading raw materials..."
                              />
                            </td>
                          </tr>
                        ) : rawProductPagination.error ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center text-danger py-4"
                            >
                              <i className="fas fa-exclamation-circle me-2"></i>
                              Failed to load raw materials
                            </td>
                          </tr>
                        ) : rawProductPagination.data?.filter(
                            (item) => item.status === "Active"
                          ).length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center text-muted py-4"
                            >
                              No raw materials found
                            </td>
                          </tr>
                        ) : (
                          rawProductPagination.data
                            ?.filter((item) => item.status === "Active")
                            .map((item) => {
                              const isSelected = isItemRawSelected(item);
                              const isFromFormulation =
                                selectedRawMaterials.some(
                                  (m) =>
                                    (m.product_id === item.product_id ||
                                      m.id === item.product_id) &&
                                    m.isFromFormulation
                                );

                              return (
                                <tr
                                  key={`raw-${item.product_id || item.id}`}
                                  onClick={(e) => {
                                    if (e.target.type !== "checkbox") {
                                      handleCheckSelectRawProduct(
                                        item,
                                        !isSelected
                                      );
                                    }
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isFromFormulation
                                      ? "#f8f9fa"
                                      : "inherit",
                                  }}
                                >
                                  <td>
                                    <div className="d-flex justify-content-center align-items-center">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          handleCheckSelectRawProduct(
                                            item,
                                            e.target.checked
                                          );
                                          e.stopPropagation();
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        // disabled={isFromFormulation}
                                      />
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    {item.product_code ||
                                      item.client_code ||
                                      "---"}
                                  </td>
                                  <td className="text-center">
                                    {item.product_name || "---"}
                                  </td>
                                  <td className="text-center">
                                    {item.packaging_name || "---"}
                                  </td>
                                  <td className="text-center">---</td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-end mt-2">
                    <PaginationControls {...rawProductPagination} />
                  </div>
                </Tab>

                <Tab
                  eventKey="finishedProductList"
                  title="Finished Product List"
                >
                  <div className="row mb-3">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search"
                        onChange={(e) =>
                          finishedProductPagination.setSearchTerm(
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ width: "50px" }}>
                            <div className="d-flex justify-content-center align-items-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectAllFinishedMaterials}
                                onChange={handleSelectAllFinishedMaterials}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </th>
                          <th className="text-center">Product Code</th>
                          <th className="text-center">Product Name</th>
                          <th className="text-center">UOM</th>
                          <th className="text-center">Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finishedProductPagination.loading ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              <ThreeDot
                                variant="brick-stack"
                                color="#6290FE"
                                size="medium"
                                text="Loading finished products..."
                              />
                            </td>
                          </tr>
                        ) : finishedProductPagination.error ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center text-danger py-4"
                            >
                              <i className="fas fa-exclamation-circle me-2"></i>
                              Failed to load finished products
                            </td>
                          </tr>
                        ) : finishedProductPagination.data?.filter(
                            (item) => item.status === "Active"
                          ).length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center text-muted py-4"
                            >
                              No finished products found
                            </td>
                          </tr>
                        ) : (
                          finishedProductPagination.data
                            ?.filter((item) => item.status === "Active")
                            .map((item) => {
                              const isSelected = isItemFinishedSelected(item);
                              const isFromFormulation =
                                selectedFinishedMaterials.some(
                                  (m) =>
                                    (m.product_id === item.product_id ||
                                      m.id === item.product_id) &&
                                    m.isFromFormulation
                                );

                              return (
                                <tr
                                  key={`finished-${item.product_id || item.id}`}
                                  onClick={(e) => {
                                    if (e.target.type !== "checkbox") {
                                      handleCheckSelectFinishedProduct(
                                        item,
                                        !isSelected
                                      );
                                    }
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isFromFormulation
                                      ? "#f8f9fa"
                                      : "inherit",
                                  }}
                                >
                                  <td>
                                    <div className="d-flex justify-content-center align-items-center">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          handleCheckSelectFinishedProduct(
                                            item,
                                            e.target.checked
                                          );
                                          e.stopPropagation();
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        // disabled={isFromFormulation}
                                      />
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    {item.product_code ||
                                      item.client_code ||
                                      "---"}
                                  </td>
                                  <td className="text-center">
                                    {item.product_name || "---"}
                                  </td>
                                  <td className="text-center">
                                    {item.packaging_name || "---"}
                                  </td>
                                  <td className="text-center">---</td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-end mt-2">
                    <PaginationControls {...finishedProductPagination} />
                  </div>
                </Tab>
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setMaterialsModal(false)}
                variant="secondary"
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
          {/* Parameter Modal */}
          <Modal
            size="xl"
            show={parameterModal}
            onHide={() => setParameterModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>{currentParameterCategory} Parameters</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: "50px" }}>
                        <div className="d-flex justify-content-center align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={paginationParameter.data
                              ?.filter(
                                (item) =>
                                  item.status === "Active" &&
                                  item.category === currentParameterCategory
                              )
                              .every((item) => {
                                const selectedParam = selectedParameters.find(
                                  (p) => p.id === item.id
                                );
                                const effectiveCategory =
                                  selectedParam?.category || item.category;
                                return isParameterSelected({
                                  ...item,
                                  category: effectiveCategory,
                                });
                              })}
                            onChange={handleSelectAllParameters}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="text-center">No.</th>
                      <th className="text-center">Specification Name</th>
                      <th className="text-center">Unit of Measure</th>
                      <th className="text-center">Description</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginationParameter.loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <ThreeDot
                            variant="brick-stack"
                            color="#6290FE"
                            size="medium"
                            text="Loading parameters..."
                          />
                        </td>
                      </tr>
                    ) : paginationParameter.error ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center text-danger py-4"
                        >
                          <i className="fas fa-exclamation-circle me-2"></i>
                          Failed to load parameters
                        </td>
                      </tr>
                    ) : paginationParameter.data?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No {currentParameterCategory.toLowerCase()} parameters
                          found
                        </td>
                      </tr>
                    ) : (
                      paginationParameter.data
                        ?.filter(
                          (item) =>
                            item.status === "Active" &&
                            item.category === currentParameterCategory
                        )
                        .map((item, index) => {
                          const selectedParam = selectedParameters.find(
                            (p) => p.id === item.id
                          );
                          const effectiveCategory =
                            selectedParam?.category || item.category;
                          const isSelected = isParameterSelected({
                            ...item,
                            category: effectiveCategory,
                          });

                          return (
                            <tr
                              key={item.id}
                              onClick={(e) => {
                                // Only trigger if clicking on the row, not on the checkbox
                                if (e.target.type !== "checkbox") {
                                  handleCheckSelectParameter(
                                    { ...item, category: effectiveCategory },
                                    !isSelected
                                  );
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <td>
                                <div className="d-flex justify-content-center align-items-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      handleCheckSelectParameter(
                                        {
                                          ...item,
                                          category: effectiveCategory,
                                        },
                                        e.target.checked
                                      );
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </td>
                              <td className="text-center">{index + 1}</td>
                              <td className="text-center">{item.name}</td>
                              <td className="text-center">{item.uom || ""}</td>
                              <td className="text-center">
                                {item.description || "-"}
                              </td>
                              <td className="text-center">
                                <span
                                  className={`badge bg-${
                                    item.status === "Active"
                                      ? "success"
                                      : "secondary"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end align-items-center mt-1">
                <div>
                  <PaginationControls {...paginationParameter} />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className="d-flex justify-content-between w-100">
                <div>
                  <span className="text-muted me-3">
                    Selected:{" "}
                    {
                      selectedParameters.filter(
                        (item) =>
                          !item.isDeleted &&
                          item.category === currentParameterCategory
                      ).length
                    }
                  </span>
                </div>
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => setParameterModal(false)}
                    className="me-2"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </Modal>
          <Modal
            size="xl"
            show={physicalModal}
            onHide={() => setPhysicalModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Physical Attributes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: "50px" }}>
                        <div className="d-flex justify-content-center align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={physicalPagination.data
                              ?.filter((item) => item.status === "Active")
                              .every((item) => isPhysicalSelected(item))}
                            onChange={handleSelectAllPhysical}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="text-center">No.</th>
                      <th className="text-center">Attribute Name</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {physicalPagination.loading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          <ThreeDot
                            variant="brick-stack"
                            color="#6290FE"
                            size="medium"
                            text="Loading physical attributes..."
                          />
                        </td>
                      </tr>
                    ) : physicalPagination.error ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center text-danger py-4"
                        >
                          <i className="fas fa-exclamation-circle me-2"></i>
                          Failed to load physical attributes
                        </td>
                      </tr>
                    ) : physicalPagination.data?.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">
                          No physical attributes found
                        </td>
                      </tr>
                    ) : (
                      physicalPagination.data
                        ?.filter((item) => item.status === "Active")
                        .map((item, index) => {
                          const isSelected = isPhysicalSelected(item);
                          return (
                            <tr
                              key={item.physical_id}
                              onClick={(e) => {
                                // Only trigger if clicking on the row, not on the checkbox
                                if (e.target.type !== "checkbox") {
                                  handleCheckSelectPhysical(item, !isSelected);
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <td>
                                <div className="d-flex justify-content-center align-items-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      handleCheckSelectPhysical(
                                        item,
                                        e.target.checked
                                      );
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </td>
                              <td className="text-center">{index + 1}</td>
                              <td className="text-center">{item.attribute}</td>
                              <td className="text-center">
                                <span
                                  className={`badge bg-${
                                    item.status === "Active"
                                      ? "success"
                                      : "secondary"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end align-items-center mt-1">
                <div>
                  <PaginationControls {...physicalPagination} />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className="d-flex justify-content-between w-100">
                <div>
                  <span className="text-muted me-3">
                    Selected:{" "}
                    {selectedPhysical.filter((item) => !item.isDeleted).length}
                  </span>
                </div>
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => setPhysicalModal(false)}
                    className="me-2"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </Modal>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}

      {/*remarks history Modal */}
      <Modal
        show={showRemarksHistoryModal}
        onHide={handleClose}
        backdrop="static"
        size="xl"
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h5 fw-bold">Remarks History</Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="p-4 scrollable-contents"
          style={{
            maxHeight: "575px",
            overflowY: "scroll",
            scrollbarWidth: "thin",
            scrollbarColor: "#dee2e6 #f8f9fa",
          }}
        >
          <div className="remarks-history-container">
            {remarksHistoryData.length > 1 ? (
              <div className="d-flex flex-column gap-4">
                {remarksHistoryData.slice(1).map((history) =>
                  deletedRemarks.includes(history.id) ? (
                    <div
                      key={history.id}
                      className="card bg-light bg-opacity-25"
                    >
                      <div
                        className="card-body position-relative"
                        style={{ opacity: 0.35 }}
                      >
                        <div className="row align-items-center">
                          <div className="col-md-12">
                            <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 pe-5">
                              <span className="p-2 fs-6 badge bg-secondary bg-opacity-10 text-black">
                                {history.fullName}
                              </span>
                              <div className="text-muted d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center">
                                <div className="fw-bold">
                                  {dayjs(history.createdAt).format(
                                    "MMMM DD, YYYY"
                                  )}
                                </div>
                                <div className="small d-none d-sm-block">•</div>
                                <div className="small">
                                  {new Date(
                                    history.createdAt
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="form-floating position-relative">
                              <textarea
                                className="form-control border border-danger text-muted fst-italic bg-white"
                                rows="3"
                                value={history.remarks || ""}
                                readOnly
                                placeholder="Remarks"
                                style={{
                                  height: "100px",
                                  backgroundColor: "#f8f9fa",
                                  opacity: 0.6,
                                }}
                              />
                              <label className="text-muted">
                                Remarks (Deleted)
                              </label>

                              <span
                                className="position-absolute top-0 end-0 mt-1 me-2 badge bg-danger text-white"
                                style={{ fontSize: "0.75rem" }}
                              >
                                Deleted
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreRemarks(history.id)}
                        className="btn btn-sm btn-outline-primary position-absolute d-flex align-items-center justify-content-center p-0"
                        style={{
                          top: "1rem",
                          right: "1rem",
                          width: "32px",
                          height: "32px",
                        }}
                        title="Restore remark"
                      >
                        <i className="fas fa-undo-alt"></i>
                      </button>
                    </div>
                  ) : (
                    <div key={history.id} className="card shadow-sm">
                      <div className="card-body position-relative">
                        <button
                          onClick={() => handleDeleteRemarks(history.id)}
                          className="btn btn-sm btn-outline-danger position-absolute d-flex align-items-center justify-content-center p-0"
                          style={{
                            top: "1rem",
                            right: "1rem",
                            width: "32px",
                            height: "32px",
                          }}
                          title="Delete remark"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>

                        <div className="row align-items-center">
                          <div className="col-md-12">
                            <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 pe-5">
                              <span className="p-2 fs-6 badge bg-secondary bg-opacity-10 text-black">
                                {history.fullName}
                              </span>
                              <div className="text-muted d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center">
                                <div className="fw-bold">
                                  {dayjs(history.createdAt).format(
                                    "MMMM DD, YYYY"
                                  )}
                                </div>
                                <div className="small d-none d-sm-block">•</div>
                                <div className="small">
                                  {new Date(
                                    history.createdAt
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="form-floating">
                              <textarea
                                className="form-control bg-light border-0"
                                rows="3"
                                value={history.remarks || ""}
                                readOnly
                                placeholder="Remarks"
                                style={{ height: "100px" }}
                              />
                              <label>Remarks</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-5">
                <h5 className="text-muted">No previous remarks found</h5>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CreateUpdateFormulation2;
