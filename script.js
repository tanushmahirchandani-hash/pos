// ---------- INITIAL SETUP ----------
// FIX: Ensure all required keys are initialized
if (!localStorage.getItem("xyz_stock")) localStorage.setItem("xyz_stock", JSON.stringify([]));
if (!localStorage.getItem("xyz_sales")) localStorage.setItem("xyz_sales", JSON.stringify([]));
// The 'xyz_udhaar' key is not used by any file (except for a reference in initial setup here), removing dependency
// if (!localStorage.getItem("xyz_udhaar")) localStorage.setItem("xyz_udhaar", JSON.stringify([])); 
if (!localStorage.getItem("xyz_notifications")) localStorage.setItem("xyz_notifications", JSON.stringify([]));

// NOTE: These IDs are from the assumed main page, but the main page is 'index.html' which defers to 'index.js'
// This file might be redundant/unused.

// ---------- CHECK AUTO ALERTS ----------
function checkAutoAlerts() {
  const stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];
  // Use sales data instead of udhaarList for alerts
  // FIX: Read from xyz_sales
  const sales = JSON.parse(localStorage.getItem("xyz_sales")) || []; 
  let notifications = JSON.parse(localStorage.getItem("xyz_notifications")) || [];
  const today = new Date().toLocaleDateString();

  // Low stock alerts
  stock.forEach(item => {
    if (item.threshold && item.quantity < item.threshold) {
      // FIX: Check if notification already exists to prevent duplicates
      const message = `Item "${item.name}" below threshold (${item.quantity} left)`;
      if (!notifications.some(n => n.message === message && n.type === "low_stock")) {
        notifications.push({
          type: "low_stock",
          message: message,
          date: today
        });
      }
    }
  });

  // Udhaar alerts
  const udhaarSales = sales.filter(s => s.payment.toLowerCase() === "udhaar");
  if (udhaarSales.length > 0) {
    const totalPending = udhaarSales.length;
    const message = `${totalPending} customer(s) have pending udhaar.`;
    // FIX: Check if notification already exists to prevent duplicates
    if (!notifications.some(n => n.message.includes("pending udhaar") && n.type === "udhaar")) {
      notifications.push({
        type: "udhaar",
        message: message,
        date: today
      });
    }
  }

  localStorage.setItem("xyz_notifications", JSON.stringify(notifications));
}

// Check for alerts on page load
// Assuming the following functions exist/are defined if this file is used.
// checkAutoAlerts();
// loadNotifications();
