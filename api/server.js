/* ═══════════════════════════════════════════════════════
   GEOSSTORE — Backend API Server
   Express + PostgreSQL (Neon)
   ═══════════════════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'geosstore_secret_key_2026_luanda';
const SALT_ROUNDS = 12;

const app = express();
const PORT = process.env.PORT || 3000;

// ─── DATABASE ─────────────────────────────────────────
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_9He1SiaWLNbd@ep-curly-lab-ais8qzcv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
    console.error('Database pool error:', err);
});

// ─── MIDDLEWARE ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// Image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'IMG')),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        const ext = path.extname(file.originalname);
        cb(null, `product-${unique}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
    }
});

// ─── HELPER ───────────────────────────────────────────
function generateOrderNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'GS-';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

// ═══════════════════════════════════════════════════════
//   PRODUCTS API
// ═══════════════════════════════════════════════════════

// GET /api/products — List products (with filters)
app.get('/api/products', async (req, res) => {
    try {
        const { category, search, sort, page = 1, limit = 20, featured, is_new, status = 'active' } = req.query;

        let query = 'SELECT * FROM products WHERE status = $1';
        const params = [status];
        let paramIndex = 2;

        if (category && category !== 'todos') {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (search) {
            query += ` AND (LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(brand) LIKE LOWER($${paramIndex}))`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (featured === 'true') {
            query += ' AND featured = true';
        }

        if (is_new === 'true') {
            query += ' AND is_new = true';
        }

        // Count total
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Sort
        switch (sort) {
            case 'preco-asc': query += ' ORDER BY price ASC'; break;
            case 'preco-desc': query += ' ORDER BY price DESC'; break;
            case 'nome': query += ' ORDER BY name ASC'; break;
            case 'popular': query += ' ORDER BY featured DESC, created_at DESC'; break;
            default: query += ' ORDER BY created_at DESC';
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), offset);

        const result = await pool.query(query, params);

        res.json({
            products: result.rows,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Erro ao carregar produtos' });
    }
});

// GET /api/products/:id — Single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Erro ao carregar produto' });
    }
});

// POST /api/products — Create product (admin)
app.post('/api/products', async (req, res) => {
    try {
        const { name, brand, description, price, old_price, category, sizes, stock, featured, is_new, status, image_url, images, color, location } = req.body;
        const result = await pool.query(
            `INSERT INTO products (name, brand, description, price, old_price, category, sizes, stock, featured, is_new, status, image_url, images, color, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
            [name, brand || '', description || '', price, old_price || null, category || 'unisexo', sizes || '', stock || 0, featured || false, is_new !== false, status || 'active', image_url || '', images || '[]', color || '', location || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
});

// PUT /api/products/:id — Update product (admin)
app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, brand, description, price, old_price, category, sizes, stock, featured, is_new, status, image_url, images, color, location } = req.body;
        const result = await pool.query(
            `UPDATE products SET name=$1, brand=$2, description=$3, price=$4, old_price=$5, category=$6, sizes=$7, stock=$8, featured=$9, is_new=$10, status=$11, image_url=$12, images=$13, color=$14, location=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
            [name, brand, description, price, old_price, category, sizes, stock, featured, is_new, status, image_url, images, color || '', location || '', req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Erro ao actualizar produto' });
    }
});

// PATCH /api/products/:id/worker — Update product stock/details (Worker)
app.patch('/api/products/:id/worker', async (req, res) => {
    try {
        const { sizes, stock, color, location } = req.body;
        const result = await pool.query(
            `UPDATE products SET sizes=$1, stock=$2, color=$3, location=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
            [sizes || '', stock || 0, color || '', location || '', req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating product stock:', err);
        res.status(500).json({ error: 'Erro ao actualizar inventário' });
    }
});

// DELETE /api/products/:id — Delete product (admin)
app.delete('/api/products/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json({ message: 'Produto eliminado com sucesso' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Erro ao eliminar produto' });
    }
});

// POST /api/upload — Upload image
app.post('/api/upload', upload.array('images', 10), (req, res) => {
    try {
        const urls = req.files.map(f => `IMG/${f.filename}`);
        res.json({ urls });
    } catch (err) {
        console.error('Error uploading:', err);
        res.status(500).json({ error: 'Erro ao fazer upload' });
    }
});


// ═══════════════════════════════════════════════════════
//   ORDERS API
// ═══════════════════════════════════════════════════════

// GET /api/orders — List orders
app.get('/api/orders', async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;

        let query = 'SELECT * FROM orders';
        const params = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            query += ` WHERE status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), offset);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Erro ao carregar encomendas' });
    }
});

// GET /api/orders/:id — Single order with items
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Encomenda não encontrada' });

        const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);

        res.json({
            ...orderResult.rows[0],
            items: itemsResult.rows
        });
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ error: 'Erro ao carregar encomenda' });
    }
});

// GET /api/orders/search/:query — Search orders
app.get('/api/orders/search/:query', async (req, res) => {
    try {
        const q = `%${req.params.query}%`;
        const result = await pool.query(
            `SELECT * FROM orders WHERE 
        LOWER(order_number) LIKE LOWER($1) OR 
        LOWER(first_name) LIKE LOWER($1) OR 
        LOWER(last_name) LIKE LOWER($1) OR 
        phone LIKE $1 OR
        LOWER(email) LIKE LOWER($1)
       ORDER BY created_at DESC LIMIT 20`,
            [q]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching orders:', err);
        res.status(500).json({ error: 'Erro na pesquisa' });
    }
});

// POST /api/orders — Create order
app.post('/api/orders', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { customer, shipping, payment, items, subtotal, shippingCost = 0 } = req.body;
        const orderNumber = generateOrderNumber();
        const total = subtotal + shippingCost;

        const orderResult = await client.query(
            `INSERT INTO orders (order_number, first_name, last_name, email, phone, address, city, province, notes, payment_method, subtotal, shipping, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [orderNumber, customer.firstName, customer.lastName, customer.email, customer.phone,
                shipping.address, shipping.city, shipping.province, shipping.notes || '',
                payment, subtotal, shippingCost, total]
        );

        const order = orderResult.rows[0];

        // Insert order items
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, product_image, size, quantity, price)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [order.id, item.id || null, item.name, item.image || '', item.size || '', item.qty, item.price]
            );

            // Decrease stock
            if (item.id) {
                await client.query(
                    'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                    [item.qty, item.id]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ order, orderNumber });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Erro ao criar encomenda' });
    } finally {
        client.release();
    }
});

// PATCH /api/orders/:id/status — Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Encomenda não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Erro ao actualizar estado' });
    }
});


// ═══════════════════════════════════════════════════════
//   NEWSLETTER API
// ═══════════════════════════════════════════════════════

// POST /api/newsletter — Subscribe
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'E-mail obrigatório' });
        await pool.query(
            'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
            [email]
        );
        res.status(201).json({ message: 'Inscrito com sucesso' });
    } catch (err) {
        console.error('Error subscribing:', err);
        res.status(500).json({ error: 'Erro ao inscrever' });
    }
});

// GET /api/newsletter — List subscribers (admin)
app.get('/api/newsletter', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching subscribers:', err);
        res.status(500).json({ error: 'Erro ao carregar inscritos' });
    }
});

// DELETE /api/newsletter/:id
app.delete('/api/newsletter/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM newsletter_subscribers WHERE id = $1', [req.params.id]);
        res.json({ message: 'Removido' });
    } catch (err) {
        res.status(500).json({ error: 'Erro' });
    }
});


// ═══════════════════════════════════════════════════════
//   REVIEWS API
// ═══════════════════════════════════════════════════════

// GET /api/reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar avaliações' });
    }
});

// POST /api/reviews
app.post('/api/reviews', async (req, res) => {
    try {
        const { customer_name, rating, comment, product_id } = req.body;
        const result = await pool.query(
            'INSERT INTO reviews (customer_name, rating, comment, product_id) VALUES ($1,$2,$3,$4) RETURNING *',
            [customer_name, rating || 5, comment || '', product_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar avaliação' });
    }
});

// DELETE /api/reviews/:id
app.delete('/api/reviews/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
        res.json({ message: 'Avaliação removida' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao remover avaliação' });
    }
});


// ═══════════════════════════════════════════════════════
//   DASHBOARD API (Admin)
// ═══════════════════════════════════════════════════════

// GET /api/dashboard/stats
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const revenue = await pool.query("SELECT COALESCE(SUM(total), 0) as value FROM orders WHERE status != 'cancelled'");
        const orders = await pool.query('SELECT COUNT(*) as value FROM orders');
        const leads = await pool.query('SELECT COUNT(*) as value FROM newsletter_subscribers');
        const products = await pool.query('SELECT COUNT(*) as value FROM products');

        const statusCounts = await pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');

        res.json({
            revenue: parseInt(revenue.rows[0].value),
            orders: parseInt(orders.rows[0].value),
            leads: parseInt(leads.rows[0].value),
            products: parseInt(products.rows[0].value),
            ordersByStatus: statusCounts.rows.reduce((acc, r) => { acc[r.status] = parseInt(r.count); return acc; }, {})
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Erro ao carregar estatísticas' });
    }
});

// GET /api/dashboard/recent-orders
app.get('/api/dashboard/recent-orders', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT o.*,
        COALESCE(
          (SELECT json_agg(json_build_object('name', oi.product_name, 'size', oi.size, 'qty', oi.quantity, 'price', oi.price))
           FROM order_items oi WHERE oi.order_id = o.id), '[]'
        ) as items
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching recent orders:', err);
        res.status(500).json({ error: 'Erro' });
    }
});

// GET /api/customers — List unique customers from the customers table
app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.id,
                c.first_name || ' ' || c.last_name as name,
                c.email, 
                c.phone,
                c.created_at as registos,
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total), 0) as total_spent,
                MIN(o.created_at) as first_order
            FROM customers c
            LEFT JOIN orders o ON LOWER(o.email) = LOWER(c.email) AND o.status != 'cancelled'
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.created_at
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ error: 'Erro ao carregar clientes' });
    }
});

// DELETE /api/customers/:id
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
        res.json({ message: 'Cliente eliminado com sucesso' });
    } catch (err) {
        console.error('Error deleting customer:', err);
        res.status(500).json({ error: 'Erro ao eliminar cliente' });
    }
});


// ═══════════════════════════════════════════════════════
//   WORKERS API
// ═══════════════════════════════════════════════════════

// GET /api/workers
app.get('/api/workers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM workers ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar trabalhadores' });
    }
});

// POST /api/workers
app.post('/api/workers', async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, E-mail e Palavra-passe são obrigatórios' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await pool.query(
            'INSERT INTO workers (name, email, password_hash, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, status',
            [name, email.toLowerCase().trim(), passwordHash, role || 'Trabalhador', status || 'Online']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar trabalhador' });
    }
});

// DELETE /api/workers/:id
app.delete('/api/workers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM workers WHERE id = $1', [req.params.id]);
        res.json({ message: 'Trabalhador removido' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao remover trabalhador' });
    }
});


// ═══════════════════════════════════════════════════════
//   AUTHENTICATION API
// ═══════════════════════════════════════════════════════

// POST /api/auth/register — Create customer account
app.post('/api/auth/register', async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, newsletter } = req.body;

        // Validation
        if (!first_name || !last_name || !email || !phone || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'A palavra-passe deve ter no mínimo 8 caracteres.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'E-mail inválido.' });
        }
        if (phone.replace(/\D/g, '').length < 9) {
            return res.status(400).json({ error: 'Telefone inválido.' });
        }

        // Check if email already exists
        const existing = await pool.query('SELECT id FROM customers WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está registado. Tente iniciar sessão.' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert customer
        const result = await pool.query(
            `INSERT INTO customers (first_name, last_name, email, phone, password_hash)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, phone, created_at`,
            [first_name.trim(), last_name.trim(), email.toLowerCase().trim(), phone.trim(), passwordHash]
        );

        const user = result.rows[0];

        // Subscribe to newsletter if opted in
        if (newsletter) {
            await pool.query(
                'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
                [email.toLowerCase().trim()]
            );
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'customer' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' });
    }
});

// POST /api/auth/worker/login — Worker Login
app.post('/api/auth/worker/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM workers WHERE email = $1', [email.toLowerCase().trim()]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const worker = result.rows[0];

        // Check password (assume password_hash is required, if old worker without hash -> fail)
        if (!worker.password_hash) {
            return res.status(401).json({ error: 'Por favor peça ao administrador para redefinir a sua palavra-passe.' });
        }

        const validPassword = await bcrypt.compare(password, worker.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: worker.id, email: worker.email, role: worker.role },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        const { password_hash, ...workerWithoutPassword } = worker;
        res.json({ user: workerWithoutPassword, token });
    } catch (err) {
        console.error('Worker login error:', err);
        res.status(500).json({ error: 'Erro ao iniciar sessão.' });
    }
});

// POST /api/auth/login — Login customer
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e palavra-passe são obrigatórios.' });
        }

        // Find customer
        const result = await pool.query(
            'SELECT * FROM customers WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou palavra-passe incorretos.' });
        }

        const customer = result.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, customer.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'E-mail ou palavra-passe incorretos.' });
        }

        // Update last login
        await pool.query('UPDATE customers SET last_login = NOW() WHERE id = $1', [customer.id]);

        // Generate JWT
        const token = jwt.sign(
            { id: customer.id, email: customer.email, role: 'customer' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Don't send password hash back
        const user = {
            id: customer.id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            phone: customer.phone,
            created_at: customer.created_at
        };

        res.json({ user, token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Erro ao iniciar sessão.' });
    }
});

// GET /api/auth/me — Get current user profile (requires token)
app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token não fornecido.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const result = await pool.query(
            'SELECT id, first_name, last_name, email, phone, created_at, last_login FROM customers WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilizador não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Erro ao carregar perfil.' });
    }
});

// GET /api/customers — List all customers (Admin)
app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, first_name, last_name, email, phone, created_at, last_login FROM customers ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ error: 'Erro ao listar clientes.' });
    }
});

// ═══════════════════════════════════════════════════════
//   DATABASE SETUP
// ═══════════════════════════════════════════════════════

async function setupDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        price INTEGER NOT NULL,
        old_price INTEGER DEFAULT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'unisexo',
        sizes TEXT DEFAULT '',
        stock INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT false,
        is_new BOOLEAN DEFAULT true,
        status VARCHAR(20) DEFAULT 'active',
        image_url TEXT DEFAULT '',
        images TEXT DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        phone VARCHAR(30) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        province VARCHAR(100) NOT NULL,
        notes TEXT DEFAULT '',
        payment_method VARCHAR(50) NOT NULL DEFAULT 'transferencia',
        subtotal INTEGER NOT NULL DEFAULT 0,
        shipping INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image TEXT DEFAULT '',
        size VARCHAR(10) DEFAULT '',
        quantity INTEGER NOT NULL DEFAULT 1,
        price INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        rating INTEGER NOT NULL DEFAULT 5,
        comment TEXT DEFAULT '',
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'Trabalhador',
        status VARCHAR(20) DEFAULT 'Online',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(30) NOT NULL,
        password_hash TEXT NOT NULL,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    `);
        console.log('✅ Database tables created');
    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        client.release();
    }
}


// ═══════════════════════════════════════════════════════
//   START SERVER
// ═══════════════════════════════════════════════════════

app.listen(PORT, async () => {
    console.log(`🚀 GEOSSTORE API running on http://localhost:${PORT}`);
    await setupDatabase();
});
