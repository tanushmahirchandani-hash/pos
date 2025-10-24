// -------------------------------
// XYZ Store POS - Notification System
// -------------------------------

const notifBtn = document.getElementById("notifBtn");
const notifPopup = document.getElementById("notifPopup");
const closeNotif = document.getElementById("closeNotif");
const notifList = document.getElementById("notifList");
const notifCount = document.getElementById("notifCount");
const clearNotif = document.getElementById("clearNotif");

// --- UTILITY FUNCTIONS ---

// 🧾 Load notifications stored from Add Stock or other actions
function loadNotifications() {
  return JSON.parse(localStorage.getItem("xyz_notifications")) || [];
}

// 🤫 Load dismissed alert IDs
function loadDismissedAlerts() {
  return JSON.parse(localStorage.getItem("xyz_dismissed_alerts")) || [];
}

// 💰 Load Udhaar customers (pending credit bills)
function loadUdhaarAlerts() {
  const sales = JSON.parse(localStorage.getItem("xyz_sales")) || [];
  const udhaars = sales.filter(s => s.payment.toLowerCase() === "udhaar"); 

  // Generate a unique ID for each dynamic alert based on the sale
  return udhaars.map((u, index) => ({
    type: "udhaar",
    // Use the index as a fallback ID if the sale object doesn't have one (though it should be unique)
    id: `udhaar-${u.customerName}-${u.total.toFixed(2)}-${index}`, 
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
      // Use the item ID to create a unique ID for the low stock alert
      id: `lowstock-${item.id}`,
      message: `⚠️ Low stock: ${item.name} (only ${item.quantity} left)`,
      date: new Date().toLocaleDateString()
    }));
}

// 🔔 Render all notifications
function renderNotifications() {
  const systemNotifs = loadNotifications();
  const udhaarAlerts = loadUdhaarAlerts();
  const stockAlerts = loadLowStockAlerts();
  const dismissedAlerts = loadDismissedAlerts(); // Load dismissed list

  // Combine all alerts
  const allNotifs = [...systemNotifs, ...udhaarAlerts, ...stockAlerts];
  
  // FILTER: Remove any dynamic alerts that have been dismissed
  const activeNotifs = allNotifs.filter(n => {
    // System notifications (which lack an 'id') are never filtered
    if (!n.id) return true; 
    // Filter out alerts whose ID is in the dismissed list
    return !dismissedAlerts.includes(n.id);
  });

  notifList.innerHTML = "";

  if (activeNotifs.length === 0) {
    notifList.innerHTML = `<p class="text-gray-500 text-center py-4">No notifications 🎉</p>`;
  } else {
    activeNotifs.forEach(n => {
      const div = document.createElement("div");
      div.className = "border border-gray-200 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition flex justify-between items-center";
      
      let html = `
        <div>
          <p>${n.message}</p>
          <p class="text-sm text-gray-400">${n.date}</p>
        </div>
      `;

      // Add a dismiss button only for dynamic/system alerts that have an ID
      if (n.id) {
        html += `<button data-alert-id="${n.id}" class="dismiss-btn text-red-500 hover:text-red-700 text-xl font-bold ml-2">✖</button>`;
      }
      
      div.innerHTML = html;
      notifList.appendChild(div);
    });
  }

  // Set up dismiss button listeners AFTER rendering
  document.querySelectorAll('.dismiss-btn').forEach(button => {
    button.addEventListener('click', dismissAlert);
  });

  // Show badge
  if (activeNotifs.length > 0) {
    notifCount.textContent = activeNotifs.length;
    notifCount.classList.remove("hidden");
  } else {
    notifCount.classList.add("hidden");
  }
}

// 🧹 Function to dismiss a single dynamic alert
window.dismissAlert = function(event) {
    const alertId = event.currentTarget.getAttribute('data-alert-id');
    if (!alertId) return;

    let dismissed = loadDismissedAlerts();
    if (!dismissed.includes(alertId)) {
        dismissed.push(alertId);
        localStorage.setItem("xyz_dismissed_alerts", JSON.stringify(dismissed));
    }
    
    // Re-render to show the alert has been dismissed
    renderNotifications();
}

// 🧹 Function to clear ALL notifications (system and dynamic)
function clearAllNotifications() {
  // 1. Clear simple system messages
  localStorage.removeItem("xyz_notifications");
  
  // 2. Clear all dynamic alerts by clearing the dismissed list
  localStorage.removeItem("xyz_dismissed_alerts"); 
  
  // 3. Re-render (this will re-show all current Udhaar/Low Stock alerts)
  renderNotifications();
  
  // 4. Close popup
  notifPopup.classList.add("hidden");
  
  // NOTE to user: For dynamic alerts (Udhaar/Low Stock) to stay cleared, you must fix the source data (add stock, mark sale as paid).
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
