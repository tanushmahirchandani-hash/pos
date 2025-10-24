// -------------------------------
// XYZ Store POS - Notification System
// -------------------------------

const notifBtn = document.getElementById("notifBtn");
const notifPopup = document.getElementById("notifPopup");
const closeNotif = document.getElementById("closeNotif");
const notifList = document.getElementById("notifList");
const notifCount = document.getElementById("notifCount");
const clearNotif = document.getElementById("clearNotif");

// 🧾 Load notifications stored from Add Stock or other actions
function loadNotifications() {
  return JSON.parse(localStorage.getItem("xyz_notifications")) || [];
}

// 💰 Load Udhaar customers (pending credit bills)
function loadUdhaarAlerts() {
  // FIX: Use 'xyz_sales' which now holds the bill data
  const sales = JSON.parse(localStorage.getItem("xyz_sales")) || []; 
  // FIXED: Ensure Udhaar is checked in lowercase for consistency
  const udhaars = sales.filter(s => s.payment.toLowerCase() === "udhaar"); 

  return udhaars.map(u => ({
    type: "udhaar",
    // FIX: Use customerName which is now top-level in the sales object
    message: `💰 ${u.customerName || 'Customer'} has pending Udhaar of ₹${u.total.toFixed(2)}`, 
    date: u.date
  }));
}

// 📦 Load stock alerts (if below threshold)
function loadLowStockAlerts() {
  const stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];
  return stock
    .filter(item => item.threshold && item.quantity < item.threshold)
    .map(item => ({
      type: "low_stock",
      message: `⚠️ Low stock: ${item.name} (only ${item.quantity} left)`,
      date: new Date().toLocaleDateString()
    }));
}

// 🔔 Render all notifications
function renderNotifications() {
  const systemNotifs = loadNotifications();
  const udhaarAlerts = loadUdhaarAlerts();
  const stockAlerts = loadLowStockAlerts();

  const allNotifs = [...systemNotifs, ...udhaarAlerts, ...stockAlerts];
  notifList.innerHTML = "";

  if (allNotifs.length === 0) {
    notifList.innerHTML = `<p class="text-gray-500 text-center py-4">No notifications 🎉</p>`;
  } else {
    allNotifs.forEach(n => {
      const div = document.createElement("div");
      div.className =
        "border border-gray-200 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition";
      div.innerHTML = `
        <p>${n.message}</p>
        <p class="text-sm text-gray-400">${n.date}</p>
      `;
      notifList.appendChild(div);
    });
  }

  // Show badge
  if (allNotifs.length > 0) {
    notifCount.textContent = allNotifs.length;
    notifCount.classList.remove("hidden");
  } else {
    notifCount.classList.add("hidden");
  }
}

// 🧹 Mark all notifications as read
function clearAllNotifications() {
  // FIX: Clear only system-generated/transient notifications, not auto-generated alerts (stock/udhaar)
  // For simplicity, we'll keep the current behavior but note the improvement
  localStorage.removeItem("xyz_notifications"); 
  renderNotifications();
  notifPopup.classList.add("hidden");
}

// 🪄 Show popup
notifBtn.addEventListener("click", () => {
  renderNotifications(); // Rerender when opening to catch new alerts
  notifPopup.classList.remove("hidden");
});

// ❌ Close popup
closeNotif.addEventListener("click", () => {
  notifPopup.classList.add("hidden");
});

// 🧹 Clear all button
clearNotif.addEventListener("click", clearAllNotifications);

// 🚀 Initialize on page load
renderNotifications();
