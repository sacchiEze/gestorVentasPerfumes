import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// PUT — Editar cliente de una venta o ajustar total manualmente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const existing = db.prepare('SELECT * FROM ventas WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    db.prepare(`
      UPDATE ventas SET clienteId = ?, total = ? WHERE id = ?
    `).run(body.clienteId ?? null, body.total, id);

    const updated = db.prepare(`
      SELECT v.*, c.nombre as clienteNombre, c.contacto as clienteContacto
      FROM ventas v LEFT JOIN clientes c ON v.clienteId = c.id
      WHERE v.id = ?
    `).get(id) as any;

    const items = db.prepare(`
      SELECT vi.*, p.nombre as perfumeNombre, p.marca as perfumeMarca
      FROM venta_items vi JOIN perfumes p ON vi.perfumeId = p.id
      WHERE vi.ventaId = ?
    `).all(id);

    const pagos = db.prepare('SELECT * FROM pagos WHERE ventaId = ?').all(id);
    const totalPagado = (pagos as any[]).reduce((s: number, p: any) => s + p.monto, 0);

    return NextResponse.json({
      ...updated,
      cliente: updated.clienteId ? { id: updated.clienteId, nombre: updated.clienteNombre, contacto: updated.clienteContacto } : null,
      items,
      pagos,
      saldoPendiente: Math.max(0, updated.total - totalPagado),
    });
  } catch (error: any) {
    console.error('Error updating venta:', error);
    return NextResponse.json({ error: 'Error al actualizar venta', details: error.message }, { status: 500 });
  }
}

// DELETE — Eliminar venta (restaura stock de los items)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const existing = db.prepare('SELECT * FROM ventas WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    try {
      db.exec('BEGIN');
      // Restaurar stock antes de borrar
      const items = db.prepare('SELECT * FROM venta_items WHERE ventaId = ?').all(id) as any[];
      const now = new Date().toISOString();
      for (const item of items) {
        db.prepare('UPDATE perfumes SET stock = stock + ?, updatedAt = ? WHERE id = ?')
          .run(item.cantidad, now, item.perfumeId);
      }
      db.prepare('DELETE FROM ventas WHERE id = ?').run(id);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting venta:', error);
    return NextResponse.json({ error: 'Error al eliminar venta', details: error.message }, { status: 500 });
  }
}
