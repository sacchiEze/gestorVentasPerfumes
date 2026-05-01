import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const existing = db.prepare('SELECT * FROM gastos WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });

    db.prepare('UPDATE gastos SET descripcion = ?, monto = ?, fecha = ?, categoria = ? WHERE id = ?')
      .run(body.descripcion, body.monto, body.fecha, body.categoria, id);

    return NextResponse.json(db.prepare('SELECT * FROM gastos WHERE id = ?').get(id));
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar gasto', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const existing = db.prepare('SELECT * FROM gastos WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });

    db.prepare('DELETE FROM gastos WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar gasto', details: error.message }, { status: 500 });
  }
}
