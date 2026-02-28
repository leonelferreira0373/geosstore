/* ═══════════════════════════════════════════════════════
   GEOSSTORE — Shared Application Logic
   Cart management, API calls, UI interactions, scroll animations.
   ═══════════════════════════════════════════════════════ */

'use strict';

// ─── API CONFIG ───────────────────────────────────────
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:3000/api`
    : '/api';

// ─── DYNAMIC DATES ────────────────────────────────────
const GeoDates = {
    init() {
        const now = new Date();
        const year = now.getFullYear();

        // Month names in Portuguese
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

        const monthYear = `${monthNames[now.getMonth()]} ${year}`;
        const fullDateStr = `${weekDays[now.getDay()].toLowerCase()}, ${now.getDate()} de ${monthNames[now.getMonth()].toLowerCase()} de ${year}`;

        // Replace all years
        document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = year);

        // Replace all Month/Years
        document.querySelectorAll('.dynamic-month-year').forEach(el => el.textContent = monthYear);

        // Replace all Full Dates
        document.querySelectorAll('.dynamic-full-date').forEach(el => el.textContent = fullDateStr);

        // Unix timestamp for some data-attributes or real-time counters if needed
        document.querySelectorAll('.dynamic-unix').forEach(el => el.textContent = Math.floor(now.getTime() / 1000));
    }
};

// ─── API HELPER ───────────────────────────────────────
const GeoAPI = {
    async get(endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },

    async post(endpoint, data) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `API Error: ${res.status}`);
        }
        return res.json();
    },

    async put(endpoint, data) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },

    async patch(endpoint, data) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },

    async delete(endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },

    async upload(files) {
        const formData = new FormData();
        for (const file of files) formData.append('images', file);
        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`Upload Error: ${res.status}`);
        return res.json();
    }
};

// ─── CART STATE ────────────────────────────────────────
const GeoCart = {
    KEY: 'geosstore_cart',

    getItems() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY)) || [];
        } catch {
            return [];
        }
    },

    save(items) {
        localStorage.setItem(this.KEY, JSON.stringify(items));
        this.updateUI();
    },

    addItem(product) {
        const items = this.getItems();
        const existing = items.find(i => i.id === product.id && i.size === product.size);
        if (existing) {
            existing.qty += product.qty || 1;
        } else {
            items.push({ ...product, qty: product.qty || 1 });
        }
        this.save(items);
        GeoToast.show('Produto adicionado ao carrinho', 'success');
    },

    removeItem(id, size) {
        let items = this.getItems();
        items = items.filter(i => !(i.id == id && i.size === size));
        this.save(items);
    },

    updateQty(id, size, qty) {
        const items = this.getItems();
        const item = items.find(i => i.id == id && i.size === size);
        if (item) {
            item.qty = Math.max(1, qty);
            this.save(items);
        }
    },

    clear() {
        localStorage.removeItem(this.KEY);
        this.updateUI();
    },

    getTotal() {
        return this.getItems().reduce((sum, i) => sum + (i.price * i.qty), 0);
    },

    getCount() {
        return this.getItems().reduce((sum, i) => sum + i.qty, 0);
    },

    updateUI() {
        document.querySelectorAll('.cart-count').forEach(el => {
            const count = this.getCount();
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
        this.renderCartDrawer();
    },

    renderCartDrawer() {
        const body = document.querySelector('.cart-drawer-body');
        const footer = document.querySelector('.cart-drawer-footer');
        if (!body || !footer) return;

        const items = this.getItems();

        if (items.length === 0) {
            body.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <p>O seu carrinho está vazio</p>
          <a href="feed.html" class="btn btn-primary btn-sm" style="margin-top:16px;">Ver Produtos</a>
        </div>
      `;
            footer.innerHTML = '';
            return;
        }

        body.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image || 'IMG/GS-LOGO-2.png'}" alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-meta">${item.brand || ''} ${item.size ? '· Tam. ' + item.size : ''}</div>
          <div class="cart-item-bottom">
            <div class="cart-qty">
              <button onclick="GeoCart.updateQty(${item.id},'${item.size || ''}', ${item.qty - 1})" aria-label="Diminuir">−</button>
              <span>${item.qty}</span>
              <button onclick="GeoCart.updateQty(${item.id},'${item.size || ''}', ${item.qty + 1})" aria-label="Aumentar">+</button>
            </div>
            <span class="cart-item-price">${GeoUtils.formatPrice(item.price * item.qty)}</span>
          </div>
        </div>
        <button class="cart-close-btn" onclick="GeoCart.removeItem(${item.id},'${item.size || ''}')" aria-label="Remover" style="align-self:start;flex-shrink:0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('');

        footer.innerHTML = `
      <div class="cart-subtotal">
        <span>Subtotal</span>
        <span class="cart-subtotal-value">${GeoUtils.formatPrice(this.getTotal())}</span>
      </div>
      <a href="checkout.html" class="btn btn-primary btn-full btn-lg">Finalizar Compra</a>
      <p class="text-center text-sm text-muted" style="margin-top:12px;">Envio calculado no checkout</p>
    `;
    }
};

// ─── TOAST NOTIFICATIONS ──────────────────────────────
const GeoToast = {
    container: null,

    init() {
        if (document.querySelector('.toast-container')) {
            this.container = document.querySelector('.toast-container');
            return;
        }
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    show(message, type = 'success', duration = 3000) {
        if (!this.container) this.init();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' ? '<path d="M20 6L9 17l-5-5"/>' : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'}
      </svg>
      <span>${message}</span>
    `;
        this.container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// ─── UTILITIES ────────────────────────────────────────
const GeoUtils = {
    formatPrice(value) {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },

    debounce(fn, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    // Render a product card HTML
    renderProductCard(product) {
        const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
        return `
      <article class="product-card" onclick="window.location.href='produto.html?id=${product.id}'">
        <div class="product-card-img">
          <img src="${product.image_url || 'IMG/GS-LOGO-2.png'}" alt="${product.name}" loading="lazy">
          ${product.is_new ? '<span class="product-card-badge">Novo</span>' : ''}
          ${discount > 0 ? `<span class="product-card-badge" style="background:var(--danger);">-${discount}%</span>` : ''}
          <div class="product-card-actions">
            <button onclick="event.stopPropagation(); GeoCart.addItem({id:${product.id}, name:'${product.name.replace(/'/g, "\\'")}', brand:'${product.brand}', price:${product.price}, image:'${product.image_url || ''}', size:'', qty:1})" aria-label="Adicionar ao carrinho">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            </button>
          </div>
        </div>
        <div class="product-card-info">
          <div class="product-card-brand">${product.brand}</div>
          <div class="product-card-title">${product.name}</div>
          <div class="product-card-price">
            ${GeoUtils.formatPrice(product.price)}
            ${product.old_price ? `<span class="old-price">${GeoUtils.formatPrice(product.old_price)}</span>` : ''}
          </div>
        </div>
      </article>
    `;
    }
};

// ─── SCROLL ANIMATIONS ───────────────────────────────
const GeoScroll = {
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.fade-up, .fade-in, .slide-in-right, .stagger-children').forEach(el => {
            observer.observe(el);
        });
    }
};

// ─── HEADER BEHAVIOR ──────────────────────────────────
const GeoHeader = {
    init() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });

        const hamburger = document.querySelector('.hamburger');
        const mobileNav = document.querySelector('.mobile-nav');
        if (hamburger && mobileNav) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('open');
                mobileNav.classList.toggle('active');
                document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
            });
            mobileNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('open');
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }
    }
};

// ─── CART DRAWER ──────────────────────────────────────
const GeoCartDrawer = {
    init() {
        const overlay = document.querySelector('.cart-overlay');
        const drawer = document.querySelector('.cart-drawer');
        const openBtns = document.querySelectorAll('[data-open-cart]');
        const closeBtns = document.querySelectorAll('[data-close-cart]');

        if (!overlay || !drawer) return;

        const open = () => {
            overlay.classList.add('active');
            drawer.classList.add('active');
            document.body.style.overflow = 'hidden';
            GeoCart.renderCartDrawer();
        };

        const close = () => {
            overlay.classList.remove('active');
            drawer.classList.remove('active');
            document.body.style.overflow = '';
        };

        openBtns.forEach(btn => btn.addEventListener('click', open));
        closeBtns.forEach(btn => btn.addEventListener('click', close));
        overlay.addEventListener('click', close);
    }
};

// ─── TABS ─────────────────────────────────────────────
const GeoTabs = {
    init() {
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                const group = tab.closest('.tabs');
                const target = tab.dataset.tab;
                group.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const container = group.parentElement;
                container.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.panel === target);
                });
            });
        });
    }
};

// ─── NAVIGATION HIGHLIGHT ───────────────────────────
const GeoNavigation = {
    init() {
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('cat');
        const path = window.location.pathname.split('/').pop() || 'index.html';

        document.querySelectorAll('.nav-center a, .mobile-nav a').forEach(link => {
            const linkUrl = link.getAttribute('href');
            if (!linkUrl) return;

            let isActive = false;
            // Ensure exact match for category params
            if (linkUrl.includes('?cat=')) {
                const linkCat = new URL(linkUrl, window.location.origin).searchParams.get('cat');
                if (cat === linkCat) isActive = true;
            } else if (linkUrl.split('?')[0] === path && !cat) {
                // If it's a base link, it matches if paths are equal AND we aren't viewing a category
                isActive = true;
            }

            if (isActive) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};

// ─── INITIALIZE EVERYTHING ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    GeoDates.init();
    GeoToast.init();
    GeoHeader.init();
    GeoNavigation.init();
    GeoCartDrawer.init();
    GeoScroll.init();
    GeoTabs.init();
    GeoCart.updateUI();
});
