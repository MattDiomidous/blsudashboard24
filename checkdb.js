const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mydb.sqlite3', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

// The serialize method ensures that the queries are executed in sequence
db.serialize(() => {
  // This is where you insert the db.each function to iterate over each row in the users table
  db.each('SELECT * FROM users', (err, row) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      return;
    }
    console.log(row); // This will log each row to the console
  });
});

// Close the database connection after all queries are done
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  }
  console.log('Closed the database connection.');
});
