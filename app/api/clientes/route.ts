import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const clientes = db.prepare('SELECT * FROM clientes ORDER BY nombre ASC').all();
    return NextResponse.json(clientes);
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener clientes', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    if (!body.nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO clientes (id, nombre, contacto, createdAt) VALUES (?, ?, ?, ?)
    `).run(id, body.nombre.trim(), body.contacto?.trim() ?? null, now);

    const newCliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    return NextResponse.json(newCliente, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear cliente', details: error.message }, { status: 500 });
  }
}
