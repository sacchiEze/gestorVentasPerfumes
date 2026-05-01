import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

// Guardar la DB en la carpeta prisma (donde ya estaba dev.db)
const DB_DIR = path.join(process.cwd(), 'prisma');
const DB_PATH = path.join(DB_DIR, 'dev.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;

  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA journal_mode = WAL');
  _db.exec('PRAGMA foreign_keys = ON');

  initSchema(_db);
  return _db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    -- ── Perfumes (stock) ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS perfumes (
      id             TEXT PRIMARY KEY,
      marca          TEXT NOT NULL,
      nombre         TEXT NOT NULL,
      precioCosto    REAL NOT NULL DEFAULT 0, -- pesos (legacy/default)
      precioVenta    REAL NOT NULL DEFAULT 0, -- pesos (legacy/default)
      precioCostoARS REAL NOT NULL DEFAULT 0,
      precioVentaARS REAL NOT NULL DEFAULT 0,
      precioCostoUSD REAL NOT NULL DEFAULT 0,
      precioVentaUSD REAL NOT NULL DEFAULT 0,
      stock          INTEGER NOT NULL DEFAULT 0,
      fotoUrl        TEXT,
      createdAt      TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Clientes ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS clientes (
      id        TEXT PRIMARY KEY,
      nombre    TEXT NOT NULL,
      contacto  TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Ventas ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ventas (
      id        TEXT PRIMARY KEY,
      clienteId TEXT,
      fecha     TEXT NOT NULL DEFAULT (datetime('now')),
      total     REAL NOT NULL DEFAULT 0, -- pesos (legacy/default)
      totalARS  REAL NOT NULL DEFAULT 0,
      totalUSD  REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (clienteId) REFERENCES clientes(id)
    );

    -- ── Items de venta ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS venta_items (
      id        TEXT PRIMARY KEY,
      ventaId   TEXT NOT NULL,
      perfumeId TEXT NOT NULL,
      cantidad  INTEGER NOT NULL,
      precio    REAL NOT NULL, -- pesos (legacy/default)
      precioARS REAL NOT NULL DEFAULT 0,
      precioUSD REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (ventaId)   REFERENCES ventas(id)   ON DELETE CASCADE,
      FOREIGN KEY (perfumeId) REFERENCES perfumes(id)
    );

    -- ── Pagos (abonos) ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS pagos (
      id       TEXT PRIMARY KEY,
      ventaId  TEXT NOT NULL,
      monto    REAL NOT NULL, -- pesos (legacy/default)
      montoARS REAL NOT NULL DEFAULT 0,
      montoUSD REAL NOT NULL DEFAULT 0,
      fecha    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ventaId) REFERENCES ventas(id) ON DELETE CASCADE
    );

    -- ── Pedidos de encargo ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS pedidos_encargo (
      id            TEXT PRIMARY KEY,
      clienteId     TEXT NOT NULL,
      perfumeNombre TEXT NOT NULL,
      estado        TEXT NOT NULL DEFAULT 'pendiente',
      fecha         TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (clienteId) REFERENCES clientes(id)
    );

    -- ── Gastos ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS gastos (
      id          TEXT PRIMARY KEY,
      descripcion TEXT NOT NULL,
      monto       REAL NOT NULL, -- pesos (legacy/default)
      montoARS    REAL NOT NULL DEFAULT 0,
      montoUSD    REAL NOT NULL DEFAULT 0,
      fecha       TEXT NOT NULL DEFAULT (datetime('now')),
      categoria   TEXT NOT NULL
    );
  `);

  // Migración: Agregar columnas si no existen (SQLite no tiene IF NOT EXISTS en ALTER TABLE)
  const tablesToMigrate = [
    { table: 'perfumes', cols: ['precioCostoARS', 'precioVentaARS', 'precioCostoUSD', 'precioVentaUSD'] },
    { table: 'ventas', cols: ['totalARS', 'totalUSD'] },
    { table: 'venta_items', cols: ['precioARS', 'precioUSD'] },
    { table: 'pagos', cols: ['montoARS', 'montoUSD'] },
    { table: 'gastos', cols: ['montoARS', 'montoUSD'] }
  ];

  for (const t of tablesToMigrate) {
    for (const col of t.cols) {
      try {
        db.exec(`ALTER TABLE ${t.table} ADD COLUMN ${col} REAL NOT NULL DEFAULT 0`);
      } catch (e) {
        // Probablemente ya existe la columna, ignorar
      }
    }
  }
}

export default getDb;
