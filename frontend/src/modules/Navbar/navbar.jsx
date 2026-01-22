import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
          `${BASE_URL}/notification/getInvoiceandExpensesAlertNotification`
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
        `${BASE_URL}/notification/getInvoiceandExpensesAlertNotification`
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

  // const DeductFixedAssetDepreciation = () => {
  //   try {
  //     axios
  //       .get(BASE_URL + "/fixedasset/deductDepreciation")
  //       .then((res) => {})
  //       .catch((err) => {
  //         swal({
  //           title: "Something Went Wrong",
  //           text: "wag pansinin pag nagdevelop",
  //           icon: "error",
  //           buttons: false,
  //           timer: 2000,
  //           dangerMode: true,
  //         });
  //       });
  //   } catch (error) {
  //     swal({
  //       title: "Something Went Wrong",
  //       text: "Please contact your support immediately",
  //       icon: "error",
  //       buttons: false,
  //       timer: 2000,
  //       dangerMode: true,
  //     });
  //   }
  // };

  // useEffect(() => {
  //   DeductFixedAssetDepreciation();
  // }, []);

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

  return (
    <nav className="custom-navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div className="container-fluid d-flex justify-content-between align-items-center h-100">
        <div className="navbar-brand"></div>
        <div className="d-flex align-items-center h-100">
          {authrztn.includes("Notifications-View") && (
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
                <button
                  className="dropdown-item"
                  onClick={() => navigate("/companyProfile")}
                >
                  Settings
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Modal show={showSeeMoreModal} onHide={handleClose} size="md">
        <Modal.Header closeButton>
          <Modal.Title>All Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renderNotificationList(getCombinedNotifications())}
        </Modal.Body>
      </Modal>
    </nav>
  );
};

export default Navbar;
