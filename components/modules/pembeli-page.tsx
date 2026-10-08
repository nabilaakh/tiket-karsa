"use client"

import React from "react"
import { Users, UserPlus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PembeliPage() {
  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Modul Pembeli</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            PRD 5.2
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Mengelola nama, nomor WhatsApp, dan email pembeli.
        </p>
      </div>

      {/* PRD Scope Info */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 mt-0.5 text-primary" />
        <div>
          <span className="font-semibold text-foreground">Cakupan Data: </span>
          Koleksi <code className="font-mono text-[11px] bg-background px-1 py-0.5 rounded border border-border">pembeli</code> (nama, no_whatsapp, email). ID dokumen menggunakan nomor WhatsApp.
        </div>
      </div>

      {/* Empty State */}
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users className="size-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold">Belum ada pembeli</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          Daftar pembeli masih kosong. Anda dapat mencari dan mendaftarkan pembeli baru saat formulir CRUD siap.
        </p>
        <div className="mt-4">
          <Button size="sm" disabled className="gap-1.5 opacity-70 cursor-not-allowed">
            <UserPlus className="size-3.5" />
            Tambah Pembeli
          </Button>
        </div>
      </div>
    </div>
  )
}
