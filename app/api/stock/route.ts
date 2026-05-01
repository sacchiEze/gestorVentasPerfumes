import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const perfumes = db.prepare('SELECT * FROM perfumes ORDER BY nombre ASC').all();
    return NextResponse.json(perfumes);
  } catch (error: any) {
    console.error('Error fetching perfumes:', error);
    return NextResponse.json({ error: 'Error al obtener perfumes', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const id = uuidv4();
    const now = new Date().toISOString();
    const createdAt = body.createdAt ? new Date(body.createdAt).toISOString() : now;

    db.prepare(`
      INSERT INTO perfumes (
        id, marca, nombre, precioCosto, precioVenta, 
        precioCostoARS, precioVentaARS, precioCostoUSD, precioVentaUSD,
        stock, fotoUrl, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.marca,
      body.nombre,
      body.precioCostoARS ?? 0, // precioCosto (legacy) will match ARS
      body.precioVentaARS ?? 0, // precioVenta (legacy) will match ARS
      body.precioCostoARS ?? 0,
      body.precioVentaARS ?? 0,
      body.precioCostoUSD ?? 0,
      body.precioVentaUSD ?? 0,
      body.stock ?? 0,
      body.fotoUrl ?? null,
      createdAt,
      now
    );

    const newItem = db.prepare('SELECT * FROM perfumes WHERE id = ?').get(id);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating perfume:', error);
    return NextResponse.json({ error: 'Error al crear perfume', details: error.message }, { status: 500 });
  }
}
