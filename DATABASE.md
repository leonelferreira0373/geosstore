# 🗄️ GEOSSTORE — Comandos SQL da Base de Dados

> **Base de Dados:** PostgreSQL (Neon)  
> **Connection String:** `postgresql://neondb_owner:npg_9He1SiaWLNbd@ep-curly-lab-ais8qzcv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require`

---

## 📋 Tabelas Completas

### 1. `products` — Produtos da Loja

```sql
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    price INTEGER NOT NULL,
    old_price INTEGER DEFAULT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'unisexo',
    sizes TEXT DEFAULT '',
    color VARCHAR(255) DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    stock INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    image_url TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL | Identificador único |
| `name` | VARCHAR(255) | Nome do produto |
| `brand` | VARCHAR(100) | Marca (Nike, Adidas, etc.) |
| `description` | TEXT | Descrição detalhada |
| `price` | INTEGER | Preço em Kwanzas (sem decimais) |
| `old_price` | INTEGER | Preço original (para promoções) |
| `category` | VARCHAR(50) | `homem`, `mulher`, `crianca`, `unisexo` |
| `sizes` | TEXT | Tamanhos disponíveis, separados por vírgula |
| `color` | VARCHAR(255) | Cores disponíveis ou variação |
| `location` | VARCHAR(255) | Localização do artigo no armazém / Prateleira |
| `stock` | INTEGER | Quantidade em stock |
| `featured` | BOOLEAN | Produto em destaque na homepage |
| `is_new` | BOOLEAN | Mostrar badge "Novo" |
| `status` | VARCHAR(20) | `active`, `inactive`, `scheduled` |
| `image_url` | TEXT | URL da imagem principal |
| `images` | TEXT | JSON array com URLs de imagens adicionais |

---

### 2. `orders` — Encomendas

```sql
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
```

**Estados da Encomenda (`status`):**
| Estado | Descrição |
|--------|-----------|
| `pending` | Pendente — Aguardando confirmação |
| `confirmed` | Confirmado — Pagamento recebido |
| `shipped` | Enviado — Em trânsito |
| `delivered` | Entregue — Concluída |
| `cancelled` | Cancelado |

**Métodos de Pagamento (`payment_method`):**
| Método | Descrição |
|--------|-----------|
| `transferencia` | Transferência Bancária |
| `multicaixa` | Multicaixa Express |
| `dinheiro` | Pagamento na Entrega |
| `whatsapp` | Combinar via WhatsApp |

---

### 3. `order_items` — Itens de cada Encomenda

```sql
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
```

---

### 4. `newsletter_subscribers` — Inscritos na Newsletter

```sql
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 5. `reviews` — Avaliações de Clientes

```sql
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    comment TEXT DEFAULT '',
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Sistema de Classificação:**
- ⭐ 1-5 estrelas (interactivo com hover)
- Associado a `product_id` para avaliações por produto
- `product_id = NULL` → avaliação geral da loja

---

### 6. `workers` — Trabalhadores

```sql
CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Trabalhador',
    status VARCHAR(20) DEFAULT 'Online',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. `customers` — Clientes Registados

```sql
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
```

**Segurança:**
- Passwords são encriptadas com `bcryptjs` (12 salt rounds)
- Autenticação via JWT (JSON Web Token) com validade de 7 dias
- O `password_hash` NUNCA é retornado pela API

---

## 📊 Índices para Performance

```sql
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
```

---

## 🚚 Taxas de Envio por Província

| Província | Custo (Kz) |
|-----------|-----------|
| Luanda | 2.500 |
| Bengo | 4.000 |
| Benguela | 5.500 |
| Bié | 6.000 |
| Cabinda | 7.000 |
| Cuando Cubango | 7.500 |
| Cuanza Norte | 5.000 |
| Cuanza Sul | 5.000 |
| Cunene | 6.500 |
| Huambo | 5.500 |
| Huíla | 6.000 |
| Lunda Norte | 7.000 |
| Lunda Sul | 7.000 |
| Malanje | 5.500 |
| Moxico | 7.500 |
| Namibe | 6.500 |
| Uíge | 5.500 |
| Zaire | 7.000 |

---

## 🔄 Comandos Úteis

### Apagar todas as tabelas (RESET)
```sql
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
```

### Ver todos os produtos
```sql
SELECT id, name, brand, category, price, stock, status FROM products ORDER BY created_at DESC;
```

### Ver encomendas pendentes
```sql
SELECT o.*, array_agg(oi.product_name) as items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'pending'
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### Receita total
```sql
SELECT COALESCE(SUM(total), 0) as receita_total FROM orders WHERE status != 'cancelled';
```

### Top 5 produtos mais vendidos
```sql
SELECT oi.product_name, SUM(oi.quantity) as total_vendido
FROM order_items oi
GROUP BY oi.product_name
ORDER BY total_vendido DESC
LIMIT 5;
```

### Média das avaliações
```sql
SELECT 
    p.name,
    COUNT(r.id) as total_avaliacoes,
    ROUND(AVG(r.rating), 1) as media
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id, p.name
HAVING COUNT(r.id) > 0
ORDER BY media DESC;
```

---

## 🌱 Seed Data (Dados Iniciais)

Para popular a base de dados com dados de teste, execute:

```bash
cd api
node seed.js
```

Isto irá inserir:
- 22 produtos (Nike, Adidas, Jordan, New Balance, Puma, etc.)
- 6 avaliações de clientes

---

## 📡 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/products` | Listar produtos (com filtros) |
| `GET` | `/api/products/:id` | Detalhes de um produto |
| `POST` | `/api/products` | Criar produto (Admin) |
| `PUT` | `/api/products/:id` | Actualizar produto (Admin) |
| `DELETE` | `/api/products/:id` | Eliminar produto (Admin) |
| `POST` | `/api/upload` | Upload de imagens |
| `GET` | `/api/orders` | Listar encomendas |
| `GET` | `/api/orders/:id` | Detalhes de encomenda |
| `POST` | `/api/orders` | Criar encomenda (Checkout) |
| `PATCH` | `/api/orders/:id/status` | Actualizar estado |
| `POST` | `/api/newsletter` | Inscrever e-mail |
| `GET` | `/api/newsletter` | Listar inscritos (Admin) |
| `DELETE` | `/api/newsletter/:id` | Remover inscrito (Admin) |
| `GET` | `/api/reviews` | Listar avaliações |
| `POST` | `/api/reviews` | Submeter avaliação |
| `DELETE` | `/api/reviews/:id` | Eliminar avaliação (Admin) |
| `GET` | `/api/workers` | Listar trabalhadores (Admin) |
| `POST` | `/api/workers` | Adicionar trabalhador (Admin) |
| `DELETE` | `/api/workers/:id` | Remover trabalhador (Admin) |
| `GET` | `/api/dashboard/stats` | Estatísticas do dashboard |
| `GET` | `/api/dashboard/recent-orders` | Últimas encomendas |
| `POST` | `/api/auth/register` | Registar nova conta |
| `POST` | `/api/auth/login` | Iniciar sessão |
| `GET` | `/api/auth/me` | Perfil do utilizador (JWT) |
| `GET` | `/api/customers` | Listar clientes (Admin) |
