import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const ventaId = searchParams.get('ventaId');

    const pagos = ventaId
      ? db.prepare('SELECT * FROM pagos WHERE ventaId = ? ORDER BY fecha DESC').all(ventaId)
      : db.prepare('SELECT * FROM pagos ORDER BY fecha DESC').all();

    return NextResponse.json(pagos);
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener pagos', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    if (!body.ventaId || !body.monto || body.monto <= 0) {
      return NextResponse.json({ error: 'ventaId y monto (> 0) son requeridos' }, { status: 400 });
    }

    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(body.ventaId) as any;
    if (!venta) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });

    const id = uuidv4();
    const now = body.fecha ?? new Date().toISOString();

    const montoARS = body.montoARS ?? body.monto;
    const montoUSD = body.montoUSD ?? 0;

    db.prepare('INSERT INTO pagos (id, ventaId, monto, montoARS, montoUSD, fecha) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, body.ventaId, montoARS, montoARS, montoUSD, now);

    const pago = db.prepare('SELECT * FROM pagos WHERE id = ?').get(id);
    return NextResponse.json(pago, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al registrar pago', details: error.message }, { status: 500 });
  }
}
