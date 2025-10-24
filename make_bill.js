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
  if (!query) return (searchResults.classList.add("hidden"));

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
      <td class="border p-1">₹${itemTotal}</td>
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
generateBillBtn.addEventListener("click", async () => {
  if (cart.length === 0) return alert("🛒 Add at least one item!");

  const mode = paymentMode.value;
  const custName = document.getElementById("custName").value.trim();
  const custPhone = document.getElementById("custPhone").value.trim();

  if (mode === "udhaar" && (!custName || !custPhone)) {
    return alert("📋 Enter customer details for Udhaar bill.");
  }

  const stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];

  // Update stock
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

  localStorage.setItem("xyz_stock", JSON.stringify(stock));

  // Prepare bill data
  const bill = {
    date: new Date().toLocaleString(),
    items: cart,
    total: parseFloat(billTotal.textContent),
    payment: mode,
    customer: mode === "udhaar" ? { name: custName, phone: custPhone } : null,
  };

  let bills = JSON.parse(localStorage.getItem("xyz_bills")) || [];
  bills.push(bill);
  localStorage.setItem("xyz_bills", JSON.stringify(bills));

  // Render preview
  document.getElementById("billDate").textContent = bill.date;
  document.getElementById("billPayment").textContent = mode;
  document.getElementById("billItems").innerHTML = cart.map(i =>
    `<tr><td class='border p-1'>${i.name}</td><td class='border p-1'>${i.qty}</td><td class='border p-1'>₹${i.price}</td><td class='border p-1'>₹${(i.price*i.qty).toFixed(2)}</td></tr>`
  ).join("");
  document.getElementById("billTotalFinal").textContent = bill.total.toFixed(2);

  if (mode === "udhaar") {
    udhaarInfo.classList.remove("hidden");
    billCustomerName.textContent = custName;
    billCustomerPhone.textContent = custPhone;
  } else {
    udhaarInfo.classList.add("hidden");
  }

  billPreview.classList.remove("hidden");
  downloadBillBtn.classList.remove("hidden");
  sendWhatsAppBtn.classList.remove("hidden");
});

// --- DOWNLOAD PDF ---
downloadBillBtn.addEventListener("click", async () => {
  const element = document.getElementById("billPreview");
  const opt = {
    margin: 0.5,
    filename: `XYZ_Bill_${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };
  await html2pdf().from(element).set(opt).save();
});

// --- SEND WHATSAPP ---
sendWhatsAppBtn.addEventListener("click", async () => {
  const element = document.getElementById("billPreview");

  // Convert to blob for GoFile upload
  const pdfBlob = await html2pdf().from(element).outputPdf("blob");

  const formData = new FormData();
  formData.append("file", pdfBlob, "bill.pdf");

  const res = await fetch("https://api.gofile.io/uploadFile", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();

  if (!data.status === "ok") return alert("❌ Upload failed");

  const fileUrl = data.data.downloadPage;
  const total = billTotal.textContent;
  const msg = `🧾 *XYZ Store Bill*\nTotal: ₹${total}\nDownload Bill: ${fileUrl}`;
  const phone = prompt("📱 Enter customer's WhatsApp number (with country code):");
  if (phone) {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }
});
