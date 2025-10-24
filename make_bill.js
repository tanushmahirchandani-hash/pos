const searchItem = document.getElementById("searchItem");
const searchResults = document.getElementById("searchResults");
const cartBody = document.getElementById("cartBody");
const billTotal = document.getElementById("billTotal");
const generateBillBtn = document.getElementById("generateBill");
const downloadBillBtn = document.getElementById("downloadBill");
const sendWhatsAppBtn = document.getElementById("sendWhatsApp");
const billPreview = document.getElementById("billPreview");

const paymentMode = document.getElementById("paymentMode");
const udhaarForm = document.getElementById("udhaarForm");
const udhaarInfo = document.getElementById("udhaarInfo");
const billCustomerName = document.getElementById("billCustomerName");
const billCustomerPhone = document.getElementById("billCustomerPhone");

let cart = [];

// Toggle Udhaar form
paymentMode.addEventListener("change", () => {
  udhaarForm.classList.toggle("hidden", paymentMode.value !== "udhaar");
});

// --- SEARCH ITEMS ---
searchItem.addEventListener("input", () => {
  const stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];
  const query = searchItem.value.trim().toLowerCase();
  searchResults.innerHTML = "";
  if (!query) return searchResults.classList.add("hidden");

  const filtered = stock.filter(item => item.name.toLowerCase().includes(query));
  if (filtered.length) {
    filtered.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} (₹${item.price}, ${item.quantity} left)`;
      li.className = "px-3 py-2 hover:bg-gray-100 cursor-pointer";
      li.addEventListener("click", () => addToCart(item));
      searchResults.appendChild(li);
    });
    searchResults.classList.remove("hidden");
  } else {
    searchResults.classList.add("hidden");
  }
});

function addToCart(item) {
  searchResults.classList.add("hidden");
  searchItem.value = "";

  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    if (existing.qty < item.quantity) {
      existing.qty++;
    } else {
      alert(`❌ Only ${item.quantity} in stock!`);
      return;
    }
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, qty: 1, stockQty: item.quantity });
  }
  renderCart();
}

function renderCart() {
  cartBody.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const tr = document.createElement("tr");
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    tr.innerHTML = `
      <td class="border p-1">${item.name}</td>
      <td class="border p-1">
        <input type="number" min="1" max="${item.stockQty}" value="${item.qty}"
        class="w-16 border rounded text-center" 
        onchange="updateQty(${index}, this.value)">
      </td>
      <td class="border p-1">₹${item.price}</td>
      <td class="border p-1">₹${itemTotal.toFixed(2)}</td>
      <td class="border p-1 text-center">
        <button onclick="removeItem(${index})" class="text-red-500 font-bold">✖</button>
      </td>
    `;
    cartBody.appendChild(tr);
  });

  billTotal.textContent = total.toFixed(2);
}

window.updateQty = function (index, newQty) {
  newQty = parseInt(newQty);
  if (newQty <= 0 || newQty > cart[index].stockQty) {
    alert(`❌ Invalid quantity. Only ${cart[index].stockQty} available.`);
    return renderCart();
  }
  cart[index].qty = newQty;
  renderCart();
};

window.removeItem = function (index) {
  cart.splice(index, 1);
  renderCart();
};

// --- GENERATE BILL ---
generateBillBtn.addEventListener("click", () => {
  if (cart.length === 0) return alert("🛒 Add at least one item!");

  const mode = paymentMode.value;
  const custName = document.getElementById("custName").value.trim();
  const custPhone = document.getElementById("custPhone").value.trim();
  const totalAmount = parseFloat(billTotal.textContent);

  if (mode === "udhaar" && (!custName || !custPhone)) {
    return alert("📋 Enter customer details for Udhaar bill.");
  }

  let stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];

  // Update stock (Error check: if quantity is reduced below 0, an alert is thrown)
  try {
      cart.forEach(item => {
        const found = stock.find(s => s.id === item.id);
        if (found) {
          if (found.quantity < item.qty) {
            alert(`❌ Not enough stock for ${item.name}`);
            throw new Error("Stock error");
          }
          found.quantity -= item.qty;
        }
      });
  } catch (e) {
      if (e.message === "Stock error") return;
      throw e;
  }

  localStorage.setItem("xyz_stock", JSON.stringify(stock));

  // FIX: Use YYYY-MM-DD format for consistent filtering
  const now = new Date();
  const dateStr = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');

  // FIX: Save to 'xyz_sales' key and flatten customer data
  const bill = {
    date: dateStr, 
    time: now.toLocaleTimeString(),
    items: cart,
    total: totalAmount,
    payment: mode,
    customerName: mode === "udhaar" ? custName : null,
    customerPhone: mode === "udhaar" ? custPhone : null,
  };

  let sales = JSON.parse(localStorage.getItem("xyz_sales")) || [];
  sales.push(bill);
  localStorage.setItem("xyz_sales", JSON.stringify(sales));

  // Render bill Preview
  document.getElementById("billDate").textContent = `${bill.date} ${bill.time}`;
  document.getElementById("billPayment").textContent = mode.toUpperCase();
  document.getElementById("billItems").innerHTML = bill.items.map(i =>
    `<tr><td class='border p-1'>${i.name}</td><td class='border p-1'>${i.qty}</td><td class='border p-1'>₹${i.price}</td><td class='border p-1'>₹${(i.price * i.qty).toFixed(2)}</td></tr>`
  ).join("");
  document.getElementById("billTotalFinal").textContent = bill.total.toFixed(2);

  if (mode === "udhaar") {
    udhaarInfo.classList.remove("hidden");
    billCustomerName.textContent = custName;
    billCustomerPhone.textContent = custPhone;
  } else {
    udhaarInfo.classList.add("hidden");
  }

  // Clear cart and form fields after successful bill generation
  cart = [];
  renderCart();
  document.getElementById("custName").value = "";
  document.getElementById("custPhone").value = "";
  
  billPreview.classList.remove("hidden");
  downloadBillBtn.classList.remove("hidden");
  sendWhatsAppBtn.classList.remove("hidden");
});

// --- DOWNLOAD PDF ---
downloadBillBtn.addEventListener("click", async () => {
  const element = document.getElementById("billPreview");
  const opt = {
    // FIX: Set margin to 0 for maximum content space
    margin: 0, 
    filename: `XYZ_Bill_${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.99 },
    html2canvas: { 
        // Increased scale for better quality/fit
        scale: 4, 
        useCORS: true 
    },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };
  await html2pdf().set(opt).from(element).save();
});

// --- SEND WHATSAPP ---
sendWhatsAppBtn.addEventListener("click", async () => {
  const element = document.getElementById("billPreview");
  
  const opt = {
    // FIX: Set margin to 0 here as well
    margin: 0, 
    filename: `bill.pdf`,
    image: { type: "jpeg", quality: 0.99 },
    html2canvas: { 
        scale: 4, 
        useCORS: true 
    },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };
  
  // Use .output('blob') from the html2pdf instance
  const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

  const formData = new FormData();
  formData.append("file", pdfBlob, "bill.pdf");

  // Using Gofile for temporary link generation
  const res = await fetch("https://api.gofile.io/uploadFile", { method: "POST", body: formData });
  const data = await res.json();

  if (data.status !== "ok") return alert("❌ Upload failed");

  const fileUrl = data.data.fileUrl || data.data.downloadPage; 
  const total = billTotal.textContent;
  const phone = prompt("📱 Enter customer's WhatsApp number (with country code, e.g., 91xxxxxxxxxx):");
  if (phone) {
    const msg = `🧾 *XYZ Store Bill*\nTotal: ₹${total}\nDownload Bill: ${fileUrl}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }
});

// Initialize cart display
renderCart();
