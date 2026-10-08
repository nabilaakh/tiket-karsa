/**
 * Nilai status tiket sesuai Skema-Firestore-Karsa-Tiket
 */
export type StatusTiket = "menunggu_bayar" | "lunas" | "hadir" | "dibatalkan"

/**
 * Tipe data dokumen tiket sesuai Skema-Firestore-Karsa-Tiket
 */
export interface TiketDoc {
  id: string // ID dokumen otomatis (contoh: Tk63fHs)
  event_id: string // ID dokumen event (contoh: Ev27dKm)
  nama_event: string // Salinan nama event saat tiket dibuat
  tanggal_event: string // Salinan tanggal event, format YYYY-MM-DD
  pembeli_id: string // ID dokumen pembeli (nomor WhatsApp)
  nama_pembeli: string // Salinan nama pembeli saat tiket dibuat
  harga_tiket: number // Salinan harga event saat tiket dibuat
  jumlah_tiket: number // 1 sampai 5 dan tidak melebihi sisa kuota
  total: number // harga_tiket × jumlah_tiket
  status: StatusTiket // Nilai status alur
  dibuat_pada: string // Waktu dokumen dibuat
}
