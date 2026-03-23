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
import { firebaseConfig, ADMIN_EMAILS } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const DEFAULT_PRODUCTS = [
  {
    category: "joyas",
    name: "Collar LAKAJUAR",
    price: 60000,
    img: "assets/images/products/collar-lakajuar.jpg",
    desc: "Collar delicado y elegante para uso diario.",
    active: true,
  },
  {
    category: "joyas",
    name: "Aros LAKAJUAR",
    price: 10000,
    img: "assets/images/products/aros-lakajuar.jpg",
    desc: "Aros finos y livianos para cualquier ocasión.",
    active: true,
  },
  {
    category: "joyas",
    name: "Set de aros mini",
    price: 10000,
    img: "assets/images/products/aros-lakajuar.jpg",
    desc: "Set de aros pequeños con diseño moderno.",
    active: true,
  },
  {
    category: "cases",
    name: "Case transparente",
    price: 18000,
    img: "https://via.placeholder.com/400x300?text=Case+transparente",
    desc: "Protección slim sin perder diseño.",
    active: true,
  },
  {
    category: "accesorios",
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
  cartCount: document.getElementById("cart-count"),
  floatingCartCount: document.getElementById("floating-cart-count"),
  cartStatus: document.querySelector(".cart-status"),
  cartDrawer: document.getElementById("cart-drawer"),
  cartToggleBtn: document.getElementById("cart-toggle-btn"),
  closeCartDrawerBtn: document.getElementById("close-cart-drawer"),
  cartItems: document.getElementById("cart-items"),
  cartSubtotal: document.getElementById("cart-subtotal"),
  cartDiscount: document.getElementById("cart-discount"),
  cartShipping: document.getElementById("cart-shipping"),
  cartTotal: document.getElementById("cart-total"),
  checkoutBtn: document.getElementById("checkout-btn"),
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
  productDescription: document.getElementById("product-description"),
  productImage: document.getElementById("product-image"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  adminProducts: document.getElementById("admin-products"),
};

let products = [];
let cart = JSON.parse(localStorage.getItem("lakajuarCart") || "[]");
let activeDiscount = Number(JSON.parse(localStorage.getItem("lakajuarDiscount") || "0"));
let currentCategory = "joyas";
let isRegisterMode = false;
let currentUserProfile = null;
let toastTimer = null;

function formatMoney(value) {
  return `Gs. ${Math.round(value).toLocaleString("es-PY")}`;
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
  const preferred = ["joyas", "cases", "accesorios"];
  const existing = [...new Set(categories.map(c => c.toLowerCase()))];
  const sorted = preferred.filter(c => existing.includes(c));
  const extras = existing.filter(c => !preferred.includes(c)).sort();
  return [...sorted, ...extras];
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

function calculateShipping(subtotal) {
  if (subtotal === 0) return 0;
  if (subtotal >= 120000) return 0;
  return 15000;
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
  if (ui.cartCount) ui.cartCount.textContent = count;
  if (ui.floatingCartCount) ui.floatingCartCount.textContent = count;

  if (ui.cartStatus) {
    ui.cartStatus.classList.add("cart-bounce");
    setTimeout(() => ui.cartStatus.classList.remove("cart-bounce"), 380);
  }
}

function saveCart() {
  localStorage.setItem("lakajuarCart", JSON.stringify(cart));
  localStorage.setItem("lakajuarDiscount", JSON.stringify(activeDiscount));
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
    ui.productGrid.innerHTML = "<p>No hay productos en esta categoría por ahora.</p>";
    return;
  }

  ui.productGrid.innerHTML = productList
    .map(
      p => `
    <article class="product-card">
      <img src="${p.img}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="price">${formatMoney(p.price)}</div>
      <button class="btn" data-add-cart="${p.id}">Agregar al carrito</button>
    </article>
  `,
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
  if (categories.length === 0) {
    ui.categoryTabs.innerHTML = "";
    return;
  }

  if (!categories.includes(currentCategory)) {
    currentCategory = categories[0];
  }

  ui.categoryTabs.innerHTML = categories
    .map(
      cat => `
      <button class="tab-button ${cat === currentCategory ? "active" : ""}" data-cat="${cat}" role="tab">
        ${cat.toUpperCase()}
      </button>
    `,
    )
    .join("");

  ui.categoryTabs.querySelectorAll(".tab-button").forEach(tab => {
    tab.addEventListener("click", () => {
      currentCategory = tab.getAttribute("data-cat") || "joyas";
      renderCategoryTabs();
      applyFilters();
    });
  });
}

function applyFilters() {
  const queryText = (ui.searchInput?.value || "").trim().toLowerCase();
  const filtered = products.filter(p => {
    const matchCategory = p.category === currentCategory;
    const matchQuery = !queryText || p.name.toLowerCase().includes(queryText) || p.desc.toLowerCase().includes(queryText);
    return matchCategory && matchQuery;
  });
  renderProducts(filtered);
}

function renderCartDrawer() {
  if (!ui.cartItems || !ui.cartSubtotal || !ui.cartDiscount || !ui.cartShipping || !ui.cartTotal) return;

  const cartItems = getCartItems();

  if (cartItems.length === 0) {
    ui.cartItems.innerHTML = "<p>Tu carrito está vacío. Agrega productos para comenzar.</p>";
  } else {
    ui.cartItems.innerHTML = cartItems
      .map(
        item => `
      <div class="cart-item">
        <div class="item-details">
          <div class="item-name">${item.name}</div>
          <div class="item-price">${formatMoney(item.price)} c/u</div>
        </div>
        <div class="item-controls">
          <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
          <button class="remove-item" data-id="${item.id}" aria-label="Quitar ${item.name}">x</button>
        </div>
      </div>
    `,
      )
      .join("");
  }

  const totals = calculateCartTotal();
  ui.cartSubtotal.textContent = formatMoney(totals.subtotal);
  ui.cartDiscount.textContent = formatMoney(totals.discountAmount);
  ui.cartShipping.textContent = formatMoney(totals.shipping);
  ui.cartTotal.textContent = formatMoney(totals.total);
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  addItemToCart(productId, 1);
  alert(`${product.name} agregado al carrito.`);
}

function openCartDrawer() {
  if (ui.cartDrawer) ui.cartDrawer.classList.add("open");
}

function closeCartDrawer() {
  if (ui.cartDrawer) ui.cartDrawer.classList.remove("open");
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.map(item => item.toLowerCase()).includes(email.toLowerCase());
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
  const role = isAdminEmail(user.email || "") ? "admin" : "cliente";

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: displayName || user.email,
      email: user.email,
      role,
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
      role: isAdminEmail(user.email || "") ? "admin" : "cliente",
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
}

function normalizeProduct(raw, fallbackId) {
  return {
    id: String(raw.id || fallbackId),
    name: raw.name || "Producto",
    price: Number(raw.price || 0),
    category: (raw.category || "accesorios").toLowerCase().trim(),
    desc: raw.desc || "",
    img: raw.img || "https://via.placeholder.com/400x300?text=Producto",
    active: raw.active !== false,
  };
}

function renderAdminProducts() {
  if (!ui.adminProducts) return;

  const productRows = products
    .map(
      p => `
      <div class="admin-product-row">
        <img src="${p.img}" alt="${p.name}" />
        <div>
          <strong>${p.name}</strong>
          <div>${formatMoney(p.price)} - ${p.category.toUpperCase()}</div>
        </div>
        <div class="admin-product-actions">
          <button class="btn" data-edit-id="${p.id}">Editar</button>
          <button class="btn secondary" data-delete-id="${p.id}">Eliminar</button>
        </div>
      </div>
    `,
    )
    .join("");

  ui.adminProducts.innerHTML = productRows || "<p>No hay productos cargados.</p>";

  ui.adminProducts.querySelectorAll("[data-edit-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = products.find(item => item.id === btn.getAttribute("data-edit-id"));
      if (!product) return;

      ui.productId.value = product.id;
      ui.productName.value = product.name;
      ui.productPrice.value = product.price;
      ui.productCategory.value = product.category;
      ui.productDescription.value = product.desc;
      window.scrollTo({ top: ui.adminPanel.offsetTop - 20, behavior: "smooth" });
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

function bindUIEvents() {
  ui.searchInput?.addEventListener("input", applyFilters);

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
    if (totals.total <= 0) {
      alert("Tu carrito está vacío. Agrega productos antes de pagar.");
      return;
    }

    alert(
      `Total a pagar ${formatMoney(totals.total)} (subtotal ${formatMoney(totals.subtotal)}, envío ${formatMoney(
        totals.shipping,
      )}, descuento ${formatMoney(totals.discountAmount)}). Gracias por comprar en LAKAJUAR.`,
    );

    cart = [];
    activeDiscount = 0;
    saveCart();
    closeCartDrawer();
  });

  ui.authOpenBtn?.addEventListener("click", openAuthModal);
  ui.authCloseBtn?.addEventListener("click", closeAuthModal);
  ui.authLogoutBtn?.addEventListener("click", async () => {
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
    if (currentUserProfile?.role !== "admin") {
      alert("Solo la cuenta admin puede crear o editar productos.");
      return;
    }

    const id = ui.productId.value;
    const name = ui.productName.value.trim();
    const price = Number(ui.productPrice.value);
    const category = ui.productCategory.value.trim().toLowerCase();
    const desc = ui.productDescription.value.trim();
    const file = ui.productImage.files?.[0];

    if (!name || !category || !desc || Number.isNaN(price)) {
      alert("Completa todos los campos obligatorios del producto.");
      return;
    }

    try {
      let imageUrl = "";
      if (file) {
        imageUrl = await uploadProductImageIfNeeded(file);
      }

      if (id) {
        const productRef = doc(db, "products", id);
        const current = products.find(item => item.id === id);
        await updateDoc(productRef, {
          name,
          price,
          category,
          desc,
          img: imageUrl || current?.img || "https://via.placeholder.com/400x300?text=Producto",
          active: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "products"), {
          name,
          price,
          category,
          desc,
          img: imageUrl || "https://via.placeholder.com/400x300?text=Producto",
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      showToast(id ? "Producto actualizado correctamente." : "Producto creado correctamente.", "success");
      resetProductForm();
    } catch (error) {
      alert(getFriendlyDataError(error));
    }
  });

  ui.cancelEditBtn?.addEventListener("click", resetProductForm);
}

function seedLocalFallbackProducts() {
  products = DEFAULT_PRODUCTS.map((item, index) => normalizeProduct(item, `seed-${index + 1}`));
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
        seedLocalFallbackProducts();
        return;
      }

      products = snapshot.docs.map(docSnap => normalizeProduct({ id: docSnap.id, ...docSnap.data() }, docSnap.id));
      ensureCartIntegrity();
      renderCategoryTabs();
      applyFilters();
      renderAdminProducts();
      saveCart();
    },
    () => {
      seedLocalFallbackProducts();
    },
  );
}

onAuthStateChanged(auth, async user => {
  if (user) {
    try {
      await upsertUserProfile(user);
    } catch {
      currentUserProfile = { email: user.email, role: isAdminEmail(user.email || "") ? "admin" : "cliente" };
    }
  } else {
    currentUserProfile = null;
  }

  updateAuthUI();
  renderAdminProducts();
});

function validateFirebaseConfig() {
  const values = Object.values(firebaseConfig || {});
  return values.every(value => value && !String(value).startsWith("REEMPLAZA_"));
}

function bootstrap() {
  bindUIEvents();
  setAuthMode(false);

  if (!validateFirebaseConfig()) {
    seedLocalFallbackProducts();
    showAuthMessage("Completa tu configuración Firebase en assets/js/firebase-config.js", true);
    return;
  }

  subscribeProducts();
}

bootstrap();
