/**
 * Tipe data dokumen event sesuai Skema-Firestore-Karsa-Tiket
 */
export interface EventDoc {
  id: string
  nama: string // Nama acara, 1 sampai 60 karakter
  tanggal: string // Tanggal acara, format YYYY-MM-DD
  lokasi: string // Tempat acara, 1 sampai 100 karakter
  harga_tiket: number // Harga satu tiket, minimal 0 (0 = gratis)
  kuota: number // Jumlah kursi, 1 sampai 500
  tiket_terjual: number // Minimal 0 dan tidak melebihi kuota. Nilai awal 0
  dibuat_pada: string // Waktu dokumen dibuat
}
