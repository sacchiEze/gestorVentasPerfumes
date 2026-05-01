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
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT * FROM perfumes WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Perfume no encontrado' }, { status: 404 });
    }

    db.prepare(`
      UPDATE perfumes
      SET marca = ?, nombre = ?, 
          precioCosto = ?, precioVenta = ?,
          precioCostoARS = ?, precioVentaARS = ?,
          precioCostoUSD = ?, precioVentaUSD = ?,
          stock = ?, fotoUrl = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      body.marca,
      body.nombre,
      body.precioCostoARS ?? 0,
      body.precioVentaARS ?? 0,
      body.precioCostoARS ?? 0,
      body.precioVentaARS ?? 0,
      body.precioCostoUSD ?? 0,
      body.precioVentaUSD ?? 0,
      body.stock,
      body.fotoUrl ?? null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM perfumes WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating perfume:', error);
    return NextResponse.json({ error: 'Error al actualizar perfume', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const existing = db.prepare('SELECT * FROM perfumes WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Perfume no encontrado' }, { status: 404 });
    }

    db.prepare('DELETE FROM perfumes WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting perfume:', error);
    return NextResponse.json({ error: 'Error al eliminar perfume', details: error.message }, { status: 500 });
  }
}
