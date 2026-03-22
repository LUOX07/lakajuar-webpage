const products = [
  { id: 1, category: 'telefonos', name: 'Funda glitter iPhone', price: 15, img: 'https://via.placeholder.com/400x300?text=Funda+iPhone', desc: 'Protección y brillo para tu teléfono.' },
  { id: 2, category: 'telefonos', name: 'Cargador rápido USB-C', price: 12, img: 'https://via.placeholder.com/400x300?text=Cargador+USB-C', desc: 'Carga segura y rápida.' },
  { id: 3, category: 'telefonos', name: 'Soporte magnético', price: 18, img: 'https://via.placeholder.com/400x300?text=Soporte+magnetico', desc: 'Soporte para auto y escritorio.' },
  { id: 4, category: 'joyas', name: 'Collar dorado', price: 25, img: 'https://via.placeholder.com/400x300?text=Collar+dorado', desc: 'Elegante y resistente a la oxidación.' },
  { id: 5, category: 'joyas', name: 'Pulsera brillante', price: 20, img: 'https://via.placeholder.com/400x300?text=Pulsera+brillante', desc: 'Diseño moderno para cualquier ocasión.' },
  { id: 6, category: 'joyas', name: 'Aretes de plata', price: 22, img: 'https://via.placeholder.com/400x300?text=Aretes+plata', desc: 'Acabado fino y cómodo.' }
];

let cart = JSON.parse(localStorage.getItem('lakajuarCart') || '[]');

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function saveCart() {
  localStorage.setItem('lakajuarCart', JSON.stringify(cart));
  document.getElementById('cart-count').textContent = cart.length;
  const floatingCount = document.getElementById('floating-cart-count');
  if (floatingCount) floatingCount.textContent = cart.length;

  const cartStatus = document.querySelector('.cart-status');
  if (cartStatus) {
    cartStatus.classList.add('cart-bounce');
    setTimeout(() => cartStatus.classList.remove('cart-bounce'), 400);
  }

  renderCartDrawer();
}

function calculateCartTotal() {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

function renderCartDrawer() {
  const itemsContainer = document.getElementById('cart-items');
  const totalNode = document.getElementById('cart-total');
  if (!itemsContainer || !totalNode) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
  } else {
    itemsContainer.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div>
          <div class="item-name">${item.name}</div>
          <div class="item-price">${formatMoney(item.price)}</div>
        </div>
        <button class="remove-item" data-index="${idx}" aria-label="Quitar ${item.name}">x</button>
      </div>
    `).join('');
  }

  totalNode.textContent = formatMoney(calculateCartTotal());

  const btns = document.querySelectorAll('.remove-item');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.getAttribute('data-index'));
      if (!Number.isNaN(index)) {
        cart.splice(index, 1);
        saveCart();
      }
    });
  });
}

function renderProducts(productList) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = productList.map(p => `
    <article class="product-card">
      <img src="${p.img}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="price">$${p.price}.00</div>
      <button class="btn" onclick="addToCart(${p.id})">Agregar al carrito</button>
    </article>
  `).join('');
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  cart.push(product);
  saveCart();
  alert(`${product.name} agregado al carrito.`);
}

function filterProducts(category, query) {
  const q = query.trim().toLowerCase();
  const filtered = products.filter(p => {
    const matchCat = category === 'all' || p.category === category;
    const matchQuery = !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });
  renderProducts(filtered);
}

const buttons = document.querySelectorAll('.category-buttons button');
buttons.forEach(button => {
  button.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    filterProducts(button.getAttribute('data-cat'), document.getElementById('search-input').value);
  });
});

const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', () => {
  const active = document.querySelector('.category-buttons button.active').getAttribute('data-cat');
  filterProducts(active, searchInput.value);
});

renderProducts(products);
saveCart();

const cartDrawer = document.getElementById('cart-drawer');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const closeCartDrawerBtn = document.getElementById('close-cart-drawer');
const checkoutBtn = document.getElementById('checkout-btn');

function openCartDrawer() {
  if (cartDrawer) cartDrawer.classList.add('open');
}

function closeCartDrawer() {
  if (cartDrawer) cartDrawer.classList.remove('open');
}

if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
if (closeCartDrawerBtn) closeCartDrawerBtn.addEventListener('click', closeCartDrawer);
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío. Agrega productos antes de pagar.');
      return;
    }
    alert(`Total a pagar ${formatMoney(calculateCartTotal())}. Gracias por comprar en LAKAJUAR.`);
    cart = [];
    saveCart();
    closeCartDrawer();
  });
}

if (cartDrawer) {
  cartDrawer.addEventListener('click', (event) => {
    if (event.target === cartDrawer) closeCartDrawer();
  });
}

