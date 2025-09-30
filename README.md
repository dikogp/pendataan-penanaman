# Tanamanku Super App 🌿

Super app Progressive Web App (PWA) lengkap untuk semua kebutuhan tanaman Anda - mulai dari penanaman, perawatan, marketplace, hingga komunitas.

## Struktur File

```
pendataan-penanaman/
├── index.html              # File HTML utama
├── styles.css              # File CSS untuk styling
├── script.js               # File JavaScript utama
├── service-worker.js       # Service Worker untuk PWA
├── app-manifest.json       # Manifest PWA
├── icons/
│   ├── icon-24.svg         # Icon aplikasi 24x24
│   ├── icon-32.svg         # Icon aplikasi 32x32
│   └── README.md           # Dokumentasi folder icons
├── manifest.json           # Manifest asli (jika ada)
├── sw.js                   # Service worker asli (jika ada)
└── index-old.html          # Backup file HTML asli
```

## Fitur Super App

### 🏠 **Dashboard**

- Ringkasan kebun dan statistik real-time
- Notifikasi perawatan hari ini
- Aktivitas terbaru
- Quick actions untuk akses cepat

### 📝 **Manajemen Tanaman**

- Input data tanaman lengkap dengan barcode
- Pencarian canggih dengan ID atau scan barcode
- Daftar tanaman dengan visual barcode
- Tracking usia dan status tanaman

### � **Jadwal Perawatan**

- Buat jadwal perawatan otomatis
- Notifikasi pengingat perawatan
- Tracking berbagai jenis perawatan (penyiraman, pemupukan, dll)
- Riwayat perawatan tanaman

### 🛒 **Marketplace**

- Belanja perlengkapan berkebun
- Kategori produk lengkap (benih, alat, pupuk, pot)
- Pencarian dan filter produk
- Katalog produk terintegrasi

### 👥 **Komunitas**

- Forum diskusi sesama pecinta tanaman
- Galeri foto tanaman dari komunitas
- Tips & tutorial berkebun
- Berbagi pengalaman dan solusi

### 📊 **Analitik & Statistik**

- Dashboard analitik lengkap
- Tren pertumbuhan tanaman
- Statistik perawatan
- Sistem pencapaian (achievements)

### 📱 **PWA Features**

- Dapat diinstall sebagai aplikasi mobile
- Offline support penuh
- Notifikasi push
- Fast loading dengan caching

## Teknologi yang Digunakan

### HTML (index.html)

- Struktur dasar aplikasi
- Form input data tanaman
- Tab navigation system
- Responsive layout

### CSS (styles.css)

- Modern gradient design
- Responsive grid system
- Card-based UI components
- Mobile-first approach
- Smooth animations and transitions

### JavaScript (script.js)

- Local storage untuk data persistence
- Barcode generation menggunakan JsBarcode
- Barcode scanning menggunakan QuaggaJS
- PWA functionality
- Tab switching dan form handling

### PWA Components

- **app-manifest.json**: Konfigurasi PWA
- **service-worker.js**: Offline caching dan background sync
- **icons/**: Icon aplikasi dalam berbagai ukuran

## Library External

1. **JsBarcode** (3.11.5)

   - CDN: `https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js`
   - Fungsi: Generate barcode untuk setiap tanaman

2. **QuaggaJS** (0.12.1)
   - CDN: `https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js`
   - Fungsi: Scan barcode menggunakan kamera

## Cara Menjalankan

1. Clone atau download project
2. Buka `index.html` di web browser
3. Untuk development server, gunakan:

   ```bash
   # Menggunakan Python
   python -m http.server 8000

   # Menggunakan Node.js
   npx serve .

   # Menggunakan PHP
   php -S localhost:8000
   ```

4. Akses di `http://localhost:8000`

## Fitur PWA

- **Installable**: Dapat diinstall di perangkat mobile/desktop
- **Offline-first**: Data tersimpan di localStorage
- **Responsive**: Optimized untuk semua ukuran layar
- **Fast**: Cached resources untuk loading cepat

## Browser Support

- Chrome/Chromium (Recommended)
- Firefox
- Safari (iOS/macOS)
- Edge

## Data Storage

Data disimpan menggunakan localStorage browser dengan format JSON:

```javascript
{
  id: "timestamp",
  name: "Nama Tanaman",
  type: "jenis",
  date: "YYYY-MM-DD",
  location: "lokasi",
  variety: "varietas",
  notes: "catatan",
  createdAt: "ISO timestamp"
}
```

## Kontribusi

Proyek ini menggunakan arsitektur sederhana dengan file terpisah untuk maintainability yang lebih baik:

- **HTML**: Struktur dan konten
- **CSS**: Styling dan layout
- **JavaScript**: Logic dan interactivity
- **PWA Files**: Progressive Web App functionality

## Lisensi

Open source project untuk keperluan pembelajaran dan pengembangan.
