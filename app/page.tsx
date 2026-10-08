"use client"

import React, { useState } from "react"
import { Navbar, type ModuleType } from "@/components/navbar"
import { EventPage, SAMPLE_EVENTS } from "@/components/modules/event-page"
import { PembeliPage, SAMPLE_PEMBELI } from "@/components/modules/pembeli-page"
import { TiketPage, SAMPLE_TIKET } from "@/components/modules/tiket-page"
import { RekapPage } from "@/components/modules/rekap-page"
import type { EventDoc } from "@/types/event"
import type { PembeliDoc } from "@/types/pembeli"
import type { TiketDoc } from "@/types/tiket"

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleType>("event")

  // State bersama antar modul agar perubahan kuota tiket langsung sinkron ke event
  const [events, setEvents] = useState<EventDoc[]>(SAMPLE_EVENTS)
  const [pembeliList, setPembeliList] = useState<PembeliDoc[]>(SAMPLE_PEMBELI)
  const [tiketList, setTiketList] = useState<TiketDoc[]>(SAMPLE_TIKET)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Responsive Navbar: Header + Desktop Tabs + Mobile Bottom Bar */}
      <Navbar activeModule={activeModule} onSelectModule={setActiveModule} />

      {/* Main Module Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 pb-24 md:pb-12">
        {activeModule === "event" && (
          <EventPage events={events} setEvents={setEvents} />
        )}
        {activeModule === "pembeli" && (
          <PembeliPage pembeliList={pembeliList} setPembeliList={setPembeliList} />
        )}
        {activeModule === "tiket" && (
          <TiketPage
            events={events}
            setEvents={setEvents}
            pembeliList={pembeliList}
            tiketList={tiketList}
            setTiketList={setTiketList}
          />
        )}
        {activeModule === "rekap" && (
          <RekapPage events={events} tiketList={tiketList} />
        )}
      </main>

      {/* Subtle Footer for desktop */}
      <footer className="hidden md:block border-t border-border py-4 text-center text-xs text-muted-foreground">
        Karsa Tiket · Tugas Mandiri Sesi 3 · Cloud Firestore & Netlify
      </footer>
    </div>
  )
}
