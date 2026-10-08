"use client"

import React from "react"
import { Calendar, Users, Ticket, BarChart3, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export type ModuleType = "event" | "pembeli" | "tiket" | "rekap"

interface NavItem {
  id: ModuleType
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const NAV_ITEMS: NavItem[] = [
  { id: "event", label: "Event", icon: Calendar },
  { id: "pembeli", label: "Pembeli", icon: Users },
  { id: "tiket", label: "Tiket", icon: Ticket },
  { id: "rekap", label: "Rekap", icon: BarChart3 },
]

interface NavbarProps {
  activeModule: ModuleType
  onSelectModule: (module: ModuleType) => void
}

export function Navbar({ activeModule, onSelectModule }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              KT
            </div>
            <div>
              <h1 className="text-base font-bold leading-none tracking-tight">
                Karsa Tiket
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Tiketing Event Komunitas
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeModule === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectModule(item.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Theme toggle */}
          <div className="flex items-center">
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Ganti Tema (tekan 'd' juga bisa)"
                aria-label="Ganti Tema"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi Utama Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid h-16 grid-cols-4 items-center max-w-md mx-auto px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-all text-xs font-medium cursor-pointer",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span className="text-[11px] leading-none">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
