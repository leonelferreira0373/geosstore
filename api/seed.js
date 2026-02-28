/* ═══════════════════════════════════════════════════════
   GEOSSTORE — Database Seed Script
   Populates the database with initial product data.
   Run: node seed.js
   ═══════════════════════════════════════════════════════ */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_9He1SiaWLNbd@ep-curly-lab-ais8qzcv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('🌱 Seeding database...');

        // Check if products exist
        const existing = await client.query('SELECT COUNT(*) FROM products');
        if (parseInt(existing.rows[0].count) > 0) {
            console.log('⚠️  Products already exist. Skipping seed. Delete products first if you want to re-seed.');
            return;
        }

        // Insert products
        await client.query(`
      INSERT INTO products (name, brand, description, price, old_price, category, sizes, stock, featured, is_new, status) VALUES
      ('Air Max 90', 'Nike', 'O clássico Air Max 90 com design icónico e amortecimento Air visível. Conforto lendário para o dia a dia.', 45000, 52000, 'homem', '39,40,41,42,43,44', 25, true, true, 'active'),
      ('Air Force 1 Low', 'Nike', 'O sneaker mais vendido do mundo. Design limpo e versátil que combina com tudo.', 38000, NULL, 'unisexo', '36,37,38,39,40,41,42,43,44,45', 40, true, false, 'active'),
      ('Ultraboost 22', 'Adidas', 'Conforto inigualável com tecnologia Boost. Perfeito para corrida e uso casual.', 55000, 65000, 'homem', '40,41,42,43,44', 15, true, true, 'active'),
      ('Stan Smith', 'Adidas', 'Minimalismo clássico. O Stan Smith é um ícone que nunca sai de moda.', 32000, NULL, 'unisexo', '36,37,38,39,40,41,42,43', 30, false, false, 'active'),
      ('Air Jordan 1 Retro High OG', 'Jordan', 'O sneaker que mudou a cultura. Design original de 1985, tão relevante como sempre.', 72000, 85000, 'homem', '40,41,42,43,44,45', 10, true, true, 'active'),
      ('Air Jordan 4 Retro', 'Jordan', 'Um dos modelos mais desejados. Silhueta agressiva com detalhes premium.', 68000, NULL, 'homem', '40,41,42,43,44', 8, true, true, 'active'),
      ('New Balance 550', 'New Balance', 'O regresso de um clássico dos anos 80. Estilo retro basketball com acabamento premium.', 42000, 48000, 'unisexo', '37,38,39,40,41,42,43,44', 20, true, true, 'active'),
      ('Dunk Low', 'Nike', 'Do basquete para a rua. O Dunk Low é o sneaker da nova geração.', 40000, NULL, 'unisexo', '36,37,38,39,40,41,42,43,44', 35, false, true, 'active'),
      ('Suede Classic', 'Puma', 'Um ícone da cultura urbana desde 1968. Camurça premium e sola clássica.', 28000, 32000, 'unisexo', '37,38,39,40,41,42,43', 22, false, false, 'active'),
      ('Old Skool', 'Vans', 'A side stripe mais conhecida do mundo. Skate culture no seu melhor.', 25000, NULL, 'unisexo', '36,37,38,39,40,41,42,43,44', 28, false, false, 'active'),
      ('Gel-Kayano 14', 'ASICS', 'Desempenho técnico com estilo Y2K. Gel visível para amortecimento superior.', 48000, 55000, 'homem', '40,41,42,43,44', 12, false, true, 'active'),
      ('Chuck Taylor All Star', 'Converse', 'O original desde 1917. Lona resistente e estilo intemporal.', 22000, NULL, 'unisexo', '36,37,38,39,40,41,42,43,44,45', 50, false, false, 'active'),
      ('Air Max 97', 'Nike', 'Linhas fluidas inspiradas nos comboios bala japoneses. Full-length Air unit.', 52000, 60000, 'homem', '40,41,42,43,44', 14, false, true, 'active'),
      ('Forum Low', 'Adidas', 'Originalmente um sneaker de basquete dos anos 80, agora um essencial streetwear.', 35000, NULL, 'unisexo', '38,39,40,41,42,43', 18, false, false, 'active'),
      ('Air Max Plus', 'Nike', 'Design futurista com Tuned Air. Atitude máxima para quem não passa despercebido.', 50000, NULL, 'homem', '40,41,42,43,44,45', 16, false, true, 'active'),
      ('Samba OG', 'Adidas', 'Do futebol indoor para as ruas. O Samba é o sneaker do momento.', 38000, NULL, 'unisexo', '36,37,38,39,40,41,42,43,44', 45, true, true, 'active'),
      ('Air Max Dawn', 'Nike', 'Estilo feminino moderno com amortecimento Air Max. Cores suaves e perfil elegante.', 42000, 48000, 'mulher', '36,37,38,39,40', 20, true, true, 'active'),
      ('Ozweego', 'Adidas', 'Design chunky dos anos 90 reimaginado. Adiprene para conforto todo o dia.', 40000, 46000, 'mulher', '36,37,38,39,40,41', 15, false, true, 'active'),
      ('Classic Leather', 'Reebok', 'O instrutor original. Couro suave e conforto leve desde 1983.', 26000, NULL, 'mulher', '36,37,38,39,40', 25, false, false, 'active'),
      ('Nike Court Vision Low', 'Nike', 'Inspiração basketball vintage adaptada para a pequenada. Resistente e estiloso.', 22000, 26000, 'crianca', '28,29,30,31,32,33,34,35', 30, true, true, 'active'),
      ('Superstar CF', 'Adidas', 'O Superstar com velcro para crianças. Shell toe icónico.', 18000, NULL, 'crianca', '28,29,30,31,32,33,34', 35, false, true, 'active'),
      ('Old Skool V', 'Vans', 'O clássico Vans adaptado para crianças com fecho de velcro. Cores divertidas.', 16000, NULL, 'crianca', '26,27,28,29,30,31,32,33', 40, false, false, 'active')
    `);
        console.log('✅ 22 products inserted');

        // Insert reviews
        await client.query(`
      INSERT INTO reviews (customer_name, rating, comment) VALUES
      ('Maria S.', 5, 'Encomendei os Air Jordan 1 e chegaram em 3 dias. 100% originais! Recomendo muito.'),
      ('Pedro A.', 5, 'A melhor loja de sneakers em Angola. Serviço impecável e produtos de qualidade.'),
      ('Ana L.', 5, 'Já comprei 3 vezes e nunca me desiludiram. Envio rápido para Benguela!'),
      ('Carlos M.', 4, 'Óptima selecção de marcas. Os preços são justos para produtos originais.'),
      ('Sofia R.', 5, 'Atendimento via WhatsApp muito profissional. Ajudaram-me a escolher o tamanho certo.'),
      ('João D.', 5, 'Finalmente uma loja de confiança em Angola! Os meus Nike Air Max são perfeitos.')
    `);
        console.log('✅ 6 reviews inserted');

        console.log('🎉 Database seeded successfully!');
    } catch (err) {
        console.error('❌ Seed error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
