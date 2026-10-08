"use client"

import React from "react"
import { BarChart3, Info } from "lucide-react"

export function RekapPage() {
  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Modul Rekap</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            PRD 5.4
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Membaca tiket terjual, sisa kuota, pendapatan, dan jumlah kehadiran per event.
        </p>
      </div>

      {/* PRD Scope Info */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 mt-0.5 text-primary" />
        <div>
          <span className="font-semibold text-foreground">Sumber Perhitungan: </span>
          Tidak ada koleksi rekap tersendiri. Rekap dihitung dinamis dari koleksi <code className="font-mono text-[11px] bg-background px-1 py-0.5 rounded border border-border">event</code> dan <code className="font-mono text-[11px] bg-background px-1 py-0.5 rounded border border-border">tiket</code> (hanya status lunas & hadir).
        </div>
      </div>

      {/* Empty State per AC 5.4 (No 3) */}
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BarChart3 className="size-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold">Pilih event untuk melihat rekap</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          Belum ada ringkasan yang dimuat. Saat terhubung dengan data event dan tiket, metrik penjualan serta kehadiran akan ditampilkan di sini.
        </p>
      </div>
    </div>
  )
}
