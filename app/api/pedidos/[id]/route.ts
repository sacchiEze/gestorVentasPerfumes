import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const ESTADOS = ['pendiente', 'pedido', 'recibido', 'entregado'];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const existing = db.prepare('SELECT * FROM pedidos_encargo WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

    if (body.estado && !ESTADOS.includes(body.estado)) {
      return NextResponse.json({ error: `Estado inválido. Opciones: ${ESTADOS.join(', ')}` }, { status: 400 });
    }

    db.prepare(`
      UPDATE pedidos_encargo SET perfumeNombre = ?, estado = ?, clienteId = ? WHERE id = ?
    `).run(body.perfumeNombre, body.estado, body.clienteId, id);

    const updated = db.prepare(`
      SELECT pe.*, c.nombre as clienteNombre, c.contacto as clienteContacto
      FROM pedidos_encargo pe JOIN clientes c ON pe.clienteId = c.id
      WHERE pe.id = ?
    `).get(id) as any;

    return NextResponse.json({
      ...updated,
      cliente: { id: updated.clienteId, nombre: updated.clienteNombre, contacto: updated.clienteContacto },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar pedido', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const existing = db.prepare('SELECT * FROM pedidos_encargo WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

    db.prepare('DELETE FROM pedidos_encargo WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar pedido', details: error.message }, { status: 500 });
  }
}
