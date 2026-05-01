"use client"

import React, { useState, useRef } from "react"
import type { Perfume } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface AddStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: Omit<Perfume, "id" | "updatedAt">) => Promise<void>
  dolarBlue: number | null
}

export function AddStockDialog({ open, onOpenChange, onAdd, dolarBlue }: AddStockDialogProps) {
  const [nombre, setNombre]           = useState("")
  const [marca, setMarca]             = useState("")
  const [precioCosto, setPrecioCosto] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [stock, setStock]             = useState("")
  const [fotoUrl, setFotoUrl]         = useState<string | null>(null)
  const [currencyCosto, setCurrencyCosto] = useState<"ARS" | "USD">("ARS")
  const [currencyVenta, setCurrencyVenta] = useState<"ARS" | "USD">("ARS")
  const [fecha, setFecha]             = useState<Date>(new Date())
  const [fechaTexto, setFechaTexto]   = useState(format(new Date(), "yyyy-MM-dd"))
  const [isDragging, setIsDragging]   = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFechaTextoChange = (val: string) => {
    setFechaTexto(val)
    const parsed = parse(val, "yyyy-MM-dd", new Date())
    if (!isNaN(parsed.getTime())) {
      setFecha(parsed)
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setFecha(date)
      setFechaTexto(format(date, "yyyy-MM-dd"))
    }
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

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!open) return
      const items = e.clipboardData?.items
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile()
            if (file) { processFile(file); break }
          }
        }
      }
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [open])

  const resetForm = () => {
    setNombre(""); setMarca(""); setPrecioCosto(""); setPrecioVenta(""); setStock(""); setFotoUrl(null);
    setCurrencyCosto("ARS"); setCurrencyVenta("ARS");
    setFecha(new Date()); setFechaTexto(format(new Date(), "yyyy-MM-dd"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !marca || !precioCosto || !precioVenta || !stock) return
    setIsSubmitting(true)
    
    const rawCosto = parseFloat(precioCosto)
    const rawVenta = parseFloat(precioVenta)

    let precioCostoARS = rawCosto
    let precioCostoUSD = 0
    let precioVentaARS = rawVenta
    let precioVentaUSD = 0

    if (dolarBlue) {
      if (currencyCosto === "ARS") {
        precioCostoUSD = rawCosto / dolarBlue
      } else {
        precioCostoUSD = rawCosto
        precioCostoARS = rawCosto * dolarBlue
      }

      if (currencyVenta === "ARS") {
        precioVentaUSD = rawVenta / dolarBlue
      } else {
        precioVentaUSD = rawVenta
        precioVentaARS = rawVenta * dolarBlue
      }
    }

    try {
      await onAdd({
        nombre,
        marca,
        precioCosto: precioCostoARS,
        precioVenta: precioVentaARS,
        precioCostoARS,
        precioVentaARS,
        precioCostoUSD,
        precioVentaUSD,
        stock: parseInt(stock),
        fotoUrl,
        createdAt: fecha.toISOString(),
      })
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (v: boolean) => { if (!v) resetForm(); onOpenChange(v) }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Stock</DialogTitle>
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
                <span className="text-sm font-medium">{fotoUrl ? "Imagen seleccionada" : "Agregar imagen"}</span>
                <span className="text-xs text-muted-foreground">Click, arrastrar o pegar (Ctrl+V)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-nombre">Nombre del perfume</Label>
              <Input id="add-nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Sauvage" className="bg-background" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-marca">Marca</Label>
              <Input id="add-marca" value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Dior" className="bg-background" required />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-costo">Costo</Label>
              <div className="flex gap-2">
                <Input id="add-costo" type="number" step="0.01" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} placeholder="0.00" className="bg-background flex-1" required />
                <div className="flex rounded-md border border-input overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrencyCosto("ARS")}
                    className={`px-3 flex items-center gap-1 transition-all ${currencyCosto === "ARS" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    <span className={currencyCosto === "ARS" ? "" : "grayscale"}>🇦🇷</span>
                    <span className="text-xs font-bold">AR$</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyCosto("USD")}
                    className={`px-3 flex items-center gap-1 transition-all ${currencyCosto === "USD" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    <span className={currencyCosto === "USD" ? "" : "grayscale"}>🇺🇸</span>
                    <span className="text-xs font-bold">U$D</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-venta">Precio Venta</Label>
              <div className="flex gap-2">
                <Input id="add-venta" type="number" step="0.01" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} placeholder="0.00" className="bg-background flex-1" required />
                <div className="flex rounded-md border border-input overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrencyVenta("ARS")}
                    className={`px-3 flex items-center gap-1 transition-all ${currencyVenta === "ARS" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    <span className={currencyVenta === "ARS" ? "" : "grayscale"}>🇦🇷</span>
                    <span className="text-xs font-bold">AR$</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyVenta("USD")}
                    className={`px-3 flex items-center gap-1 transition-all ${currencyVenta === "USD" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    <span className={currencyVenta === "USD" ? "" : "grayscale"}>🇺🇸</span>
                    <span className="text-xs font-bold">U$D</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-stock">Stock disponible</Label>
              <Input id="add-stock" type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" className="bg-background" required />
            </div>
          </div>
          
          {/* Fecha Personalizada */}
          <div className="space-y-2">
            <Label htmlFor="add-fecha">Fecha de Ingreso</Label>
            <div className="flex gap-2">
              <Input
                id="add-fecha"
                type="date"
                value={fechaTexto}
                onChange={e => handleFechaTextoChange(e.target.value)}
                className="bg-background flex-1"
                required
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 bg-background">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={handleCalendarSelect}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-[10px] text-muted-foreground">Puedes ingresar la fecha manualmente o usar el calendario</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => handleOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
