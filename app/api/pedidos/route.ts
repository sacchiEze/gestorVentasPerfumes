import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const pedidos = db.prepare(`
      SELECT pe.*, c.nombre as clienteNombre, c.contacto as clienteContacto
      FROM pedidos_encargo pe
      JOIN clientes c ON pe.clienteId = c.id
      ORDER BY pe.fecha DESC
    `).all() as any[];

    return NextResponse.json(pedidos.map(p => ({
      ...p,
      cliente: { id: p.clienteId, nombre: p.clienteNombre, contacto: p.clienteContacto },
    })));
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener pedidos', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    if (!body.clienteId || !body.perfumeNombre?.trim()) {
      return NextResponse.json({ error: 'clienteId y perfumeNombre son requeridos' }, { status: 400 });
    }

    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(body.clienteId);
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO pedidos_encargo (id, clienteId, perfumeNombre, estado, fecha)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, body.clienteId, body.perfumeNombre.trim(), body.estado ?? 'pendiente', now);

    const pedido = db.prepare(`
      SELECT pe.*, c.nombre as clienteNombre, c.contacto as clienteContacto
      FROM pedidos_encargo pe JOIN clientes c ON pe.clienteId = c.id
      WHERE pe.id = ?
    `).get(id) as any;

    return NextResponse.json({
      ...pedido,
      cliente: { id: pedido.clienteId, nombre: pedido.clienteNombre, contacto: pedido.clienteContacto },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear pedido', details: error.message }, { status: 500 });
  }
}
