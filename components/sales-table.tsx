"use client"

import { useState, useMemo } from "react"
import type { Venta } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, TrendingUp, Search, Trash2 } from "lucide-react"

interface SalesTableProps {
  data: Venta[]
  onDelete: (id: string) => void
  onUpdateCliente: (ventaId: string, clienteId: string | null, total: number) => void
}

type SortKey = "fecha" | "total" | "saldoPendiente"
type SortDirection = "asc" | "desc"

export function SalesTable({ data, onDelete, onUpdateCliente }: SalesTableProps) {
  const [sortKey, setSortKey]         = useState<SortKey>("fecha")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDirection("desc") }
  }

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter(v =>
      v.cliente?.nombre.toLowerCase().includes(q) ||
      v.items?.some(i => (i as any).perfumeNombre?.toLowerCase().includes(q))
    )
  }, [data, searchQuery])

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "fecha":          cmp = new Date(a.fecha).getTime() - new Date(b.fecha).getTime(); break
        case "total":          cmp = a.total - b.total; break
        case "saldoPendiente": cmp = (a.saldoPendiente ?? 0) - (b.saldoPendiente ?? 0); break
      }
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [filteredData, sortKey, sortDirection])

  const totalVentas   = data.reduce((s, v) => s + v.total, 0)
  const totalPendiente = data.reduce((s, v) => s + (v.saldoPendiente ?? 0), 0)

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })

  const SortableHeader = ({ label, sk }: { label: string; sk: SortKey }) => (
    <button type="button" onClick={() => handleSort(sk)}
      className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === sk ? "text-foreground" : "text-muted-foreground/50"}`} />
    </button>
  )

  const ranking = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(v => v.items?.forEach((i: any) => {
      const name = i.perfumeNombre ?? "?"
      map.set(name, (map.get(name) ?? 0) + i.cantidad)
    }))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [data])

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No hay ventas registradas</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Ventas Totales</span>
          <span className="text-xl font-semibold">{data.length}</span>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Facturado</span>
          <span className="text-xl font-semibold text-accent">${totalVentas.toFixed(2)}</span>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Saldo Pendiente</span>
          <span className={`text-xl font-semibold ${totalPendiente > 0 ? "text-destructive" : "text-accent"}`}>
            ${totalPendiente.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Top ranking */}
      {ranking.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Top Vendidos</span>
          </div>
          <div className="space-y-1">
            {ranking.map(([nombre, cant], idx) => (
              <div key={nombre} className="flex items-center justify-between text-sm">
                <span><span className="text-muted-foreground mr-1">{idx + 1}.</span>{nombre}</span>
                <span className="text-muted-foreground">{cant}u</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input type="text" placeholder="Buscar por cliente o perfume..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead><SortableHeader label="Fecha" sk="fecha" /></TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right"><div className="flex justify-end"><SortableHeader label="Total" sk="total" /></div></TableHead>
              <TableHead className="text-right"><div className="flex justify-end"><SortableHeader label="Pendiente" sk="saldoPendiente" /></div></TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(venta => {
              const pendiente = venta.saldoPendiente ?? 0
              return (
                <TableRow key={venta.id} className="border-border">
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(venta.fecha)}</TableCell>
                  <TableCell>
                    {venta.cliente
                      ? <span className="font-medium">{venta.cliente.nombre}</span>
                      : <span className="text-muted-foreground italic text-sm">Sin cliente</span>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {venta.items?.map((item: any) => (
                        <p key={item.id} className="text-sm">
                          <span className="font-medium">{item.perfumeNombre}</span>
                          <span className="text-muted-foreground"> × {item.cantidad} · ${item.precio.toFixed(2)}</span>
                        </p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-accent">${venta.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${pendiente > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      ${pendiente.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button type="button" onClick={() => onDelete(venta.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
