/**
 * Tipe data dokumen pembeli sesuai Skema-Firestore-Karsa-Tiket
 */
export interface PembeliDoc {
  id: string // Sama dengan no_whatsapp (ID dokumen Firestore)
  nama: string // Nama pembeli, 1 sampai 60 karakter
  no_whatsapp: string // Diawali 08, total 10 sampai 13 angka
  email: string // Mengandung tanda @, maksimal 80 karakter
  dibuat_pada: string // Waktu dokumen dibuat
}
