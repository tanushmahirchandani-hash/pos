const searchItem = document.getElementById("searchItem");
const searchResults = document.getElementById("searchResults");
const cartBody = document.getElementById("cartBody");
const billTotal = document.getElementById("billTotal");
const generateBill = document.getElementById("generateBill");
const downloadBill = document.getElementById("downloadBill");
const sendWhatsApp = document.getElementById("sendWhatsApp");
const billPreview = document.getElementById("billPreview");
const billItems = document.getElementById("billItems");
const billTotalFinal = document.getElementById("billTotalFinal");
const billPayment = document.getElementById("billPayment");
const billDate = document.getElementById("billDate");
const udhaarForm = document.getElementById("udhaarForm");
const paymentMode = document.getElementById("paymentMode");
const udhaarInfo = document.getElementById("udhaarInfo");
const billCustomerName = document.getElementById("billCustomerName");
const billCustomerPhone = document.getElementById("billCustomerPhone");

let cart = [];
let selectedItems = [];
let stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];

// ---------- SEARCH ITEM ----------
searchItem.addEventListener("input", () => {
  const query = searchItem.value.trim().toLowerCase();
  if (!query) {
    searchResults.classList.add("hidden");
    return;
  }

  const results = stock.filter(item =>
    item.name.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    searchResults.innerHTML = `<li class="p-2 text-gray-500">No items found</li>`;
  } else {
    searchResults.innerHTML = results
      .map(
        (item) => `
        <li class="p-2 hover:bg-gray-100 cursor-pointer" data-name="${item.name}">
          ${item.name} - ₹${item.price}
        </li>`
      )
      .join("");
  }

  searchResults.classList.remove("hidden");
});

// ---------- ADD ITEM TO CART ----------
searchResults.addEventListener("click", (e) => {
  const name = e.target.dataset.name;
  if (!name) return;

  const item = stock.find((i) => i.name === name);
  if (!item) return;

  const existing = cart.find((c) => c.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name: item.name, price: item.price, qty: 1 });
  }

  renderCart();
  searchResults.classList.add("hidden");
  searchItem.value = "";
});

// ---------- RENDER CART ----------
function renderCart() {
  cartBody.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    cartBody.innerHTML += `
      <tr class="text-center">
        <td class="border p-2">${item.name}</td>
        <td class="border p-2">
          <input type="number" min="1" value="${item.qty}" data-index="${index}"
            class="qtyInput w-16 border rounded px-1 text-center">
        </td>
        <td class="border p-2">₹${item.price}</td>
        <td class="border p-2">₹${itemTotal}</td>
        <td class="border p-2">
          <button class="removeBtn text-red-500" data-index="${index}">❌</button>
        </td>
      </tr>
    `;
  });

  billTotal.textContent = total;
}

// ---------- UPDATE QUANTITY ----------
cartBody.addEventListener("input", (e) => {
  if (e.target.classList.contains("qtyInput")) {
    const index = e.target.dataset.index;
    const qty = parseInt(e.target.value);
    cart[index].qty = qty > 0 ? qty : 1;
    renderCart();
  }
});

// ---------- REMOVE ITEM ----------
cartBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("removeBtn")) {
    const index = e.target.dataset.index;
    cart.splice(index, 1);
    renderCart();
  }
});

// ---------- SHOW / HIDE UDHAAR FORM ----------
paymentMode.addEventListener("change", () => {
  if (paymentMode.value === "udhaar") {
    udhaarForm.classList.remove("hidden");
  } else {
    udhaarForm.classList.add("hidden");
  }
});

// ---------- GENERATE BILL ----------
generateBill.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Add items to the bill first!");
    return;
  }

  const mode = paymentMode.value;
  const date = new Date().toLocaleString();
  billDate.textContent = date;
  billPayment.textContent =
    mode === "udhaar" ? "Udhaar (to be paid later)" : mode.toUpperCase();

  billItems.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    billItems.innerHTML += `
      <tr class="text-center">
        <td class="border p-1">${item.name}</td>
        <td class="border p-1">${item.qty}</td>
        <td class="border p-1">₹${item.price}</td>
        <td class="border p-1">₹${itemTotal}</td>
      </tr>
    `;
  });

  billTotalFinal.textContent = total;

  if (mode === "udhaar") {
    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();

    if (!name || !phone) {
      alert("Please enter customer name and phone for Udhaar bill!");
      return;
    }

    billCustomerName.textContent = name;
    billCustomerPhone.textContent = phone;
    udhaarInfo.classList.remove("hidden");

    // Save udhaar entry
    let udhaarList = JSON.parse(localStorage.getItem("xyz_udhaar")) || [];
    udhaarList.push({
      name,
      phone,
      amount: total,
      date,
      items: cart
    });
    localStorage.setItem("xyz_udhaar", JSON.stringify(udhaarList));
  } else {
    udhaarInfo.classList.add("hidden");
  }

  billPreview.classList.remove("hidden");
  downloadBill.classList.remove("hidden");
  sendWhatsApp.classList.remove("hidden");
});

// ---------- DOWNLOAD PDF (FULL PAGE FIXED) ----------
downloadBill.addEventListener("click", () => {
  const element = document.getElementById("billPreview");

  const opt = {
    margin: 0.5,
    filename: `XYZ_Bill_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight
    },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save();
});

// ---------- SEND WHATSAPP ----------
sendWhatsApp.addEventListener("click", () => {
  const total = billTotalFinal.textContent;
  const date = billDate.textContent;
  const mode = billPayment.textContent;

  let message = `🧾 *XYZ Store Bill*\n📅 ${date}\n💰 Total: ₹${total}\n💳 Payment: ${mode}\n\nItems:\n`;

  cart.forEach((item) => {
    message += `- ${item.name} x${item.qty} = ₹${item.price * item.qty}\n`;
  });

  const phone = prompt("Enter customer's WhatsApp number (with country code):");
  if (phone) {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }
});
