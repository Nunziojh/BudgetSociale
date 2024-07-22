'use strict';

/* Data Access Object (DAO) module for accessing users data */

import db from './db.mjs';
import crypto from 'crypto';

// This function returns user's information given its id.
export const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM Users WHERE id=?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        // By default, the local strategy looks for "username": 
        // for simplicity, instead of using "email", we create an object with that property.
        const user = { id: row.id, username: row.email, name: row.name, role: row.role }
        resolve(user);
      }
    });
  });
};

// This function is used at log-in time to verify username and password.
export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email=?';
      db.get(sql, [username], (err, row) => {
          if (err) { // database error
              reject(err);
          } else {
              if (!row) { // non-existent user
                  reject('Invalid username or password');
              } else {
                  crypto.scrypt(password, row.salt, 64, (err, computed_hash) => {
                      if (err) { // key derivation fails
                          reject(err);
                      } else {
                          const equal = crypto.timingSafeEqual(computed_hash, Buffer.from(row.hash, 'hex'));
                          if (equal) { // password ok
                              resolve(row);
                          } else { // password doesn't match
                              reject('Invalid username or password');
                          }
                      }
                  });
              }
          }
      });
  });
}

export default {
  getUserById,
  getUser
};