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

    const existing = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

    db.prepare('UPDATE clientes SET nombre = ?, contacto = ? WHERE id = ?')
      .run(body.nombre, body.contacto ?? null, id);

    return NextResponse.json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(id));
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar cliente', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const existing = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

    db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar cliente', details: error.message }, { status: 500 });
  }
}
