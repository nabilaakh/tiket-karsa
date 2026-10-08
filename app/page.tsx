"use client"

import React, { useState } from "react"
import { Navbar, type ModuleType } from "@/components/navbar"
import { EventPage } from "@/components/modules/event-page"
import { PembeliPage } from "@/components/modules/pembeli-page"
import { TiketPage } from "@/components/modules/tiket-page"
import { RekapPage } from "@/components/modules/rekap-page"

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleType>("event")

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Responsive Navbar: Header + Desktop Tabs + Mobile Bottom Bar */}
      <Navbar activeModule={activeModule} onSelectModule={setActiveModule} />

      {/* Main Module Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 pb-24 md:pb-12">
        {activeModule === "event" && <EventPage />}
        {activeModule === "pembeli" && <PembeliPage />}
        {activeModule === "tiket" && <TiketPage />}
        {activeModule === "rekap" && <RekapPage />}
      </main>

      {/* Subtle Footer for desktop */}
      <footer className="hidden md:block border-t border-border py-4 text-center text-xs text-muted-foreground">
        Karsa Tiket · Tugas Mandiri Sesi 3 · Cloud Firestore & Netlify
      </footer>
    </div>
  )
}
