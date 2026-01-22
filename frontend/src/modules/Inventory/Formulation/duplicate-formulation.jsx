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
import { useNavigate } from "react-router-dom";
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

const DuplicateFormulation = ({ authrztn }) => {
  const uuid = uuidv4();
  const navigate = useNavigate();
  const debounceTimeout = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [packagingData, setPackagingData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [showInstructions, setShowInstructions] = useState({});
  const [materialsModal, setMaterialsModal] = useState(false);
  const [parameterModal, setParameterModal] = useState(false);
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
    pagination.refreshData();
  }, [pagination]);

  const fetchRawMaterials = useCallback(() => {
    rawProductPagination.refreshData();
  }, [rawProductPagination]);

  const fetchFinishedMaterials = useCallback(() => {
    finishedProductPagination.refreshData();
  }, [finishedProductPagination]);

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

  // Product code validation on input (when suffix exists)
  const checkProductCode = async (e, productCode, suffix = "") => {
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

  // Product code validation on save (regardless of suffix)
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

  // Validation for product name and suffix combination
  // useEffect(() => {
  //   const checkNameAndSuffix = async () => {
  //     // If product name is empty, no validation and suffix is not required
  //     if (!currentProductName) {
  //       setIsExistingFormulation(false);
  //       return;
  //     }

  //     // If product name exists and suffix is empty, no need to validate
  //     if (currentProductName && !currentSuffix) {
  //       setIsExistingFormulation(false);
  //       return;
  //     }

  //     // If both product name and suffix are filled, validate if combination exists
  //     if (currentProductName && currentSuffix) {
  //       try {
  //         const res = await axios.get(
  //           `${BASE_URL}/product/fetchProductNameAndSuffix`,
  //           {
  //             params: {
  //               productName: currentProductName,
  //               suffix: currentSuffix,
  //               isUpdate: "false", // Always false for duplicate
  //               id: null,
  //             },
  //           }
  //         );

  //         if (res.data.success) {
  //           if (res.data.exists) {
  //             const confirmed = await swal({
  //               icon: "warning",
  //               title: "Oops!",
  //               text: `Product Name with the same Suffix already exists.`,
  //               button: "OK",
  //               dangerMode: true,
  //               closeOnClickOutside: false,
  //               closeOnEsc: false,
  //             });

  //             if (confirmed) {
  //               const suffixInput = document.getElementById("suffixInput");
  //               const pNameInput = document.getElementById("productNameInput");

  //               // Clear both fields
  //               pNameInput.value = "";
  //               suffixInput.value = "";
  //               setValue("productName", "");
  //               setValue("suffix", "");
  //               setCurrentSuffix("");
  //               setCurrentProductName("");
  //             }
  //           } else {
  //             setIsExistingFormulation(false);
  //           }
  //         }
  //       } catch (err) {
  //         console.error("Error checking product:", err);
  //       }
  //     }
  //   };

  //   checkNameAndSuffix();
  // }, [currentProductName, currentSuffix, setValue]);

  useEffect(() => {
    const checkNameAndSuffix = async () => {
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
                isUpdate: "false", // Always false for duplicate
                id: null,
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

                // Only clear suffix, not product name
                suffixInput.value = "";
                setValue("suffix", "");
                setCurrentSuffix("");
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
  }, [currentProductName, currentSuffix, setValue]);

  const fetchPackging = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataPackaging`);
      setPackagingData(res.data);
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

  const userLoggedID = useDecodeToken();

  // Load duplicated data from session storage
  useEffect(() => {
    const loadDuplicatedData = () => {
      const duplicatedData = sessionStorage.getItem("duplicateFormulation");
      if (duplicatedData) {
        try {
          const parsedData = JSON.parse(duplicatedData);
          const {
            duplicatedData: formData,
            duplicatedMaterials,
            duplicatedParameters,
            duplicatedPhysical,
          } = parsedData;

          // Set form values
          Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              setValue(key, value);
            }
          });

          // Set materials
          setSelectedMaterials(
            duplicatedMaterials
              .filter((item) => item.category === "Vendor Product")
              .map((item) => ({
                ...item,
                uuid: uuidv4(),
                isDeleted: false,
              }))
          );

          setSelectedRawMaterials(
            duplicatedMaterials
              .filter((item) => item.category === "Raw Product")
              .map((item) => ({
                ...item,
                uuid: uuidv4(),
                isRawDeleted: false,
              }))
          );

          setSelectedFinishedMaterials(
            duplicatedMaterials
              .filter((item) => item.category === "Finished Product")
              .map((item) => ({
                ...item,
                uuid: uuidv4(),
                isFinishedDeleted: false,
              }))
          );

          // Set parameters
          setSelectedParameters(
            duplicatedParameters.map((item) => ({
              ...item,
              isDeleted: false,
            }))
          );

          // Set physical attributes
          setSelectedPhysical(
            duplicatedPhysical.map((item) => ({
              ...item,
              isDeleted: false,
            }))
          );
        } catch (error) {
          console.error("Error parsing duplicated data:", error);
          swal({
            title: "Error",
            text: "Failed to load duplicated formulation data",
            icon: "error",
          }).then(() => {
            navigate("/inventory/formulation");
          });
        }
      } else {
        swal({
          title: "Error",
          text: "No duplicated formulation data found",
          icon: "error",
        }).then(() => {
          navigate("/inventory/formulation");
        });
      }
    };

    loadDuplicatedData();
    fetchPackging();
    fetchSource();
  }, [navigate, setValue]);

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
        if (!item.isDeleted) {
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
        if (!item.isRawDeleted) {
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
        if (!item.isFinishedDeleted) {
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

  const isItemRawSelected = (item) => {
    return selectedRawMaterials.some(
      (i) =>
        (i.product_id === (item.product_id || item.id) ||
          i.id === (item.product_id || item.id)) &&
        !i.isRawDeleted
    );
  };

  const isItemFinishedSelected = (item) => {
    return selectedFinishedMaterials.some(
      (i) =>
        (i.product_id === (item.product_id || item.id) ||
          i.id === (item.product_id || item.id)) &&
        !i.isFinishedDeleted
    );
  };

  const handleCheckSelectProduct = (item, isChecked) => {
    setSelectedMaterials((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_tag_vendor_id === item.id || i.id === item.id
      );

      if (isChecked) {
        if (existingIndex >= 0) {
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
          return [
            ...prev,
            {
              ...item,
              id: item.id || null,
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
        if (existingIndex >= 0) {
          return prev.map((i) =>
            i.product_tag_vendor_id === item.id || i.id === item.id
              ? { ...i, isDeleted: true }
              : i
          );
        }
        return prev;
      }
    });
  };

  const handleCheckSelectRawProduct = (item, isChecked) => {
    setSelectedRawMaterials((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_id === item.product_id || i.id === item.product_id
      );

      if (isChecked) {
        if (existingIndex >= 0) {
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
        if (existingIndex >= 0) {
          return prev.map((i) =>
            i.product_id === item.product_id || i.id === item.product_id
              ? { ...i, isRawDeleted: true }
              : i
          );
        }
        return prev;
      }
    });
  };

  const handleCheckSelectFinishedProduct = (item, isChecked) => {
    setSelectedFinishedMaterials((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_id === item.product_id || i.id === item.product_id
      );

      if (isChecked) {
        if (existingIndex >= 0) {
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
        if (existingIndex >= 0) {
          return prev.map((i) =>
            i.product_id === item.product_id || i.id === item.product_id
              ? { ...i, isFinishedDeleted: true }
              : i
          );
        }
        return prev;
      }
    });
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
          return prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  isDeleted: false,
                  value: 0,
                  uom: item.uom || "",
                  category: item.category,
                }
              : i
          );
        } else {
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

      setSelectedPhysical((prev) => [
        ...prev.filter(
          (item) =>
            !activeItems.some((ai) => ai.physical_id === item.physical_id)
        ),
        ...itemsToAdd,
      ]);
    } else {
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
          return prev.map((i) =>
            i.physical_id === item.physical_id
              ? {
                  ...i,
                  isDeleted: false,
                  description: "",
                  attribute: item.attribute,
                  physical_id: item.physical_id,
                  createdAt: item.createdAt,
                }
              : i
          );
        } else {
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
      (i) => i.physical_id === item.physical_id && i.isDeleted === false
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
    // Allow two decimal places (same as create-update)
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
      return (comp / 100) * currentWeight;
    },
    [currentWeight]
  );

  // validation for material
  const [materialsValidationError, setMaterialsValidationError] =
    useState(false);
  const [materialsValidationMessage, setMaterialsValidationMessage] =
    useState("");

  const handleSubmitFormulation = (e) => {
    e.preventDefault();

    // Reset validation states
    setMaterialsValidationError(false);
    setMaterialsValidationMessage("");

    const form = e.currentTarget;
    const allMaterials = getAllSelectedMaterials();

    // Get form values
    const formData = getValues();
    const productCode = formData.productCode;
    const suffix = formData.suffix || "";
    const productName = formData.productName;

    // Always validate product code on save (regardless of suffix)
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
      const confirmMessage = "Create this new finish goods?";

      swal({
        title: confirmMessage,
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const filteredSelectedMaterials = allMaterials.map((item, index) => {
            const baseMaterial = {
              index: index + 1,
              uuid: item.uuid,
              product_id: item.product_id || null,
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

            return baseMaterial;
          });

          const filteredParams = selectedParameters.filter(
            (item) => item.isDeleted === false
          );

          const filteredPhysical = selectedPhysical.filter(
            (item) => item.isDeleted === false
          );

          const requestData = {
            formData,
            userLoggedID,
            selectedMaterials: filteredSelectedMaterials,
            selectedParameters: filteredParams,
            selectedPhysical: filteredPhysical,
          };

          axios
            .post(`${BASE_URL}/formulation/createFinishGoods`, requestData)
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Finish Goods created successfully",
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
                CREATE FINISHED GOODS
              </span>
            </div>
          </div>

          <div className="alert alert-info mb-3 mx-2">
            <i className="bx bx-info-circle me-2"></i>
            You're editing a duplicated formulation.
          </div>
          <Form
            noValidate
            validated={validated}
            onSubmit={handleSubmitFormulation}
          >
            <div className="container-fluid mt-4">
              {materialsValidationError && (
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
              )}
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
                    required
                    className="form-control p-3"
                    {...register("productCode", {
                      onChange: (e) => {
                        const productCode = e.target.value;
                        const suffix = watch("suffix") || "";
                        // Only validate on input if suffix is also provided
                        if (suffix) {
                          checkProductCode(e, productCode, suffix);
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
                    // Remove required attribute - suffix is optional by default
                    required={false}
                    id="suffixInput"
                    className="form-control p-3"
                    style={{
                      letterSpacing: "0.5px",
                      width: "100%",
                      minWidth: "50px",
                      fontSize: "0.9rem",
                      ...(isExistingFormulation && {
                        outline: "2px solid red",
                      }),
                    }}
                    {...register("suffix", {
                      // Update validation - make suffix optional
                      validate: (value) => {
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

                      // Also trigger product code validation when suffix changes
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
                    onChange={(selectedOption) =>
                      setValue("packaging_id", selectedOption?.value || "")
                    }
                    placeholder="Select Packaging"
                    isSearchable
                    isClearable
                    required
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        paddingBlock: "0.6rem",
                      }),
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
                      option: (provided) => ({
                        ...provided,
                        padding: "8px 12px",
                      }),
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    menuShouldBlockScroll={true}
                  />
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
                          value={value || ""}
                          onValueChange={(values) => {
                            onChange(values.floatValue);
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
                          required
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
                  <span className="pb-1">Remarks</span>
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
                          value={value || ""}
                          onValueChange={(values) => {
                            onChange(values.floatValue);
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
                          <td className="text-center">{i + 1}</td>
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
              {materialsValidationError && (
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
              )}
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
                  <span className="text-secondary">{totalTargetWeight}kg</span>
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
                      <th className="text-center">DATE CREATED</th>
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
                          <td className="text-center">
                            {new Date(item.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
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
                      <th className="text-center">DATE CREATED</th>
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
                          <td className="text-center">
                            {new Date(item.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
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
                      <th className="text-center">DATE CREATED</th>
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
                          <td className="text-center">
                            {new Date(item.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
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
                        // Only disable if there's an existing formulation with same name AND suffix
                        disabled={isExistingFormulation && currentSuffix !== ""}
                        title={
                          getAllSelectedMaterials().length === 0
                            ? "Please select at least one material"
                            : isExistingFormulation && currentSuffix !== ""
                            ? "Product name with this suffix already exists"
                            : ""
                        }
                      >
                        Save
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
                {/* <Tab eventKey="vendorProductList" title="Vendor Products">
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
                                  style={{ cursor: "pointer" }}
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
                                  style={{ cursor: "pointer" }}
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
                                  style={{ cursor: "pointer" }}
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
    </div>
  );
};

export default DuplicateFormulation;
