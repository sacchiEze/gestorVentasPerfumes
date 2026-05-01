import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET — Saldo pendiente de un cliente: total ventas - suma de pagos
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

    const ventas = db.prepare('SELECT * FROM ventas WHERE clienteId = ?').all(id) as any[];

    const totalVentas = ventas.reduce((sum: number, v: any) => sum + v.total, 0);

    const ventaIds = ventas.map((v: any) => v.id);
    let totalPagos = 0;

    if (ventaIds.length > 0) {
      const placeholders = ventaIds.map(() => '?').join(',');
      const pagos = db.prepare(
        `SELECT SUM(monto) as total FROM pagos WHERE ventaId IN (${placeholders})`
      ).get(...ventaIds) as any;
      totalPagos = pagos?.total ?? 0;
    }

    const saldoPendiente = Math.max(0, totalVentas - totalPagos);

    return NextResponse.json({
      cliente,
      totalVentas,
      totalPagos,
      saldoPendiente,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al calcular saldo', details: error.message }, { status: 500 });
  }
}
