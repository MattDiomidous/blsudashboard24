require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const { auth } = require('express-openid-connect');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const path = require('path');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const app = express();
app.use(auth(config));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

app.use(async (req, res, next) => {
  if (req.oidc.isAuthenticated()) {
    const email = req.oidc.user.email;
    const username = req.oidc.user.nickname;
    
    // Set default values for new user
    const accountType = 'Guest'; // Default account type is 'Guest'
    const subject = null; // Default is NULL
    const dayAvailable = null; // Default is NULL
    const timeAvailable = null; // Default is NULL

    // Include account_type in the INSERT statement
    try {
      await pool.execute(
        `INSERT INTO users (email, username, subject, day_available, time_available, account_type)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         email = VALUES(email), username = VALUES(username), account_type = IF(account_type IS NULL, VALUES(account_type), account_type)`,
        [email, username, subject, dayAvailable, timeAvailable, accountType]
      );
    } catch (err) {
    }
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

app.get('/logout', (req, res) => {
  req.oidc.logout({
    returnTo: config.baseURL,
  });
});

// Profile route to fetch user info from the database
app.get('/profile', async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    try {
      const email = req.oidc.user.email;
      const connection = await pool.getConnection();
      const [rows] = await connection.execute('SELECT email, subject, day_available, time_available, account_type FROM users WHERE email = ?', [email]);
      connection.release();

      if (rows.length > 0) {
        // Send the email, subject, day_available, time_available, and account_type as a JSON object
        res.json(rows[0]);
      } else {
        res.send('Profile not found');
      }
    } catch (err) {
      console.error(err.message);
      res.send('Error fetching profile information');
    }
  } else {
    res.send('User not logged in');
  }
});

// IDK TESTING THEIHFSLKFD
app.get('/subpages/hhm.html', async (req, res) => {
  try {
    let htmlContent = await fs.readFile('./subpages/hhm.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/subpages/account.html', async (req, res) => {
  try {
    let htmlContent = await fs.readFile('./subpages/account.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/subpages/tutoring.html', async (req, res) => {
  try {
    let htmlContent = await fs.readFile('./subpages/tutoring.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/subpages/material.html', async (req, res) => {
  try {
    let htmlContent = await fs.readFile('./subpages/material.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/subpages/blog.html', async (req, res) => {
  try {
      // Read the content of the HTML file
      let htmlContent = await fs.readFile('./subpages/blog.html', 'utf8');

      // Set authentication status based on req.oidc.isAuthenticated()
      const isAuthenticated = req.oidc.isAuthenticated();
    if (req.oidc.isAuthenticated()) {  
      const email = req.oidc.user.email;
      htmlContent = htmlContent.replace('{{userEmail}}', isAuthenticated ? email : 'You are not logged in.');
    }

    else {
      htmlContent = htmlContent.replace('{{userEmail}}', isAuthenticated ? ' ' : 'You are not logged in.');
    }

    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).send("Error fetching users: " + err.message);
  }
});


app.get('/announcements', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements');
    const array = [];
    for (let index = 0; index < rows.length; index++) { 
      array.push([rows[index].title, rows[index].content, rows[index].date]);
    }
    res.json({ array_one: array });
  } catch (err) {
    console.error('Error fetching announcements:', err.message);
    res.status(500).send('Error fetching announcements');
  }
});

app.get('/reset-announcements', async (req, res) => {
  try {
    // Delete all data from the table
    await pool.query('DELETE FROM announcements');
    // Reset the auto-increment counter to 1
    await pool.query('ALTER TABLE announcements AUTO_INCREMENT = 1');
    res.send("All announcements have been deleted and ID reset.");
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send("An error occurred with the database");
  }
});

app.delete('/delete-announcement/:id', async (req, res) => {
  const announcementId = parseInt(req.params.id.substring(1));
  try {
      await pool.query(`DELETE FROM announcements WHERE id= (?)`, [announcementId]);
      await pool.query(`UPDATE announcements SET id = id - 1 WHERE id > (?)`, [announcementId]);
  
  } catch (err) {
      console.log('Database error:', err);
  }
});


app.post('/add-announcements', async (req, res) => {
    const { title, content } = req.body;
    const [row] = await pool.query('SELECT * FROM announcements');
    const l = row.length;
    try {
      await pool.query(`INSERT INTO announcements (title, content, date) VALUES (?, ?, ?)`, [title, content, new Date()]);
      const [rows] = await pool.query('SELECT * FROM announcements');
      if (rows.length>l) {
        res.json({ message: 'Annoucement successful' });
      } else {
        res.json({ message: 'Error with annoucement' });
      }
    } catch (err) {
      res.json({ message: 'Uh oh' });
  } 
});

app.get('/tutors', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE account_type = 'Tutor'");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching tutors:", err.message);
    res.status(500).send("Error fetching tutors: " + err.message);
  }
});

app.post('/setPreferences', async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    const { subject, day, time } = req.body;
    const email = req.oidc.user.email;

    try {
      const [result] = await pool.query('UPDATE users SET subject = ?, day_available = ?, time_available = ? WHERE email = ?', [subject, day, time, email]);
      if (result.affectedRows > 0) {
        res.json({ message: 'Preferences updated successfully' });
      } else {
        res.json({ message: 'No changes made or user not found' });
      }
    } catch (err) {
      console.error('Error updating preferences:', err.message);
      res.json({ message: 'Error updating preferences' });
    }
  } else {
    res.json({ message: 'User not logged in' });
  }
});

app.get('/accountType', async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    const email = req.oidc.user.email;

    try {
      const [rows] = await pool.query('SELECT account_type FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
        res.json({ account_type: rows[0].account_type });
      } else {
        res.json({ account_type: null });
      }
    } catch (err) {
      console.error('Error fetching account type:', err.message);
      res.status(500).send('Error fetching account type');
    }
  } else {
    res.json({ account_type: null });
  }
});

app.get('/loginStatus', (req, res) => {
  res.json({ isAuthenticated: req.oidc.isAuthenticated() });
});

app.get('/subpages/admin.html', async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    const email = req.oidc.user.email;

    try {
      const [rows] = await pool.query('SELECT account_type FROM users WHERE email = ?', [email]);
      if (rows.length > 0 && rows[0].account_type === 'Admin') {
        const adminFilePath = path.join(__dirname, 'subpages/admin.html'); // Correctly resolve the file path
        const htmlContent = await fs.readFile(adminFilePath, 'utf8');
        res.send(htmlContent);
      } else {
        // Not an admin or not found
        res.send('Access Denied: You do not have permission to view this page.');
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    // User not authenticated
    res.redirect('/login');
  }
});

app.get('/api/users', async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    const email = req.oidc.user.email;
    try {
      const [adminCheck] = await pool.query('SELECT account_type FROM users WHERE email = ?', [email]);
      if (adminCheck.length > 0 && adminCheck[0].account_type === 'Admin') {
        const [users] = await pool.query("SELECT * FROM users");
        res.json(users);
      } else {
        res.status(403).send('Access Denied');
      }
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.delete('/api/deleteUser/:email', async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    const adminEmail = req.oidc.user.email;
    try {
      const [adminCheck] = await pool.query('SELECT account_type FROM users WHERE email = ?', [adminEmail]);
      if (adminCheck.length > 0 && adminCheck[0].account_type === 'Admin') {
        const emailToDelete = req.params.email;
        const [result] = await pool.query('DELETE FROM users WHERE email = ?', [emailToDelete]);
        if (result.affectedRows > 0) {
          res.json({ success: true, message: 'User deleted' });
        } else {
          res.status(404).send('User not found');
        }
      } else {
        res.status(403).send('Access Denied');
      }
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/signups', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM signups");
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send("Error fetching signups");
  }
});

app.post('/signup', async (req, res) => {
  const { name, email, phone, notes } = req.body;
  try {
    const [result] = await pool.query(`INSERT INTO signups (name, email, phone, notes) VALUES (?, ?, ?, ?)`, [name, email, phone, notes]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Successfully signed up' });
    } else {
      res.status(400).send('Signup failed');
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Error saving to database', error: err.message });
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }

  const { originalname, path, mimetype, size } = req.file;

  try {
    const [result] = await pool.query(`INSERT INTO materials (originalName, filePath, mimeType, size) VALUES (?, ?, ?, ?)`, [originalname, path, mimetype, size]);
    if (result.affectedRows > 0) {
      res.send('File uploaded and saved successfully');
    } else {
      res.status(400).send('Error saving file information');
    }
  } catch (err) {
    console.error('Error saving file metadata:', err);
    res.status(500).send('Error saving file information');
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM materials");
    res.json(rows);
  } catch (err) {
    console.error('Error fetching materials:', err);
    res.status(500).send("Error fetching materials");
  }
});

app.post('/api/updateUserType', async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // Check if the user is an admin
    const adminEmail = req.oidc.user.email;
    const [adminCheck] = await pool.query('SELECT account_type FROM users WHERE email = ?', [adminEmail]);
    if (adminCheck.length > 0 && adminCheck[0].account_type === 'Admin') {
      const { email, newType } = req.body;
      const [result] = await pool.query('UPDATE users SET account_type = ? WHERE email = ?', [newType, email]);
      if (result.affectedRows > 0) {
        res.json({ success: true, message: 'Account type updated successfully' });
      } else {
        res.status(404).send('User not found');
      }
    } else {
      res.status(403).send('Access Denied');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.delete('/delete-file', (req, res) => {
  const { filename } = req.body; // Extract filename from request body
  console.log('Attempting to delete file:', filename); // Debugging line


  if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename is required' });
  }

  const filePath = path.join(__dirname, 'uploads', filename); // Adjust the path as necessary

  // Check if file exists and delete
  fs.unlink(filePath, (err) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ success: false, message: 'Failed to delete the file' });
      }
      res.json({ success: true, message: 'File deleted successfully' });
  });
});



// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});