"use client"

import React, { useState } from "react"
import {
  Ticket,
  Plus,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  X,
  CreditCard,
  UserCheck,
  Ban,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateId } from "@/lib/id"
import type { EventDoc } from "@/types/event"
import type { PembeliDoc } from "@/types/pembeli"
import type { TiketDoc, StatusTiket } from "@/types/tiket"
import { SAMPLE_EVENTS } from "./event-page"
import { SAMPLE_PEMBELI } from "./pembeli-page"

// Data awal menggunakan contoh dokumen tiket/Tk63fHs dari Skema Firestore
export const SAMPLE_TIKET: TiketDoc[] = [
  {
    id: "Tk63fHs",
    event_id: "Ev27dKm",
    nama_event: "Workshop Sablon Tote Bag",
    tanggal_event: "2026-10-18",
    pembeli_id: "081355512345",
    nama_pembeli: "Nadia Putri",
    harga_tiket: 75000,
    jumlah_tiket: 2,
    total: 150000,
    status: "menunggu_bayar",
    dibuat_pada: "1 Oktober 2026 09.15",
  },
]

export interface TiketPageProps {
  events?: EventDoc[]
  setEvents?: React.Dispatch<React.SetStateAction<EventDoc[]>>
  pembeliList?: PembeliDoc[]
  tiketList?: TiketDoc[]
  setTiketList?: React.Dispatch<React.SetStateAction<TiketDoc[]>>
}

export function TiketPage({
  events: propEvents,
  setEvents: propSetEvents,
  pembeliList: propPembeliList,
  tiketList: propTiketList,
  setTiketList: propSetTiketList,
}: TiketPageProps = {}) {
  // Local states jika props tidak dilempar
  const [localEvents, setLocalEvents] = useState<EventDoc[]>(SAMPLE_EVENTS)
  const [localPembeliList] = useState<PembeliDoc[]>(SAMPLE_PEMBELI)
  const [localTiketList, setLocalTiketList] = useState<TiketDoc[]>(SAMPLE_TIKET)

  const events = propEvents ?? localEvents
  const setEvents = propSetEvents ?? setLocalEvents
  const pembeliList = propPembeliList ?? localPembeliList
  const tiketList = propTiketList ?? localTiketList
  const setTiketList = propSetTiketList ?? setLocalTiketList

  // Filter tab status
  const [statusFilter, setStatusFilter] = useState<"semua" | StatusTiket>("semua")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [cancelingTiket, setCancelingTiket] = useState<TiketDoc | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    event_id: "",
    pembeli_id: "",
    jumlah_tiket: "1",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Format rupiah
  const formatRupiah = (nominal: number) => {
    if (nominal === 0) return "Gratis"
    return `Rp ${nominal.toLocaleString("id-ID")}`
  }

  // Notifikasi toast
  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Event yang dipilih di formulir
  const selectedEvent = events.find((e) => e.id === formData.event_id)
  const sisaKuota = selectedEvent
    ? selectedEvent.kuota - selectedEvent.tiket_terjual
    : 0

  // Total kalkulasi realtime di formulir
  const calculatedTotal =
    selectedEvent && formData.jumlah_tiket
      ? selectedEvent.harga_tiket * Number(formData.jumlah_tiket)
      : 0

  // Buka formulir pembuatan tiket
  const handleOpenAddForm = () => {
    // Pilih event pertama yang masih ada kuota jika tersedia
    const availableEvent = events.find((e) => e.kuota - e.tiket_terjual > 0)
    const firstPembeli = pembeliList[0]

    setFormData({
      event_id: availableEvent ? availableEvent.id : events[0]?.id || "",
      pembeli_id: firstPembeli ? firstPembeli.id : "",
      jumlah_tiket: "1",
    })
    setErrors({})
    setIsFormOpen(true)
  }

  // Validasi formulir sesuai PRD 5.3 & Acceptance Criteria
  const validateForm = () => {
    const errs: Record<string, string> = {}

    if (!formData.event_id) {
      errs.event_id = "Silakan pilih event acara."
    }

    if (!formData.pembeli_id) {
      errs.pembeli_id = "Silakan pilih data pembeli."
    }

    const jumlahNum = Number(formData.jumlah_tiket)

    // Acceptance Criteria 5.3 No. 2:
    // Given jumlah tiket 0, lebih dari 5, atau melebihi sisa kuota, When tiket dikirim, Then permintaan ditolak.
    if (!formData.jumlah_tiket || isNaN(jumlahNum)) {
      errs.jumlah_tiket = "Jumlah tiket wajib berupa angka."
    } else if (jumlahNum < 1 || jumlahNum > 5) {
      errs.jumlah_tiket = "Jumlah tiket harus antara 1 sampai 5 tiket per transaksi."
    } else if (!Number.isInteger(jumlahNum)) {
      errs.jumlah_tiket = "Jumlah tiket harus berupa angka bulat."
    } else if (selectedEvent && jumlahNum > sisaKuota) {
      errs.jumlah_tiket = `Jumlah tiket melebihi sisa kuota acara (${sisaKuota} tiket tersisa).`
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit Simpan Tiket (Acceptance Criteria 5.3 No. 1)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedEvent) {
      return
    }

    const selectedPembeli = pembeliList.find((p) => p.id === formData.pembeli_id)
    if (!selectedPembeli) {
      setErrors((prev) => ({ ...prev, pembeli_id: "Pembeli tidak ditemukan." }))
      return
    }

    const jumlahNum = Math.round(Number(formData.jumlah_tiket))
    const totalBayar = selectedEvent.harga_tiket * jumlahNum

    // Dokumen tiket baru dengan nama dan harga event disalin (Skema Bagian 5)
    const newTiket: TiketDoc = {
      id: generateId("Tk"),
      event_id: selectedEvent.id,
      nama_event: selectedEvent.nama,
      tanggal_event: selectedEvent.tanggal,
      pembeli_id: selectedPembeli.id,
      nama_pembeli: selectedPembeli.nama,
      harga_tiket: selectedEvent.harga_tiket,
      jumlah_tiket: jumlahNum,
      total: totalBayar,
      status: "menunggu_bayar", // Status awal wajib menunggu_bayar (AC 5.3 No. 1)
      dibuat_pada: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    // 1. Simpan tiket ke koleksi tiket
    setTiketList((prev) => [newTiket, ...prev])

    // 2. Tambah tiket_terjual pada event sebanyak jumlah_tiket (AC 5.3 No. 1)
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === selectedEvent.id
          ? { ...ev, tiket_terjual: ev.tiket_terjual + jumlahNum }
          : ev
      )
    )

    setIsFormOpen(false)
    showToast(
      `Tiket untuk "${selectedPembeli.nama}" berhasil disimpan! Status: menunggu_bayar`
    )
  }

  // Ubah status ke "lunas" (AC 5.3 No. 3: menunggu_bayar -> lunas)
  const handleSetLunas = (tiket: TiketDoc) => {
    if (tiket.status !== "menunggu_bayar") return

    setTiketList((prev) =>
      prev.map((t) => (t.id === tiket.id ? { ...t, status: "lunas" } : t))
    )
    showToast(`Tiket ${tiket.id} (${tiket.nama_pembeli}) berhasil dikonfirmasi lunas!`)
  }

  // Ubah status ke "hadir" (AC 5.3 No. 3: lunas -> hadir)
  const handleSetHadir = (tiket: TiketDoc) => {
    if (tiket.status !== "lunas") return

    setTiketList((prev) =>
      prev.map((t) => (t.id === tiket.id ? { ...t, status: "hadir" } : t))
    )
    showToast(`Check-in berhasil: ${tiket.nama_pembeli} hadir di acara!`)
  }

  // Konfirmasi Pembatalan Tiket (AC 5.3 No. 4)
  const handleConfirmCancel = () => {
    if (!cancelingTiket) return

    // 1. Ubah status tiket menjadi "dibatalkan"
    setTiketList((prev) =>
      prev.map((t) => (t.id === cancelingTiket.id ? { ...t, status: "dibatalkan" } : t))
    )

    // 2. Kurangi tiket_terjual pada event sebanyak jumlah_tiket (kuota kembali) (AC 5.3 No. 4)
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === cancelingTiket.event_id
          ? { ...ev, tiket_terjual: Math.max(0, ev.tiket_terjual - cancelingTiket.jumlah_tiket) }
          : ev
      )
    )

    showToast(
      `Tiket ${cancelingTiket.id} dibatalkan. Kuota acara dikembalikan sebanyak ${cancelingTiket.jumlah_tiket} tiket.`
    )
    setCancelingTiket(null)
  }

  // Filter daftar tiket berdasarkan tab status
  const filteredTiket = tiketList.filter((t) => {
    if (statusFilter === "semua") return true
    return t.status === statusFilter
  })

  // Hitungan per status
  const countMenunggu = tiketList.filter((t) => t.status === "menunggu_bayar").length
  const countLunas = tiketList.filter((t) => t.status === "lunas").length
  const countHadir = tiketList.filter((t) => t.status === "hadir").length
  const countDibatalkan = tiketList.filter((t) => t.status === "dibatalkan").length

  return (
    <div className="space-y-5">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed top-16 right-4 left-4 md:left-auto md:w-96 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 shadow-md backdrop-blur">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* DIALOG KONFIRMASI PEMBATALAN TIKET (AC 5.3 No. 4) */}
      {cancelingTiket && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">Batalkan Pembelian Tiket?</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Apakah Anda yakin ingin membatalkan tiket untuk{" "}
                  <strong className="text-foreground">
                    &ldquo;{cancelingTiket.nama_pembeli}&rdquo;
                  </strong>{" "}
                  sebanyak {cancelingTiket.jumlah_tiket} tiket? Kuota acara akan dikembalikan
                  sebanyak {cancelingTiket.jumlah_tiket} kursi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelingTiket(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Tutup dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancelingTiket(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
                className="cursor-pointer"
              >
                Batalkan Tiket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Modul Tiket */}
      <div className="flex flex-col gap-2 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Modul Tiket</h2>
            <p className="text-xs text-muted-foreground">
              Mencatat pembelian tiket, konfirmasi pembayaran, dan check-in kehadiran.
            </p>
          </div>

          {!isFormOpen ? (
            <Button
              size="sm"
              onClick={handleOpenAddForm}
              className="gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              Buat Tiket
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(false)}
              className="gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Kembali
            </Button>
          )}
        </div>
      </div>

      {/* TAMPILAN FORMULIR CATAT TIKET */}
      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-semibold">Formulir Pembelian Tiket</h3>
              <p className="text-xs text-muted-foreground">
                Pilih event, pembeli, dan jumlah tiket (1 sampai 5).
              </p>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              koleksi: tiket
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: event_id */}
            <div className="space-y-1">
              <label htmlFor="event_id" className="text-xs font-semibold text-foreground">
                Pilih Event <span className="text-destructive">*</span>
              </label>
              <select
                id="event_id"
                value={formData.event_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, event_id: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Pilih Acara Event --</option>
                {events.map((ev) => {
                  const sisa = ev.kuota - ev.tiket_terjual
                  return (
                    <option key={ev.id} value={ev.id} disabled={sisa <= 0}>
                      {ev.nama} - {formatRupiah(ev.harga_tiket)} (Sisa: {sisa} kursi)
                      {sisa <= 0 ? " [HABIS]" : ""}
                    </option>
                  )
                })}
              </select>
              {errors.event_id && (
                <span className="text-[11px] text-destructive font-medium block">
                  {errors.event_id}
                </span>
              )}
            </div>

            {/* Field: pembeli_id */}
            <div className="space-y-1">
              <label htmlFor="pembeli_id" className="text-xs font-semibold text-foreground">
                Pilih Pembeli <span className="text-destructive">*</span>
              </label>
              <select
                id="pembeli_id"
                value={formData.pembeli_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pembeli_id: e.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Pilih Pembeli Terdaftar --</option>
                {pembeliList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.no_whatsapp})
                  </option>
                ))}
              </select>
              {errors.pembeli_id ? (
                <span className="text-[11px] text-destructive font-medium block">
                  {errors.pembeli_id}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground block">
                  Data pembeli diambil dari koleksi pembeli
                </span>
              )}
            </div>

            {/* Field: jumlah_tiket (1 - 5) */}
            <div className="space-y-1">
              <label htmlFor="jumlah_tiket" className="text-xs font-semibold text-foreground">
                Jumlah Tiket (1-5) <span className="text-destructive">*</span>
              </label>
              <input
                id="jumlah_tiket"
                type="number"
                min="1"
                max={Math.min(5, Math.max(1, sisaKuota))}
                step="1"
                value={formData.jumlah_tiket}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, jumlah_tiket: e.target.value }))
                }
                placeholder="1 sampai 5"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex justify-between text-[11px]">
                {errors.jumlah_tiket ? (
                  <span className="text-destructive font-medium">{errors.jumlah_tiket}</span>
                ) : (
                  <span className="text-muted-foreground">
                    Maksimal 5 tiket dan tidak boleh melebihi sisa kuota ({sisaKuota} kursi)
                  </span>
                )}
              </div>
            </div>

            {/* Ringkasan Perhitungan Total (Tiga Aturan Nilai No. 3) */}
            {selectedEvent && (
              <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Harga Satuan:</span>
                  <span className="font-semibold text-foreground">
                    {formatRupiah(selectedEvent.harga_tiket)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Jumlah Pembelian:</span>
                  <span className="font-semibold text-foreground">
                    {formData.jumlah_tiket || 0} tiket
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold text-foreground">
                  <span>Total Tagihan:</span>
                  <span className="text-primary">{formatRupiah(calculatedTotal)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  *Status awal tiket otomatis menunggu_bayar. Tiket terjual pada event akan
                  bertambah.
                </p>
              </div>
            )}

            {/* Tombol aksi formulir */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="cursor-pointer"
                disabled={events.length === 0 || pembeliList.length === 0}
              >
                Simpan Tiket
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* TAMPILAN DAFTAR TIKET */
        <div className="space-y-4">
          {/* TABS FILTER STATUS (PRD 5.3) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("semua")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "semua"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Semua</span>
              <span className="text-[10px] bg-background/30 px-1.5 py-0.2 rounded-full">
                {tiketList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("menunggu_bayar")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "menunggu_bayar"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Menunggu Bayar</span>
              <span className="text-[10px] bg-background/30 px-1.5 py-0.2 rounded-full">
                {countMenunggu}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("lunas")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "lunas"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Lunas</span>
              <span className="text-[10px] bg-background/30 px-1.5 py-0.2 rounded-full">
                {countLunas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("hadir")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "hadir"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Hadir</span>
              <span className="text-[10px] bg-background/30 px-1.5 py-0.2 rounded-full">
                {countHadir}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("dibatalkan")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "dibatalkan"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Dibatalkan</span>
              <span className="text-[10px] bg-background/30 px-1.5 py-0.2 rounded-full">
                {countDibatalkan}
              </span>
            </button>
          </div>

          {/* DAFTAR KARTU TIKET */}
          {filteredTiket.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Ticket className="size-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">
                {statusFilter === "semua"
                  ? "Belum ada tiket dicatat"
                  : `Tidak ada tiket dengan status "${statusFilter}"`}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                {statusFilter === "semua"
                  ? "Belum ada transaksi tiket. Klik tombol di bawah untuk mencatat tiket baru."
                  : "Silakan pilih tab status lain untuk melihat tiket."}
              </p>
              {statusFilter === "semua" && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    onClick={handleOpenAddForm}
                    className="gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    Buat Tiket
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-1">
              {filteredTiket.map((t) => {
                // Badge status warna
                const getStatusBadge = () => {
                  switch (t.status) {
                    case "menunggu_bayar":
                      return (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          <Clock className="size-3" />
                          Menunggu Bayar
                        </span>
                      )
                    case "lunas":
                      return (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                          <CreditCard className="size-3" />
                          Lunas
                        </span>
                      )
                    case "hadir":
                      return (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <UserCheck className="size-3" />
                          Hadir
                        </span>
                      )
                    case "dibatalkan":
                      return (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                          <Ban className="size-3" />
                          Dibatalkan
                        </span>
                      )
                  }
                }

                return (
                  <div
                    key={t.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 shadow-sm"
                  >
                    <div>
                      {/* Baris Atas: Nama Event & Badge Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold tracking-tight text-foreground">
                              {t.nama_event}
                            </h3>
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {t.id}
                            </span>
                          </div>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="size-3.5 text-primary" />
                            <span>{t.tanggal_event}</span>
                          </p>
                        </div>
                        <div>{getStatusBadge()}</div>
                      </div>

                      {/* Detail Pembeli & Pembayaran */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-y border-border/60 py-2.5 my-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-foreground font-semibold">
                            <User className="size-3.5 text-muted-foreground" />
                            <span>{t.nama_pembeli}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono pl-5">
                            WA: {t.pembeli_id}
                          </div>
                        </div>

                        <div className="space-y-1 sm:text-right">
                          <div className="text-muted-foreground">
                            {t.jumlah_tiket} tiket × {formatRupiah(t.harga_tiket)}
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            Total: <span className="text-primary">{formatRupiah(t.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu & Tombol Aksi Alur Status (AC 5.3 No. 3) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        Dibuat: {t.dibuat_pada}
                      </span>

                      {/* Tombol Perubahan Status Sesuai Alur Ketat */}
                      <div className="flex items-center gap-2">
                        {t.status === "menunggu_bayar" && (
                          <>
                            {/* Konfirmasi Bayar -> lunas */}
                            <Button
                              size="xs"
                              onClick={() => handleSetLunas(t)}
                              className="gap-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            >
                              <CreditCard className="size-3" />
                              Konfirmasi Lunas
                            </Button>
                            {/* Pembatalan Tiket -> dibatalkan (dengan dialog) */}
                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => setCancelingTiket(t)}
                              className="gap-1 cursor-pointer"
                            >
                              <Ban className="size-3" />
                              Batalkan
                            </Button>
                          </>
                        )}

                        {t.status === "lunas" && (
                          /* Check-in -> hadir */
                          <Button
                            size="xs"
                            onClick={() => handleSetHadir(t)}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            <UserCheck className="size-3" />
                            Check-in (Hadir)
                          </Button>
                        )}

                        {t.status === "hadir" && (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            ✓ Peserta Sudah Hadir
                          </span>
                        )}

                        {t.status === "dibatalkan" && (
                          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                            Tiket Dibatalkan (Kuota Kembali)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
