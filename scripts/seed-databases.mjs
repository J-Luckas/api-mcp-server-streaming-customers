import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
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
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isoNow() {
  return new Date().toISOString();
}

function randomPastDate(daysAgoMax = 365) {
  const date = faker.date.past({ years: 1 });
  if (daysAgoMax < 365) {
    const ms = faker.number.int({ min: 0, max: daysAgoMax * 24 * 60 * 60 * 1000 });
    return new Date(Date.now() - ms);
  }
  return date;
}

async function setupCustomersDb() {
  if (fs.existsSync(CUSTOMERS_DB)) fs.unlinkSync(CUSTOMERS_DB);

  const db = await openDatabase(CUSTOMERS_DB);

  await exec(
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

    await run(db, insertSql, [
      faker.person.fullName(),
      faker.string.numeric(11),
      faker.internet.email().toLowerCase(),
      faker.internet.password({ length: 12 }),
      lastLogin,
      createdAt,
      updatedAt,
    ]);
  }

  await close(db);
  console.log(`customers.db: ${CUSTOMER_COUNT} customers seeded.`);
}

async function setupMoviesDb(customerIds) {
  if (fs.existsSync(MOVIES_DB)) fs.unlinkSync(MOVIES_DB);

  const db = await openDatabase(MOVIES_DB);

  await exec(
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
    const result = await run(db, 'INSERT INTO categories (name) VALUES (?)', [name]);
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
    const result = await run(db, `
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

    await run(
      db,
      `
      INSERT INTO customer_wishlist (customer_id, movie_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `,
      [customerId, movieId, createdAt, updatedAt]
    );

    inserted += 1;
  }

  await close(db);
  console.log(
    `movies.db: ${CATEGORY_COUNT} categories, ${MOVIE_COUNT} movies, ${WISHLIST_COUNT} wishlist items seeded.`
  );
}

 async function setupLogsDb() {
  if (fs.existsSync(LOGS_DB)) fs.unlinkSync(LOGS_DB);

  const db = await openDatabase(LOGS_DB);
  await exec(db, `
    CREATE TABLE logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
 }

async function getCustomerIds() {
  const db = await openDatabase(CUSTOMERS_DB);
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT id FROM customers ORDER BY id', [], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
  await close(db);
  return rows.map((row) => row.id);
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('Seeding databases...');
  await setupCustomersDb();
  const customerIds = await getCustomerIds();
  await setupMoviesDb(customerIds);
  await setupLogsDb();
  console.log('Done.');
  console.log(`  ${CUSTOMERS_DB}`);
  console.log(`  ${MOVIES_DB}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
