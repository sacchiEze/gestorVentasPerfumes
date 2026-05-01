import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET — Listar ventas con sus items y cliente
export async function GET() {
  try {
    const db = getDb();

    const ventas = db.prepare(`
      SELECT v.*, c.nombre as clienteNombre, c.contacto as clienteContacto
      FROM ventas v
      LEFT JOIN clientes c ON v.clienteId = c.id
      ORDER BY v.fecha DESC
    `).all() as any[];

    const ventasConItems = ventas.map((v) => {
      const items = db.prepare(`
        SELECT vi.*, p.nombre as perfumeNombre, p.marca as perfumeMarca, p.fotoUrl
        FROM venta_items vi
        JOIN perfumes p ON vi.perfumeId = p.id
        WHERE vi.ventaId = ?
      `).all(v.id) as any[];

      const pagos = db.prepare(
        'SELECT * FROM pagos WHERE ventaId = ? ORDER BY fecha DESC'
      ).all(v.id);

      const totalPagado = (pagos as any[]).reduce((sum: number, p: any) => sum + p.monto, 0);

      return {
        id: v.id,
        fecha: v.fecha,
        total: v.total,
        saldoPendiente: Math.max(0, v.total - totalPagado),
        cliente: v.clienteId ? {
          id: v.clienteId,
          nombre: v.clienteNombre,
          contacto: v.clienteContacto,
        } : null,
        items,
        pagos,
      };
    });

    return NextResponse.json(ventasConItems);
  } catch (error: any) {
    console.error('Error fetching ventas:', error);
    return NextResponse.json({ error: 'Error al obtener ventas', details: error.message }, { status: 500 });
  }
}

// POST — Registrar venta (descuenta stock automáticamente, en transacción)
export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    // body esperado:
    // { clienteId?: string, items: [{ perfumeId, cantidad, precio }] }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'La venta debe tener al menos un item' }, { status: 400 });
    }

    const ventaId = uuidv4();
    const now = new Date().toISOString();

    // Transacción atómica: crear venta + items + descontar stock
    let result;
    try {
      db.exec('BEGIN');
      // 1. Verificar stock de cada item
      for (const item of body.items) {
        const perfume = db.prepare('SELECT * FROM perfumes WHERE id = ?').get(item.perfumeId) as any;
        if (!perfume) throw new Error(`Perfume con id ${item.perfumeId} no encontrado`);
        if (perfume.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para "${perfume.nombre}". Disponible: ${perfume.stock}, solicitado: ${item.cantidad}`);
        }
      }

      // 2. Calcular totales
      let totalARS = 0;
      let totalUSD = 0;

      for (const item of body.items) {
        totalARS += item.precioARS * item.cantidad;
        totalUSD += item.precioUSD * item.cantidad;
      }

      // 3. Insertar venta
      db.prepare(`
        INSERT INTO ventas (id, clienteId, fecha, total, totalARS, totalUSD)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ventaId, body.clienteId ?? null, now, totalARS, totalARS, totalUSD);

      // 4. Insertar items y descontar stock
      for (const item of body.items) {
        db.prepare(`
          INSERT INTO venta_items (id, ventaId, perfumeId, cantidad, precio, precioARS, precioUSD)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), ventaId, item.perfumeId, item.cantidad, item.precioARS, item.precioARS, item.precioUSD);

        db.prepare(`
          UPDATE perfumes SET stock = stock - ?, updatedAt = ? WHERE id = ?
        `).run(item.cantidad, now, item.perfumeId);
      }

      result = db.prepare(`
        SELECT v.*, c.nombre as clienteNombre
        FROM ventas v LEFT JOIN clientes c ON v.clienteId = c.id
        WHERE v.id = ?
      `).get(ventaId);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    const items = db.prepare(`
      SELECT vi.*, p.nombre as perfumeNombre, p.marca as perfumeMarca
      FROM venta_items vi JOIN perfumes p ON vi.perfumeId = p.id
      WHERE vi.ventaId = ?
    `).all(ventaId);

    return NextResponse.json({ ...result as object, items, pagos: [] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating venta:', error);
    return NextResponse.json({ error: error.message || 'Error al registrar venta' }, { status: 400 });
  }
}
