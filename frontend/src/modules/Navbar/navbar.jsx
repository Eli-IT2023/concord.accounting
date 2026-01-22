import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import ELI from "../../assets/img/ELI LOGO.png";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import swal from "sweetalert";
import { jwtDecode } from "jwt-decode";
import { Bell } from "@phosphor-icons/react";
import Modal from "react-bootstrap/Modal";

const Navbar = ({ authrztn }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [Fname, setFname] = useState("");
  const [Lname, setLname] = useState("");
  const [usersType, setUsersType] = useState("");
  const [invoiceDueDateData, setInvoiceDueDateData] = useState([]);
  const [expensesDueDateData, setExpensesDueDateData] = useState([]);
  const [payableDueDateData, setPayableDueDateData] = useState([]);
  const [customerLastTransaction, setCustomerLastTransaction] = useState([]);

  const [showNotificationIndicator, setShowNotificationIndicator] =
    useState(false);
  const [showSeeMoreModal, setShowSeeMoreModal] = useState(false);

  const handleClose = () => {
    setShowSeeMoreModal(false);
  };

  const openSeeMore = () => {
    setShowSeeMoreModal(true);
    setShowNotifications(false);
  };
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  const toggleNotifications = async () => {
    setShowNotifications((prev) => !prev);

    if (!showNotifications) {
      try {
        const res = await axios.get(
          `${BASE_URL}/notification/getInvoiceandExpensesAlertNotification`,
        );
        setInvoiceDueDateData(res.data.salesInvoices || []);
        setExpensesDueDateData(res.data.expenses || []);
        setPayableDueDateData(res.data.payable || []);
        setCustomerLastTransaction(res.data.customer || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchNotificationIndicator = async () => {
      const res = await axios.get(
        `${BASE_URL}/notification/getInvoiceandExpensesAlertNotification`,
      );

      if (res.status === 200) {
        const { salesInvoices, expenses, payable, customer } = res.data;

        const hasUnreadNotification =
          salesInvoices.some((item) => item.notification === false) ||
          expenses.some((item) => item.notification === false) ||
          payable.some((item) => item.notification === false) ||
          customer.some((item) => item.notification === false);

        setShowNotificationIndicator(hasUnreadNotification);
      }
    };

    fetchNotificationIndicator();
  }, []);

  const getCombinedNotifications = () => {
    const combined = [
      ...invoiceDueDateData.map((item) => ({
        ...item,
        type: "invoice",
        date: new Date(item.due_date),
        description: "Due Date Invoice",
      })),
      ...expensesDueDateData.map((item) => ({
        ...item,
        type: "expense",
        date: new Date(item.due_date),
        description: "Due Date Expenses",
      })),
      ...payableDueDateData.map((item) => ({
        ...item,
        type: "payable",
        date: new Date(item.due_date),
        description: "Due Date Payable",
      })),
      ...customerLastTransaction.map((item) => ({
        ...item,
        type: "customer",
        date: new Date(item.invoice_date),
        description: "Customer Last Transaction",
      })),
    ].sort((a, b) => b.date - a.date);

    return combined;
  };

  const NotificationItem = ({ item, onClick }) => (
    <li
      className={`nav-item mb-2 ${
        !item.notification ? "row-not-clicked" : "row-clicked"
      }`}
      onClick={onClick}
    >
      <div className="notification-item d-flex">
        <div className="me-3">
          {!item.notification && (
            <i
              className="fa fa-circle"
              style={{ color: "red", fontSize: "0.5rem" }}
            ></i>
          )}
        </div>
        <div>
          <p className="mb-1">{item.description}</p>
          <small className="text-muted">
            {item.type === "customer" ? "Date Transaction: " : "Due on: "}
            {item.date.toLocaleDateString()}
          </small>
        </div>
      </div>
    </li>
  );

  const renderNotificationList = (notifications, limit = null) => {
    const notificationsToShow = limit
      ? notifications.slice(0, limit)
      : notifications;

    return (
      <ul className="list-unstyled notification-list">
        {notificationsToShow.map((item) => (
          <NotificationItem
            key={`${item.type}-${item.id || item.sales_invoice_id}`}
            item={item}
            onClick={() =>
              handleRowClick(item.id || item.sales_invoice_id, item.type)
            }
          />
        ))}
      </ul>
    );
  };

  const DeductFixedAssetDepreciation = () => {
    try {
      axios
        .get(BASE_URL + "/fixedasset/deductDepreciation")
        .then((res) => {})
        .catch((err) => {
          swal({
            title: "Something Went Wrong",
            text: "wag pansinin pag nagdevelop",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          });
        });
    } catch (error) {
      swal({
        title: "Something Went Wrong",
        text: "Please contact your support immediately",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      });
    }
  };

  useEffect(() => {
    DeductFixedAssetDepreciation();
  }, []);

  const decodeToken = () => {
    var token = localStorage.getItem("accessToken");
    if (typeof token === "string") {
      var decoded = jwtDecode(token);
      setFname(decoded.Fname);
      setLname(decoded.Lname);
      setUsersType(decoded.userType);
    }
  };
  useEffect(() => {
    decodeToken();
  }, []);

  const handleRowClick = async (id, type) => {
    const route =
      type === "invoice"
        ? "/updateNotificationInvoice"
        : type === "expense"
          ? "/updateNotificationExpenses"
          : type === "payable"
            ? "/updateNotificationPayable"
            : type === "customer"
              ? "/updateNotificationLastCustomerTransaction"
              : "";

    const updateStatus = await axios.put(`${BASE_URL}/notification${route}`, {
      id,
    });

    if (updateStatus.status === 200) {
      if (type === "invoice") {
        navigate(`/sales/invoices-copy/${id}`);
      } else if (type === "expense") {
        navigate(`/accounting/expenses-copy/${id}`);
      } else if (type === "payable") {
        navigate(`/Purchases/Payable-copy/${id}`);
      } else if (type === "customer") {
        navigate(`/sales/invoices-copy/${id}`);
      }
      setShowNotifications(false);
      setShowSeeMoreModal(false);
    }
  };

  // concord notification integration
  const [showConcordNotification, setShowConcordNotification] = useState(false);
  const concordNotifRef = useRef(null);
  const bellButtonRef = useRef(null);

  const [concordNotifications, setConcordNotifications] = useState([]);
  const [allConcordNotifications, setAllConcordNotifications] = useState([]); // New state for all notifications
  const [concordNotificationCount, setConcordNotificationCount] = useState(0);
  const [
    isLoadingAllConcordNotifications,
    setIsLoadingAllConcordNotifications,
  ] = useState(false);

  const [showConcordShowMoreModal, setShowConcordShowMoreModal] =
    useState(false);

  // Fetch active notifications for the dropdown
  const fetchConcordNotifications = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/concordNotification/getActiveNotification`,
      );
      setConcordNotifications(response.data.data || []);
    } catch (error) {
      console.error("Error fetching concord notifications:", error);
    }
  }, []);

  const fetchConcordNotificationCount = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/concordNotification/countActiveNotifications`,
      );
      setConcordNotificationCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching concord notification count:", error);
    }
  }, []);

  // Combined fetch function
  const fetchAllNotificationData = useCallback(async () => {
    await Promise.all([
      fetchConcordNotifications(),
      fetchConcordNotificationCount(),
    ]);
  }, [fetchConcordNotifications, fetchConcordNotificationCount]);

  // Fetch ALL notifications for the modal
  const fetchAllConcordNotifications = async () => {
    setIsLoadingAllConcordNotifications(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/concordNotification/getActiveNotification`,
      );
      setAllConcordNotifications(response.data.data || []);
    } catch (error) {
      console.error("Error fetching all concord notifications:", error);
    } finally {
      setIsLoadingAllConcordNotifications(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchAllNotificationData();
  }, [fetchAllNotificationData]);

  // Toggle notifications and fetch fresh data
  const toggleConcordNotifications = async () => {
    const newState = !showConcordNotification;
    setShowConcordNotification(newState);

    if (newState) {
      // Only fetch when opening the notification dropdown
      await fetchAllNotificationData();
    }
  };

  // Open the modal and fetch all notifications
  const openConcordSeeMore = async () => {
    setShowConcordNotification(false); // Hide the notification dropdown
    setShowConcordShowMoreModal(true);
    await fetchAllConcordNotifications();
  };

  // concord date notification formatter
  const [now, setNow] = useState(new Date());

  const formatNotificationTime = (date) => {
    const created = new Date(date);
    const diffMs = now - created;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return created.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // read notification update
  const markNotificationAsRead = async (notification, navigate = true) => {
    try {
      await axios.post(
        `${BASE_URL}/concordNotification/readNotification/${notification.id}`,
      );

      // Update the dropdown notifications
      setConcordNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n,
        ),
      );

      // Update the modal notifications
      setAllConcordNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n,
        ),
      );

      // Update count
      setConcordNotificationCount((prev) => Math.max(prev - 1, 0));

      if (navigate) {
        window.location.href = notification.module_url;
      }
    } catch (error) {
      console.error(error);
    }
  };

  // swipe for read update
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const SWIPE_THRESHOLD = 60;

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      isSwiping.current = true;
      e.preventDefault(); // stop text selection
    }
  };

  const handleTouchEnd = (notification, e) => {
    if (!isSwiping.current) return;

    const endX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - endX;

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      markNotificationAsRead(notification, false);
    }

    isSwiping.current = false;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        concordNotifRef.current &&
        !concordNotifRef.current.contains(event.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        setShowConcordNotification(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowConcordNotification(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleCloseConcordModal = () => {
    setShowConcordShowMoreModal(false);
  };

  return (
    <nav className="custom-navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div className="container-fluid d-flex justify-content-between align-items-center h-100">
        <div className="navbar-brand"></div>
        <div className="d-flex align-items-center h-100">
          {/* Original Notifications (Kept for future use) */}
          {false && authrztn.includes("Notifications-View") && (
            <div className="p-2 position-relative" ref={notificationRef}>
              {showNotificationIndicator && (
                <div className="bg-danger rounded-circle have-notif position-absolute"></div>
              )}
              <button
                className="notification"
                style={{ border: "none", background: "inherit" }}
                onClick={toggleNotifications}
              >
                <Bell size={30} />
              </button>

              {showNotifications && (
                <div className="position-absolute notification-card bg-white shadow-sm rounded p-3 border">
                  <h6>Notifications</h6>
                  {getCombinedNotifications().length === 0 ? (
                    <p className="text-muted">No notifications available</p>
                  ) : (
                    <>
                      {renderNotificationList(getCombinedNotifications(), 10)}
                      {getCombinedNotifications().length > 10 && (
                        <div
                          className="text-decoration-underline text-primary text-center"
                          onClick={openSeeMore}
                          style={{ cursor: "pointer" }}
                        >
                          See More
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Concord Notifications */}
          {authrztn.includes("Notifications-View") && (
            <div className="p-2 position-relative">
              {concordNotificationCount > 0 && (
                <div className="bg-danger rounded-circle have-notif position-absolute"></div>
              )}

              <button
                ref={bellButtonRef}
                className="notification"
                style={{ border: "none", background: "inherit" }}
                onClick={toggleConcordNotifications}
              >
                <Bell size={30} />
              </button>

              {/* Notification list */}
              <div
                ref={concordNotifRef}
                className={`position-absolute notification-card bg-white shadow-sm rounded py-3 px-2 border
        ${showConcordNotification ? "notif-open" : "notif-close"}`}
              >
                <div className="d-flex justify-content-between align-items-center px-2 mb-2">
                  <h6 className="mb-0">Notifications</h6>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={fetchAllNotificationData}
                    title="Refresh notifications"
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>

                {concordNotificationCount === 0 ? (
                  <p className="text-muted px-2">No notifications available</p>
                ) : (
                  <>
                    {concordNotifications.slice(0, 5).map((notification) => (
                      <li
                        key={notification.id}
                        className={`mb-2 p-2 rounded concord-notification-card cursor-pointer ${
                          notification.isRead ? "opacity-50" : ""
                        }`}
                        style={{ listStyle: "none" }}
                        onClick={() => markNotificationAsRead(notification)}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={(e) => handleTouchEnd(notification, e)}
                      >
                        <div className="d-flex flex-column">
                          <span
                            className="text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            {notification.module_to} •{" "}
                            {formatNotificationTime(notification.createdAt)}
                          </span>

                          <span
                            className="fw-semibold text-dark"
                            style={{ fontSize: "13px" }}
                          >
                            {notification.type}
                          </span>

                          <span
                            className="text-dark"
                            style={{ fontSize: "12px" }}
                          >
                            {notification.message}
                          </span>
                        </div>
                      </li>
                    ))}

                    {concordNotificationCount > 5 && (
                      <div
                        className="text-center fw-semibold p-2 rounded concord-notification-card"
                        onClick={openConcordSeeMore}
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        See More
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="dropdown d-flex align-items-center h-100 user-infos">
            <div
              className="d-flex align-items-center"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="user-info me-2 m-2 ">
                <div className="user-name">
                  {`${Fname} ${Lname}`.length > 30
                    ? `${`${Fname} ${Lname}`.substring(0, 30)}...`
                    : `${Fname} ${Lname}`}
                </div>
                <div className="text-secondary user-role">
                  User Account
                  {/* {usersType.length > 10
                    ? `${usersType.substring(0, 10)}...`
                    : usersType} */}
                </div>
              </div>
              <img
                src={ELI}
                alt="Profile"
                className="rounded-circle border user-image m-2 h-100"
              />
              <i className="fa-solid fa-sort-down ms-2 m-2"></i>
            </div>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Original See More Modal (Kept for future use) */}
      <Modal show={showSeeMoreModal} onHide={handleClose} size="md">
        <Modal.Header closeButton>
          <Modal.Title>All Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renderNotificationList(getCombinedNotifications())}
        </Modal.Body>
      </Modal>

      {/* Concord Show More Modal */}
      <Modal
        show={showConcordShowMoreModal}
        onHide={handleCloseConcordModal}
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>All Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className="w-100 scrollable-contents"
            style={{ maxHeight: "750px", overflowY: "scroll" }}
          >
            {isLoadingAllConcordNotifications ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : allConcordNotifications.length === 0 ? (
              <p className="text-muted text-center">
                No notifications available
              </p>
            ) : (
              <>
                {allConcordNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`mb-2 p-2 rounded concord-notification-card cursor-pointer${
                      notification.isRead ? "opacity-50" : ""
                    }`}
                    style={{ listStyle: "none" }}
                    onClick={() => markNotificationAsRead(notification)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(notification, e)}
                  >
                    <div className="d-flex flex-column">
                      <span className="text-muted" style={{ fontSize: "11px" }}>
                        {notification.module_to} •{" "}
                        {formatNotificationTime(notification.createdAt)}
                      </span>

                      <span
                        className="fw-semibold text-dark"
                        style={{ fontSize: "13px" }}
                      >
                        {notification.type}
                      </span>

                      <span className="text-dark" style={{ fontSize: "12px" }}>
                        {notification.message}
                      </span>
                    </div>
                  </li>
                ))}
              </>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </nav>
  );
};

export default Navbar;
