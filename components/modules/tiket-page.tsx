"use client"

import React from "react"
import { Ticket, Plus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TiketPage() {
  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Modul Tiket</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            PRD 5.3
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Mencatat pembelian, total bayar, pelunasan, dan konfirmasi kehadiran.
        </p>
      </div>

      {/* PRD Scope Info */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 mt-0.5 text-primary" />
        <div className="space-y-1">
          <div>
            <span className="font-semibold text-foreground">Alur Status Tiket: </span>
            <span className="inline-flex gap-1 text-[11px] font-mono">
              <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">menunggu_bayar</span>
              →
              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">lunas</span>
              →
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">hadir</span>
            </span>
          </div>
          <p className="text-[11px]">
            *Tiket juga dapat diubah ke status <span className="font-mono text-destructive">dibatalkan</span> sebelum lunas.
          </p>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Ticket className="size-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold">Belum ada tiket</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          Belum ada transaksi tiket yang dicatat. Formulir pembelian tiket (1-5 tiket per transaksi) akan diintegrasikan pada tahap berikutnya.
        </p>
        <div className="mt-4">
          <Button size="sm" disabled className="gap-1.5 opacity-70 cursor-not-allowed">
            <Plus className="size-3.5" />
            Buat Tiket
          </Button>
        </div>
      </div>
    </div>
  )
}
