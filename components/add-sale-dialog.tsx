"use client"

import type React from "react"

import { useState, useMemo } from "react"
import type { Perfume } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Search } from "lucide-react"

interface AddSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (payload: { clienteId?: string; items: { perfumeId: string; cantidad: number; precio: number }[] }) => void
  stock: Perfume[]
  dolarBlue: number | null
}

export function AddSaleDialog({ open, onOpenChange, onAdd, stock, dolarBlue }: AddSaleDialogProps) {
  const [selectedStock, setSelectedStock] = useState<Perfume | null>(null)
  const [cantidad, setCantidad] = useState("")
  const [valorVenta, setValorVenta] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [searchPerfume, setSearchPerfume] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS")

  const filteredStock = useMemo(() => {
    if (!searchPerfume.trim()) return stock
    const query = searchPerfume.toLowerCase()
    return stock.filter((s) => s.nombre.toLowerCase().includes(query) || s.marca.toLowerCase().includes(query))
  }, [stock, searchPerfume])

  const handleSelectPerfume = (item: Perfume) => {
    setSelectedStock(item)
    setSearchPerfume(`${item.nombre} - ${item.marca}`)
    
    if (currency === "ARS") {
      setValorVenta(item.precioVentaARS.toString() || item.precioVenta.toString())
    } else {
      setValorVenta(item.precioVentaUSD.toString())
    }
    
    setShowDropdown(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStock || !cantidad || !valorVenta) return

    const rawVenta = parseFloat(valorVenta)
    let precioARS = rawVenta
    let precioUSD = 0

    if (dolarBlue) {
      if (currency === "ARS") {
        precioUSD = rawVenta / dolarBlue
      } else {
        precioUSD = rawVenta
        precioARS = rawVenta * dolarBlue
      }
    }

    onAdd({
      items: [{
        perfumeId: selectedStock.id,
        cantidad: Number.parseInt(cantidad),
        precio: precioARS,
        precioARS,
        precioUSD,
      } as any]
    })

    // Reset form
    setSelectedStock(null)
    setSearchPerfume("")
    setCantidad("")
    setValorVenta("")
    setDescripcion("")
    setShowDropdown(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedStock(null)
      setSearchPerfume("")
      setCantidad("")
      setValorVenta("")
      setDescripcion("")
      setShowDropdown(false)
      setCurrency("ARS")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Venta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="perfume-search">Perfume</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="perfume-search"
                type="text"
                value={searchPerfume}
                onChange={(e) => {
                  setSearchPerfume(e.target.value)
                  setSelectedStock(null)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar por perfume o marca..."
                className="pl-10 bg-background"
                autoComplete="off"
              />
              {showDropdown && filteredStock.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredStock.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPerfume(item)}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm flex justify-between items-center"
                    >
                      <span>{item.nombre}</span>
                      <span className="text-muted-foreground">{item.marca}</span>
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && searchPerfume && filteredStock.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4">
                  <p className="text-sm text-muted-foreground text-center">No se encontraron perfumes</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad-venta">Cantidad</Label>
              <Input
                id="cantidad-venta"
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Precio Total</Label>
              <div className="flex gap-2">
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={valorVenta}
                  onChange={(e) => setValorVenta(e.target.value)}
                  placeholder="0.00"
                  className="bg-background flex-1"
                />
                <div className="flex rounded-md border border-input overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrency("ARS")}
                    className={`px-3 flex items-center gap-1 transition-all ${currency === "ARS" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    <span className={currency === "ARS" ? "" : "grayscale"}>🇦🇷</span>
                    <span className="text-xs font-bold">AR$</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-3 flex items-center gap-1 transition-all ${currency === "USD" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    <span className={currency === "USD" ? "" : "grayscale"}>🇺🇸</span>
                    <span className="text-xs font-bold">U$D</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Notas sobre la venta..."
              rows={2}
              className="bg-background resize-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
