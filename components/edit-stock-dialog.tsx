"use client"

import React, { useState, useEffect, useRef } from "react"
import type { Perfume } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageIcon, X } from "lucide-react"

interface EditStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: Perfume) => Promise<void>
  item: Perfume | null
  dolarBlue: number | null
}

export function EditStockDialog({ open, onOpenChange, onSave, item, dolarBlue }: EditStockDialogProps) {
  const [formData, setFormData] = useState({ nombre: "", marca: "", precioCosto: "", precioVenta: "", stock: "" })
  const [fotoUrl, setFotoUrl]   = useState<string | null>(null)
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD")
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (item) {
      setFormData({
        nombre:      item.nombre,
        marca:       item.marca,
        precioCosto: item.precioCosto.toString(),
        precioVenta: item.precioVenta.toString(),
        stock:       item.stock.toString(),
      })
      setFotoUrl(item.fotoUrl)
      setCurrency("USD")
    }
  }, [item, open])

  const handleToggleCurrency = (target: "USD" | "ARS") => {
    if (currency === target || !dolarBlue) return;
    const isToARS = target === "ARS";
    const multiplier = isToARS ? dolarBlue : (1 / dolarBlue);
    setFormData(prev => ({
      ...prev,
      precioCosto: (parseFloat(prev.precioCosto || "0") * multiplier).toFixed(2),
      precioVenta: (parseFloat(prev.precioVenta || "0") * multiplier).toFixed(2),
    }));
    setCurrency(target);
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 300
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
        else       { if (h > MAX) { w *= MAX / h; h = MAX } }
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h)
        setFotoUrl(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!open) return
      const items = e.clipboardData?.items
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const f = items[i].getAsFile()
            if (f) { processFile(f); break }
          }
        }
      }
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    setIsSubmitting(true)

    let finalCosto = parseFloat(formData.precioCosto) || 0
    let finalVenta = parseFloat(formData.precioVenta) || 0

    if (currency === "ARS" && dolarBlue) {
      finalCosto = finalCosto / dolarBlue
      finalVenta = finalVenta / dolarBlue
    }

    try {
      await onSave({
        ...item,
        nombre:      formData.nombre,
        marca:       formData.marca,
        precioCosto: finalCosto,
        precioVenta: finalVenta,
        stock:       parseInt(formData.stock) || 0,
        fotoUrl,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const set = (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Editar Producto</DialogTitle>
            <div className="flex items-center rounded-md border border-border overflow-hidden text-sm mr-8">
              <button
                type="button"
                onClick={() => handleToggleCurrency("USD")}
                className={`px-3 py-1 ${currency === "USD" ? "bg-primary text-primary-foreground font-medium" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => handleToggleCurrency("ARS")}
                disabled={!dolarBlue}
                className={`px-3 py-1 ${currency === "ARS" ? "bg-primary text-primary-foreground font-medium" : "bg-muted/50 text-muted-foreground hover:bg-muted"} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!dolarBlue ? "Cotización no disponible" : undefined}
              >
                ARS
              </button>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">

          {/* Imagen */}
          <div className="space-y-2">
            <Label>Imagen del producto</Label>
            <input ref={fileInputRef} type="file" accept="image/*"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} className="hidden" />
            <div
              className={`flex items-center gap-3 p-2 rounded-lg border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-transparent"}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }}
            >
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden hover:border-foreground/30 transition-colors cursor-pointer shrink-0">
                {fotoUrl ? <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
              </button>
              {fotoUrl && (
                <button type="button" onClick={() => setFotoUrl(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{fotoUrl ? "Imagen seleccionada" : "Cambiar imagen"}</span>
                <span className="text-xs text-muted-foreground">Click, arrastrar o pegar (Ctrl+V)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre del perfume</Label>
              <Input id="edit-nombre" value={formData.nombre} onChange={set("nombre")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-marca">Marca</Label>
              <Input id="edit-marca" value={formData.marca} onChange={set("marca")} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-costo">Costo ({currency})</Label>
              <Input id="edit-costo" type="number" step="0.01" value={formData.precioCosto} onChange={set("precioCosto")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-venta">Precio Venta ({currency})</Label>
              <Input id="edit-venta" type="number" step="0.01" value={formData.precioVenta} onChange={set("precioVenta")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input id="edit-stock" type="number" value={formData.stock} onChange={set("stock")} required />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => onOpenChange(false)}
              className="flex-1 py-2.5 px-4 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
