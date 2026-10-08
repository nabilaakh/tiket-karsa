"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Calendar,
  Plus,
  MapPin,
  Tag,
  Users,
  CheckCircle2,
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardListSkeleton, EmptyStateView, ErrorStateView } from "@/components/ui/state-views"
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/firestore"
import type { EventDoc } from "@/types/event"

// Data fallback kosong saat terhubung ke Firestore
export const SAMPLE_EVENTS: EventDoc[] = []

export interface EventPageProps {
  events?: EventDoc[]
  setEvents?: React.Dispatch<React.SetStateAction<EventDoc[]>>
}

export function EventPage({ events: propEvents, setEvents: propSetEvents }: EventPageProps = {}) {
  const [localEvents, setLocalEvents] = useState<EventDoc[]>([])
  const events = propEvents ?? localEvents
  const setEvents = propSetEvents ?? setLocalEvents
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventDoc | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<EventDoc | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const data = await getEvents()
      setEvents(data)
    } catch (err) {
      console.error("Gagal mengambil data event dari Firestore:", err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [setEvents])

  useEffect(() => {
    let ignore = false
    getEvents()
      .then((data) => {
        if (!ignore) {
          setEvents(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Gagal mengambil data event:", err)
          setIsError(true)
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [setEvents])

  const handleRetry = () => {
    setIsLoading(true)
    setIsError(false)
    loadData()
  }

  // Form State menggunakan nama field persis seperti skema
  const [formData, setFormData] = useState({
    nama: "",
    tanggal: "",
    lokasi: "",
    harga_tiket: "",
    kuota: "",
  })

  // State galat validasi formulir
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Format rupiah untuk harga tiket
  const formatRupiah = (nominal: number) => {
    if (nominal === 0) return "Gratis"
    return `Rp ${nominal.toLocaleString("id-ID")}`
  }

  // Tampilkan toast notifikasi
  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Buka formulir untuk Tambah Event baru
  const handleOpenAddForm = () => {
    setEditingEvent(null)
    setFormData({
      nama: "",
      tanggal: "",
      lokasi: "",
      harga_tiket: "",
      kuota: "",
    })
    setErrors({})
    setIsFormOpen(true)
  }

  // Buka formulir untuk Ubah Event
  const handleOpenEditForm = (ev: EventDoc) => {
    setEditingEvent(ev)
    setFormData({
      nama: ev.nama,
      tanggal: ev.tanggal,
      lokasi: ev.lokasi,
      harga_tiket: ev.harga_tiket.toString(),
      kuota: ev.kuota.toString(),
    })
    setErrors({})
    setIsFormOpen(true)
  }

  // Handle perubahan input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Hapus error saat pengguna mulai mengetik
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // Validasi formulir sesuai PRD Bagian 5.1 & Skema Bagian 3 & 7
  const validateForm = () => {
    const errs: Record<string, string> = {}

    // Nama: wajib, 1 - 60 karakter
    if (!formData.nama.trim()) {
      errs.nama = "Nama acara wajib diisi."
    } else if (formData.nama.trim().length > 60) {
      errs.nama = "Nama acara maksimal 60 karakter."
    }

    // Tanggal: wajib, format YYYY-MM-DD
    if (!formData.tanggal) {
      errs.tanggal = "Tanggal acara wajib dipilih."
    }

    // Lokasi: wajib, 1 - 100 karakter
    if (!formData.lokasi.trim()) {
      errs.lokasi = "Lokasi acara wajib diisi."
    } else if (formData.lokasi.trim().length > 100) {
      errs.lokasi = "Lokasi acara maksimal 100 karakter."
    }

    // Harga tiket: angka bulat, minimal 0 (0 = gratis)
    const hargaNum = Number(formData.harga_tiket)
    if (formData.harga_tiket === "" || isNaN(hargaNum)) {
      errs.harga_tiket = "Harga tiket wajib diisi angka bulat."
    } else if (hargaNum < 0) {
      errs.harga_tiket = "Harga tiket tidak boleh negatif."
    } else if (!Number.isInteger(hargaNum)) {
      errs.harga_tiket = "Harga tiket harus berupa angka bulat."
    }

    // Kuota: angka bulat, 1 sampai 500
    const kuotaNum = Number(formData.kuota)
    if (formData.kuota === "" || isNaN(kuotaNum)) {
      errs.kuota = "Kuota kursi wajib diisi angka."
    } else if (kuotaNum < 1 || kuotaNum > 500) {
      errs.kuota = "Kuota kursi harus antara 1 sampai 500."
    } else if (!Number.isInteger(kuotaNum)) {
      errs.kuota = "Kuota kursi harus berupa angka bulat."
    } else if (editingEvent && kuotaNum < editingEvent.tiket_terjual) {
      // Acceptance criteria 5.1 No. 4:
      // Given kuota diubah menjadi lebih kecil dari tiket terjual, When data dikirim, Then permintaan ditolak.
      errs.kuota = `Kuota tidak boleh lebih kecil dari tiket yang sudah terjual (${editingEvent.tiket_terjual} tiket).`
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit Simpan Event (Tambah atau Ubah)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const hargaBulat = Math.round(Number(formData.harga_tiket))
    const kuotaBulat = Math.round(Number(formData.kuota))

    setIsSubmitting(true)
    try {
      if (editingEvent) {
        // Mode Ubah Event (Update)
        await updateEvent(editingEvent.id, {
          nama: formData.nama.trim(),
          tanggal: formData.tanggal,
          lokasi: formData.lokasi.trim(),
          harga_tiket: hargaBulat,
          kuota: kuotaBulat,
        })
        showToast(`Event "${formData.nama.trim()}" berhasil diperbarui!`)
      } else {
        // Mode Tambah Event (Create) via addDoc - tiket_terjual bernilai 0 (AC 5.1 No 1)
        await createEvent({
          nama: formData.nama.trim(),
          tanggal: formData.tanggal,
          lokasi: formData.lokasi.trim(),
          harga_tiket: hargaBulat,
          kuota: kuotaBulat,
        })
        showToast(`Event "${formData.nama.trim()}" berhasil disimpan ke Firestore!`)
      }

      await loadData()
      setIsFormOpen(false)
      setEditingEvent(null)
      setFormData({
        nama: "",
        tanggal: "",
        lokasi: "",
        harga_tiket: "",
        kuota: "",
      })
    } catch (err: unknown) {
      console.error("Gagal menyimpan event ke Firestore:", err)
      const msg = err instanceof Error ? err.message : "Gagal menyimpan data event ke Firestore."
      showToast(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Konfirmasi Hapus Event (Delete)
  const handleConfirmDelete = async () => {
    if (!deletingEvent) return

    try {
      await deleteEvent(deletingEvent.id)
      showToast(`Event "${deletingEvent.nama}" berhasil dihapus.`)
      setDeletingEvent(null)
      await loadData()
    } catch (err) {
      console.error("Gagal menghapus event dari Firestore:", err)
      showToast("Gagal menghapus data event dari Firestore.")
    }
  }

  return (
    <div className="space-y-5">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed top-16 right-4 left-4 md:left-auto md:w-96 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 shadow-md backdrop-blur">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* MODAL DIALOG KONFIRMASI HAPUS EVENT */}
      {deletingEvent && (
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
                <h3 className="text-sm font-bold text-foreground">Hapus Event?</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Apakah Anda yakin ingin menghapus event{" "}
                  <strong className="text-foreground">&ldquo;{deletingEvent.nama}&rdquo;</strong>? Tindakan
                  ini tidak dapat dibatalkan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
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
                onClick={() => setDeletingEvent(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                className="cursor-pointer"
              >
                Hapus Event
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Modul Event */}
      <div className="flex flex-col gap-2 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Modul Event</h2>
            <p className="text-xs text-muted-foreground">
              Mengelola nama, tanggal, lokasi, harga tiket, dan kuota acara.
            </p>
          </div>

          {!isFormOpen ? (
            <Button
              size="sm"
              onClick={handleOpenAddForm}
              className="gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              Tambah Event
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsFormOpen(false)
                setEditingEvent(null)
              }}
              className="gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Kembali
            </Button>
          )}
        </div>
      </div>

      {/* TAMPILAN FORMULIR TAMBAH / UBAH EVENT */}
      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-semibold">
                {editingEvent ? `Ubah Event: ${editingEvent.nama}` : "Formulir Tambah Event"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {editingEvent
                  ? "Perbarui informasi acara. Kuota tidak boleh lebih kecil dari tiket terjual."
                  : "Isi data acara sesuai dengan skema koleksi event."}
              </p>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {editingEvent ? editingEvent.id : "koleksi: event"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: nama (1-60 karakter) */}
            <div className="space-y-1">
              <label htmlFor="nama" className="text-xs font-semibold text-foreground">
                Nama Acara <span className="text-destructive">*</span>
              </label>
              <input
                id="nama"
                name="nama"
                type="text"
                maxLength={60}
                value={formData.nama}
                onChange={handleChange}
                placeholder="Contoh: Workshop Sablon Tote Bag"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex justify-between text-[11px]">
                {errors.nama ? (
                  <span className="text-destructive font-medium">{errors.nama}</span>
                ) : (
                  <span className="text-muted-foreground">Maksimal 60 karakter</span>
                )}
                <span className="text-muted-foreground">{formData.nama.length}/60</span>
              </div>
            </div>

            {/* Field: tanggal (YYYY-MM-DD) */}
            <div className="space-y-1">
              <label htmlFor="tanggal" className="text-xs font-semibold text-foreground">
                Tanggal Acara <span className="text-destructive">*</span>
              </label>
              <input
                id="tanggal"
                name="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {errors.tanggal && (
                <span className="text-[11px] text-destructive font-medium">{errors.tanggal}</span>
              )}
            </div>

            {/* Field: lokasi (1-100 karakter) */}
            <div className="space-y-1">
              <label htmlFor="lokasi" className="text-xs font-semibold text-foreground">
                Lokasi Acara <span className="text-destructive">*</span>
              </label>
              <input
                id="lokasi"
                name="lokasi"
                type="text"
                maxLength={100}
                value={formData.lokasi}
                onChange={handleChange}
                placeholder="Contoh: Ruang Karsa, Jl. Merdeka No. 21"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex justify-between text-[11px]">
                {errors.lokasi ? (
                  <span className="text-destructive font-medium">{errors.lokasi}</span>
                ) : (
                  <span className="text-muted-foreground">Tempat atau ruangan acara</span>
                )}
                <span className="text-muted-foreground">{formData.lokasi.length}/100</span>
              </div>
            </div>

            {/* Grid 2 kolom: harga_tiket & kuota */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Field: harga_tiket */}
              <div className="space-y-1">
                <label htmlFor="harga_tiket" className="text-xs font-semibold text-foreground">
                  Harga Tiket (Rp) <span className="text-destructive">*</span>
                </label>
                <input
                  id="harga_tiket"
                  name="harga_tiket"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.harga_tiket}
                  onChange={handleChange}
                  placeholder="Contoh: 75000"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {errors.harga_tiket ? (
                  <span className="text-[11px] text-destructive font-medium">{errors.harga_tiket}</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Isi 0 jika acara gratis</span>
                )}
              </div>

              {/* Field: kuota */}
              <div className="space-y-1">
                <label htmlFor="kuota" className="text-xs font-semibold text-foreground">
                  Kuota Kursi <span className="text-destructive">*</span>
                </label>
                <input
                  id="kuota"
                  name="kuota"
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={formData.kuota}
                  onChange={handleChange}
                  placeholder="Contoh: 30"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {errors.kuota ? (
                  <span className="text-[11px] text-destructive font-medium">{errors.kuota}</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {editingEvent
                      ? `Minimal ${editingEvent.tiket_terjual} kursi (sesuai tiket terjual)`
                      : "1 sampai 500 kursi"}
                  </span>
                )}
              </div>
            </div>

            {/* Tombol aksi formulir */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditingEvent(null)
                }}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="cursor-pointer gap-1.5"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                {isSubmitting
                  ? "Menyimpan..."
                  : editingEvent
                  ? "Simpan Perubahan"
                  : "Simpan Event"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* TAMPILAN DAFTAR EVENT */
        <div className="space-y-4">
          {isError ? (
            <ErrorStateView
              title="Gagal Memuat Event"
              message="Terjadi kendala saat membaca data koleksi event. Silakan coba lagi."
              onRetry={handleRetry}
            />
          ) : isLoading ? (
            <CardListSkeleton count={2} />
          ) : events.length === 0 ? (
            /* Empty state (Acceptance Criteria 5.1 No 2) */
            <EmptyStateView
              icon={Calendar}
              title="Belum ada event"
              description="Belum ada acara yang dibuat. Klik tombol di bawah untuk menambah event baru."
              actionLabel="Tambah Event"
              actionIcon={Plus}
              onAction={handleOpenAddForm}
            />
          ) : (
            /* Daftar Kartu Event */
            <div className="grid gap-3 sm:grid-cols-1">
              {events.map((ev) => {
                const sisaKuota = ev.kuota - ev.tiket_terjual
                const isHabis = ev.tiket_terjual >= ev.kuota // AC 5.1 No 3
                const persentaseTerjual = Math.min(
                  100,
                  Math.round((ev.tiket_terjual / ev.kuota) * 100)
                )

                return (
                  <div
                    key={ev.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 shadow-sm"
                  >
                    <div>
                      {/* Baris Atas: Nama, ID, Status, dan Tombol Aksi */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold tracking-tight text-foreground">
                              {ev.nama}
                            </h3>
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {ev.id}
                            </span>
                          </div>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="size-3.5 text-primary" />
                            <span>{ev.tanggal}</span>
                          </p>
                        </div>

                        {/* Status Label & Tombol Ubah/Hapus */}
                        <div className="flex items-center gap-1.5">
                          {isHabis ? (
                            <span className="inline-flex items-center rounded-md bg-destructive/15 px-2.5 py-1 text-xs font-bold text-destructive">
                              Habis
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              Tersedia
                            </span>
                          )}

                          {/* Tombol Ubah */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(ev)}
                            title="Ubah Event"
                            aria-label={`Ubah event ${ev.nama}`}
                            className="inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Pencil className="size-3.5" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => setDeletingEvent(ev)}
                            title="Hapus Event"
                            aria-label={`Hapus event ${ev.nama}`}
                            className="inline-flex size-7 items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Info Detail: Lokasi & Harga */}
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs border-y border-border/60 py-2.5 my-2.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{ev.lokasi}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-foreground font-semibold">
                          <Tag className="size-3.5 shrink-0 text-primary" />
                          <span>{formatRupiah(ev.harga_tiket)}</span>
                        </div>
                      </div>

                      {/* Kuota & Sisa Kuota (Dihitung di aplikasi: kuota - tiket_terjual) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="size-3.5" />
                            <span>Kapasitas:</span>
                            <strong className="text-foreground">{ev.kuota} kursi</strong>
                          </span>
                          <span className="text-xs">
                            Sisa:{" "}
                            <strong
                              className={
                                isHabis
                                  ? "text-destructive font-bold"
                                  : "text-primary font-bold"
                              }
                            >
                              {sisaKuota} tiket
                            </strong>
                          </span>
                        </div>

                        {/* Progress Bar Kuota */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isHabis ? "bg-destructive" : "bg-primary"
                            }`}
                            style={{ width: `${persentaseTerjual}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>Terjual: {ev.tiket_terjual} tiket</span>
                          <span>{persentaseTerjual}% terisi</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu */}
                    <div className="mt-3 flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/40">
                      <span>Dibuat: {ev.dibuat_pada}</span>
                      <span className="font-mono">harga_tiket: {ev.harga_tiket}</span>
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
