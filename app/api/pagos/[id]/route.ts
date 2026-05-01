import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const existing = db.prepare('SELECT * FROM pagos WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });

    db.prepare('DELETE FROM pagos WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar pago', details: error.message }, { status: 500 });
  }
}
