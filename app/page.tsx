"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockTable } from "@/components/stock-table"
import { SalesTable } from "@/components/sales-table"
import { AddStockDialog } from "@/components/add-stock-dialog"
import { AddSaleDialog } from "@/components/add-sale-dialog"
import { EditStockDialog } from "@/components/edit-stock-dialog"
import { Package, ShoppingCart, Plus, Receipt, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Perfume, Venta } from "@/lib/types"

export default function Home() {
  const [stock, setStock] = useState<Perfume[]>([])
  const [sales, setSales] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dolarRates, setDolarRates] = useState<{ blue: number; cripto: number } | null>(null)

  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Perfume | null>(null)

  const fetchData = async () => {
    try {
      const [stockRes, salesRes, dolarBlueRes, dolarCriptoRes] = await Promise.all([
        fetch('/api/stock'),
        fetch('/api/sales'),
        fetch('https://dolarapi.com/v1/dolares/blue').catch(() => null),
        fetch('https://dolarapi.com/v1/dolares/cripto').catch(() => null),
      ])
      if (!stockRes.ok) throw new Error('Failed to fetch stock')
      if (!salesRes.ok) throw new Error('Failed to fetch sales')

      setStock(await stockRes.json())
      setSales(await salesRes.json())

      if (dolarBlueRes?.ok && dolarCriptoRes?.ok) {
        const blueData = await dolarBlueRes.json()
        const criptoData = await dolarCriptoRes.json()
        setDolarRates({ blue: blueData.venta, cripto: criptoData.venta })
      }
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── Stock handlers ──────────────────────────────────────────────────────

  const handleAddStock = async (item: Omit<Perfume, "id" | "updatedAt"> & { createdAt?: string }) => {
    const tempId = crypto.randomUUID()
    const now = new Date().toISOString()
    const createdAt = item.createdAt || now
    const tempItem: Perfume = { ...item, id: tempId, createdAt, updatedAt: now }

    setStock(prev => [...prev, tempItem])
    setIsStockDialogOpen(false)
    toast.success("Producto agregado")

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error()
      const newItem: Perfume = await res.json()
      setStock(prev => prev.map(s => s.id === tempId ? newItem : s))
    } catch {
      toast.error("Error al agregar producto")
      setStock(prev => prev.filter(s => s.id !== tempId))
    }
  }

  const handleUpdateStockImage = async (id: string, fotoUrl: string) => {
    const item = stock.find(s => s.id === id)
    if (!item) return
    const updated = { ...item, fotoUrl }
    setStock(prev => prev.map(s => s.id === id ? updated : s))
    toast.success("Imagen actualizada")
    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) throw new Error()
      const saved: Perfume = await res.json()
      setStock(prev => prev.map(s => s.id === id ? saved : s))
    } catch {
      toast.error("Error al actualizar imagen")
      setStock(prev => prev.map(s => s.id === id ? item : s))
    }
  }

  const handleEditStock = (item: Perfume) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async (updatedItem: Perfume) => {
    const original = stock.find(s => s.id === updatedItem.id)
    setStock(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s))
    setIsEditDialogOpen(false)
    setEditingItem(null)
    toast.success("Producto actualizado")
    try {
      const res = await fetch(`/api/stock/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      })
      if (!res.ok) throw new Error()
      const saved: Perfume = await res.json()
      setStock(prev => prev.map(s => s.id === saved.id ? saved : s))
    } catch {
      toast.error("Error al actualizar producto")
      if (original) setStock(prev => prev.map(s => s.id === updatedItem.id ? original : s))
    }
  }

  const handleDeleteStock = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return
    const item = stock.find(s => s.id === id)
    setStock(prev => prev.filter(s => s.id !== id))
    toast.success("Producto eliminado")
    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Error al eliminar producto")
      if (item) setStock(prev => [...prev, item])
    }
  }

  // ── Sale handlers ───────────────────────────────────────────────────────

  const handleAddSale = async (payload: {
    clienteId?: string
    items: { perfumeId: string; cantidad: number; precio: number }[]
  }) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al registrar venta')

      setSales(prev => [data, ...prev])
      // Refresh stock to reflect server-decremented values
      const stockRes = await fetch('/api/stock')
      if (stockRes.ok) setStock(await stockRes.json())

      setIsSaleDialogOpen(false)
      toast.success("Venta registrada")
    } catch (error: any) {
      toast.error(error.message ?? "Error al registrar venta")
    }
  }

  const handleDeleteSale = async (id: string) => {
    if (!confirm("¿Eliminar esta venta? Se restaurará el stock.")) return
    const sale = sales.find(s => s.id === id)
    setSales(prev => prev.filter(s => s.id !== id))
    toast.success("Venta eliminada")
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      // Refresh stock after restore
      const stockRes = await fetch('/api/stock')
      if (stockRes.ok) setStock(await stockRes.json())
    } catch {
      toast.error("Error al eliminar venta")
      if (sale) setSales(prev => [sale, ...prev])
    }
  }

  const handleUpdateSaleCliente = async (ventaId: string, clienteId: string | null, total: number) => {
    try {
      const res = await fetch(`/api/sales/${ventaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, total }),
      })
      if (!res.ok) throw new Error()
      const updated: Venta = await res.json()
      setSales(prev => prev.map(s => s.id === ventaId ? updated : s))
      toast.success("Venta actualizada")
    } catch {
      toast.error("Error al actualizar venta")
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Gestión de Ventas</h1>
            <p className="text-muted-foreground mt-1">Administra tu inventario y registra tus ventas</p>
          </div>
          {dolarRates && (
            <div className="flex gap-4 bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Dólar Blue</span>
                <span className="text-lg font-bold text-foreground">${dolarRates.blue}</span>
              </div>
              <div className="w-px bg-border"></div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Dólar Cripto</span>
                <span className="text-lg font-bold text-foreground">${dolarRates.cripto}</span>
              </div>
            </div>
          )}
        </header>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={() => setIsStockDialogOpen(true)}
            className="flex-1 flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-6 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Agregar Stock
          </button>
          <button
            onClick={() => setIsSaleDialogOpen(true)}
            className="flex-1 flex items-center justify-center gap-3 bg-accent text-accent-foreground py-4 px-6 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Receipt className="w-5 h-5" />
            Registrar Venta
          </button>
        </div>

        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="w-full sm:w-auto bg-muted p-1 rounded-lg mb-6">
            <TabsTrigger value="stock" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md">
              <Package className="w-4 h-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="ventas" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md">
              <ShoppingCart className="w-4 h-4" />
              Ventas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="mt-0">
            <StockTable
              data={stock}
              onUpdateImage={handleUpdateStockImage}
              onEdit={handleEditStock}
              onDelete={handleDeleteStock}
            />
          </TabsContent>

          <TabsContent value="ventas" className="mt-0">
            <SalesTable
              data={sales}
              onDelete={handleDeleteSale}
              onUpdateCliente={handleUpdateSaleCliente}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AddStockDialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen} onAdd={handleAddStock} dolarBlue={dolarRates?.blue || null} />
      <AddSaleDialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen} onAdd={handleAddSale} stock={stock} dolarBlue={dolarRates?.blue || null} />
      <EditStockDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} onSave={handleSaveEdit} item={editingItem} dolarBlue={dolarRates?.blue || null} />
    </main>
  )
}
