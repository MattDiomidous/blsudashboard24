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




// Create a table if it doesn't exist
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, username TEXT, subject TEXT DEFAULT "Mathematics")');
});

const app = express();
app.use(auth(config));

// Middleware to add the user's email and username to the database if they're logged in
app.use((req, res, next) => {
  if (req.oidc.isAuthenticated()) {
    const email = req.oidc.user.email;
    const username = req.oidc.user.nickname;
    const subject = 'Mathematics'; // Set the subject to "Mathematics" for all users

    db.run('INSERT OR IGNORE INTO users (email, username, subject) VALUES (?, ?, ?)', [email, username, subject], function(err) {
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
    // Assuming the 'users' table now has a 'subject' column
    db.get('SELECT email, subject FROM users WHERE email = ?', [req.oidc.user.email], (err, row) => {
      if (err) {
        res.send('Error fetching profile information');
        return console.error(err.message);
      }
      if(row) {
          // Send both the email and the subject as a JSON object
          res.json({ email: row.email, subject: row.subject });
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
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
        res.status(500).send("Error fetching tutors: " + err.message);
        return;
    }
    res.json(rows);
  });
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

