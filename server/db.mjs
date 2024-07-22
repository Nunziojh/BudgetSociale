import sqlite from 'sqlite3';

// open the database
const db = new sqlite.Database('budget_sociale.SQLite', (err) => {
  if (err) throw err;
});

export default db;