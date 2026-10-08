"use client"

import React from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CardListSkeletonProps {
  count?: number
}

/**
 * Skeleton loading state untuk daftar kartu
 */
export function CardListSkeleton({ count = 2 }: CardListSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted/60 rounded" />
            </div>
            <div className="h-6 w-16 bg-muted rounded-md" />
          </div>

          <div className="h-7 w-full bg-muted/40 rounded border border-border/40" />

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-28 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface EmptyStateViewProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel?: string
  actionIcon?: React.ComponentType<{ className?: string }>
  onAction?: () => void
}

/**
 * Empty state seragam untuk halaman daftar
 */
export function EmptyStateView({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
}: EmptyStateViewProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction} className="gap-1.5 cursor-pointer">
            {ActionIcon && <ActionIcon className="size-3.5" />}
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

interface ErrorStateViewProps {
  title?: string
  message?: string
  onRetry: () => void
}

/**
 * Error state seragam untuk penanganan galat jaringan/data
 */
export function ErrorStateView({
  title = "Gagal Memuat Data",
  message = "Terjadi kesalahan saat memuat data dari sistem. Silakan coba lagi.",
  onRetry,
}: ErrorStateViewProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-destructive">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          {message}
        </p>
      </div>
      <Button size="sm" onClick={onRetry} className="gap-1.5 cursor-pointer">
        <RotateCcw className="size-3.5" />
        Coba Lagi
      </Button>
    </div>
  )
}
