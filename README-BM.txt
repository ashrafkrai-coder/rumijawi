JAWI PWA — PAKEJ VERCEL

1. Ekstrak semua fail ZIP ke satu folder. index.html dan vercel.json berada di root.
2. Muat naik kandungan folder ke repository GitHub anda.
3. Dalam Vercel, import repository tersebut.
4. Framework Preset: Other. Root Directory: folder yang mengandungi index.html.
5. Build Command: kosong (aktifkan Override jika diperlukan). Install Command: kosong. Output Directory: .
6. Klik Deploy. Tiada API key, Apps Script atau pemasangan dependency diperlukan.

Alternatif menggunakan Vercel CLI (Node.js diperlukan):
  npx vercel
Untuk production:
  npx vercel --prod
Jalankan arahan dalam folder yang mengandungi index.html. Ikut arahan log masuk Vercel.

PEMASANGAN PWA
Android/Desktop Chrome atau Edge: buka URL HTTPS dan pilih Pasang aplikasi.
iPhone/iPad: Safari > Kongsi > Add to Home Screen.
Buka sekali dalam talian dan tunggu kamus selesai dimuatkan sebelum menggunakan mod luar talian.

FUNGSI
Penukar Rumi-Jawi, 66,025 entri kamus/pengecualian, padanan frasa, semakan anggaran, salin, saiz tulisan, import/eksport pembetulan TSV.
Pembetulan disimpan dalam pelayar peranti (localStorage) dan kekal selepas halaman ditutup. Ia tidak dikongsi antara peranti:
gunakan Eksport dan Import (fail TSV: Rumi<tab>Jawi) untuk memindahkan atau berkongsi senarai pembetulan.
Apabila versi baharu dipasang, notis "Versi baharu tersedia" dipaparkan dengan butang Muat semula.
Data kamus ialah salinan daripada fail yang diberi; tiada penyegerakan langsung Google Sheets.
Fail PWA ini tidak memerlukan log masuk ChatGPT. Kawalan akses Vercel bergantung pada tetapan projek anda.

KEMAS KINI
Edit kamus.json untuk menambah atau membetulkan pasangan Rumi-Jawi. Pengecualian sumber telah digabungkan dan diberi keutamaan.
Apabila mengemas kini aplikasi/kamus, ubah CACHE dalam sw.js (contoh jawi-v1 -> jawi-v2). Ini menggantikan cache luar talian versi lama.
Fallback huruf ialah anggaran, bukan ejaan Jawi yang dijamin tepat.

FAIL
index.html, style.css, app.js, engine.js, kamus.json, manifest.webmanifest, sw.js, icon-192.png, icon-512.png, vercel.json,
fonts/NotoNaskhArabic-arabic.woff2 (Noto Naskh Arabic, Google Fonts, lesen SIL Open Font License 1.1).
