const products = [
  { id: 1, category: 'telefonos', name: 'Funda glitter iPhone', price: 15, img: 'https://via.placeholder.com/400x300?text=Funda+iPhone', desc: 'Protección y brillo para tu teléfono.' },
  { id: 2, category: 'telefonos', name: 'Cargador rápido USB-C', price: 12, img: 'https://via.placeholder.com/400x300?text=Cargador+USB-C', desc: 'Carga segura y rápida.' },
  { id: 3, category: 'telefonos', name: 'Soporte magnético', price: 18, img: 'https://via.placeholder.com/400x300?text=Soporte+magnetico', desc: 'Soporte para auto y escritorio.' },
  { id: 4, category: 'joyas', name: 'Collar dorado', price: 25, img: 'https://via.placeholder.com/400x300?text=Collar+dorado', desc: 'Elegante y resistente a la oxidación.' },
  { id: 5, category: 'joyas', name: 'Pulsera brillante', price: 20, img: 'https://via.placeholder.com/400x300?text=Pulsera+brillante', desc: 'Diseño moderno para cualquier ocasión.' },
  { id: 6, category: 'joyas', name: 'Aretes de plata', price: 22, img: 'https://via.placeholder.com/400x300?text=Aretes+plata', desc: 'Acabado fino y cómodo.' }
];

let cart = JSON.parse(localStorage.getItem('lakajuarCart') || '[]');

function saveCart() {
  localStorage.setItem('lakajuarCart', JSON.stringify(cart));
  document.getElementById('cart-count').textContent = cart.length;
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
