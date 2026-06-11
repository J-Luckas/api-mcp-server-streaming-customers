import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { faker } from '@faker-js/faker';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const CUSTOMERS_DB = path.join(DATA_DIR, 'customers.db');
const MOVIES_DB = path.join(DATA_DIR, 'movies.db');
const LOGS_DB = path.join(DATA_DIR, 'logs.db');

const CUSTOMER_COUNT = 50;
const CATEGORY_COUNT = 3;
const MOVIE_COUNT = 15;
const WISHLIST_COUNT = 20;

function openDatabase(filePath) {
  return new Database(filePath);
}

function run(db, sql, params = []) {
  const result = db.prepare(sql).run(...params);
  return {
    lastID: Number(result.lastInsertRowid),
    changes: result.changes,
  };
}

function exec(db, sql) {
  db.exec(sql);
}

function close(db) {
  db.close();
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomPastDate(daysAgoMax = 365) {
  const date = faker.date.past({ years: 1 });
  if (daysAgoMax < 365) {
    const ms = faker.number.int({ min: 0, max: daysAgoMax * 24 * 60 * 60 * 1000 });
    return new Date(Date.now() - ms);
  }
  return date;
}

function setupCustomersDb() {
  if (fs.existsSync(CUSTOMERS_DB)) fs.unlinkSync(CUSTOMERS_DB);

  const db = openDatabase(CUSTOMERS_DB);

  exec(
    db,
    `
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      document TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      lastLogin TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `
  );

  const insertSql = `
    INSERT INTO customers (name, document, email, password, lastLogin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  for (let i = 0; i < CUSTOMER_COUNT; i += 1) {
    const createdAt = randomPastDate(180).toISOString();
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() }).toISOString();
    const hasLoggedIn = faker.datatype.boolean({ probability: 0.85 });
    const lastLogin = hasLoggedIn
      ? faker.date.between({ from: createdAt, to: new Date() }).toISOString()
      : null;

    run(db, insertSql, [
      faker.person.fullName(),
      faker.string.numeric(11),
      faker.internet.email().toLowerCase(),
      faker.internet.password({ length: 12 }),
      lastLogin,
      createdAt,
      updatedAt,
    ]);
  }

  close(db);
  console.log(`customers.db: ${CUSTOMER_COUNT} customers seeded.`);
}

function setupMoviesDb(customerIds) {
  if (fs.existsSync(MOVIES_DB)) fs.unlinkSync(MOVIES_DB);

  const db = openDatabase(MOVIES_DB);

  exec(
    db,
    `
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE customer_wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (customer_id, movie_id)
    );
  `
  );

  const categoryNames = ['Ação', 'Comédia', 'Drama'];
  const categoryIds = [];

  for (const name of categoryNames.slice(0, CATEGORY_COUNT)) {
    const result = run(db, 'INSERT INTO categories (name) VALUES (?)', [name]);
    categoryIds.push(result.lastID);
  }

  const movieIds = [];
  const usedSlugs = new Set();

  for (let i = 0; i < MOVIE_COUNT; i += 1) {
    const name = faker.music.songName();
    let slug = slugify(name);
    let suffix = 1;
    while (usedSlugs.has(slug)) {
      slug = `${slugify(name)}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    const categoryId = faker.helpers.arrayElement(categoryIds);
    const result = run(db, `
      INSERT INTO movies (name, slug, description, category_id)
      VALUES (?, ?, ?, ?)
    `, [name, slug, faker.lorem.paragraph({ min: 2, max: 4 }), categoryId]);

    movieIds.push(result.lastID);
  }

  const wishlistPairs = new Set();
  let inserted = 0;

  while (inserted < WISHLIST_COUNT) {
    const customerId = faker.helpers.arrayElement(customerIds);
    const movieId = faker.helpers.arrayElement(movieIds);
    const key = `${customerId}:${movieId}`;

    if (wishlistPairs.has(key)) continue;
    wishlistPairs.add(key);

    const createdAt = randomPastDate(90).toISOString();
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() }).toISOString();

    run(
      db,
      `
      INSERT INTO customer_wishlist (customer_id, movie_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `,
      [customerId, movieId, createdAt, updatedAt]
    );

    inserted += 1;
  }

  close(db);
  console.log(
    `movies.db: ${CATEGORY_COUNT} categories, ${MOVIE_COUNT} movies, ${WISHLIST_COUNT} wishlist items seeded.`
  );
}

function setupLogsDb() {
  if (fs.existsSync(LOGS_DB)) fs.unlinkSync(LOGS_DB);

  const db = openDatabase(LOGS_DB);
  exec(db, `
    CREATE TABLE logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  close(db);
}

function getCustomerIds() {
  const db = openDatabase(CUSTOMERS_DB);
  const rows = db.prepare('SELECT id FROM customers ORDER BY id').all();
  close(db);
  return rows.map((row) => row.id);
}

function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('Seeding databases...');
  setupCustomersDb();
  const customerIds = getCustomerIds();
  setupMoviesDb(customerIds);
  setupLogsDb();
  console.log('Done.');
  console.log(`  ${CUSTOMERS_DB}`);
  console.log(`  ${MOVIES_DB}`);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
