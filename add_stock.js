// ---------- CAMERA SETUP ----------
const video = document.getElementById("camera");
const captureBtn = document.getElementById("captureBtn");
const snapshot = document.getElementById("snapshot");
const previewImg = document.getElementById("previewImg");
let capturedImage = null; // We still capture the image for the preview, but won't save it to storage.

async function startRearCamera() {
  try {
    // 🎥 Define constraints to STRONGLY and EXPLICITLY prefer the rear camera
    // 'exact: "environment"' forces the browser to use the back camera or throw an error.
    const constraints = {
      video: {
        facingMode: { exact: "environment" } // <-- KEY CHANGE
      }
    };

    // 🚀 Start stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (err) {
    console.error("Camera error (Exact Rear Failed):", err);
    // If the exact rear camera fails, try a generic request as a fallback
    try {
        const fallbackConstraints = { video: true };
        const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        video.srcObject = stream;
    } catch (fallbackErr) {
        console.error("Camera error (Generic Fallback Failed):", fallbackErr);
        alert("Unable to access the camera. Please check permissions or try again.");
    }
  }
}

// Start the camera
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  startRearCamera();
} else {
  alert("Camera not supported in this browser.");
}

// Capture photo
captureBtn.addEventListener("click", () => {
  const context = snapshot.getContext("2d");
  snapshot.width = video.videoWidth;
  snapshot.height = video.videoHeight;
  context.drawImage(video, 0, 0, snapshot.width, snapshot.height);
  capturedImage = snapshot.toDataURL("image/png");
  previewImg.src = capturedImage;
  previewImg.classList.remove("hidden");
});

// ---------- SAVE STOCK ----------
const stockForm = document.getElementById("stockForm");
const successMsg = document.getElementById("successMsg");

stockForm.addEventListener("submit", e => {
  e.preventDefault();

  let stock = JSON.parse(localStorage.getItem("xyz_stock")) || [];
  let notifications = JSON.parse(localStorage.getItem("xyz_notifications")) || [];

  const name = document.getElementById("name").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const quantity = parseInt(document.getElementById("quantity").value);
  const threshold = parseInt(document.getElementById("threshold").value) || null;

  // Generate ID
  const id = "XYZ" + String(stock.length + 1).padStart(3, "0");

  // Create item object
  // FIX: Removed 'image: capturedImage' to prevent QuotaExceededError
  const item = { 
    id, 
    name, 
    price, 
    quantity, 
    threshold,
    hasImage: !!capturedImage // Store a boolean flag instead of the huge string
  }; 

  // Save to localStorage
  stock.push(item);
  localStorage.setItem("xyz_stock", JSON.stringify(stock));

  // Notification if below threshold
  if (threshold && quantity < threshold) {
    const today = new Date().toLocaleDateString();
    notifications.push({
      type: "low_stock",
      message: `Item "${name}" below threshold (${quantity} left)`,
      date: today
    });
    localStorage.setItem("xyz_notifications", JSON.stringify(notifications));
  }

  // Success message
  successMsg.classList.remove("hidden");
  stockForm.reset();
  capturedImage = null;
  previewImg.classList.add("hidden");

  // Hide success message after 3 seconds
  setTimeout(() => successMsg.classList.add("hidden"), 3000);
});
