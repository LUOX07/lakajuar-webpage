const phoneProducts = [
  { name: "Funda glitter iPhone", price: "$15", img: "https://via.placeholder.com/400x300?text=Funda+iPhone", desc: "Protección y brillo para tu teléfono." },
  { name: "Cargador rápido USB-C", price: "$12", img: "https://via.placeholder.com/400x300?text=Cargador+USB-C", desc: "Carga segura y rápida." },
  { name: "Soporte magnético", price: "$18", img: "https://via.placeholder.com/400x300?text=Soporte+magnetico", desc: "Soporte para auto y escritorio." },
];

const jewelryProducts = [
  { name: "Collar dorado", price: "$25", img: "https://via.placeholder.com/400x300?text=Collar+dorado", desc: "Elegante y resistente a la oxidación." },
  { name: "Pulsera brillante", price: "$20", img: "https://via.placeholder.com/400x300?text=Pulsera+brillante", desc: "Diseño moderno para cualquier ocasión." },
  { name: "Aretes de plata", price: "$22", img: "https://via.placeholder.com/400x300?text=Aretes+plata", desc: "Acabado fino y cómodo." },
];

function renderProducts(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = products.map(item => `
    <article class="product-card">
      <img src="${item.img}" alt="${item.name}" />
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="price">${item.price}</div>
      <button class="btn">Agregar al carrito</button>
    </article>
  `).join("");
}

renderProducts("phone-products", phoneProducts);
renderProducts("jewelry-products", jewelryProducts);
