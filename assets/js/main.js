const products = [
  { id: 1, category: 'telefonos', name: 'Funda glitter iPhone', price: 15, img: 'https://via.placeholder.com/400x300?text=Funda+iPhone', desc: 'Protección y brillo para tu teléfono.' },
  { id: 2, category: 'telefonos', name: 'Cargador rápido USB-C', price: 12, img: 'https://via.placeholder.com/400x300?text=Cargador+USB-C', desc: 'Carga segura y rápida.' },
  { id: 3, category: 'telefonos', name: 'Soporte magnético', price: 18, img: 'https://via.placeholder.com/400x300?text=Soporte+magnetico', desc: 'Soporte para auto y escritorio.' },
  { id: 4, category: 'joyas', name: 'Collar dorado', price: 25, img: 'https://via.placeholder.com/400x300?text=Collar+dorado', desc: 'Elegante y resistente a la oxidación.' },
  { id: 5, category: 'joyas', name: 'Pulsera brillante', price: 20, img: 'https://via.placeholder.com/400x300?text=Pulsera+brillante', desc: 'Diseño moderno para cualquier ocasión.' },
  { id: 6, category: 'joyas', name: 'Aretes de plata', price: 22, img: 'https://via.placeholder.com/400x300?text=Aretes+plata', desc: 'Acabado fino y cómodo.' }
];

let cart = JSON.parse(localStorage.getItem('lakajuarCart') || '[]');
let activeDiscount = JSON.parse(localStorage.getItem('lakajuarDiscount') || '0');

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function getCartItems() {
  return cart.map(({ id, quantity }) => {
    const product = products.find(p => p.id === id);
    return product ? { ...product, quantity } : null;
  }).filter(Boolean);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function calculateCartSubtotal() {
  return getCartItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateShipping(subtotal) {
  if (subtotal === 0) return 0;
  if (subtotal >= 100) return 0;
  return 8;
}

function calculateCartTotal() {
  const subtotal = calculateCartSubtotal();
  const discountAmount = subtotal * activeDiscount;
  const shipping = calculateShipping(subtotal - discountAmount);
  return {
    subtotal,
    discountAmount,
    shipping,
    total: subtotal - discountAmount + shipping,
  };
}

function updateCartSummary() {
  const count = getCartCount();
  const cartCountNode = document.getElementById('cart-count');
  const floatCountNode = document.getElementById('floating-cart-count');

  if (cartCountNode) cartCountNode.textContent = count;
  if (floatCountNode) floatCountNode.textContent = count;

  const cartStatus = document.querySelector('.cart-status');
  if (cartStatus) {
    cartStatus.classList.add('cart-bounce');
    setTimeout(() => cartStatus.classList.remove('cart-bounce'), 400);
  }
}

function saveCart() {
  localStorage.setItem('lakajuarCart', JSON.stringify(cart));
  localStorage.setItem('lakajuarDiscount', JSON.stringify(activeDiscount));
  updateCartSummary();
  renderCartDrawer();
}

function addItemToCart(productId, quantity = 1) {
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }
  saveCart();
}

function removeItemFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

function changeItemQuantity(productId, delta) {
  const item = cart.find(it => it.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeItemFromCart(productId);
    return;
  }
  saveCart();
}

function applyCoupon() {
  const input = document.getElementById('coupon-code');
  const message = document.getElementById('coupon-message');
  if (!input || !message) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    message.textContent = 'Ingresa un código de cupón.';
    message.style.color = '#e67e22';
    return;
  }

  if (code === 'LAKA10') {
    activeDiscount = 0.1;
    message.textContent = '¡Cupón aplicado! 10% de descuento.';
    message.style.color = '#27ae60';
  } else if (code === 'ENVIOFREE') {
    activeDiscount = 0.05;
    message.textContent = '¡Cupón aplicado! 5% de descuento + envío estándar.';
    message.style.color = '#27ae60';
  } else {
    activeDiscount = 0;
    message.textContent = 'Cupón inválido, intenta LAKA10 o ENVIOFREE.';
    message.style.color = '#c0392b';
  }

  saveCart();
}

function renderCartDrawer() {
  const itemsContainer = document.getElementById('cart-items');
  const subtotalNode = document.getElementById('cart-subtotal');
  const discountNode = document.getElementById('cart-discount');
  const shippingNode = document.getElementById('cart-shipping');
  const totalNode = document.getElementById('cart-total');

  if (!itemsContainer || !subtotalNode || !discountNode || !shippingNode || !totalNode) return;

  const cartItems = getCartItems();

  if (cartItems.length === 0) {
    itemsContainer.innerHTML = '<p>Tu carrito está vacío. Agrega productos para comenzar.</p>';
  } else {
    itemsContainer.innerHTML = cartItems.map(item => `
      <div class="cart-item">
        <div class="item-details">
          <div class="item-name">${item.name}</div>
          <div class="item-price">${formatMoney(item.price)} c/u</div>
        </div>
        <div class="item-controls">
          <button class="qty-btn" data-action="decrease" data-id="${item.id}">–</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
          <button class="remove-item" data-id="${item.id}" aria-label="Quitar ${item.name}">x</button>
        </div>
      </div>
    `).join('');
  }

  const totals = calculateCartTotal();
  subtotalNode.textContent = formatMoney(totals.subtotal);
  discountNode.textContent = formatMoney(totals.discountAmount);
  shippingNode.textContent = formatMoney(totals.shipping);
  totalNode.textContent = formatMoney(totals.total);
}

function setupCartDrawerEvents() {
  const itemsContainer = document.getElementById('cart-items');
  const applyCouponBtn = document.getElementById('coupon-apply-btn');

  if (itemsContainer) {
    itemsContainer.addEventListener('click', (event) => {
      const target = event.target;
      if (target.matches('.qty-btn')) {
        const id = Number(target.getAttribute('data-id'));
        const action = target.getAttribute('data-action');
        if (action === 'increase') changeItemQuantity(id, 1);
        if (action === 'decrease') changeItemQuantity(id, -1);
      }
      if (target.matches('.remove-item')) {
        const id = Number(target.getAttribute('data-id'));
        removeItemFromCart(id);
      }
    });
  }

  if (applyCouponBtn) applyCouponBtn.addEventListener('click', applyCoupon);
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
  if (!product) return;
  addItemToCart(productId, 1);
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
setupCartDrawerEvents();

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
    const totals = calculateCartTotal();
    if (totals.total <= 0) {
      alert('Tu carrito está vacío. Agrega productos antes de pagar.');
      return;
    }
    alert(`Total a pagar ${formatMoney(totals.total)} (subtotal ${formatMoney(totals.subtotal)}, envío ${formatMoney(totals.shipping)}, descuento ${formatMoney(totals.discountAmount)}). Gracias por comprar en LAKAJUAR.`);
    cart = [];
    activeDiscount = 0;
    saveCart();
    closeCartDrawer();
  });
}

if (cartDrawer) {
  cartDrawer.addEventListener('click', (event) => {
    if (event.target === cartDrawer) closeCartDrawer();
  });
}

