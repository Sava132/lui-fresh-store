// --- 1. Настройка Supabase ---
const SUPABASE_URL = "https://iryyjhepgxxwccoyuavm.supabase.co";
const SUPABASE_KEY = "sb_publishable_f-hRSgZDWM0rAB1aaWqxYg_2ycwGWhO";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. Инициализация переменных ---
// КОРЗИНА теперь загружается из localStorage при старте
let cart = JSON.parse(localStorage.getItem('aetheris_cart')) || []; 
let productsData = [];
let isSignUpMode = false;

const cartCount = document.getElementById("cart-count");
const cartPanel = document.getElementById("cart-side-panel");
const cartItemsList = document.getElementById("cart-items");
const totalSumElement = document.getElementById("total-sum");
const authModal = document.getElementById("auth-modal");
const authBtnIcon = document.getElementById("auth-btn"); // Иконка космонавта

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
    const containers = {
        smartphones: document.getElementById("smartphones-container"),
        computers: document.getElementById("computers-container"),
        peripherals: document.getElementById("peripherals-container"),
    };
    Object.values(containers).forEach(div => { if (div) div.innerHTML = ""; });

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
        const target = containers[product.category] || containers.peripherals;
        if (target) target.appendChild(card);
    });
}

// --- 4. Логика поиска (без изменений) ---
function initSearch() {
    const searchInput = document.getElementById("product-search");
    if (!searchInput) return;
    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const categories = document.querySelectorAll(".category-group");
        categories.forEach(category => {
            const cards = category.querySelectorAll(".product-card");
            let hasResults = false;
            cards.forEach(card => {
                const title = card.querySelector("h4")?.innerText.toLowerCase() || "";
                const desc = card.querySelector("p")?.innerText.toLowerCase() || "";
                if (title.includes(term) || desc.includes(term)) {
                    card.style.display = "flex";
                    hasResults = true;
                } else {
                    card.style.display = "none";
                }
            });
            category.style.display = hasResults ? "block" : "none";
        });
    });
}

// --- 5. Корзина (Добавлено сохранение) ---
function addToCart(name, price) {
    cart.push({ id: Date.now(), name, price });
    saveCart(); // Сохраняем в localStorage
    updateUI();
    showToast(`${name} добавлен в корзину!`);

    const logo = document.querySelector(".logo");
    logo.classList.add("glitch-effect");
    setTimeout(() => logo.classList.remove("glitch-effect"), 400);
}

function saveCart() {
    localStorage.setItem('aetheris_cart', JSON.stringify(cart));
}

async function updateUI() {
    // Обновление счетчика корзины
    if (cartCount) cartCount.innerText = cart.length;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    if (totalSumElement) totalSumElement.innerText = total;

    // ОБНОВЛЕНИЕ ПРОФИЛЯ
    const { data: { user } } = await _supabase.auth.getUser();
    const authContainer = document.querySelector(".header-right");
    
    // Находим или создаем элемент для отображения статуса входа
    let profileDisplay = document.getElementById("profile-display");
    
    if (user) {
        authBtnIcon.style.display = "none"; // Прячем космонавта
        if (!profileDisplay) {
            profileDisplay = document.createElement("div");
            profileDisplay.id = "profile-display";
            profileDisplay.style.cssText = "display:flex; align-items:center; gap:10px; cursor:pointer;";
            authContainer.appendChild(profileDisplay);
        }
        // Показываем имя (часть email до собаки) и иконку выхода
        profileDisplay.innerHTML = `
            <span style="color:var(--accent); font-size:14px; font-weight:bold;">${user.email.split('@')[0].toUpperCase()}</span>
            <i class="fas fa-sign-out-alt" onclick="handleLogout()" style="font-size:16px; opacity:0.6"></i>
        `;
    } else {
        authBtnIcon.style.display = "block"; // Возвращаем космонавта
        if (profileDisplay) profileDisplay.remove();
    }
}

async function handleLogout() {
    const { error } = await _supabase.auth.signOut();
    if (error) showToast(error.message, "error");
    else {
        showToast("Вы вышли из системы");
        updateUI();
    }
}

function toggleCart() {
    cartPanel.classList.toggle("active");
    renderCart();
}

function renderCart() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = cart.length === 0 
        ? '<p style="text-align:center; opacity:0.5; margin-top:50px;">Корзина пуста</p>' 
        : "";

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.style.cssText = "display:flex; justify-content:space-between; padding:15px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:10px; border: 1px solid var(--glass-border)";
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

// --- 6. Авторизация (Добавлено обновление UI) ---
function toggleAuthModal() {
    authModal.classList.toggle("hidden");
}

function switchAuthMode() {
    isSignUpMode = !isSignUpMode;
    const confirmGroup = document.getElementById("confirm-group");
    document.getElementById("auth-title").innerText = isSignUpMode ? "Регистрация" : "Вход";
    document.getElementById("auth-main-btn").innerText = isSignUpMode ? "Создать" : "Войти";
    document.getElementById("auth-toggle-text").innerText = isSignUpMode ? "Уже есть аккаунт?" : "Нет аккаунта?";
    if (isSignUpMode) confirmGroup.classList.remove("hidden");
    else confirmGroup.classList.add("hidden");
}
// ... (начало кода без изменений до handleAuthSubmit) ...

// 1. Основная функция обработки (Замени старую handleAuthSubmit)
// 1. Основная логика: Регистрация + Скрытие полей
async function handleAuthSubmit() {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const confirmPassword = document.getElementById("auth-password-confirm")?.value;

    if (isSignUpMode) {
        if (password !== confirmPassword) {
            showToast("Пароли не совпадают!", "error");
            return;
        }

        // Отправка данных в Supabase
        const { error } = await _supabase.auth.signUp({ email, password });

        if (error) {
            showToast(error.message, "error");
        } else {
            showToast("Код подтверждения отправлен!", "success");
            
            // --- ТУТ МАГИЯ СКРЫТИЯ ---
            // Скрываем блоки с Email и Паролями
            document.querySelectorAll('.auth-group:not(#otp-group)').forEach(group => {
                group.classList.add('hidden');
            });
            
            // Показываем блок ввода кода (OTP)
            document.getElementById("otp-group").classList.remove("hidden");
            
            // Меняем кнопку: теперь она подтверждает код
            const mainBtn = document.getElementById("auth-main-btn");
            mainBtn.innerText = "Подтвердить код";
            mainBtn.onclick = () => verifyOTP(email); 
        }
    } else {
        // Логика обычного входа
        const { error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) showToast("Ошибка входа", "error");
        else location.reload();
    }
}

// 2. Функция проверки кода из письма
async function verifyOTP(email) {
    const token = document.getElementById("auth-otp").value;

    const { error } = await _supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: 'signup'
    });

    if (error) {
        showToast("Неверный код", "error");
    } else {
        showToast("Успешно! Входим...", "success");
        setTimeout(() => location.reload(), 1500);
    }
}

// 3. Функция сброса (если нажал "Назад")
function cancelOTP() {
    // Показываем поля обратно
    document.querySelectorAll('.auth-group:not(#otp-group)').forEach(group => {
        group.classList.remove('hidden');
    });
    // Прячем поле кода
    document.getElementById("otp-group").classList.add("hidden");
    
    // Возвращаем кнопку в режим "Создать"
    const mainBtn = document.getElementById("auth-main-btn");
    mainBtn.innerText = "Создать";
    mainBtn.onclick = handleAuthSubmit;
}
// ... (остальной код без изменений) ...
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

// --- 7. Уведомления ---
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

function scrollToShop() { document.getElementById("shop").scrollIntoView(); }
function scrollToFooter() { document.querySelector(".main-footer").scrollIntoView(); }

// Запуск при загрузке
document.addEventListener("DOMContentLoaded", () => {
    initSearch();
    loadProducts();
    updateUI(); // Проверяем сессию и корзину при загрузке страницы
});