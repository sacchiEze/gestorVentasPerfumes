import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');

    const gastos = categoria
      ? db.prepare('SELECT * FROM gastos WHERE categoria = ? ORDER BY fecha DESC').all(categoria)
      : db.prepare('SELECT * FROM gastos ORDER BY fecha DESC').all();

    return NextResponse.json(gastos);
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener gastos', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    if (!body.descripcion?.trim() || !body.monto || body.monto <= 0 || !body.categoria?.trim()) {
      return NextResponse.json({ error: 'descripcion, monto (> 0) y categoria son requeridos' }, { status: 400 });
    }

    const id = uuidv4();
    const now = body.fecha ?? new Date().toISOString();
    
    const montoARS = body.montoARS ?? body.monto;
    const montoUSD = body.montoUSD ?? 0;

    db.prepare('INSERT INTO gastos (id, descripcion, monto, montoARS, montoUSD, fecha, categoria) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, body.descripcion.trim(), montoARS, montoARS, montoUSD, now, body.categoria.trim());

    return NextResponse.json(db.prepare('SELECT * FROM gastos WHERE id = ?').get(id), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear gasto', details: error.message }, { status: 500 });
  }
}
