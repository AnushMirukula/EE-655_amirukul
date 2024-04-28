require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Database configuration
const config = {
  user: process.env.DbUsername,
  password: process.env.DbUserPassword,
  server: process.env.DbServerName,
  database: process.env.DbName,
  options: {
    encrypt: true, // Use encryption
    enableArithAbort: true // Enable ArithAbort
  }
};

// Function to handle database connection errors
const handleDatabaseError = (error, res) => {
  console.error('Database error:', error);
  res.status(500).json({ error: 'Database error' });
};

// Connect to the database
sql.connect(config)
  .then(() => console.log('Database connection successful'))
  .catch(err => {
    console.error('Error connecting to database:', err);
    process.exit(1); // Exit the process if database connection fails
  });

// Create a new product
app.post('/products', async (req, res) => {
  const { ID, name, price, quantity } = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('ID', sql.Int, ID)
      .input('name', sql.VarChar(50), name)
      .input('price', sql.Decimal(10, 2), price)
      .input('quantity', sql.Int, quantity)
      .query('INSERT INTO PRODUCTLIST (ID, NAME, PRICE, QUANTITY) VALUES (@ID, @name, @price, @quantity);');

    const newProduct = { ID, name, price, quantity };
    res.status(201).json(newProduct);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Retrieve all products with optional filtering
app.get('/products', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    let query = 'SELECT * FROM PRODUCTLIST';

    // Check for query parameters
    const { minPrice, maxPrice, minQuantity, maxQuantity } = req.query;
    const params = [];
    if (minPrice !== undefined) {
      query += ' WHERE PRICE >= @minPrice';
      params.push({ name: 'minPrice', type: sql.Decimal(10, 2), value: minPrice });
    }
    if (maxPrice !== undefined) {
      if (params.length === 0) query += ' WHERE';
      else query += ' AND';
      query += ' PRICE <= @maxPrice';
      params.push({ name: 'maxPrice', type: sql.Decimal(10, 2), value: maxPrice });
    }
    if (minQuantity !== undefined) {
      if (params.length === 0) query += ' WHERE';
      else query += ' AND';
      query += ' QUANTITY >= @minQuantity';
      params.push({ name: 'minQuantity', type: sql.Int, value: minQuantity });
    }
    if (maxQuantity !== undefined) {
      if (params.length === 0) query += ' WHERE';
      else query += ' AND';
      query += ' QUANTITY <= @maxQuantity';
      params.push({ name: 'maxQuantity', type: sql.Int, value: maxQuantity });
    }

    const request = pool.request();
    // Add parameters to the request
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    // Execute the query
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Retrieve a single product by ID
app.get('/products/:ID', async (req, res) => {
  const { ID } = req.params;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ID', sql.Int, ID)
      .query('SELECT * FROM PRODUCTLIST WHERE ID = @ID');

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(result.recordset[0]);
    }
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Update a product by ID
app.put('/products/:ID', async (req, res) => {
  const { ID } = req.params;
  const { name, price, quantity } = req.body;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ID', sql.Int, ID)
      .input('name', sql.VarChar(50), name)
      .input('price', sql.Decimal(10, 2), price)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE PRODUCTLIST SET NAME = @name, PRICE = @price, QUANTITY = @quantity WHERE ID = @ID');

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json({ message: 'Product updated successfully' });
    }
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Delete a product by ID
app.delete('/products/:ID', async (req, res) => {
  const { ID } = req.params;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ID', sql.Int, ID)
      .query('DELETE FROM PRODUCTLIST WHERE ID = @ID');

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json({ message: 'Product deleted successfully' });
    }
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
