"use client"

import type React from "react"
import { useRef, useState, useMemo } from "react"
import type { Perfume } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ImageIcon, Pencil, Trash2, ArrowUpDown, Search } from "lucide-react"

interface StockTableProps {
  data: Perfume[]
  onUpdateImage: (id: string, fotoUrl: string) => void
  onEdit: (item: Perfume) => void
  onDelete: (id: string) => void
}

type SortKey = "nombre" | "marca" | "precioCosto" | "stock" | "precioVenta" | "gananciaUnidad" | "gananciaTotal"
type SortDirection = "asc" | "desc"

export function StockTable({ data, onUpdateImage, onEdit, onDelete }: StockTableProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentItemIdRef = useRef<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("nombre")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter(i => i.nombre.toLowerCase().includes(q) || i.marca.toLowerCase().includes(q))
  }, [data, searchQuery])

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let cmp = 0
      const guA = a.precioVenta - a.precioCosto
      const guB = b.precioVenta - b.precioCosto
      switch (sortKey) {
        case "nombre":       cmp = a.nombre.localeCompare(b.nombre); break
        case "marca":        cmp = a.marca.localeCompare(b.marca); break
        case "precioCosto":  cmp = a.precioCosto - b.precioCosto; break
        case "stock":        cmp = a.stock - b.stock; break
        case "precioVenta":  cmp = a.precioVenta - b.precioVenta; break
        case "gananciaUnidad": cmp = guA - guB; break
        case "gananciaTotal":  cmp = guA * a.stock - guB * b.stock; break
      }
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [filteredData, sortKey, sortDirection])

  const handleImageClick = (itemId: string) => {
    currentItemIdRef.current = itemId
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && currentItemIdRef.current) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const MAX = 300
          let w = img.width, h = img.height
          if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
          else       { if (h > MAX) { w *= MAX / h; h = MAX } }
          canvas.width = w; canvas.height = h
          canvas.getContext("2d")?.drawImage(img, 0, 0, w, h)
          if (currentItemIdRef.current)
            onUpdateImage(currentItemIdRef.current, canvas.toDataURL("image/jpeg", 0.7))
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  const totalInvertido     = data.reduce((acc, i) => acc + i.precioCosto * i.stock, 0)
  const totalGanPotencial  = data.reduce((acc, i) => acc + (i.precioVenta - i.precioCosto) * i.stock, 0)

  const SortableHeader = ({ label, sk, className = "" }: { label: string; sk: SortKey; className?: string }) => (
    <button type="button" onClick={() => handleSort(sk)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${className}`}>
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === sk ? "text-foreground" : "text-muted-foreground/50"}`} />
    </button>
  )

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No hay productos en stock</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Total Invertido</span>
          <span className="text-xl font-semibold text-foreground">${totalInvertido.toFixed(2)}</span>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Ganancia Potencial</span>
          <span className="text-xl font-semibold text-accent">${totalGanPotencial.toFixed(2)}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input type="text" placeholder="Buscar por perfume o marca..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12" />
              <TableHead><SortableHeader label="Perfume"    sk="nombre" /></TableHead>
              <TableHead><SortableHeader label="Marca"      sk="marca" /></TableHead>
              <TableHead className="text-right"><div className="flex justify-end"><SortableHeader label="Costo (USD)"  sk="precioCosto" /></div></TableHead>
              <TableHead className="text-right"><div className="flex justify-end"><SortableHeader label="Stock"        sk="stock" /></div></TableHead>
              <TableHead className="text-right"><div className="flex justify-end"><SortableHeader label="Precio Venta" sk="precioVenta" /></div></TableHead>
              <TableHead className="text-right"><div className="flex justify-end"><SortableHeader label="Gan. Unidad"  sk="gananciaUnidad" /></div></TableHead>
              <TableHead className="text-right"><div className="flex justify-end"><SortableHeader label="Gan. Total"   sk="gananciaTotal" /></div></TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(item => {
              const ganUn  = item.precioVenta - item.precioCosto
              const ganTot = ganUn * item.stock
              const baja   = ganTot < 0 || ganTot < item.precioCosto * item.stock * 0.15
              return (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="py-2 pr-0">
                    <button type="button" onClick={() => handleImageClick(item.id)}
                      className="w-10 h-10 rounded border border-border bg-muted/30 flex items-center justify-center overflow-hidden hover:border-foreground/30 transition-colors cursor-pointer">
                      {item.fotoUrl
                        ? <img src={item.fotoUrl} alt={item.nombre} className="w-full h-full object-contain" />
                        : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{item.marca}</TableCell>
                  <TableCell className="text-right text-muted-foreground">${item.precioCosto.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded text-sm ${item.stock < 5 ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">${item.precioVenta.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-medium ${baja ? "text-destructive" : "text-accent"}`}>${ganUn.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-medium ${baja ? "text-destructive" : "text-accent"}`}>${ganTot.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => onEdit(item)}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
