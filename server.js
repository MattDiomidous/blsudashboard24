require('dotenv').config();
const express = require('express');
const fs = require('fs').promises; 
const { auth } = require('express-openid-connect');
const sqlite3 = require('sqlite3').verbose();

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET, // Environment variable for Auth0 secret
  baseURL: process.env.BASE_URL, // Environment variable for the base URL of the app
  clientID: process.env.AUTH0_CLIENT_ID, // Environment variable for Auth0 client ID
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL, // Environment variable for Auth0 issuer base URL
};


// Set up the database
const db = new sqlite3.Database('./mydb.sqlite3', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});




// Create a table if it doesn't exist with additional columns for day_available and time_available
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, username TEXT, subject TEXT, day_available TEXT, time_available TEXT, account_type TEXT)');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    email TEXT, 
    phone TEXT, 
    notes TEXT
  )`, (err) => {
  if (err) {
    console.error("Error creating 'signups' table:", err.message);
  } else {
    console.log("'signups' table created or already exists");
  }
});

});



const app = express();
app.use(auth(config));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Middleware to add the user's email and username to the database if they're logged in
app.use((req, res, next) => {
  if (req.oidc.isAuthenticated()) {
    const email = req.oidc.user.email;
    const username = req.oidc.user.nickname;
    const subject = 'Mathematics'; // Or fetch this from user input
    const dayAvailable = 'Monday'; // Or fetch this from user input
    const timeAvailable = '5 PM'; // Or fetch this from user input
    const accountType = 'Student'; // Or set this based on user input or some logic

    // Include account_type in the INSERT statement
    db.run('INSERT OR IGNORE INTO users (email, username, subject, day_available, time_available, account_type) VALUES (?, ?, ?, ?, ?, ?)', [email, username, subject, dayAvailable, timeAvailable, accountType], function(err) {
      if (err) {
        console.error('Error inserting user:', err.message);
      } else {
        console.log(`Upserted user: ${email}`);
      }
    });
  }
  next();
});




app.get('/', async (req, res) => {
  try {
      // Read the content of the HTML file
      let htmlContent = await fs.readFile('index.html', 'utf8');

      // Set authentication status based on req.oidc.isAuthenticated()
      const isAuthenticated = req.oidc.isAuthenticated();

      // Replace placeholders in the HTML content
      htmlContent = htmlContent.replace('{{loginStatus}}', isAuthenticated ? '' : 'not ');

      // Send the modified HTML content as the response
      res.send(htmlContent);
  } catch (error) {
      console.error('Error reading HTML file:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.oidc.logout({
    returnTo: config.baseURL,
  });
});

// Profile route to fetch user info from the database
app.get('/profile', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    db.get('SELECT email, subject, day_available, time_available, account_type FROM users WHERE email = ?', [req.oidc.user.email], (err, row) => {
      if (err) {
        res.send('Error fetching profile information');
        return console.error(err.message);
      }
      if(row) {
          // Send the email, subject, day_available, time_available, and account_type as a JSON object
          res.json({ email: row.email, subject: row.subject, day_available: row.day_available, time_available: row.time_available, account_type: row.account_type });
      } else {
          res.send('Profile not found');
      }
    });
  } else {
    res.send('User not logged in');
  }
});



app.get('/hhm.html', async (req, res) => {
  try {
    // Read and send the content of the HTML file
    let htmlContent = await fs.readFile('hhm.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/tutoring.html', async (req, res) => {
  try {
    // Read and send the content of the HTML file
    let htmlContent = await fs.readFile('tutoring.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/material.html', async (req, res) => {
  try {
    // Read and send the content of the HTML file
    let htmlContent = await fs.readFile('material.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/events.html', async (req, res) => {
  try {
    // Read and send the content of the HTML file
    let htmlContent = await fs.readFile('events.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
      if (err) {
          res.status(500).send("Error fetching users: " + err.message);
          return;
      }
      // Send data as JSON (or you can format it as HTML)
      res.json(rows);
  });
});

app.get('/tutors', (req, res) => {
  // Fetch the list of tutors/users from your database or wherever it's stored
  // Return the data as JSON
  db.all("SELECT * FROM users WHERE account_type = 'Tutor'", [], (err, rows) => {
    if (err) {
        res.status(500).send("Error fetching tutors: " + err.message);
        return;
    }
    res.json(rows);
  });
});

app.post('/setPreferences', (req, res) => {
  if (req.oidc.isAuthenticated()) {
      const { subject, day, time } = req.body;
      const email = req.oidc.user.email;

      db.run('UPDATE users SET subject = ?, day_available = ?, time_available = ? WHERE email = ?', [subject, day, time, email], function(err) {
          if (err) {
              res.json({ message: 'Error updating preferences' });
          } else {
              res.json({ message: 'Preferences updated successfully' });
          }
      });
  } else {
      res.json({ message: 'User not logged in' });
  }
});

app.get('/accountType', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    const email = req.oidc.user.email;
    db.get('SELECT account_type FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        res.status(500).send('Error fetching account type');
      } else {
        res.json({ account_type: row ? row.account_type : null });
      }
    });
  } else {
    res.json({ account_type: null });
  }
});

app.get('/admin.html', async (req, res) => {
  try {
    // Read and send the content of the HTML file
    let htmlContent = await fs.readFile('admin.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/users', (req, res) => {
  // Check if the user is authenticated
  if (req.oidc.isAuthenticated()) {
      const email = req.oidc.user.email;

      // Query the database for the user's account type
      db.get('SELECT account_type FROM users WHERE email = ?', [email], (err, row) => {
          if (err) {
              res.status(500).send('Internal Server Error');
          } else if (row && row.account_type === 'Admin') {
              // User is an admin, fetch and send all users' data
              db.all("SELECT * FROM users", [], (err, rows) => {
                  if (err) {
                      res.status(500).send("Error fetching users: " + err.message);
                  } else {
                      res.json(rows);
                  }
              });
          } else {
              // User is not an admin or user not found
              res.status(403).send('Access Denied');
          }
      });
  } else {
      // User is not authenticated
      res.status(401).send('Unauthorized');
  }
});

app.delete('/api/deleteUser/:email', (req, res) => {
  if (req.oidc.isAuthenticated()) {
      const adminEmail = req.oidc.user.email;

      // First, check if the authenticated user is an admin
      db.get('SELECT account_type FROM users WHERE email = ?', [adminEmail], (err, row) => {
          if (err) {
              res.status(500).send('Internal Server Error');
          } else if (row && row.account_type === 'Admin') {
              // Admin confirmed, proceed with deletion
              const emailToDelete = req.params.email;
              db.run('DELETE FROM users WHERE email = ?', [emailToDelete], function(err) {
                  if (err) {
                      res.status(500).json({ success: false, message: 'Internal Server Error' });
                  } else {
                      res.json({ success: true, message: 'User deleted' });
                  }
              });
          } else {
              // User is not an admin
              res.status(403).send('Access Denied');
          }
      });
  } else {
      // User is not authenticated
      res.status(401).send('Unauthorized');
  }
});

app.get('/signups', (req, res) => {
  db.all("SELECT * FROM signups", [], (err, rows) => {
      if (err) {
          res.status(500).send("Error fetching signups: " + err.message);
      } else {
          res.json(rows);
      }
  });
});

app.post('/signup', (req, res) => {
  const { name, email, phone, notes } = req.body;
  const query = `INSERT INTO signups (name, email, phone, notes) VALUES (?, ?, ?, ?)`;

  db.run(query, [name, email, phone, notes], (err) => {
      if (err) {
          console.error('Database error:', err);
          res.status(500).json({ success: false, message: 'Error saving to database', error: err.message });
      } else {
          res.json({ success: true, message: 'Successfully signed up' });
      }
  });
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

