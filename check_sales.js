const salesContainer = document.getElementById("salesContainer");
const totalSalesEl = document.getElementById("totalSales");
const totalBillsEl = document.getElementById("totalBills");
const filterDate = document.getElementById("filterDate");
const filterPayment = document.getElementById("filterPayment");
const applyFilter = document.getElementById("applyFilter");

function loadSales() {
  // FIX: The sales data should be stored under 'xyz_sales'
  return JSON.parse(localStorage.getItem("xyz_sales")) || []; 
}

function renderSales(filterDateVal = "", paymentMethod = "all") {
  const sales = loadSales();
  let filtered = sales;

  // Filter by date (YYYY-MM-DD format)
  if (filterDateVal) {
    // FIX: Sale date is now YYYY-MM-DD to match the input value
    filtered = filtered.filter(s => s.date === filterDateVal); 
  }

  // Filter by payment method
  if (paymentMethod !== "all") {
    filtered = filtered.filter(s => s.payment.toLowerCase() === paymentMethod.toLowerCase());
  }

  // Render bills
  salesContainer.innerHTML = "";
  let totalAmount = 0;

  if (filtered.length === 0) {
    salesContainer.innerHTML = `<p class="text-gray-500 text-center py-4">No sales found for the current filter criteria.</p>`;
  }

  filtered.forEach((sale, index) => {
    totalAmount += sale.total;

    const div = document.createElement("div");
    div.className = "border-b border-gray-200 py-2";
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <p class="font-semibold">🧾 Bill #${index + 1}</p>
          <p class="text-sm text-gray-500">${sale.date} ${sale.time ? `(${sale.time})` : ''} | ${sale.payment.toUpperCase()}</p>
          ${sale.payment.toLowerCase() === "udhaar" && sale.customerName && sale.customerPhone ? `<p class="text-red-500 text-sm">👤 ${sale.customerName} - 📞 ${sale.customerPhone}</p>` : ""}
        </div>
        <p class="font-bold text-green-600">₹${sale.total.toFixed(2)}</p>
      </div>
    `;
    salesContainer.appendChild(div);
  });

  totalSalesEl.textContent = `Total Sales: ₹${totalAmount.toFixed(2)}`;
  totalBillsEl.textContent = `Total Bills: ${filtered.length}`;
}

applyFilter.addEventListener("click", () => {
  const dateVal = filterDate.value;
  const paymentVal = filterPayment.value;
  renderSales(dateVal, paymentVal);
});

// Auto-load on page open
renderSales();
