// ---------- INITIAL SETUP ----------
if (!localStorage.getItem("xyz_stock")) localStorage.setItem("xyz_stock", JSON.stringify([]));
if (!localStorage.getItem("xyz_sales")) localStorage.setItem("xyz_sales", JSON.stringify([]));
if (!localStorage.getItem("xyz_udhaar")) localStorage.setItem("xyz_udhaar", JSON.stringify([]));
if (!localStorage.getItem("xyz_notifications")) localStorage.setItem("xyz_notifications", JSON.stringify([]));

const notifBtn = document.getElementById("notifBtn");
const notifModal = document.getElementById("notifModal");
const notifList = document.getElementById("notifList");
const notifCount = document.getElementById("notifCount");
const clearNotif = document.getElementById("clearNotif");
const closeNotif = document.getElementById("closeNotif");

// ---------- LOAD & DISPLAY NOTIFICATIONS ----------
function loadNotifications() {
  const notifications = JSON.parse(localStorage.getItem("xyz_notifications")) || [];
  notifList.innerHTML = "";

  if (notifications.length === 0) {
    notifList.innerHTML = `<li class="text-gray-500">No new notifications 🎉</li>`;
    notifCount.classList.add("hidden");
  } else {
    notifCount.textContent = notifications.length;
    notifCount.classList.remove("hidden");

    notifications.forEach(n => {
      const li = document.createElement("li");
      li.className = "p-2 bg-gray-100 rounded-md";
      li.innerHTML = `
        <p class="font-semibold">${n.message}</p>
        <p class="text-xs text-gray-500">${n.date}</p>
      `;
      notifList.appendChild(li);
    });
  }
}

// ---------- EVENT LISTENERS FOR MODAL ----------
notifBtn.addEventListener("click", () => {
  checkAutoAlerts(); // Re-check alerts every time modal opens
  loadNotifications();
  notifModal.classList.remove("hidden");
});

closeNotif.addEventListener("click", () => notifModal.classList.add("hidden"));
clearNotif.addEventListener("click", () => {
  localStorage.setItem("xyz_notifications", JSON.stringify([]));
  loadNotifications();
});

// ---------- CHECK AUTO ALERTS ----------
function checkAutoAlerts() {
  const stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];
  // Use sales data instead of udhaarList for alerts
  const sales = JSON.parse(localStorage.getItem("xyz_sales")) || []; 
  let notifications = JSON.parse(localStorage.getItem("xyz_notifications")) || [];
  const today = new Date().toLocaleDateString();

  // Low stock alerts
  stock.forEach(item => {
    if (item.threshold && item.quantity < item.threshold) {
      if (!notifications.some(n => n.message.includes(item.name) && n.type === "low_stock")) {
        notifications.push({
          type: "low_stock",
          message: `Item "${item.name}" below threshold (${item.quantity} left)`,
          date: today
        });
      }
    }
  });

  // Udhaar alerts
  const udhaarSales = sales.filter(s => s.payment.toLowerCase() === "udhaar");
  if (udhaarSales.length > 0) {
    const totalPending = udhaarSales.length;
    if (!notifications.some(n => n.type === "udhaar")) {
      notifications.push({
        type: "udhaar",
        message: `${totalPending} customer(s) have pending udhaar.`,
        date: today
      });
    }
  }

  localStorage.setItem("xyz_notifications", JSON.stringify(notifications));
}

// Check for alerts on page load
checkAutoAlerts();
loadNotifications();