// ======= INITIAL DATA =======
const stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];
const sales = JSON.parse(localStorage.getItem("xyz_sales")) || [];
const udhaarList = JSON.parse(localStorage.getItem("xyz_udhaar")) || [];

// ======= DOM ELEMENTS =======
const searchInput = document.getElementById("searchItem");
const searchResults = document.getElementById("searchResults");
const cartBody = document.getElementById("cartBody");
const totalDisplay = document.getElementById("billTotal");
const paymentMode = document.getElementById("paymentMode");
const udhaarForm = document.getElementById("udhaarForm");
const billPreview = document.getElementById("billPreview");

const billItemsTable = document.getElementById("billItems");
const billTotalFinal = document.getElementById("billTotalFinal");
const billPayment = document.getElementById("billPayment");
const billDate = document.getElementById("billDate");
const udhaarInfo = document.getElementById("udhaarInfo");
const billCustomerNameEl = document.getElementById("billCustomerName");
const billCustomerPhoneEl = document.getElementById("billCustomerPhone");

let cart = [];

// ======= SEARCH FUNCTION =======
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  searchResults.innerHTML = "";
  if (!q) return searchResults.classList.add("hidden");

  const matches = stock.filter(item => item.name.toLowerCase().includes(q));
  if (matches.length === 0) {
    searchResults.innerHTML = "<li class='p-2 text-gray-500'>No item found</li>";
  } else {
    matches.forEach(item => {
      const li = document.createElement("li");
      li.className = "p-2 hover:bg-gray-200 cursor-pointer";
      li.textContent = `${item.name} (₹${item.price})`;
      li.onclick = () => addToCart(item);
      searchResults.appendChild(li);
    });
  }
  searchResults.classList.remove("hidden");
});

// ======= CART FUNCTIONS =======
function addToCart(item) {
  const existing = cart.find(c => c.id === item.id);
  if (existing) existing.qty++;
  else cart.push({ ...item, qty: 1 });
  renderCart();
  searchResults.classList.add("hidden");
  searchInput.value = "";
}

function renderCart() {
  cartBody.innerHTML = "";
  let total = 0;
  cart.forEach((c, i) => {
    const row = document.createElement("tr");
    const itemTotal = c.price * c.qty;
    total += itemTotal;
    row.innerHTML = `
      <td class="border p-1">${c.name}</td>
      <td class="border p-1">
        <input type="number" value="${c.qty}" min="1" class="w-16 border rounded text-center" 
          onchange="updateQty(${i}, this.value)">
      </td>
      <td class="border p-1">₹${c.price}</td>
      <td class="border p-1">₹${itemTotal.toFixed(2)}</td>
      <td class="border p-1 text-center">
        <button onclick="removeItem(${i})" class="text-red-500 font-bold">✖</button>
      </td>`;
    cartBody.appendChild(row);
  });
  totalDisplay.textContent = total.toFixed(2);
}

window.updateQty = (index, value) => {
  cart[index].qty = parseInt(value);
  renderCart();
};

window.removeItem = (index) => {
  cart.splice(index, 1);
  renderCart();
};

// ======= TOGGLE UDHAAR FORM =======
paymentMode.addEventListener("change", () => {
  udhaarForm.classList.toggle("hidden", paymentMode.value !== "udhaar");
});

// ======= GENERATE BILL =======
document.getElementById("generateBill").addEventListener("click", () => {
  if (cart.length === 0) return alert("Add items to cart first!");

  const total = parseFloat(totalDisplay.textContent);
  const pay = paymentMode.value;
  const today = new Date().toLocaleDateString();

  let custName = "";
  let custPhone = "";

  if (pay === "udhaar") {
    custName = document.getElementById("custName").value.trim();
    custPhone = document.getElementById("custPhone").value.trim();
    if (!custName || !custPhone) return alert("Enter name and phone for udhaar.");

    udhaarList.push({ name: custName, phone: custPhone, amount: total, date: today });
    localStorage.setItem("xyz_udhaar", JSON.stringify(udhaarList));
  }

  // Deduct stock
  const stockData = JSON.parse(localStorage.getItem("xyz_stock")) || [];
  cart.forEach(c => {
    const item = stockData.find(i => i.id === c.id);
    if (item) item.quantity -= c.qty;
  });
  localStorage.setItem("xyz_stock", JSON.stringify(stockData));

  // Save sales
  const saleItems = cart.map(item => {
    const { id, name, price, qty } = item;
    return { id, name, price, qty };
  });
  sales.push({ id: Date.now(), items: saleItems, total, date: today, payment: pay, customerName: custName, customerPhone: custPhone });
  localStorage.setItem("xyz_sales", JSON.stringify(sales));

  // Show bill preview
  billItemsTable.innerHTML = "";
  cart.forEach(c => {
    billItemsTable.innerHTML += `<tr>
      <td class="border p-1">${c.name}</td>
      <td class="border p-1">${c.qty}</td>
      <td class="border p-1">₹${c.price}</td>
      <td class="border p-1">₹${(c.price * c.qty).toFixed(2)}</td>
    </tr>`;
  });
  billTotalFinal.textContent = total.toFixed(2);
  billPayment.textContent = pay.toUpperCase();
  billDate.textContent = today;

  if (pay === "udhaar") {
    billCustomerNameEl.textContent = custName;
    billCustomerPhoneEl.textContent = custPhone;
    udhaarInfo.classList.remove("hidden");
  } else {
    udhaarInfo.classList.add("hidden");
  }

  billPreview.classList.remove("hidden");
  document.getElementById("downloadBill").classList.remove("hidden");
  document.getElementById("sendWhatsApp").classList.remove("hidden");
});

// ======= DOWNLOAD PDF =======
document.getElementById("downloadBill").addEventListener("click", () => {
  const element = document.getElementById("billPreview");
  element.classList.remove("hidden");

  const opt = {
    margin: 0.5,
    filename: 'bill.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, logging: false, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().from(element).set(opt).save();
});

// ======= GOFILE UPLOAD FUNCTION =======
async function uploadToGofile(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'bill.pdf');
  const res = await fetch('https://store1.gofile.io/uploadFile', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.data && data.data.downloadPage) return data.data.downloadPage;
  throw new Error('GoFile upload failed');
}

// ======= SEND BILL VIA WHATSAPP =======
document.getElementById("sendWhatsApp").addEventListener("click", async () => {
  let phoneInput = document.getElementById("custPhone").value.trim();
  if (!phoneInput) phoneInput = prompt("Enter customer phone number (e.g., 91XXXXXXXXXX):");
  if (!phoneInput) return;

  const phone = phoneInput.replace(/\D/g, '');
  const element = document.getElementById("billPreview");
  element.classList.remove("hidden");

  try {
    // Generate PDF blob
    const pdfBlob = await html2pdf().from(element).set({
      margin: 0.5,
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).outputPdf("blob");

    // Upload to GoFile
    const gofileLink = await uploadToGofile(pdfBlob);

    // Send WhatsApp link
    const msg = `Hello! Here is your bill from XYZ Store: ${encodeURIComponent(gofileLink)}`;
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");

  } catch (err) {
    console.error("WhatsApp/GoFile error:", err);
    alert("❌ Failed to upload bill. Please download manually.\n" + err.message);
  }
});
