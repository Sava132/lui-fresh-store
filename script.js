// --- 1. Настройка Supabase ---
const SUPABASE_URL = "https://iryyjhepgxxwccoyuavm.supabase.co";
const SUPABASE_KEY = "sb_publishable_f-hRSgZDWM0rAB1aaWqxYg_2ycwGWhO";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. Инициализация переменных ---
let cart = JSON.parse(localStorage.getItem("aetheris_cart")) || [];
let productsData = [];
let isSignUpMode = false;

const cartCount = document.getElementById("cart-count");
const cartPanel = document.getElementById("cart-side-panel");
const cartItemsList = document.getElementById("cart-items");
const totalSumElement = document.getElementById("total-sum");
const authModal = document.getElementById("auth-modal");
const authBtnIcon = document.getElementById("auth-btn");

// --- 3. Загрузка товаров ---
async function loadProducts() {
  const { data, error } = await _supabase.from("products").select("*");
  if (error) {
    showToast("Ошибка Supabase: " + error.message, "error");
    return;
  }
  productsData = data;
  renderProductCards(data);
}

function renderProductCards(products) {
  // Проверяем наличие контейнеров в HTML
  const containers = {
    smartphones: document.getElementById("smartphones-container"),
    computers: document.getElementById("computers-container"),
    peripherals: document.getElementById("peripherals-container"),
  };

  // Очистка перед рендером
  Object.values(containers).forEach((div) => {
    if (div) div.innerHTML = "";
  });

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card glass";
    card.innerHTML = `
            <div>
                <div class="product-badge" style="color: var(--accent); font-size: 12px; margin-bottom: 10px; text-transform: uppercase;">
                    ${product.category}
                </div>
                <h4 style="margin-bottom: 10px;">${product.name}</h4>
                <p style="font-size: 14px; opacity: 0.7;">${product.description || "Aetheris Tech Premium"}</p>
            </div>
            <div>
                <div class="price">${product.price} $</div>
                <button class="btn-glow" style="width:100%" onclick="addToCart('${product.name}', ${product.price})">В КОРЗИНУ</button>
            </div>
        `;

    // Добавляем в нужный контейнер по категории
    const target = containers[product.category] || containers.peripherals;
    if (target) {
      target.appendChild(card);
    }
  });
}

// --- 4. Логика поиска (Исправленная) ---

const logo = document.querySelector(".logo");
if (logo) {
  logo.style.cursor = "pointer"; // Делаем курсор рукой при наведении
  logo.addEventListener("click", () => {
    location.reload(); // Перезагрузка страницы
  });
}
function initSearch() {
  const searchInput = document.getElementById("product-search");
  const shopSection = document.getElementById("shop");

  if (!searchInput) return;

  // 1. Поиск при вводе (живой поиск)
  searchInput.addEventListener("input", (e) => {
    handleFiltering(e.target.value.toLowerCase().trim());
  });

  // 2. Поиск при нажатии Enter
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const term = e.target.value.toLowerCase().trim();
      const shopSection = document.getElementById("shop");

      // Вызываем фильтрацию (убедись, что логика фильтрации доступна)
      if (shopSection) {
        shopSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Скрываем клавиатуру на мобильных устройствах
      searchInput.blur();
    }
  });
  // Вынес логику фильтрации в отдельную под-функцию, чтобы не дублировать код
  function handleFiltering(term) {
    const categories = document.querySelectorAll(".category-group");
    let foundAny = false;

    categories.forEach((category) => {
      const cards = category.querySelectorAll(".product-card");
      let hasResults = false;

      cards.forEach((card) => {
        const title = card.querySelector("h4")?.innerText.toLowerCase() || "";
        const desc = card.querySelector("p")?.innerText.toLowerCase() || "";

        if (title.includes(term) || desc.includes(term)) {
          card.style.display = "flex";
          hasResults = true;
          foundAny = true;
        } else {
          card.style.display = "none";
        }
      });
      category.style.display = term === "" || hasResults ? "block" : "none";
    });

    // Авто-скролл при живом поиске (если ввели больше 2 символов)
    if (term.length > 2 && foundAny && shopSection) {
      shopSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
// --- 5. Корзина (с сохранением) ---
function addToCart(name, price) {
  cart.push({ id: Date.now(), name, price });
  saveCart();
  updateUI();
  showToast(`${name} добавлен в корзину!`);

  const logo = document.querySelector(".logo");
  if (logo) {
    logo.classList.add("glitch-effect");
    setTimeout(() => logo.classList.remove("glitch-effect"), 400);
  }
}

function saveCart() {
  localStorage.setItem("aetheris_cart", JSON.stringify(cart));
}

async function updateUI() {
  if (cartCount) cartCount.innerText = cart.length;
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  if (totalSumElement) totalSumElement.innerText = total;

  // Работа с пользователем Supabase
  const {
    data: { user },
  } = await _supabase.auth.getUser();
  const authContainer = document.querySelector(".header-right");
  let profileDisplay = document.getElementById("profile-display");

  if (user) {
    if (authBtnIcon) authBtnIcon.style.display = "none";
    if (!profileDisplay && authContainer) {
      profileDisplay = document.createElement("div");
      profileDisplay.id = "profile-display";
      profileDisplay.style.cssText =
        "display:flex; align-items:center; gap:10px; cursor:pointer;";
      authContainer.appendChild(profileDisplay);
    }
    if (profileDisplay) {
      profileDisplay.innerHTML = `
                <span style="color:var(--accent); font-size:14px; font-weight:bold;">${user.email.split("@")[0].toUpperCase()}</span>
                <i class="fas fa-sign-out-alt" onclick="handleLogout()" style="font-size:16px; opacity:0.6; margin-left:5px;"></i>
            `;
    }
  } else {
    if (authBtnIcon) authBtnIcon.style.display = "block";
    if (profileDisplay) profileDisplay.remove();
  }
}

async function handleLogout() {
  const { error } = await _supabase.auth.signOut();
  if (error) showToast(error.message, "error");
  else {
    showToast("Вы вышли из системы");
    updateUI();
    setTimeout(() => location.reload(), 500);
  }
}

function toggleCart() {
  if (cartPanel) cartPanel.classList.toggle("active");
  renderCart();
}

function renderCart() {
  if (!cartItemsList) return;
  cartItemsList.innerHTML =
    cart.length === 0
      ? '<p style="text-align:center; opacity:0.5; margin-top:50px;">Корзина пуста</p>'
      : "";

  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.style.cssText =
      "display:flex; justify-content:space-between; padding:15px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:10px; border: 1px solid var(--glass-border)";
    div.innerHTML = `
            <span>${item.name} <br> <small style="color:var(--accent)">${item.price} $</small></span>
            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:20px;">&times;</button>
        `;
    cartItemsList.appendChild(div);
  });
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateUI();
  renderCart();
}

function scrollToFooter() {
    const footer = document.querySelector('.main-footer');
    if (footer) {
        footer.scrollIntoView({ behavior: 'smooth' });
    }
}

async function handleAuthSubmit() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  if (isSignUpMode) {
    // Собираем доп. данные
    const profileData = {
      first_name: document.getElementById("reg-first-name").value,
      last_name: document.getElementById("reg-last-name").value,
      birthday: document.getElementById("reg-birthday").value,
      location: document.getElementById("reg-location").value,
      github_url: document.getElementById("reg-github").value,
      instagram_handle: document.getElementById("reg-instagram").value,
      discord_tag: document.getElementById("reg-discord").value,
    };

    const { data, error } = await _supabase.auth.signUp({ email, password });

    if (error) {
      showToast(error.message, "error");
    } else if (data.user) {
      // Сразу создаем профиль в нашей таблице
      const { error: profileError } = await _supabase
        .from("profiles")
        .insert([{ id: data.user.id, ...profileData }]);

      if (profileError) console.error("Ошибка профиля:", profileError);

      showToast("Код отправлен! Проверьте почту.", "success");
      // ... логика переключения на OTP ...
    }
  } else {
    // Логика входа остается прежней
  }
}

async function checkout() {
  // 1. Проверяем, есть ли вообще товары в корзине
  if (cart.length === 0) {
    showToast("Сначала добавьте товары в корзину!", "error");
    return;
  }

  // 2. ПРОВЕРКА ВХОДА: Получаем данные пользователя из Supabase
  const {
    data: { user },
  } = await _supabase.auth.getUser();

  if (!user) {
    // Если пользователя нет — показываем тост и открываем окно входа
    showToast("Пожалуйста, войдите в систему для оформления заказа", "error");
    toggleAuthModal(); // Открываем твое окно авторизации
    return;
  }

  // 3. Если пользователь вошел — имитируем заказ (пробник)
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  // Показываем красивое уведомление с его Email
  showToast(
    `Заказ для ${user.email.split("@")[0]} на сумму ${total}$ оформлен! (Демо-режим)`,
    "success",
  );

  // 4. Очистка (как в настоящем магазине)
  cart = [];
  saveCart();
  updateUI();
  renderCart();

  // Закрываем корзину через небольшую паузу
  setTimeout(() => {
    if (cartPanel) cartPanel.classList.remove("active");
  }, 1500);
}

// --- 6. Авторизация и OTP ---
function toggleAuthModal() {
  if (authModal) authModal.classList.toggle("hidden");
}

function switchAuthMode() {
  isSignUpMode = !isSignUpMode;
  const regFields = document.getElementById("reg-fields");
  const authTitle = document.getElementById("auth-title");
  const mainBtn = document.getElementById("auth-main-btn");
  const toggleText = document.getElementById("auth-toggle-text");

  if (authTitle) authTitle.innerText = isSignUpMode ? "Регистрация" : "Вход";
  if (mainBtn) mainBtn.innerText = isSignUpMode ? "Создать" : "Войти";

  if (isSignUpMode) {
    regFields?.classList.remove("hidden");
    toggleText.innerText = "Уже есть аккаунт? Войти";
  } else {
    regFields?.classList.add("hidden");
    toggleText.innerText = "Нет аккаунта? Зарегистрироваться";
  }
}
// Показываем или скрываем блок доп. полей
// 1. Сначала находим элемент (ВНЕ условий)
const regFields = document.getElementById("reg-fields");

// 2. Теперь используем его
if (isSignUpMode) {
    regFields?.classList.remove("hidden");
} else {
    regFields?.classList.add("hidden");
}

function cancelOTP() {
  // 1. Показываем блоки ввода Email и пароля
  const authGroups = document.querySelectorAll(".auth-group:not(#otp-group)");
  authGroups.forEach((group) => group.classList.remove("hidden"));

  // 2. Скрываем блок ввода кода (OTP)
  const otpGroup = document.getElementById("otp-group");
  if (otpGroup) otpGroup.classList.add("hidden");

  // 3. Возвращаем текст и действие главной кнопке
  const mainBtn = document.getElementById("auth-main-btn");
  if (mainBtn) {
    mainBtn.innerText = isSignUpMode ? "Создать" : "Войти";
    // Возвращаем стандартную функцию отправки
    mainBtn.onclick = handleAuthSubmit;
  }
}

function resetAuthMode() {
  // 1. Показываем все скрытые поля (Email, Пароли)
  document.querySelectorAll(".auth-group").forEach((group) => {
    group.classList.remove("hidden");
  });

  // 2. Скрываем поле для ввода OTP кода
  const otpGroup = document.getElementById("otp-group");
  if (otpGroup) otpGroup.classList.add("hidden");

  // 3. Возвращаем текст главной кнопки
  const mainBtn = document.getElementById("auth-main-btn");
  if (mainBtn) {
    mainBtn.innerText = isSignUpMode ? "Создать" : "Войти";
    // Возвращаем стандартный обработчик клика
    mainBtn.onclick = handleAuthSubmit;
  }
}

async function handleAuthSubmit() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const confirmPassword = document.getElementById(
    "auth-password-confirm",
  )?.value;

  if (isSignUpMode) {
    if (password !== confirmPassword) {
      showToast("Пароли не совпадают!", "error");
      return;
    }

    // Собираем все дополнительные данные из полей ввода
    const userMetadata = {
      first_name: document.getElementById("reg-first-name")?.value || "",
      last_name: document.getElementById("reg-last-name")?.value || "",
      birthday: document.getElementById("reg-birthday")?.value || "",
      location: document.getElementById("reg-location")?.value || "",
      github: document.getElementById("reg-github")?.value || "",
      instagram: document.getElementById("reg-instagram")?.value || "",
      discord: document.getElementById("reg-discord")?.value || "",
      avatar_url: "https://via.placeholder.com/150", // Временный аватар по умолчанию
    };

    // Регистрируем пользователя и передаем метаданные в Supabase
    const { data, error } = await _supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata, // Эти данные сохранятся в auth.users
      },
    });

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Код подтверждения отправлен!", "success");

      // Скрываем все поля регистрации, кроме блока OTP
      document
        .querySelectorAll(".auth-group:not(#otp-group)")
        .forEach((group) => {
          group.classList.add("hidden");
        });

      const otpGroup = document.getElementById("otp-group");
      if (otpGroup) otpGroup.classList.remove("hidden");

      const mainBtn = document.getElementById("auth-main-btn");
      if (mainBtn) {
        mainBtn.innerText = "Подтвердить код";
        mainBtn.onclick = () => verifyOTP(email);
      }
    }
  } else {
    // Логика входа остается прежней
    const { error } = await _supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) showToast("Ошибка входа", "error");
    else location.reload();
  }
}

async function searchUsers(searchTerm) {
  // В реальном проекте лучше создать таблицу 'profiles',
  // но для "пробника" можно искать через API Supabase (если настроен доступ)
  const { data, error } = await _supabase
    .from("profiles") // Предполагается, что ты создал таблицу profiles
    .select("*")
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);

  if (error) {
    console.error("Ошибка поиска:", error.message);
    return;
  }

  return data; // Вернет список найденных профилей
}

async function verifyOTP(email) {
  const token = document.getElementById("auth-otp").value;
  const { error } = await _supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  if (error) showToast("Неверный код", "error");
  else {
    showToast("Успешно!", "success");
    setTimeout(() => location.reload(), 1000);
  }
}

function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input && input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else if (input) {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

// --- 7. Утилиты ---
function showToast(message, type = "success") {
  const container = document.getElementById("notification-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  toast.innerHTML = `<i class="fas ${type === "error" ? "fa-exclamation-circle" : "fa-check-circle"}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "0.5s";
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// Плавная прокрутка
function scrollToShop() {
  const shop = document.getElementById("shop");
  if (shop) shop.scrollIntoView({ behavior: "smooth" });
}

// Запуск приложения
document.addEventListener("DOMContentLoaded", () => {
  loadProducts(); // Сначала грузим товары
  initSearch(); // Потом включаем поиск
  updateUI(); // Обновляем профиль
});
