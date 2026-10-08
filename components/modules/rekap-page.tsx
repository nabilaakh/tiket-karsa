"use client"

import React, { useState, useMemo } from "react"
import {
  BarChart3,
  Ticket,
  Users,
  UserCheck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Calendar,
  MapPin,
  Clock,
  Ban,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EventDoc } from "@/types/event"
import type { TiketDoc } from "@/types/tiket"
import { SAMPLE_EVENTS } from "./event-page"
import { SAMPLE_TIKET } from "./tiket-page"

export interface RekapPageProps {
  events?: EventDoc[]
  tiketList?: TiketDoc[]
}

export function RekapPage({
  events: propEvents,
  tiketList: propTiketList,
}: RekapPageProps = {}) {
  const events = propEvents ?? SAMPLE_EVENTS
  const tiketList = propTiketList ?? SAMPLE_TIKET

  // Event yang dipilih untuk direkap
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events[0]?.id || ""
  )
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Format rupiah
  const formatRupiah = (nominal: number) => {
    return `Rp ${nominal.toLocaleString("id-ID")}`
  }

  // Event terpilih
  const selectedEvent = events.find((e) => e.id === selectedEventId)

  // Semua tiket untuk event yang dipilih
  const eventTikets = useMemo(() => {
    if (!selectedEventId) return []
    return tiketList.filter((t) => t.event_id === selectedEventId)
  }, [tiketList, selectedEventId])

  // AC 5.4 No. 2:
  // Pendapatan HANYA dihitung dari tiket berstatus lunas dan hadir
  // Tiket berstatus menunggu_bayar dan dibatalkan TIDAK ikut dihitung
  const pendapatan = useMemo(() => {
    return eventTikets
      .filter((t) => t.status === "lunas" || t.status === "hadir")
      .reduce((sum, t) => sum + t.total, 0)
  }, [eventTikets])

  // Pendapatan menunggu bayar (potensi piutang belum masuk kas)
  const potensiMenungguBayar = useMemo(() => {
    return eventTikets
      .filter((t) => t.status === "menunggu_bayar")
      .reduce((sum, t) => sum + t.total, 0)
  }, [eventTikets])

  // Jumlah peserta hadir (check-in)
  const jumlahHadir = useMemo(() => {
    return eventTikets
      .filter((t) => t.status === "hadir")
      .reduce((sum, t) => sum + t.jumlah_tiket, 0)
  }, [eventTikets])

  // Rincian jumlah tiket per status
  const countMenunggu = eventTikets
    .filter((t) => t.status === "menunggu_bayar")
    .reduce((sum, t) => sum + t.jumlah_tiket, 0)

  const countLunas = eventTikets
    .filter((t) => t.status === "lunas")
    .reduce((sum, t) => sum + t.jumlah_tiket, 0)

  const countHadir = eventTikets
    .filter((t) => t.status === "hadir")
    .reduce((sum, t) => sum + t.jumlah_tiket, 0)

  const countDibatalkan = eventTikets
    .filter((t) => t.status === "dibatalkan")
    .reduce((sum, t) => sum + t.jumlah_tiket, 0)

  // Simulasi refresh / reload (AC 5.4 No. 4)
  const handleRetry = () => {
    setIsLoading(true)
    setIsError(false)
    setTimeout(() => {
      setIsLoading(false)
    }, 400)
  }

  // Jika belum ada event sama sekali
  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-xl font-bold tracking-tight">Modul Rekap</h2>
          <p className="text-xs text-muted-foreground">
            Ringkasan penjualan tiket, pendapatan, dan kehadiran per event.
          </p>
        </div>
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
          <BarChart3 className="size-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">Belum Ada Event</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Tambahkan event terlebih dahulu di Modul Event untuk melihat ringkasan rekap.
          </p>
        </div>
      </div>
    )
  }

  // Tampilan Error State dengan tombol Coba Lagi (AC 5.4 No. 4)
  if (isError) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-xl font-bold tracking-tight">Modul Rekap</h2>
          <p className="text-xs text-muted-foreground">
            Ringkasan penjualan tiket, pendapatan, dan kehadiran per event.
          </p>
        </div>
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-destructive">
            Gagal Memuat Data Rekap
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Koneksi terputus atau terjadi kesalahan saat mengambil data rekap acara.
          </p>
          <Button
            size="sm"
            onClick={handleRetry}
            className="gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  // Tampilan Skeleton saat memuat (PRD 5.4 Komponen Skeleton)
  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="h-12 w-full bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    )
  }

  const sisaKuota = selectedEvent
    ? selectedEvent.kuota - selectedEvent.tiket_terjual
    : 0
  const isHabis = selectedEvent
    ? selectedEvent.tiket_terjual >= selectedEvent.kuota
    : false
  const persentaseTerjual = selectedEvent
    ? Math.min(
        100,
        Math.round((selectedEvent.tiket_terjual / selectedEvent.kuota) * 100)
      )
    : 0

  return (
    <div className="space-y-5">
      {/* Header Modul Rekap */}
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Modul Rekap</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            PRD 5.4
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Ringkasan penjualan tiket, sisa kuota, uang masuk, dan kehadiran per event.
        </p>
      </div>

      {/* SELECT EVENT (PRD 5.4) */}
      <div className="space-y-1.5">
        <label htmlFor="rekap_event" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="size-3.5 text-primary" />
          <span>Pilih Acara Event untuk Direkap:</span>
        </label>
        <select
          id="rekap_event"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs font-medium focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring shadow-xs cursor-pointer"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nama} ({ev.tanggal}) - {ev.tiket_terjual}/{ev.kuota} tiket
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <div className="space-y-4">
          {/* INFORMASI ACARA */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {selectedEvent.nama}
                </h3>
                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {selectedEvent.id}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3 text-primary" />
                  {selectedEvent.tanggal}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3 text-muted-foreground" />
                  {selectedEvent.lokasi}
                </span>
                <span>
                  Harga: <strong>{formatRupiah(selectedEvent.harga_tiket)}</strong>
                </span>
              </div>
            </div>

            {isHabis ? (
              <span className="inline-flex items-center rounded-md bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive self-start sm:self-center">
                Habis Terjual
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary self-start sm:self-center">
                {sisaKuota} Kursi Tersedia
              </span>
            )}
          </div>

          {/* 4 KARTU ANGKA METRIK UTAMA (AC 5.4 No. 1) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* 1. Tiket Terjual */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Tiket Terjual</span>
                <Ticket className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {selectedEvent.tiket_terjual}
              </div>
              <p className="text-[11px] text-muted-foreground">
                dari {selectedEvent.kuota} kuota
              </p>
            </div>

            {/* 2. Sisa Kuota */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Sisa Kuota</span>
                <Users className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {sisaKuota}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isHabis ? "Kapasitas penuh" : "Kursi belum terisi"}
              </p>
            </div>

            {/* 3. Pendapatan Masuk (AC 5.4 No. 2: hanya lunas & hadir) */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Pendapatan</span>
                <CreditCard className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatRupiah(pendapatan)}
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Lunas & Hadir saja
              </p>
            </div>

            {/* 4. Peserta Hadir (Check-in) */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Peserta Hadir</span>
                <UserCheck className="size-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {jumlahHadir}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sudah check-in
              </p>
            </div>
          </div>

          {/* BATANG KEMAJUAN (PRD 5.4 Komponen Batang Kemajuan) */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Keterisian Kuota Acara:
              </span>
              <span className="font-bold text-primary">
                {selectedEvent.tiket_terjual} / {selectedEvent.kuota} Kursi ({persentaseTerjual}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  isHabis ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${persentaseTerjual}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>0 Kursi</span>
              <span>Kapasitas Maksimal {selectedEvent.kuota} Kursi</span>
            </div>
          </div>

          {/* EMPTY STATE JIKA EVENT BELUM MEMILIKI TIKET (AC 5.4 No. 3) */}
          {eventTikets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
              <Ticket className="size-8 mx-auto text-muted-foreground" />
              <h4 className="text-xs font-semibold text-foreground">
                Belum Ada Pembelian Tiket
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Event ini belum memiliki transaksi tiket yang tercatat. Rincian status
                dan pendapatan akan tampil setelah ada tiket yang dibuat di Modul Tiket.
              </p>
            </div>
          ) : (
            /* RINCIAN STATUS PEMBELIAN TIKET */
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-foreground border-b border-border pb-2">
                Rincian Status Pembayaran & Kehadiran
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Lunas */}
                <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Lunas (Belum Hadir)</span>
                  </div>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    {countLunas} tiket
                  </span>
                </div>

                {/* Hadir */}
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Sudah Hadir (Check-in)</span>
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {countHadir} tiket
                  </span>
                </div>

                {/* Menunggu Bayar */}
                <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <span>Menunggu Bayar</span>
                      <span className="block text-[10px] text-muted-foreground">
                        Potensi: {formatRupiah(potensiMenungguBayar)}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {countMenunggu} tiket
                  </span>
                </div>

                {/* Dibatalkan */}
                <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
                  <div className="flex items-center gap-2">
                    <Ban className="size-3.5 text-rose-600 dark:text-rose-400" />
                    <div>
                      <span>Dibatalkan</span>
                      <span className="block text-[10px] text-muted-foreground">
                        Kuota dikembalikan
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-rose-700 dark:text-rose-300">
                    {countDibatalkan} tiket
                  </span>
                </div>
              </div>

              {/* Catatan Aturan PRD */}
              <p className="text-[11px] text-muted-foreground italic pt-1">
                *Sesuai PRD 5.4 AC 2, pendapatan hanya menghitung tiket berstatus Lunas dan Hadir.
                Tiket Menunggu Bayar dan Dibatalkan tidak dimasukkan ke pendapatan kas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
