// ─── Perfume (stock) ────────────────────────────────────────────────────────
export interface Perfume {
  id: string
  marca: string
  nombre: string
  precioCosto: number // Pesos (legacy/default)
  precioVenta: number // Pesos (legacy/default)
  precioCostoARS: number
  precioVentaARS: number
  precioCostoUSD: number
  precioVentaUSD: number
  stock: number
  fotoUrl: string | null
  createdAt: string
  updatedAt: string
}

// ─── Cliente ────────────────────────────────────────────────────────────────
export interface Cliente {
  id: string
  nombre: string
  contacto: string | null
  createdAt: string
}

// ─── Venta ──────────────────────────────────────────────────────────────────
export interface VentaItem {
  id: string
  ventaId: string
  perfumeId: string
  cantidad: number
  precio: number // Pesos (legacy/default)
  precioARS: number
  precioUSD: number
  perfume?: Perfume
}

export interface Venta {
  id: string
  clienteId: string | null
  fecha: string
  total: number // Pesos (legacy/default)
  totalARS: number
  totalUSD: number
  cliente?: Cliente | null
  items?: VentaItem[]
  pagos?: Pago[]
  saldoPendiente?: number
}

// ─── Pago (abono a venta) ───────────────────────────────────────────────────
export interface Pago {
  id: string
  ventaId: string
  monto: number // Pesos (legacy/default)
  montoARS: number
  montoUSD: number
  fecha: string
}

// ─── Pedido de Encargo ──────────────────────────────────────────────────────
export interface PedidoEncargo {
  id: string
  clienteId: string
  perfumeNombre: string
  estado: string
  fecha: string
  cliente?: Cliente
}

// ─── Gasto ──────────────────────────────────────────────────────────────────
export interface Gasto {
  id: string
  descripcion: string
  monto: number // Pesos (legacy/default)
  montoARS: number
  montoUSD: number
  fecha: string
  categoria: string
}

// ─── Saldo de cliente ───────────────────────────────────────────────────────
export interface ClienteSaldo {
  cliente: Cliente
  totalVentas: number
  totalPagos: number
  saldoPendiente: number
}

// ─── Tipos legacy (compatibilidad durante transición) ───────────────────────
export interface StockItem {
  id: string
  perfume: string
  marca: string
  costoDolares: number
  cantidad: number
  precioSugerido: number
  imagen: string | null
}

export interface SaleItem {
  id: string
  fecha: string
  perfume: string
  marca: string
  cantidad: number
  valorVenta: number
  costo: number
  descripcion: string
}
