// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered successfully:", registration);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installPrompt").classList.add("show");
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        document.getElementById("installPrompt").classList.remove("show");
      }
      deferredPrompt = null;
    });
  }
}

// Offline Detection
window.addEventListener("online", () => {
  document.getElementById("offlineIndicator").classList.remove("show");
});

window.addEventListener("offline", () => {
  document.getElementById("offlineIndicator").classList.add("show");
});

// Application State
let plants = JSON.parse(localStorage.getItem("plants")) || [];
let isScanning = false;

// Tab Switching
function switchTab(tabName) {
  // Stop scanner if active when leaving search tab
  if (isScanning) {
    stopBarcodeScanner();
  }

  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(tabName + "Tab").classList.add("active");

  // Find and activate the correct tab button
  const targetTab = document.querySelector(
    `[onclick="switchTab('${tabName}')"]`
  );
  if (targetTab) {
    targetTab.classList.add("active");
  }

  // Load data when switching to specific tabs
  if (tabName === "dashboard") {
    loadDashboard();
  } else if (tabName === "list") {
    displayPlants();
  } else if (tabName === "stats") {
    displayStats();
  } else if (tabName === "care") {
    loadCareTab();
  } else if (tabName === "marketplace") {
    loadMarketplace();
  }
}

// Form Submission
// Form Submission - wrapped in try-catch for initialization
function initializePlantForm() {
  const plantForm = document.getElementById("plantForm");
  if (plantForm) {
    plantForm.addEventListener("submit", function (e) {
      handlePlantFormSubmission(e, this);
    });
  }
}

function handlePlantFormSubmission(e, form) {
  e.preventDefault();

  try {
    const plantData = {
      id: Date.now().toString(),
      name: document.getElementById("plantName").value.trim(),
      type: document.getElementById("plantType").value,
      date: document.getElementById("plantDate").value,
      location: document.getElementById("plantLocation").value.trim(),
      variety: document.getElementById("plantVariety").value.trim(),
      notes: document.getElementById("plantNotes").value.trim(),
      createdAt: new Date().toISOString(),
    };

    // Validation
    if (
      !plantData.name ||
      !plantData.type ||
      !plantData.date ||
      !plantData.location
    ) {
      alert("⚠️ Mohon lengkapi semua field yang wajib diisi!");
      return;
    }

    plants.push(plantData);
    localStorage.setItem("plants", JSON.stringify(plants));

    // Add to activities
    addActivity("Tanaman Baru", `Menambahkan tanaman ${plantData.name}`);

    // Reset form
    form.reset();
    const plantDateInput = document.getElementById("plantDate");
    if (plantDateInput) {
      plantDateInput.valueAsDate = new Date();
    }

    // Show success message
    alert("✅ Data tanaman berhasil disimpan!");

    // Update dashboard and switch to list tab
    updateDashboardStats();
    switchTab("list");
  } catch (error) {
    console.error("Error saving plant:", error);
    alert("❌ Gagal menyimpan data tanaman. Silakan coba lagi.");
  }
} // Display Plants
function displayPlants() {
  const plantList = document.getElementById("plantList");

  if (plants.length === 0) {
    plantList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #64748b;">
          <div style="font-size: 4rem; margin-bottom: 20px;">🌱</div>
          <h3>Belum ada data tanaman</h3>
          <p>Tambahkan tanaman pertama Anda di tab Input Data</p>
      </div>
    `;
    return;
  }

  plantList.innerHTML = plants
    .map(
      (plant) => `
        <div class="plant-card" data-plant-id="${plant.id}">
            <div class="plant-info">
                <div class="plant-details">
                    <h3>${plant.name}</h3>
                    <div class="plant-meta">
                        <div class="meta-item">
                            <div class="meta-label">Jenis</div>
                            <div class="meta-value">${getTypeIcon(
                              plant.type
                            )} ${plant.type}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Tanggal Tanam</div>
                            <div class="meta-value">${formatDate(
                              plant.date
                            )}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Lokasi</div>
                            <div class="meta-value">📍 ${plant.location}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Usia</div>
                            <div class="meta-value">${calculateAge(
                              plant.date
                            )} hari</div>
                        </div>
                    </div>
                    ${
                      plant.variety
                        ? `<p><strong>Varietas:</strong> ${plant.variety}</p>`
                        : ""
                    }
                    ${
                      plant.notes
                        ? `<p><strong>Catatan:</strong> ${plant.notes}</p>`
                        : ""
                    }
                </div>
                <div class="barcode-section">
                    <canvas id="barcode-${
                      plant.id
                    }" class="barcode-canvas"></canvas>
                    <div style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">ID: ${
                      plant.id
                    }</div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn btn-secondary" onclick="downloadBarcode('${
                  plant.id
                }', '${plant.name}')">📱 Download Barcode</button>
                <button class="btn btn-danger" onclick="deletePlant('${
                  plant.id
                }')">🗑️ Hapus</button>
            </div>
        </div>
    `
    )
    .join("");

  // Generate barcodes with error handling
  plants.forEach((plant) => {
    try {
      const barcodeElement = document.getElementById(`barcode-${plant.id}`);
      if (barcodeElement) {
        JsBarcode(barcodeElement, plant.id, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
          background: "#ffffff",
          lineColor: "#000000",
        });
      }
    } catch (error) {
      console.error(`Error generating barcode for plant ${plant.id}:`, error);
      // Show a placeholder if barcode generation fails
      const barcodeElement = document.getElementById(`barcode-${plant.id}`);
      if (barcodeElement) {
        const ctx = barcodeElement.getContext("2d");
        barcodeElement.width = 200;
        barcodeElement.height = 70;
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, 200, 70);
        ctx.fillStyle = "#ef4444";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Barcode Error", 100, 35);
        ctx.fillText(plant.id, 100, 50);
      }
    }
  });
}

// Display Statistics
function displayStats() {
  const statsGrid = document.getElementById("statsGrid");

  const totalPlants = plants.length;
  const typeCount = plants.reduce((acc, plant) => {
    acc[plant.type] = (acc[plant.type] || 0) + 1;
    return acc;
  }, {});

  const avgAge =
    plants.length > 0
      ? Math.round(
          plants.reduce((sum, plant) => sum + calculateAge(plant.date), 0) /
            plants.length
        )
      : 0;

  const newestPlant =
    plants.length > 0
      ? Math.min(...plants.map((plant) => calculateAge(plant.date)))
      : 0;

  statsGrid.innerHTML = `
    <div class="stat-card">
        <div class="stat-number">${totalPlants}</div>
        <div class="stat-label">Total Tanaman</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">${Object.keys(typeCount).length}</div>
        <div class="stat-label">Jenis Berbeda</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">${avgAge}</div>
        <div class="stat-label">Rata-rata Usia (hari)</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">${newestPlant}</div>
        <div class="stat-label">Tanaman Terbaru (hari)</div>
    </div>
  `;

  // Type distribution
  if (Object.keys(typeCount).length > 0) {
    const typeStats = Object.entries(typeCount)
      .map(
        ([type, count]) => `
          <div class="meta-item" style="margin-bottom: 10px;">
              <div class="meta-label">${getTypeIcon(type)} ${type}</div>
              <div class="meta-value">${count} tanaman</div>
          </div>
        `
      )
      .join("");

    document.getElementById("monthlyChart").innerHTML = `
      <h3 style="margin: 20px 0; color: #1e293b;">📈 Distribusi Jenis Tanaman</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          ${typeStats}
      </div>
    `;
  } else {
    document.getElementById("monthlyChart").innerHTML = "";
  }
}

// Search Functions
function searchById() {
  const searchId = document.getElementById("searchId").value.trim();
  const resultsContainer = document.getElementById("searchResults");

  if (!searchId) {
    resultsContainer.innerHTML = `
      <div class="search-alert">
          ⚠️ Silakan masukkan ID tanaman untuk mencari
      </div>
    `;
    return;
  }

  const plant = plants.find((p) => p.id === searchId);

  if (plant) {
    displaySearchResult(plant, "ID Manual");
  } else {
    resultsContainer.innerHTML = `
      <div class="search-alert">
          ❌ Tanaman dengan ID "${searchId}" tidak ditemukan
          <br><small>Pastikan ID yang dimasukkan benar</small>
      </div>
    `;
  }
}

function displaySearchResult(plant, method) {
  const resultsContainer = document.getElementById("searchResults");

  resultsContainer.innerHTML = `
    <div class="search-success">
        ✅ Tanaman ditemukan! (Metode: ${method})
    </div>
    <div class="search-result-card">
        <div class="search-result-header">
            <h3>${plant.name}</h3>
            <div style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 8px; font-size: 0.9rem;">
                ID: ${plant.id}
            </div>
        </div>
        
        <div class="search-result-meta">
            <div class="search-meta-item">
                <div class="search-meta-label">Jenis Tanaman</div>
                <div class="search-meta-value">${getTypeIcon(plant.type)} ${
    plant.type
  }</div>
            </div>
            <div class="search-meta-item">
                <div class="search-meta-label">Tanggal Tanam</div>
                <div class="search-meta-value">📅 ${formatDate(
                  plant.date
                )}</div>
            </div>
            <div class="search-meta-item">
                <div class="search-meta-label">Lokasi</div>
                <div class="search-meta-value">📍 ${plant.location}</div>
            </div>
            <div class="search-meta-item">
                <div class="search-meta-label">Usia Tanaman</div>
                <div class="search-meta-value">⏰ ${calculateAge(
                  plant.date
                )} hari</div>
            </div>
        </div>

        ${
          plant.variety
            ? `
            <div class="search-meta-item" style="margin-bottom: 15px;">
                <div class="search-meta-label">Varietas</div>
                <div class="search-meta-value">🌱 ${plant.variety}</div>
            </div>
        `
            : ""
        }

        ${
          plant.notes
            ? `
            <div class="search-meta-item">
                <div class="search-meta-label">Catatan</div>
                <div class="search-meta-value">📝 ${plant.notes}</div>
            </div>
        `
            : ""
        }

        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn" style="background: rgba(255,255,255,0.2); flex: 1; min-width: 120px;" onclick="downloadBarcode('${
              plant.id
            }', '${plant.name}')">
                📱 Download Barcode
            </button>
            <button class="btn" style="background: rgba(255,255,255,0.2); flex: 1; min-width: 120px;" onclick="goToPlantInList('${
              plant.id
            }')">
                📋 Lihat di Daftar
            </button>
        </div>
    </div>
  `;

  // Clear search input
  document.getElementById("searchId").value = "";
}

function goToPlantInList(plantId) {
  // Switch to list tab
  switchTab("list");

  // Highlight the specific plant
  setTimeout(() => {
    const plantElement = document.querySelector(`[data-plant-id="${plantId}"]`);
    if (plantElement) {
      plantElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      plantElement.style.animation = "highlight 2s ease-in-out";

      // Remove animation after completion
      setTimeout(() => {
        plantElement.style.animation = "";
      }, 2000);
    }
  }, 200);
}

// Barcode Scanner Functions
function startBarcodeScanner() {
  const video = document.getElementById("scannerVideo");
  const placeholder = document.getElementById("scannerPlaceholder");
  const startBtn = document.getElementById("startScanBtn");
  const stopBtn = document.getElementById("stopScanBtn");
  const scanResult = document.getElementById("scanResult");

  // Reset previous results
  scanResult.innerHTML = "";

  // Check camera permission
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    scanResult.innerHTML = `
      <div class="search-alert">
          ❌ Kamera tidak tersedia di browser ini
          <br><small>Gunakan browser yang mendukung akses kamera</small>
      </div>
    `;
    return;
  }

  // Check if QuaggaJS is loaded
  if (typeof Quagga === "undefined") {
    scanResult.innerHTML = `
      <div class="search-alert">
          ❌ Library scanner belum termuat
          <br><small>Silakan refresh halaman dan coba lagi</small>
      </div>
    `;
    return;
  }

  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: "environment", // Use back camera if available
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    })
    .then((stream) => {
      isScanning = true;
      video.srcObject = stream;
      video.style.display = "block";
      placeholder.style.display = "none";
      startBtn.style.display = "none";
      stopBtn.style.display = "block";

      video.onloadedmetadata = () => {
        video.play();

        // Initialize Quagga for barcode scanning
        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: video,
              constraints: {
                width: 640,
                height: 480,
                facingMode: "environment",
              },
            },
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_93_reader",
                "codabar_reader",
              ],
            },
            locate: true,
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
          },
          function (err) {
            if (err) {
              console.error("QuaggaJS initialization failed:", err);
              scanResult.innerHTML = `
                <div class="search-alert">
                    ❌ Gagal memulai scanner
                    <br><small>Error: ${err.message || "Unknown error"}</small>
                </div>
              `;
              stopBarcodeScanner();
              return;
            }

            try {
              Quagga.start();
              scanResult.innerHTML = `
                <div class="search-success">
                    📷 Scanner aktif - Arahkan kamera ke barcode
                    <br><small>Pastikan barcode terlihat jelas dan cukup cahaya</small>
                </div>
              `;
            } catch (startErr) {
              console.error("Quagga start failed:", startErr);
              scanResult.innerHTML = `
                <div class="search-alert">
                    ❌ Gagal memulai scanning
                    <br><small>Coba tutup dan buka kembali scanner</small>
                </div>
              `;
              stopBarcodeScanner();
            }
          }
        );

        // Handle barcode detection
        Quagga.onDetected(function (data) {
          if (!isScanning) return; // Prevent multiple detections

          const scannedCode = data.codeResult.code;
          console.log("Barcode detected:", scannedCode);

          // Stop scanning immediately to prevent duplicates
          stopBarcodeScanner();

          // Search for plant
          const plant = plants.find((p) => p.id === scannedCode);

          if (plant) {
            displaySearchResult(plant, "Barcode Scanner");
          } else {
            document.getElementById("searchResults").innerHTML = `
              <div class="search-alert">
                  ❌ Tanaman dengan ID "${scannedCode}" tidak ditemukan
                  <br><small>Barcode valid tapi data tidak ada di database lokal</small>
                  <br><button class="btn" onclick="document.getElementById('searchId').value='${scannedCode}'" style="margin-top: 10px; width: auto; padding: 8px 16px;">📝 Isi ID ke Form Manual</button>
              </div>
            `;
          }
        });
      };
    })
    .catch((err) => {
      console.error("Camera access denied:", err);
      let errorMessage = "Akses kamera ditolak";

      if (err.name === "NotAllowedError") {
        errorMessage =
          "Izin kamera ditolak - Berikan izin di pengaturan browser";
      } else if (err.name === "NotFoundError") {
        errorMessage = "Kamera tidak ditemukan di perangkat ini";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Browser tidak mendukung akses kamera";
      }

      scanResult.innerHTML = `
        <div class="search-alert">
            ❌ ${errorMessage}
            <br><small>Gunakan pencarian manual sebagai alternatif</small>
        </div>
      `;
    });
}

function stopBarcodeScanner() {
  const video = document.getElementById("scannerVideo");
  const placeholder = document.getElementById("scannerPlaceholder");
  const startBtn = document.getElementById("startScanBtn");
  const stopBtn = document.getElementById("stopScanBtn");

  if (isScanning) {
    try {
      // Stop Quagga
      if (typeof Quagga !== "undefined") {
        Quagga.stop();
        Quagga.offDetected();
      }
    } catch (err) {
      console.warn("Error stopping Quagga:", err);
    }

    // Stop video stream
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
      video.srcObject = null;
    }

    isScanning = false;
  }

  video.style.display = "none";
  placeholder.style.display = "block";
  startBtn.style.display = "block";
  stopBtn.style.display = "none";
}

// Utility Functions
function getTypeIcon(type) {
  const icons = {
    sayuran: "🥬",
    buah: "🍎",
    herbs: "🌿",
    hias: "🌺",
    pohon: "🌳",
  };
  return icons[type] || "🌱";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calculateAge(plantDate) {
  const today = new Date();
  const planted = new Date(plantDate);
  const diffTime = Math.abs(today - planted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function deletePlant(plantId) {
  if (confirm("Apakah Anda yakin ingin menghapus tanaman ini?")) {
    plants = plants.filter((plant) => plant.id !== plantId);
    localStorage.setItem("plants", JSON.stringify(plants));
    displayPlants();
    alert("✅ Tanaman berhasil dihapus!");
  }
}

function clearAllData() {
  if (
    confirm(
      "Apakah Anda yakin ingin menghapus SEMUA data tanaman? Tindakan ini tidak dapat dibatalkan!"
    )
  ) {
    plants = [];
    localStorage.setItem("plants", JSON.stringify(plants));
    displayPlants();
    alert("✅ Semua data berhasil dihapus!");
  }
}

function downloadBarcode(plantId, plantName) {
  const canvas = document.getElementById(`barcode-${plantId}`);

  // Create a new canvas with white background
  const downloadCanvas = document.createElement("canvas");
  const ctx = downloadCanvas.getContext("2d");

  downloadCanvas.width = canvas.width;
  downloadCanvas.height = canvas.height + 60; // Extra space for title

  // Fill white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

  // Add title
  ctx.fillStyle = "black";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(plantName, downloadCanvas.width / 2, 25);

  // Add subtitle
  ctx.font = "12px Arial";
  ctx.fillText("ID: " + plantId, downloadCanvas.width / 2, 45);

  // Draw barcode
  ctx.drawImage(canvas, 0, 50);

  // Download
  const link = document.createElement("a");
  link.download = `barcode-${plantName.replace(/\s+/g, "_")}-${plantId}.png`;
  link.href = downloadCanvas.toDataURL();
  link.click();
}

function exportToCSV() {
  if (plants.length === 0) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }

  const headers = [
    "ID",
    "Nama Tanaman",
    "Jenis",
    "Tanggal Tanam",
    "Lokasi",
    "Varietas",
    "Catatan",
    "Usia (hari)",
  ];
  const csvContent = [
    headers.join(","),
    ...plants.map((plant) =>
      [
        plant.id,
        `"${plant.name}"`,
        plant.type,
        plant.date,
        `"${plant.location}"`,
        `"${plant.variety || ""}"`,
        `"${plant.notes || ""}"`,
        calculateAge(plant.date),
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `data-tanaman-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

// Super App Features

// Dashboard Functions
function loadDashboard() {
  updateDashboardStats();
  loadTodayCare();
  loadRecentActivity();
}

function updateDashboardStats() {
  const totalPlantsCount = plants.length;
  const activePlantsCount = plants.filter((plant) => {
    const plantAge = calculateAge(plant.date);
    return plantAge < 365; // Consider plants under 1 year as active
  }).length;

  // Mock needs care count (in real app, this would be based on care schedule)
  const needsCareCount = Math.floor(totalPlantsCount * 0.3);

  document.getElementById("totalPlantsCount").textContent = totalPlantsCount;
  document.getElementById("activePlantsCount").textContent = activePlantsCount;
  document.getElementById("needsCareCount").textContent = needsCareCount;
}

function loadTodayCare() {
  const todayCareList = document.getElementById("todayCareList");
  const careSchedules = JSON.parse(localStorage.getItem("careSchedules")) || [];

  const today = new Date().toDateString();
  const todaysCare = careSchedules.filter(
    (care) => new Date(care.nextDate).toDateString() === today
  );

  if (todaysCare.length === 0) {
    todayCareList.innerHTML =
      '<p class="no-care">Tidak ada perawatan yang dijadwalkan hari ini</p>';
    return;
  }

  todayCareList.innerHTML = todaysCare
    .map(
      (care) => `
    <div class="care-item">
      <strong>${care.plantName}</strong> - ${care.careType}
      <small>${care.notes || "Tidak ada catatan"}</small>
    </div>
  `
    )
    .join("");
}

function loadRecentActivity() {
  const recentActivity = document.getElementById("recentActivity");
  const activities = JSON.parse(localStorage.getItem("activities")) || [];

  if (activities.length === 0) {
    recentActivity.innerHTML = '<p class="no-activity">Belum ada aktivitas</p>';
    return;
  }

  const recentActivities = activities.slice(-5).reverse();
  recentActivity.innerHTML = recentActivities
    .map(
      (activity) => `
    <div class="activity-item">
      <strong>${activity.type}</strong> - ${activity.description}
      <small>${formatDate(activity.date)}</small>
    </div>
  `
    )
    .join("");
}

// Care Tab Functions
function loadCareTab() {
  populatePlantSelect();
  displayCareSchedules();
}

function populatePlantSelect() {
  const select = document.getElementById("carePlantSelect");
  select.innerHTML = '<option value="">Pilih tanaman untuk dirawat</option>';

  plants.forEach((plant) => {
    const option = document.createElement("option");
    option.value = plant.id;
    option.textContent = plant.name;
    select.appendChild(option);
  });
}

function displayCareSchedules() {
  const careList = document.getElementById("careList");
  const careSchedules = JSON.parse(localStorage.getItem("careSchedules")) || [];

  if (careSchedules.length === 0) {
    careList.innerHTML = '<p class="no-data">Belum ada jadwal perawatan</p>';
    return;
  }

  careList.innerHTML = careSchedules
    .map(
      (care) => `
    <div class="care-item">
      <div>
        <strong>${care.plantName}</strong> - ${getCareTypeIcon(
        care.careType
      )} ${care.careType}
        <p>Frekuensi: ${care.frequency}</p>
        <p>Berikutnya: ${formatDate(care.nextDate)}</p>
        ${care.notes ? `<p>Catatan: ${care.notes}</p>` : ""}
      </div>
      <button class="btn btn-danger" onclick="deleteCareSchedule('${
        care.id
      }')">Hapus</button>
    </div>
  `
    )
    .join("");
}

function getCareTypeIcon(careType) {
  const icons = {
    watering: "🚿",
    fertilizing: "🌱",
    pruning: "✂️",
    repotting: "🪴",
    "pest-control": "🐛",
    harvesting: "🌾",
  };
  return icons[careType] || "💧";
}

function deleteCareSchedule(careId) {
  if (confirm("Hapus jadwal perawatan ini?")) {
    let careSchedules = JSON.parse(localStorage.getItem("careSchedules")) || [];
    careSchedules = careSchedules.filter((care) => care.id !== careId);
    localStorage.setItem("careSchedules", JSON.stringify(careSchedules));
    displayCareSchedules();
    updateDashboardStats();
  }
}

// Marketplace Functions
function loadMarketplace() {
  setupMarketplaceFilters();
}

function setupMarketplaceFilters() {
  const categoryButtons = document.querySelectorAll(".category-btn");
  const searchInput = document.getElementById("marketplaceSearch");

  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterProducts(btn.dataset.category, searchInput.value);
    });
  });

  searchInput.addEventListener("input", (e) => {
    const activeCategory = document.querySelector(".category-btn.active")
      .dataset.category;
    filterProducts(activeCategory, e.target.value);
  });
}

function filterProducts(category, searchTerm) {
  const products = document.querySelectorAll(".product-card");

  products.forEach((product) => {
    const productCategory = product.dataset.category;
    const productName = product.querySelector("h4").textContent.toLowerCase();

    const categoryMatch = category === "all" || productCategory === category;
    const searchMatch =
      !searchTerm || productName.includes(searchTerm.toLowerCase());

    product.style.display = categoryMatch && searchMatch ? "block" : "none";
  });
}

// Care Schedule Form Handler
document.addEventListener("DOMContentLoaded", function () {
  const careForm = document.getElementById("careScheduleForm");
  if (careForm) {
    careForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const plantId = document.getElementById("carePlantSelect").value;
      const careType = document.getElementById("careType").value;
      const frequency = document.getElementById("careFrequency").value;
      const notes = document.getElementById("careNotes").value;

      if (!plantId || !careType || !frequency) {
        alert("Mohon lengkapi semua field yang wajib!");
        return;
      }

      const plant = plants.find((p) => p.id === plantId);
      const careSchedule = {
        id: Date.now().toString(),
        plantId: plantId,
        plantName: plant.name,
        careType: careType,
        frequency: frequency,
        notes: notes,
        nextDate: calculateNextCareDate(frequency),
        createdAt: new Date().toISOString(),
      };

      let careSchedules =
        JSON.parse(localStorage.getItem("careSchedules")) || [];
      careSchedules.push(careSchedule);
      localStorage.setItem("careSchedules", JSON.stringify(careSchedules));

      // Add to activities
      addActivity(
        "Jadwal Perawatan",
        `Membuat jadwal ${careType} untuk ${plant.name}`
      );

      careForm.reset();
      displayCareSchedules();
      updateDashboardStats();
      alert("✅ Jadwal perawatan berhasil dibuat!");
    });
  }
});

function calculateNextCareDate(frequency) {
  const now = new Date();
  switch (frequency) {
    case "daily":
      now.setDate(now.getDate() + 1);
      break;
    case "weekly":
      now.setDate(now.getDate() + 7);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      now.setDate(now.getDate() + 7); // default weekly
  }
  return now.toISOString();
}

function addActivity(type, description) {
  let activities = JSON.parse(localStorage.getItem("activities")) || [];
  activities.push({
    id: Date.now().toString(),
    type: type,
    description: description,
    date: new Date().toISOString(),
  });

  // Keep only last 50 activities
  if (activities.length > 50) {
    activities = activities.slice(-50);
  }

  localStorage.setItem("activities", JSON.stringify(activities));
}

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  // Set today's date as default
  const plantDateInput = document.getElementById("plantDate");
  if (plantDateInput) {
    plantDateInput.valueAsDate = new Date();
  }

  // Initialize forms
  initializePlantForm();

  // Load initial data
  loadDashboard();
  displayPlants();
  displayStats();
});

// Auto-save to prevent data loss
window.addEventListener("beforeunload", function () {
  localStorage.setItem("plants", JSON.stringify(plants));
});

// Enhanced keyboard shortcuts
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "1":
        e.preventDefault();
        switchTab("dashboard");
        break;
      case "2":
        e.preventDefault();
        switchTab("input");
        break;
      case "3":
        e.preventDefault();
        switchTab("list");
        break;
      case "4":
        e.preventDefault();
        switchTab("care");
        break;
      case "5":
        e.preventDefault();
        switchTab("marketplace");
        break;
      case "6":
        e.preventDefault();
        switchTab("community");
        break;
      case "7":
        e.preventDefault();
        switchTab("stats");
        break;
    }
  }
});
