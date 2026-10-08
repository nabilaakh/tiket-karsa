import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  limit,
  orderBy,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import type { EventDoc } from "@/types/event"
import type { PembeliDoc } from "@/types/pembeli"
import type { TiketDoc, StatusTiket } from "@/types/tiket"

/**
 * Format timestamp Firestore ke representasi tanggal lokal yang ramah dibaca
 */
function formatTimestamp(val: unknown): string {
  if (!val) return new Date().toLocaleDateString("id-ID", { dateStyle: "medium" })
  if (val instanceof Timestamp) {
    return val.toDate().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  if (
    typeof val === "object" &&
    val !== null &&
    "toDate" in val &&
    typeof (val as { toDate: () => Date }).toDate === "function"
  ) {
    return (val as { toDate: () => Date }).toDate().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  if (typeof val === "string") return val
  return String(val)
}

/**
 * Pembungkus timeout agar Promise Firestore tidak menggantung selamanya jika jaringan/rules bermasalah
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 8000,
  errorMsg = "Koneksi ke Firestore timeout (lebih dari 8 detik). Pastikan database Cloud Firestore sudah diaktifkan di Firebase Console dan aturan Security Rules mengizinkan akses."
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    ),
  ])
}

/**
 * Validasi apakah variabel lingkungan Firebase sudah terisi dan tersimpan
 */
function checkFirebaseReady() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Konfigurasi Firebase belum terisi atau belum disimpan di file .env.local. Pastikan nilai NEXT_PUBLIC_FIREBASE_* sudah diisi dan file sudah disimpan (Ctrl+S)."
    )
  }
}

// ==========================================
// KOLEKSI: EVENT
// ==========================================

/**
 * Mengambil daftar event dibatasi limit(20)
 */
export async function getEvents(): Promise<EventDoc[]> {
  checkFirebaseReady()
  const eventCol = collection(db, "event")
  let snapshot
  try {
    const q = query(eventCol, orderBy("tanggal", "asc"), limit(20))
    snapshot = await withTimeout(getDocs(q))
  } catch {
    // Fallback query tanpa orderBy jika index belum aktif
    const fallbackQ = query(eventCol, limit(20))
    snapshot = await withTimeout(getDocs(fallbackQ))
  }

  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      nama: String(data.nama || ""),
      tanggal: String(data.tanggal || ""),
      lokasi: String(data.lokasi || ""),
      harga_tiket: Number(data.harga_tiket ?? 0),
      kuota: Number(data.kuota ?? 0),
      tiket_terjual: Number(data.tiket_terjual ?? 0),
      dibuat_pada: formatTimestamp(data.dibuat_pada),
    }
  })
}

/**
 * Menambahkan event baru dengan addDoc
 */
export async function createEvent(
  data: Omit<EventDoc, "id" | "tiket_terjual" | "dibuat_pada">
): Promise<string> {
  checkFirebaseReady()
  const docRef = await withTimeout(
    addDoc(collection(db, "event"), {
      nama: data.nama,
      tanggal: data.tanggal,
      lokasi: data.lokasi,
      harga_tiket: data.harga_tiket,
      kuota: data.kuota,
      tiket_terjual: 0,
      dibuat_pada: serverTimestamp(),
    }),
    8000,
    "Gagal menyimpan event: Firestore timeout. Pastikan Cloud Firestore sudah dibuat di Firebase Console dan aturan Security Rules mengizinkan write."
  )
  return docRef.id
}

/**
 * Memperbarui data event dengan updateDoc
 */
export async function updateEvent(
  id: string,
  data: Partial<Omit<EventDoc, "id" | "dibuat_pada">>
): Promise<void> {
  checkFirebaseReady()
  const eventRef = doc(db, "event", id)
  await withTimeout(updateDoc(eventRef, data))
}

/**
 * Menghapus event dengan deleteDoc
 */
export async function deleteEvent(id: string): Promise<void> {
  checkFirebaseReady()
  await withTimeout(deleteDoc(doc(db, "event", id)))
}

// ==========================================
// KOLEKSI: PEMBELI
// ==========================================

/**
 * Mengambil daftar pembeli dibatasi limit(20)
 */
export async function getPembeli(): Promise<PembeliDoc[]> {
  checkFirebaseReady()
  const pembeliCol = collection(db, "pembeli")
  let snapshot
  try {
    const q = query(pembeliCol, orderBy("nama", "asc"), limit(20))
    snapshot = await withTimeout(getDocs(q))
  } catch {
    const fallbackQ = query(pembeliCol, limit(20))
    snapshot = await withTimeout(getDocs(fallbackQ))
  }

  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      nama: String(data.nama || ""),
      no_whatsapp: String(data.no_whatsapp || d.id),
      email: String(data.email || ""),
      dibuat_pada: formatTimestamp(data.dibuat_pada),
    }
  })
}

/**
 * Menambahkan pembeli baru dengan setDoc (ID dokumen = nomor WhatsApp)
 * Sesuai Skema Firestore Karsa Tiket Bagian 4
 */
export async function createPembeli(
  data: Omit<PembeliDoc, "id" | "dibuat_pada">
): Promise<void> {
  checkFirebaseReady()
  const docRef = doc(db, "pembeli", data.no_whatsapp)
  const existingDoc = await withTimeout(getDoc(docRef))
  if (existingDoc.exists()) {
    throw new Error("Nomor WhatsApp sudah terdaftar")
  }

  await withTimeout(
    setDoc(docRef, {
      nama: data.nama,
      no_whatsapp: data.no_whatsapp,
      email: data.email,
      dibuat_pada: serverTimestamp(),
    }),
    8000,
    "Gagal menyimpan pembeli: Firestore timeout. Pastikan Cloud Firestore sudah aktif dan rules mengizinkan write."
  )
}

/**
 * Memperbarui data pembeli dengan updateDoc
 */
export async function updatePembeli(
  id: string,
  data: { nama: string; email: string }
): Promise<void> {
  checkFirebaseReady()
  await withTimeout(updateDoc(doc(db, "pembeli", id), data))
}

/**
 * Menghapus pembeli dengan deleteDoc
 */
export async function deletePembeli(id: string): Promise<void> {
  checkFirebaseReady()
  await withTimeout(deleteDoc(doc(db, "pembeli", id)))
}

// ==========================================
// KOLEKSI: TIKET
// ==========================================

/**
 * Mengambil daftar tiket dibatasi limit(20)
 */
export async function getTiket(): Promise<TiketDoc[]> {
  checkFirebaseReady()
  const tiketCol = collection(db, "tiket")
  let snapshot
  try {
    const q = query(tiketCol, orderBy("dibuat_pada", "desc"), limit(20))
    snapshot = await withTimeout(getDocs(q))
  } catch {
    const fallbackQ = query(tiketCol, limit(20))
    snapshot = await withTimeout(getDocs(fallbackQ))
  }

  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      event_id: String(data.event_id || ""),
      nama_event: String(data.nama_event || ""),
      tanggal_event: String(data.tanggal_event || ""),
      pembeli_id: String(data.pembeli_id || ""),
      nama_pembeli: String(data.nama_pembeli || ""),
      harga_tiket: Number(data.harga_tiket ?? 0),
      jumlah_tiket: Number(data.jumlah_tiket ?? 0),
      total: Number(data.total ?? 0),
      status: (data.status as StatusTiket) || "menunggu_bayar",
      dibuat_pada: formatTimestamp(data.dibuat_pada),
    }
  })
}

/**
 * Menambahkan pembelian tiket baru dengan addDoc
 * Sekaligus memperbarui tiket_terjual pada dokumen event dengan increment(jumlah_tiket)
 */
export async function createTiket(
  data: Omit<TiketDoc, "id" | "dibuat_pada" | "status">
): Promise<string> {
  checkFirebaseReady()
  const docRef = await withTimeout(
    addDoc(collection(db, "tiket"), {
      event_id: data.event_id,
      nama_event: data.nama_event,
      tanggal_event: data.tanggal_event,
      pembeli_id: data.pembeli_id,
      nama_pembeli: data.nama_pembeli,
      harga_tiket: data.harga_tiket,
      jumlah_tiket: data.jumlah_tiket,
      total: data.total,
      status: "menunggu_bayar",
      dibuat_pada: serverTimestamp(),
    }),
    8000,
    "Gagal menyimpan tiket: Firestore timeout. Pastikan Cloud Firestore sudah aktif dan rules mengizinkan write."
  )

  // Perbarui tiket_terjual pada dokumen event
  try {
    const eventRef = doc(db, "event", data.event_id)
    await withTimeout(
      updateDoc(eventRef, {
        tiket_terjual: increment(data.jumlah_tiket),
      }),
      5000
    )
  } catch (err) {
    console.warn("Gagal memperbarui tiket_terjual pada event:", err)
  }

  return docRef.id
}

/**
 * Memperbarui status tiket dengan updateDoc
 * Jika status berubah ke "dibatalkan", kuota event dikembalikan dengan increment(-jumlah_tiket)
 */
export async function updateStatusTiket(
  tiketId: string,
  newStatus: StatusTiket,
  eventId: string,
  jumlahTiket: number
): Promise<void> {
  checkFirebaseReady()
  await withTimeout(
    updateDoc(doc(db, "tiket", tiketId), {
      status: newStatus,
    })
  )

  if (newStatus === "dibatalkan") {
    try {
      const eventRef = doc(db, "event", eventId)
      await withTimeout(
        updateDoc(eventRef, {
          tiket_terjual: increment(-jumlahTiket),
        }),
        5000
      )
    } catch (err) {
      console.warn("Gagal mengembalikan kuota tiket event:", err)
    }
  }
}
