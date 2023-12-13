const sqlite3 = require('sqlite3').verbose();

// Connect to the SQLite database
const db = new sqlite3.Database('./mydb.sqlite3', (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

  

// Insert a test email
db.run('INSERT INTO users (email, username) VALUES (?, ?)', ['test@example.com', 'testuser'], function(err) {
  if (err) {
    return console.error('Error inserting test data:', err.message);
  }
  console.log(`A row has been inserted with rowid ${this.lastID}`);

  // Query back the inserted email
  db.get('SELECT email FROM users WHERE email = ?', ['test@example.com'], (err, row) => {
    if (err) {
      return console.error('Error fetching data:', err.message);
    }
    if (row) {
      console.log(`Retrieved email: ${row.email}`);
    } else {
      console.log('Email not found');
    }

    // Close the database connection
    db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Closed the database connection.');
    });
  });
});
