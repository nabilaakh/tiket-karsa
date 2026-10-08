"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  RotateCcw,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardListSkeleton, EmptyStateView, ErrorStateView } from "@/components/ui/state-views"
import {
  getPembeli,
  createPembeli,
  updatePembeli,
  deletePembeli,
} from "@/lib/firestore"
import type { PembeliDoc } from "@/types/pembeli"

// Data fallback kosong saat terhubung ke Firestore
export const SAMPLE_PEMBELI: PembeliDoc[] = []

export interface PembeliPageProps {
  pembeliList?: PembeliDoc[]
  setPembeliList?: React.Dispatch<React.SetStateAction<PembeliDoc[]>>
}

export function PembeliPage({
  pembeliList: propPembeliList,
  setPembeliList: propSetPembeliList,
}: PembeliPageProps = {}) {
  const [localPembeliList, setLocalPembeliList] = useState<PembeliDoc[]>([])
  const pembeliList = propPembeliList ?? localPembeliList
  const setPembeliList = propSetPembeliList ?? setLocalPembeliList
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPembeli, setEditingPembeli] = useState<PembeliDoc | null>(null)
  const [deletingPembeli, setDeletingPembeli] = useState<PembeliDoc | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const data = await getPembeli()
      setPembeliList(data)
    } catch (err) {
      console.error("Gagal mengambil data pembeli dari Firestore:", err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [setPembeliList])

  useEffect(() => {
    let ignore = false
    getPembeli()
      .then((data) => {
        if (!ignore) {
          setPembeliList(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Gagal mengambil data pembeli:", err)
          setIsError(true)
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [setPembeliList])

  const handleRetry = () => {
    setIsLoading(true)
    setIsError(false)
    loadData()
  }

  // Form state persis sesuai field skema: nama, no_whatsapp, email
  const [formData, setFormData] = useState({
    nama: "",
    no_whatsapp: "",
    email: "",
  })

  // State pesan galat validasi formulir
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Tampilkan notifikasi toast
  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Buka formulir untuk Tambah Pembeli baru
  const handleOpenAddForm = () => {
    setEditingPembeli(null)
    setFormData({
      nama: "",
      no_whatsapp: "",
      email: "",
    })
    setErrors({})
    setIsFormOpen(true)
  }

  // Buka formulir untuk Ubah Pembeli
  const handleOpenEditForm = (p: PembeliDoc) => {
    setEditingPembeli(p)
    setFormData({
      nama: p.nama,
      no_whatsapp: p.no_whatsapp,
      email: p.email,
    })
    setErrors({})
    setIsFormOpen(true)
  }

  // Handle input perubahan
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // Validasi formulir sesuai PRD 5.2 & Skema Bagian 4 & 7
  const validateForm = () => {
    const errs: Record<string, string> = {}
    const cleanNama = formData.nama.trim()
    const cleanWa = formData.no_whatsapp.trim()
    const cleanEmail = formData.email.trim()

    // Nama: wajib, 1 - 60 karakter
    if (!cleanNama) {
      errs.nama = "Nama pembeli wajib diisi."
    } else if (cleanNama.length > 60) {
      errs.nama = "Nama pembeli maksimal 60 karakter."
    }

    // Nomor WhatsApp: diawali 08, 10 - 13 angka
    const waRegex = /^08\d{8,11}$/
    if (!cleanWa) {
      errs.no_whatsapp = "Nomor WhatsApp wajib diisi."
    } else if (!waRegex.test(cleanWa)) {
      errs.no_whatsapp = "Nomor WhatsApp harus diawali 08 dan memiliki panjang 10-13 digit angka."
    } else {
      // Acceptance Criteria 5.2 No. 2:
      // Given nomor WhatsApp sudah terdaftar, When data baru dikirim,
      // Then aplikasi menampilkan pesan "Nomor WhatsApp sudah terdaftar" dan data lama tidak tertimpa.
      const isDuplicate = pembeliList.some((p) => {
        if (editingPembeli && p.id === editingPembeli.id) {
          return false // abaikan dokumen yang sedang diubah jika nomor sama
        }
        return p.no_whatsapp === cleanWa
      })

      if (isDuplicate) {
        errs.no_whatsapp = "Nomor WhatsApp sudah terdaftar"
      }
    }

    // Email: wajib mengandung tanda @, maksimal 80 karakter (AC 5.2 No. 3)
    if (!cleanEmail) {
      errs.email = "Email wajib diisi."
    } else if (!cleanEmail.includes("@")) {
      errs.email = "Format email tidak sah, wajib mengandung tanda @"
    } else if (cleanEmail.length > 80) {
      errs.email = "Email maksimal 80 karakter."
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit Simpan Pembeli (Create & Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const cleanNama = formData.nama.trim()
    const cleanWa = formData.no_whatsapp.trim()
    const cleanEmail = formData.email.trim()

    setIsSubmitting(true)
    try {
      if (editingPembeli) {
        // Mode Ubah Pembeli
        await updatePembeli(editingPembeli.id, {
          nama: cleanNama,
          email: cleanEmail,
        })
        showToast(`Data pembeli "${cleanNama}" berhasil diperbarui!`)
      } else {
        // Mode Tambah Pembeli (ID dokumen = nomor WhatsApp sesuai Skema Bagian 4)
        await createPembeli({
          nama: cleanNama,
          no_whatsapp: cleanWa,
          email: cleanEmail,
        })
        showToast(`Pembeli "${cleanNama}" berhasil disimpan ke Firestore!`)
      }

      await loadData()
      setIsFormOpen(false)
      setEditingPembeli(null)
      setFormData({
        nama: "",
        no_whatsapp: "",
        email: "",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan data pembeli"
      if (msg.includes("Nomor WhatsApp sudah terdaftar")) {
        setErrors((prev) => ({
          ...prev,
          no_whatsapp: "Nomor WhatsApp sudah terdaftar",
        }))
      } else {
        showToast("Gagal menyimpan data pembeli ke Firestore.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Konfirmasi Hapus Pembeli (AC 5.2 No. 5)
  const handleConfirmDelete = async () => {
    if (!deletingPembeli) return

    try {
      await deletePembeli(deletingPembeli.id)
      showToast(`Data pembeli "${deletingPembeli.nama}" berhasil dihapus.`)
      setDeletingPembeli(null)
      await loadData()
    } catch (err) {
      console.error("Gagal menghapus pembeli:", err)
      showToast("Gagal menghapus data pembeli dari Firestore.")
    }
  }

  // Filter daftar berdasarkan kolom cari nama atau nomor WA (AC 5.2 No. 4)
  const filteredPembeli = useMemo(() => {
    if (!searchQuery.trim()) return pembeliList
    const q = searchQuery.toLowerCase().trim()
    return pembeliList.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.no_whatsapp.includes(q)
    )
  }, [pembeliList, searchQuery])

  return (
    <div className="space-y-5">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed top-16 right-4 left-4 md:left-auto md:w-96 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 shadow-md backdrop-blur">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* MODAL DIALOG KONFIRMASI HAPUS PEMBELI (AC 5.2 No. 5) */}
      {deletingPembeli && (
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
                <h3 className="text-sm font-bold text-foreground">Hapus Pembeli?</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Apakah Anda yakin ingin menghapus data pembeli{" "}
                  <strong className="text-foreground">
                    &ldquo;{deletingPembeli.nama}&rdquo;
                  </strong>{" "}
                  ({deletingPembeli.no_whatsapp})? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingPembeli(null)}
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
                onClick={() => setDeletingPembeli(null)}
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
                Hapus Pembeli
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Modul Pembeli */}
      <div className="flex flex-col gap-2 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Modul Pembeli</h2>
            <p className="text-xs text-muted-foreground">
              Mengelola nama, nomor WhatsApp, dan email pembeli.
            </p>
          </div>

          {!isFormOpen ? (
            <Button
              size="sm"
              onClick={handleOpenAddForm}
              className="gap-1.5 cursor-pointer"
            >
              <UserPlus className="size-3.5" />
              Tambah Pembeli
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsFormOpen(false)
                setEditingPembeli(null)
              }}
              className="gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Kembali
            </Button>
          )}
        </div>
      </div>

      {/* TAMPILAN FORMULIR TAMBAH / UBAH PEMBELI */}
      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-semibold">
                {editingPembeli
                  ? `Ubah Pembeli: ${editingPembeli.nama}`
                  : "Formulir Tambah Pembeli"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {editingPembeli
                  ? "Perbarui informasi kontak pembeli tiket."
                  : "Daftarkan pembeli baru dengan nomor WhatsApp sebagai ID unik."}
              </p>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              koleksi: pembeli
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: nama (1-60 karakter) */}
            <div className="space-y-1">
              <label htmlFor="nama" className="text-xs font-semibold text-foreground">
                Nama Pembeli <span className="text-destructive">*</span>
              </label>
              <input
                id="nama"
                name="nama"
                type="text"
                maxLength={60}
                value={formData.nama}
                onChange={handleChange}
                placeholder="Contoh: Nadia Putri"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex justify-between text-[11px]">
                {errors.nama ? (
                  <span className="text-destructive font-medium">{errors.nama}</span>
                ) : (
                  <span className="text-muted-foreground">Nama lengkap pembeli</span>
                )}
                <span className="text-muted-foreground">{formData.nama.length}/60</span>
              </div>
            </div>

            {/* Field: no_whatsapp (ID dokumen) */}
            <div className="space-y-1">
              <label htmlFor="no_whatsapp" className="text-xs font-semibold text-foreground">
                Nomor WhatsApp <span className="text-destructive">*</span>
              </label>
              <input
                id="no_whatsapp"
                name="no_whatsapp"
                type="tel"
                maxLength={13}
                value={formData.no_whatsapp}
                onChange={handleChange}
                placeholder="Contoh: 081355512345"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
              {errors.no_whatsapp ? (
                <span className="text-[11px] text-destructive font-medium block">
                  {errors.no_whatsapp}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground block">
                  Diawali 08, 10-13 digit angka (digunakan sebagai ID unik)
                </span>
              )}
            </div>

            {/* Field: email (mengandung @) */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                maxLength={80}
                value={formData.email}
                onChange={handleChange}
                placeholder="Contoh: nadia.putri@contoh.id"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex justify-between text-[11px]">
                {errors.email ? (
                  <span className="text-destructive font-medium">{errors.email}</span>
                ) : (
                  <span className="text-muted-foreground">Wajib mengandung tanda @</span>
                )}
                <span className="text-muted-foreground">{formData.email.length}/80</span>
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
                  setEditingPembeli(null)
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
                  : editingPembeli
                  ? "Simpan Perubahan"
                  : "Simpan Pembeli"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* TAMPILAN DAFTAR PEMBELI */
        <div className="space-y-4">
          {/* Kolom Cari Pembeli (AC 5.2 No. 4) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pembeli berdasarkan nama atau nomor WhatsApp..."
              className="w-full rounded-lg border border-input bg-card pl-9 pr-8 py-2 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Daftar Kartu Pembeli */}
          {isError ? (
            <ErrorStateView
              title="Gagal Memuat Pembeli"
              message="Terjadi kendala saat membaca data koleksi pembeli. Silakan coba lagi."
              onRetry={handleRetry}
            />
          ) : isLoading ? (
            <CardListSkeleton count={2} />
          ) : filteredPembeli.length === 0 ? (
            <EmptyStateView
              icon={Users}
              title={searchQuery ? "Pembeli tidak ditemukan" : "Belum ada pembeli"}
              description={
                searchQuery
                  ? `Tidak ada data pembeli yang cocok dengan kata kunci "${searchQuery}".`
                  : "Daftar pembeli masih kosong. Tambahkan pembeli baru untuk mulai mencatat tiket."
              }
              actionLabel={searchQuery ? "Reset Pencarian" : "Tambah Pembeli"}
              actionIcon={searchQuery ? RotateCcw : UserPlus}
              onAction={searchQuery ? () => setSearchQuery("") : handleOpenAddForm}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-1">
              {filteredPembeli.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 shadow-sm"
                >
                  <div>
                    {/* Header: Nama, ID/No WA, dan Tombol Ubah/Hapus */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold tracking-tight text-foreground">
                            {p.nama}
                          </h3>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          ID: <span className="font-mono">{p.id}</span>
                        </p>
                      </div>

                      {/* Tombol Ubah & Hapus */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(p)}
                          title="Ubah Data Pembeli"
                          aria-label={`Ubah pembeli ${p.nama}`}
                          className="inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPembeli(p)}
                          title="Hapus Pembeli"
                          aria-label={`Hapus pembeli ${p.nama}`}
                          className="inline-flex size-7 items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Informasi Kontak: WhatsApp & Email */}
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs border-y border-border/60 py-2.5 my-2.5">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Phone className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-mono">{p.no_whatsapp}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="size-3.5 shrink-0 text-primary" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Kartu */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Terdaftar sejak: {p.dibuat_pada}</span>
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      pembeli/{p.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
