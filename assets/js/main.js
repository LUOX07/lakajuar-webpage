import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'400'%20height%3D'300'%20viewBox%3D'0%200%20400%20300'%3E%3Crect%20width%3D'400'%20height%3D'300'%20fill%3D'%23f5ede3'%2F%3E%3Ctext%20x%3D'200'%20y%3D'160'%20font-family%3D'sans-serif'%20font-size%3D'18'%20fill%3D'%23b08060'%20text-anchor%3D'middle'%3ESin%20imagen%3C%2Ftext%3E%3C%2Fsvg%3E";
const STORE_WHATSAPP_FALLBACK = "595984475612";
const IS_LOCAL_DEV = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const BASE_CATEGORIES = ["joyas", "cases", "accesorios"];
const SUBCATEGORY_PRESETS = {
  joyas: ["aros", "pulseras", "anillos", "collares", "dijes", "tobilleras"],
  cases: ["flores", "anime", "naturaleza", "minimalista", "marmol", "glitter", "kawaii", "gaming", "street", "personalizados"],
  accesorios: ["cargadores", "cables", "soportes", "power-banks", "airpods", "organizadores"],
};

let runtimeConfig = null;
let app = null;
let auth = null;
let db = null;
let storage = null;

const DEFAULT_PRODUCTS = [
  {
    category: "joyas",
    subcategory: "collares",
    name: "Collar LAKAJUAR",
    price: 60000,
    img: "assets/images/products/collar-lakajuar.jpg",
    desc: "Collar delicado y elegante para uso diario.",
    active: true,
  },
  {
    category: "joyas",
    subcategory: "aros",
    name: "Aros LAKAJUAR",
    price: 10000,
    img: "assets/images/products/aros-lakajuar.jpg",
    desc: "Aros finos y livianos para cualquier ocasión.",
    active: true,
  },
  {
    category: "joyas",
    subcategory: "aros",
    name: "Set de aros mini",
    price: 10000,
    img: "assets/images/products/aros-lakajuar.jpg",
    desc: "Set de aros pequeños con diseño moderno.",
    active: true,
  },
  {
    category: "cases",
    subcategory: "minimalista",
    name: "Case transparente",
    price: 18000,
    img: "https://via.placeholder.com/400x300?text=Case+transparente",
    desc: "Protección slim sin perder diseño.",
    active: true,
  },
  {
    category: "accesorios",
    subcategory: "cargadores",
    name: "Cargador rápido USB-C",
    price: 25000,
    img: "https://via.placeholder.com/400x300?text=Cargador+USB-C",
    desc: "Carga segura y rápida.",
    active: true,
  },
];

const ui = {
  searchInput: document.getElementById("search-input"),
  productGrid: document.getElementById("product-grid"),
  categoryTabs: document.getElementById("category-tabs"),
  subcategoryTabs: document.getElementById("subcategory-tabs"),
  cartCount: document.getElementById("cart-count"),
  floatingCartCount: document.getElementById("floating-cart-count"),
  cartStatus: document.querySelector(".cart-status"),
  cartDrawer: document.getElementById("cart-drawer"),
  cartToggleBtn: document.getElementById("cart-toggle-btn"),
  closeCartDrawerBtn: document.getElementById("close-cart-drawer"),
  cartItems: document.getElementById("cart-items"),
  cartSubtotal: document.getElementById("cart-subtotal"),
  cartDiscount: document.getElementById("cart-discount"),
  cartTotal: document.getElementById("cart-total"),
  checkoutBtn: document.getElementById("checkout-btn"),
  whatsappContactLink: document.getElementById("whatsapp-contact-link"),
  whatsappFloatBtn: document.getElementById("whatsapp-float-btn"),
  authOpenBtn: document.getElementById("auth-open-btn"),
  authLogoutBtn: document.getElementById("auth-logout-btn"),
  authRoleBadge: document.getElementById("auth-role-badge"),
  toastContainer: document.getElementById("toast-container"),
  authModal: document.getElementById("auth-modal"),
  authCloseBtn: document.getElementById("auth-close-btn"),
  authTitle: document.getElementById("auth-title"),
  authForm: document.getElementById("auth-form"),
  authNameGroup: document.getElementById("auth-name-group"),
  authName: document.getElementById("auth-name"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  authTogglePassword: document.getElementById("auth-toggle-password"),
  authSubmitBtn: document.getElementById("auth-submit-btn"),
  authMessage: document.getElementById("auth-message"),
  loginModeBtn: document.getElementById("auth-mode-login"),
  registerModeBtn: document.getElementById("auth-mode-register"),
  adminPanel: document.getElementById("admin-panel"),
  productForm: document.getElementById("product-form"),
  productId: document.getElementById("product-id"),
  productName: document.getElementById("product-name"),
  productPrice: document.getElementById("product-price"),
  productCategory: document.getElementById("product-category"),
  productSubcategory: document.getElementById("product-subcategory"),
  productDescription: document.getElementById("product-description"),
  productStock: document.getElementById("product-stock"),
  productImage: document.getElementById("product-image"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  adminSearchInput: document.getElementById("admin-search"),
  adminProducts: document.getElementById("admin-products"),
  clearCartBtn: document.getElementById("clear-cart-btn"),
};

let products = [];
let cart = JSON.parse(localStorage.getItem("lakajuarCart") || "[]");
const activeDiscount = 0;
let currentCategory = "joyas";
let currentSubcategory = "todos";
let isRegisterMode = false;
let currentUserProfile = null;
let toastTimer = null;
let adminSearchQuery = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function sanitizeImageUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return FALLBACK_IMG;
  if (trimmed === FALLBACK_IMG) return FALLBACK_IMG;

  try {
    const resolved = new URL(trimmed, window.location.origin);
    if (["http:", "https:"].includes(resolved.protocol)) {
      return resolved.toString();
    }
  } catch {
    return FALLBACK_IMG;
  }

  return FALLBACK_IMG;
}

function getStoreWhatsAppNumber() {
  return runtimeConfig?.storeWhatsAppNumber || STORE_WHATSAPP_FALLBACK;
}

function validateRuntimeConfig(config) {
  const firebase = config?.firebaseConfig;
  const requiredKeys = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
  return requiredKeys.every(key => firebase?.[key] && !String(firebase[key]).startsWith("REEMPLAZA_"));
}

async function loadRuntimeConfig() {
  const response = await fetch("/api/public-config", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`runtime-config-${response.status}`);
  }

  const config = await response.json();
  if (!validateRuntimeConfig(config)) {
    throw new Error("runtime-config-invalid");
  }

  runtimeConfig = config;
}

function initializeFirebaseServices() {
  app = initializeApp(runtimeConfig.firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

function formatMoney(value) {
  return `Gs. ${Math.round(value).toLocaleString("es-PY")}`;
}

function normalizeWhatsAppNumber(rawNumber) {
  return String(rawNumber || "").replace(/\D/g, "");
}

function buildWhatsAppWelcomeMessage() {
  return "Bienvenido a la Tienda Lakajuar, pronto seras atendido, te atenderemos en breve. Gracias por tu compra 🙏✨😊";
}

function buildWhatsAppCheckoutMessage(items, totals) {
  const lines = [
    buildWhatsAppWelcomeMessage(),
    "",
    "Productos:",
    ...items.map(item => `- ${item.quantity} x ${item.name} (${formatMoney(item.price)} c/u) = ${formatMoney(item.price * item.quantity)}`),
    "",
    `Subtotal: ${formatMoney(totals.subtotal)}`,
    `Descuento: ${formatMoney(totals.discountAmount)}`,
    `Total estimado: ${formatMoney(totals.total)}`,
    "",
    "Quedo atento para coordinar pago y entrega.",
  ];

  return lines.join("\n");
}

function normalizeStockStatus(value) {
  const normalized = String(value || "").toLowerCase().trim();
  if (normalized === "agotado" || normalized === "proximo_ingreso") return normalized;
  return "disponible";
}

function getProductStockStatus(product) {
  if (!product) return "disponible";
  return normalizeStockStatus(product.stockStatus || (product.inStock === false ? "agotado" : "disponible"));
}

function getStockBadgeConfig(stockStatus) {
  if (stockStatus === "agotado") {
    return {
      className: "agotado",
      label: "Agotado",
      buttonLabel: "Agotado",
      canAddToCart: false,
    };
  }

  if (stockStatus === "proximo_ingreso") {
    return {
      className: "proximo-ingreso",
      label: "Próximo ingreso",
      buttonLabel: "Próximo ingreso",
      canAddToCart: false,
    };
  }

  return {
    className: "disponible",
    label: "Disponible",
    buttonLabel: "Agregar al carrito",
    canAddToCart: true,
  };
}

function buildWhatsAppUrl(message) {
  const whatsappNumber = normalizeWhatsAppNumber(getStoreWhatsAppNumber());
  if (!whatsappNumber) return "";
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function bindWhatsAppLink(linkElement) {
  linkElement?.addEventListener("click", event => {
    const whatsappUrl = buildWhatsAppUrl(buildWhatsAppWelcomeMessage());
    if (!whatsappUrl) {
      event.preventDefault();
      showToast("El contacto de WhatsApp no esta disponible en este momento.", "error");
      return;
    }

    linkElement.href = whatsappUrl;
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function preferredCategoryOrder(categories) {
  const existing = [...new Set(categories.map(c => String(c || "").toLowerCase().trim()).filter(Boolean))];
  const extras = existing.filter(c => !BASE_CATEGORIES.includes(c)).sort();
  return [...BASE_CATEGORIES, ...extras];
}

function normalizeCategory(value) {
  const normalized = String(value || "").toLowerCase().trim();
  if (!normalized) return BASE_CATEGORIES[0];
  return normalized;
}

function getSubcategoryOptions(category) {
  const normalizedCategory = normalizeCategory(category);
  const base = SUBCATEGORY_PRESETS[normalizedCategory] || ["general"];
  const dynamic = products
    .filter(product => normalizeCategory(product.category) === normalizedCategory)
    .map(product => slugify(product.subcategory || ""))
    .filter(Boolean);

  const options = [...new Set([...base, ...dynamic])];
  return options.length ? options : ["general"];
}

function formatSubcategoryLabel(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "General";
  if (normalized === "power-banks") return "Power Banks";
  if (normalized === "airpods") return "AirPods";

  return normalized
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function normalizeSubcategoryForCategory(value, category) {
  const allowed = getSubcategoryOptions(category);
  const normalized = slugify(value || "");
  if (normalized && allowed.includes(normalized)) return normalized;
  return allowed[0];
}

function syncAdminSubcategorySelect(selectedValue = "") {
  if (!ui.productSubcategory) return;

  const category = normalizeCategory(ui.productCategory?.value || currentCategory);
  const options = getSubcategoryOptions(category);
  const normalizedSelected = normalizeSubcategoryForCategory(selectedValue || ui.productSubcategory.value, category);

  ui.productSubcategory.innerHTML = options
    .map(option => `<option value="${escapeAttribute(option)}">${escapeHtml(formatSubcategoryLabel(option))}</option>`)
    .join("");

  ui.productSubcategory.value = normalizedSelected;
}

function syncAdminCategorySelect(selectedValue = "") {
  if (!ui.productCategory) return;

  const dynamicCategories = preferredCategoryOrder(products.map(p => p.category));
  const allCategories = dynamicCategories.length ? dynamicCategories : BASE_CATEGORIES;
  const normalizedSelected = String(selectedValue || "").toLowerCase().trim();

  if (normalizedSelected && !allCategories.includes(normalizedSelected)) {
    allCategories.push(normalizedSelected);
  }

  ui.productCategory.innerHTML = allCategories
    .map(category => `<option value="${escapeAttribute(category)}">${escapeHtml(category.toUpperCase())}</option>`)
    .join("");

  const nextValue = normalizedSelected || ui.productCategory.value || allCategories[0];
  ui.productCategory.value = allCategories.includes(nextValue) ? nextValue : allCategories[0];
  syncAdminSubcategorySelect();
}

function ensureCartIntegrity() {
  const validIds = new Set(products.map(p => p.id));
  cart = cart.filter(item => validIds.has(item.id) && item.quantity > 0);
}

function getCartItems() {
  return cart
    .map(({ id, quantity }) => {
      const product = products.find(p => p.id === id);
      return product ? { ...product, quantity } : null;
    })
    .filter(Boolean);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function calculateCartSubtotal() {
  return getCartItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateCartTotal() {
  const subtotal = calculateCartSubtotal();
  return {
    subtotal,
    discountAmount: 0,
    total: subtotal,
  };
}

function updateCartSummary() {
  const count = getCartCount();
  if (ui.cartCount) ui.cartCount.textContent = count;
  if (ui.floatingCartCount) ui.floatingCartCount.textContent = count;

  if (ui.cartStatus) {
    ui.cartStatus.classList.add("cart-bounce");
    setTimeout(() => ui.cartStatus.classList.remove("cart-bounce"), 380);
  }
}

function saveCart() {
  localStorage.setItem("lakajuarCart", JSON.stringify(cart));
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

function renderProducts(productList) {
  if (!ui.productGrid) return;

  if (productList.length === 0) {
    ui.productGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛍️</div>
        <div class="empty-state-face">( ˘̹ ³˘̹)</div>
        <p class="empty-state-title">Nada por aquí todavía</p>
        <p class="empty-state-subtitle">Esta categoría aún no tiene productos disponibles.<br>¡Volvé pronto!</p>
      </div>
    `;
    return;
  }

  ui.productGrid.innerHTML = productList
    .map(
      p => {
    const stock = getStockBadgeConfig(getProductStockStatus(p));
    return `
    <article class="product-card">
      <img src="${escapeAttribute(p.img)}" alt="${escapeAttribute(p.name)}" onerror="handleImgError(this)" />
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.desc)}</p>
      <div class="stock-badge ${stock.className}">${stock.label}</div>
      <div class="price">${formatMoney(p.price)}</div>
      <button class="btn ${stock.canAddToCart ? "" : "btn-out-stock"}" data-add-cart="${escapeAttribute(p.id)}" ${stock.canAddToCart ? "" : "disabled"}>
        ${stock.buttonLabel}
      </button>
    </article>
  `;
      },
    )
    .join("");

  ui.productGrid.querySelectorAll("[data-add-cart]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-add-cart");
      addToCart(id);
    });
  });
}

function renderCategoryTabs() {
  if (!ui.categoryTabs) return;
  const categories = preferredCategoryOrder(products.map(p => p.category));
  syncAdminCategorySelect();
  if (categories.length === 0) {
    ui.categoryTabs.innerHTML = "";
    return;
  }

  if (!categories.includes(currentCategory)) {
    currentCategory = categories[0];
  }

  const subcategoryOptions = getSubcategoryOptions(currentCategory);
  if (currentSubcategory !== "todos" && !subcategoryOptions.includes(currentSubcategory)) {
    currentSubcategory = "todos";
  }

  ui.categoryTabs.innerHTML = categories
    .map(
      cat => `
      <button class="tab-button ${cat === currentCategory ? "active" : ""}" data-cat="${escapeAttribute(cat)}" role="tab">
        ${escapeHtml(cat.toUpperCase())}
      </button>
    `,
    )
    .join("");

  ui.categoryTabs.querySelectorAll(".tab-button").forEach(tab => {
    tab.addEventListener("click", () => {
      currentCategory = tab.getAttribute("data-cat") || "joyas";
      currentSubcategory = "todos";
      renderCategoryTabs();
      applyFilters();
    });
  });

  renderSubcategoryTabs();
}

function renderSubcategoryTabs() {
  if (!ui.subcategoryTabs) return;
  const subcategories = getSubcategoryOptions(currentCategory);

  ui.subcategoryTabs.innerHTML = ["todos", ...subcategories]
    .map(
      subcategory => `
      <button class="subtab-button ${subcategory === currentSubcategory ? "active" : ""}" data-subcat="${escapeAttribute(subcategory)}" role="tab">
        ${escapeHtml(subcategory === "todos" ? "Todos" : formatSubcategoryLabel(subcategory))}
      </button>
    `,
    )
    .join("");

  ui.subcategoryTabs.querySelectorAll(".subtab-button").forEach(tab => {
    tab.addEventListener("click", () => {
      currentSubcategory = tab.getAttribute("data-subcat") || "todos";
      renderSubcategoryTabs();
      applyFilters();
    });
  });
}

function applyFilters() {
  const queryText = (ui.searchInput?.value || "").trim().toLowerCase();
  const filtered = products.filter(p => {
    const matchCategory = p.category === currentCategory;
    const productSubcategory = normalizeSubcategoryForCategory(p.subcategory, p.category);
    const matchSubcategory = currentSubcategory === "todos" || productSubcategory === currentSubcategory;
    const matchQuery = !queryText
      || p.name.toLowerCase().includes(queryText)
      || p.desc.toLowerCase().includes(queryText)
      || formatSubcategoryLabel(productSubcategory).toLowerCase().includes(queryText);
    return matchCategory && matchSubcategory && matchQuery;
  });
  renderProducts(filtered);
}

function renderCartDrawer() {
  if (!ui.cartItems || !ui.cartSubtotal || !ui.cartDiscount || !ui.cartTotal) return;

  const cartItems = getCartItems();

  if (cartItems.length === 0) {
    ui.cartItems.innerHTML = "<p>Tu carrito está vacío. Agrega productos para comenzar.</p>";
  } else {
    ui.cartItems.innerHTML = cartItems
      .map(
        item => `
      <div class="cart-item">
        <div class="item-details">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-price">${formatMoney(item.price)} c/u</div>
        </div>
        <div class="item-controls">
          <button class="qty-btn" data-action="decrease" data-id="${escapeAttribute(item.id)}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-action="increase" data-id="${escapeAttribute(item.id)}">+</button>
          <button class="remove-item" data-id="${escapeAttribute(item.id)}" aria-label="Quitar ${escapeAttribute(item.name)}">x</button>
        </div>
      </div>
    `,
      )
      .join("");
  }

  const totals = calculateCartTotal();
  ui.cartSubtotal.textContent = formatMoney(totals.subtotal);
  ui.cartDiscount.textContent = formatMoney(totals.discountAmount);
  ui.cartTotal.textContent = formatMoney(totals.total);
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const stockStatus = getProductStockStatus(product);
  if (stockStatus !== "disponible") {
    if (stockStatus === "proximo_ingreso") {
      showToast(`${product.name} tendrá próximo ingreso.`, "error");
    } else {
      showToast(`${product.name} está agotado por ahora.`, "error");
    }
    return;
  }
  addItemToCart(productId, 1);
  showToast(`${product.name} agregado al carrito. 🛒`, "success");
}

function openCartDrawer() {
  if (ui.cartDrawer) ui.cartDrawer.classList.add("open");
}

function closeCartDrawer() {
  if (ui.cartDrawer) ui.cartDrawer.classList.remove("open");
}

function showAuthMessage(message, isError = false) {
  if (!ui.authMessage) return;
  ui.authMessage.textContent = message;
  ui.authMessage.style.color = isError ? "#c0392b" : "#2e7d32";
}

function showToast(message, type = "success") {
  if (!ui.toastContainer) return;

  ui.toastContainer.innerHTML = "";
  const toast = document.createElement("div");
  toast.className = `app-toast ${type}`;
  toast.textContent = message;
  ui.toastContainer.appendChild(toast);

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.remove();
  }, 3000);
}

function getFriendlyAuthError(errorCode, registerMode) {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return registerMode
        ? "Ese correo ya fue registrado. Inicia sesion con esa cuenta o usa otro correo."
        : "Ese correo ya existe, pero no pudimos iniciar sesion con los datos ingresados.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Correo o contrasena incorrectos. Verifica tus datos e intenta de nuevo.";
    case "auth/invalid-email":
      return "El correo ingresado no es valido.";
    case "auth/weak-password":
      return "La contrasena es muy debil. Usa al menos 6 caracteres.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento e intenta nuevamente.";
    case "auth/network-request-failed":
      return "No se pudo conectar con Firebase. Revisa tu internet e intenta otra vez.";
    case "permission-denied":
      return "Tu cuenta no tiene permisos para esta accion.";
    default:
      return `Error: ${errorCode || "No se pudo completar la accion."}`;
  }
}

function getFriendlyDataError(error) {
  const code = error?.code || "";
  if (code === "permission-denied") {
    return "No tienes permisos para esta accion. Verifica reglas de Firestore/Storage y que hayas iniciado sesion con el admin.";
  }
  if (code === "storage/unauthorized") {
    return "No se pudo subir la imagen: Storage no autoriza esta cuenta. Revisa las reglas de Storage.";
  }
  if (code === "storage/object-not-found") {
    return "No se encontro el archivo de imagen seleccionado.";
  }
  if (code === "unauthenticated") {
    return "Debes iniciar sesion para administrar productos.";
  }
  return `No se pudo completar la operacion (${code || "error-desconocido"}).`;
}

function setAuthMode(registerMode) {
  isRegisterMode = registerMode;
  if (!ui.authTitle || !ui.authSubmitBtn || !ui.authName || !ui.loginModeBtn || !ui.registerModeBtn) return;

  ui.authTitle.textContent = registerMode ? "Crear cuenta cliente" : "Iniciar sesión";
  ui.authSubmitBtn.textContent = registerMode ? "Crear cuenta" : "Entrar";
  ui.authName.required = registerMode;
  ui.authNameGroup?.classList.toggle("hidden", !registerMode);
  ui.authPassword.setAttribute("autocomplete", registerMode ? "new-password" : "current-password");

  ui.loginModeBtn.classList.toggle("secondary", registerMode);
  ui.registerModeBtn.classList.toggle("secondary", !registerMode);
}

function openAuthModal() {
  if (!ui.authModal) return;
  ui.authModal.classList.remove("hidden");
  ui.authModal.setAttribute("aria-hidden", "false");
  showAuthMessage("");
}

function closeAuthModal() {
  if (!ui.authModal) return;
  ui.authModal.classList.add("hidden");
  ui.authModal.setAttribute("aria-hidden", "true");
  ui.authForm.reset();
  showAuthMessage("");
}

async function upsertUserProfile(user, displayName = "") {
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: displayName || user.email,
      email: user.email,
      role: "cliente",
      createdAt: serverTimestamp(),
    });
  }

  const latest = await getDoc(userRef);
  currentUserProfile = latest.exists() ? latest.data() : { role: "cliente", email: user.email };
}

async function ensureUserProfile(user, displayName = "") {
  try {
    await upsertUserProfile(user, displayName);
  } catch {
    // If Firestore rules block profile read/write, keep auth session alive with a safe fallback role.
    currentUserProfile = {
      uid: user.uid,
      email: user.email,
      role: "cliente",
    };
  }
}

function updateAuthUI() {
  const user = auth.currentUser;
  const isLogged = !!user;
  const role = currentUserProfile?.role || "cliente";

  ui.authOpenBtn?.classList.toggle("hidden", isLogged);
  ui.authLogoutBtn?.classList.toggle("hidden", !isLogged);

  if (ui.authRoleBadge) {
    if (isLogged) {
      ui.authRoleBadge.textContent = role === "admin" ? "Administrador" : "Cliente";
      ui.authRoleBadge.classList.remove("hidden");
    } else {
      ui.authRoleBadge.classList.add("hidden");
      ui.authRoleBadge.textContent = "";
    }
  }

  if (ui.adminPanel) {
    ui.adminPanel.classList.toggle("hidden", role !== "admin");
  }
}

async function uploadProductImageIfNeeded(file) {
  if (!file) return "";
  const fileName = `${Date.now()}-${slugify(file.name)}`;
  const storageRef = ref(storage, `products/${fileName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

function resetProductForm() {
  ui.productForm?.reset();
  if (ui.productId) ui.productId.value = "";
  if (ui.productStock) ui.productStock.value = "disponible";
  syncAdminCategorySelect("joyas");
  syncAdminSubcategorySelect();
}

function normalizeProduct(raw, fallbackId) {
  const stockStatus = normalizeStockStatus(raw.stockStatus || (raw.inStock === false ? "agotado" : "disponible"));
  const category = normalizeCategory(raw.category || "accesorios");
  const subcategory = normalizeSubcategoryForCategory(raw.subcategory, category);
  return {
    id: String(raw.id || fallbackId),
    name: raw.name || "Producto",
    price: Number(raw.price || 0),
    category,
    subcategory,
    desc: raw.desc || "",
    img: sanitizeImageUrl(raw.img),
    inStock: stockStatus === "disponible",
    stockStatus,
    active: raw.active !== false,
  };
}

function renderAdminProducts() {
  if (!ui.adminProducts) return;

  const queryText = adminSearchQuery.trim().toLowerCase();
  const listedProducts = queryText
    ? products.filter(item => {
      const subcategoryLabel = formatSubcategoryLabel(item.subcategory).toLowerCase();
      return item.name.toLowerCase().includes(queryText)
        || item.category.toLowerCase().includes(queryText)
        || subcategoryLabel.includes(queryText);
    })
    : products;

  const productRows = listedProducts
    .map(
      p => {
      const stockStatus = getProductStockStatus(p);
      return `
      <div class="admin-product-row" data-product-row-id="${p.id}">
        <img src="${escapeAttribute(p.img)}" alt="${escapeAttribute(p.name)}" onerror="handleImgError(this)" />
        <div class="admin-product-main">
          <strong>${escapeHtml(p.name)}</strong>
          <div>${formatMoney(p.price)} - ${escapeHtml(p.category.toUpperCase())} / ${escapeHtml(formatSubcategoryLabel(p.subcategory))}</div>
          <div class="stock-badge ${getStockBadgeConfig(stockStatus).className}">${getStockBadgeConfig(stockStatus).label}</div>
          <div class="admin-quick-edit">
            <input type="number" min="0" step="100" value="${p.price}" data-quick-price />
            <select data-quick-stock>
              <option value="disponible" ${stockStatus === "disponible" ? "selected" : ""}>Disponible</option>
              <option value="agotado" ${stockStatus === "agotado" ? "selected" : ""}>Agotado</option>
              <option value="proximo_ingreso" ${stockStatus === "proximo_ingreso" ? "selected" : ""}>Próximo ingreso</option>
            </select>
            <button class="btn secondary" data-quick-save-id="${escapeAttribute(p.id)}">Guardar rápido</button>
          </div>
        </div>
        <div class="admin-product-actions">
          <button class="btn" data-edit-id="${escapeAttribute(p.id)}">Editar</button>
          <button class="btn secondary" data-delete-id="${escapeAttribute(p.id)}">Eliminar</button>
        </div>
      </div>
    `;
      },
    )
    .join("");

  ui.adminProducts.innerHTML = productRows || "<p>No se encontraron productos con ese filtro.</p>";

  ui.adminProducts.querySelectorAll("[data-edit-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = products.find(item => item.id === btn.getAttribute("data-edit-id"));
      if (!product) return;

      ui.productId.value = product.id;
      ui.productName.value = product.name;
      ui.productPrice.value = product.price;
      syncAdminCategorySelect(product.category);
      syncAdminSubcategorySelect(product.subcategory);
      ui.productDescription.value = product.desc;
      if (ui.productStock) ui.productStock.value = getProductStockStatus(product);
      window.scrollTo({ top: ui.adminPanel.offsetTop - 20, behavior: "smooth" });
    });
  });

  ui.adminProducts.querySelectorAll("[data-quick-save-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-quick-save-id");
      if (!id) return;

      const row = btn.closest(".admin-product-row");
      const priceInput = row?.querySelector("[data-quick-price]");
      const stockSelect = row?.querySelector("[data-quick-stock]");
      const newPrice = Number(priceInput?.value);
      const stockStatus = normalizeStockStatus(stockSelect?.value);
      const inStock = stockStatus === "disponible";

      if (Number.isNaN(newPrice) || newPrice < 0) {
        showToast("Ingresa un precio válido en la edición rápida.", "error");
        return;
      }

      try {
        await updateDoc(doc(db, "products", id), {
          price: newPrice,
          inStock,
          stockStatus,
          updatedAt: serverTimestamp(),
        });
        showToast("Producto actualizado rápido correctamente.", "success");
      } catch (error) {
        alert(getFriendlyDataError(error));
      }
    });
  });

  ui.adminProducts.querySelectorAll("[data-delete-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delete-id");
      if (!id) return;
      if (!confirm("¿Eliminar este producto?")) return;
      try {
        await deleteDoc(doc(db, "products", id));
        showToast("Producto eliminado correctamente.", "success");
      } catch (error) {
        alert(getFriendlyDataError(error));
      }
    });
  });
}

function normalizeImageUrl(url) {
  if (!url) return "";
  // Convierte https://imgur.com/XXXXX  →  https://i.imgur.com/XXXXX.jpg
  const imgurPage = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/);
  if (imgurPage) return sanitizeImageUrl(`https://i.imgur.com/${imgurPage[1]}.jpg`);
  return sanitizeImageUrl(url);
}

function bindUIEvents() {
  ui.searchInput?.addEventListener("input", applyFilters);
  ui.productCategory?.addEventListener("change", () => {
    syncAdminSubcategorySelect();
  });
  ui.adminSearchInput?.addEventListener("input", () => {
    adminSearchQuery = (ui.adminSearchInput?.value || "").toLowerCase();
    renderAdminProducts();
  });

  ui.cartToggleBtn?.addEventListener("click", openCartDrawer);
  ui.closeCartDrawerBtn?.addEventListener("click", closeCartDrawer);

  ui.cartItems?.addEventListener("click", event => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches(".qty-btn")) {
      const id = target.getAttribute("data-id");
      const action = target.getAttribute("data-action");
      if (!id) return;
      changeItemQuantity(id, action === "increase" ? 1 : -1);
    }

    if (target.matches(".remove-item")) {
      const id = target.getAttribute("data-id");
      if (!id) return;
      removeItemFromCart(id);
    }
  });

  ui.checkoutBtn?.addEventListener("click", () => {
    const totals = calculateCartTotal();
    const items = getCartItems();
    if (totals.total <= 0) {
      alert("Tu carrito está vacío. Agrega productos antes de pagar.");
      return;
    }

    const message = buildWhatsAppCheckoutMessage(items, totals);
    const whatsappUrl = buildWhatsAppUrl(message);
    if (!whatsappUrl) {
      showToast("El contacto de WhatsApp no esta disponible en este momento.", "error");
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    showToast("Te redirigimos a WhatsApp para coordinar tu compra.", "success");

    cart = [];
    saveCart();
    closeCartDrawer();
  });

  ui.authOpenBtn?.addEventListener("click", openAuthModal);
  ui.authCloseBtn?.addEventListener("click", closeAuthModal);
  ui.authLogoutBtn?.addEventListener("click", async () => {
    if (!auth) return;
    await signOut(auth);
  });

  ui.loginModeBtn?.addEventListener("click", () => setAuthMode(false));
  ui.registerModeBtn?.addEventListener("click", () => setAuthMode(true));

  ui.authTogglePassword?.addEventListener("click", () => {
    const isHidden = ui.authPassword.type === "password";
    ui.authPassword.type = isHidden ? "text" : "password";
    ui.authTogglePassword.textContent = isHidden ? "🙈" : "👁";
    ui.authTogglePassword.setAttribute("aria-label", isHidden ? "Ocultar contraseña" : "Mostrar contraseña");
    ui.authTogglePassword.setAttribute("title", isHidden ? "Ocultar contraseña" : "Mostrar contraseña");
  });

  ui.authForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!auth) {
      showAuthMessage("El acceso no esta disponible hasta cargar la configuracion segura.", true);
      return;
    }

    const email = ui.authEmail?.value?.trim();
    const password = ui.authPassword?.value;
    const name = ui.authName?.value?.trim();

    if (!email || !password) {
      showAuthMessage("Completa correo y contraseña.", true);
      return;
    }

    try {
      if (isRegisterMode) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(cred.user, name || "Cliente");
        showAuthMessage("Cuenta cliente creada correctamente.");
        showToast("Cuenta creada correctamente. Bienvenido a LAKAJUAR.", "success");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(cred.user);
        showAuthMessage("Ingreso correcto.");
        showToast("Ingreso correcto. Bienvenido nuevamente.", "success");
      }
      setTimeout(closeAuthModal, 600);
    } catch (error) {
      if (error?.code === "auth/email-already-in-use" && isRegisterMode) {
        setAuthMode(false);
      }
      showAuthMessage(getFriendlyAuthError(error?.code, isRegisterMode), true);
    }
  });

  ui.productForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!db) {
      showToast("La administracion no esta disponible hasta cargar la configuracion segura.", "error");
      return;
    }

    if (currentUserProfile?.role !== "admin") {
      alert("Solo la cuenta admin puede crear o editar productos.");
      return;
    }

    const id = ui.productId.value;
    const name = ui.productName.value.trim();
    const price = Number(ui.productPrice.value);
    const category = normalizeCategory(ui.productCategory.value);
    const subcategory = normalizeSubcategoryForCategory(ui.productSubcategory?.value, category);
    const desc = ui.productDescription.value.trim();
    const stockStatus = normalizeStockStatus(ui.productStock.value);
    const inStock = stockStatus === "disponible";
    const imageUrl = normalizeImageUrl((ui.productImage.value || "").trim());

    if (!name || !category || !desc || Number.isNaN(price)) {
      showToast("Completa todos los campos obligatorios del producto.", "error");
      return;
    }

    try {
      if (id) {
        const productRef = doc(db, "products", id);
        const current = products.find(item => item.id === id);
        await updateDoc(productRef, {
          name,
          price,
          category,
          subcategory,
          desc,
          inStock,
          stockStatus,
          img: imageUrl || current?.img || FALLBACK_IMG,
          active: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "products"), {
          name,
          price,
          category,
          subcategory,
          desc,
          inStock,
          stockStatus,
          img: imageUrl || FALLBACK_IMG,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      showToast(id ? "Producto actualizado correctamente." : "Producto creado correctamente.", "success");
      resetProductForm();
    } catch (error) {
      const code = error?.code || "desconocido";
      alert(`${getFriendlyDataError(error)}\n\nCódigo: ${code}`);
    }
  });

  ui.cancelEditBtn?.addEventListener("click", resetProductForm);
  bindWhatsAppLink(ui.whatsappContactLink);
  bindWhatsAppLink(ui.whatsappFloatBtn);

  ui.clearCartBtn?.addEventListener("click", () => {
    if (cart.length === 0) return;
    if (!confirm("¿Vaciar todo el carrito?")) return;
    cart = [];
    saveCart();
    showToast("Carrito vaciado.", "success");
  });
}

function seedLocalFallbackProducts() {
  if (!IS_LOCAL_DEV) return;
  products = DEFAULT_PRODUCTS.map((item, index) => normalizeProduct(item, `seed-${index + 1}`));
  ensureCartIntegrity();
  renderCategoryTabs();
  applyFilters();
  renderAdminProducts();
  saveCart();
}

function resetUiWithoutSeedProducts() {
  products = [];
  ensureCartIntegrity();
  renderCategoryTabs();
  applyFilters();
  renderAdminProducts();
  saveCart();
}

function subscribeProducts() {
  const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));

  onSnapshot(
    productsQuery,
    snapshot => {
      if (snapshot.empty) {
        products = [];
        ensureCartIntegrity();
        renderCategoryTabs();
        applyFilters();
        renderAdminProducts();
        saveCart();
        return;
      }

      products = snapshot.docs.map(docSnap => normalizeProduct({ id: docSnap.id, ...docSnap.data() }, docSnap.id));
      ensureCartIntegrity();
      renderCategoryTabs();
      applyFilters();
      renderAdminProducts();
      saveCart();
    },
    error => {
      if (IS_LOCAL_DEV) {
        seedLocalFallbackProducts();
        return;
      }

      resetUiWithoutSeedProducts();
      showToast(`No se pudieron cargar productos desde Firebase (${error?.code || "error"}).`, "error");
    },
  );
}

function attachAuthObserver() {
  if (!auth) return;

  onAuthStateChanged(auth, async user => {
    if (user) {
      try {
        await upsertUserProfile(user);
      } catch {
        currentUserProfile = { email: user.email, role: "cliente" };
      }
    } else {
      currentUserProfile = null;
    }

    updateAuthUI();
    renderAdminProducts();
  });
}

async function bootstrap() {
  bindUIEvents();
  setAuthMode(false);

  try {
    await loadRuntimeConfig();
    initializeFirebaseServices();
    attachAuthObserver();
    subscribeProducts();
  } catch {
    if (IS_LOCAL_DEV) {
      seedLocalFallbackProducts();
      showAuthMessage("No se pudo cargar la configuracion segura del sitio.", true);
      showToast("Modo local: se cargaron productos de prueba.", "error");
      return;
    }

    resetUiWithoutSeedProducts();
    showAuthMessage("Falta configurar variables seguras en Cloudflare Pages.", true);
    showToast("Configuracion remota pendiente: la tienda no se conecto a Firebase.", "error");
  }
}

window.handleImgError = function (img) {
  img.onerror = null;
  img.src = FALLBACK_IMG;
};

bootstrap();
