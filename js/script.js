const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDvuSJDjmGBpYHUkj0gbfC9GgEhGftt0_YjfgXcZzEjfkh8r-J6Jpt8aHxTbwgTJb0WMfL8iF9QcEs/pub?output=csv";

let products = [];
let currentTab = "all";
let currentCategory = "الكل";
let currentSearch = "";

Papa.parse(csvUrl, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
        products = results.data;
        buildCategories();
        loadProducts();
        setupEventListeners();
    }
});

function loadProducts() {
    filterAndDisplay();
}

function buildCategories() {
    const categoriesContainer = document.querySelector(".categories");
    if (!categoriesContainer) return;

    categoriesContainer.innerHTML = "";
    const categoriesSet = new Set();

    products.forEach(product => {
        const cat = (product["القسم"] || "").trim();
        if (cat) categoriesSet.add(cat);
    });

    const uniqueCategories = ["الكل", ...categoriesSet];

    uniqueCategories.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat;
        btn.style.opacity = (cat === currentCategory) ? "1" : "0.6";
        categoriesContainer.appendChild(btn);
    });
}

function cleanText(text) {
    if (!text) return "";
    return text.toString()
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ؤ]/g, 'و')
        .replace(/[ئ]/g, 'ي')
        .replace(/[ة]/g, 'ه');
}

// دالة الفلترة المزدوجة
function filterAndDisplay() {
    let filteredProducts = products.filter(product => {
        const isAvailable = (product["متوفر"] || "").trim() !== "لا";

        let matchTab = true;
        if (currentTab === "best") matchTab = (product["الاكثر طلبا"] === "نعم") && isAvailable;
        if (currentTab === "new") matchTab = (product["جديد"] === "نعم") && isAvailable;
        if (currentTab === "offers") matchTab = (product["عرض"] === "نعم") && isAvailable;

        const productCat = (product["القسم"] || "").trim();
        const matchCategory = (currentCategory === "الكل") || (productCat === currentCategory);

        const normSearch = cleanText(currentSearch);
        const normName = cleanText(product["الاسم"] || "");
        const normDesc = cleanText(product["الوصف"] || "");
        const normKeywords = cleanText(product["الكلمات المفتاحية"] || product["الكلمات المفتاحيه"] || "");

        const matchSearch = normName.includes(normSearch) ||
            normDesc.includes(normSearch) ||
            normKeywords.includes(normSearch);

        return matchTab && matchCategory && matchSearch;
    });

    filteredProducts.sort((a, b) => {
        const availA = (a["متوفر"] || "").trim() !== "لا" ? 1 : 0;
        const availB = (b["متوفر"] || "").trim() !== "لا" ? 1 : 0;
        return availB - availA;
    });

    displayProducts(filteredProducts);
}

function setupEventListeners() {
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearch = e.target.value;
            filterAndDisplay();
        });
    }

    const tabButtons = document.querySelectorAll(".main-tabs .tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTab = btn.getAttribute("data-tab");
            filterAndDisplay();
        });
    });

    const categoryButtons = document.querySelectorAll(".categories button");
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryButtons.forEach(b => b.style.opacity = "0.6");
            btn.style.opacity = "1";
            currentCategory = btn.textContent.trim();
            filterAndDisplay();
        });
    });

    // أحداث قفل النافذة المنبثقة
    const modal = document.getElementById("productModal");
    const closeBtn = document.querySelector(".close-btn");
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }
}

function displayProducts(list) {
    const container = document.getElementById("allProducts");
    if (!container) return;
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <h3>مفيش منتجات بالشكل ده دلوقتي!</h3>
                <p>ممكن تكون بتبحث بكلمة غلط، أو القسم ده لسه معليهوش عروض.</p>
                <button onclick="resetFilters()">عرض كل المنتجات 🔄</button>
            </div>
        `;
        return;
    }

    list.forEach(product => {
        container.appendChild(createCard(product));
    });
}

function resetFilters() {
    currentTab = "all";
    currentCategory = "الكل";
    currentSearch = "";

    const searchInput = document.getElementById("search");
    if (searchInput) searchInput.value = "";

    const tabButtons = document.querySelectorAll(".main-tabs .tab-btn");
    tabButtons.forEach(btn => {
        if (btn.getAttribute("data-tab") === "all") btn.classList.add("active");
        else btn.classList.remove("active");
    });

    const categoryButtons = document.querySelectorAll(".categories button");
    categoryButtons.forEach(btn => {
        btn.style.opacity = (btn.textContent.trim() === "الكل") ? "1" : "0.6";
    });

    filterAndDisplay();
}

// إنشاء الكارت وربطة بالنافذة المنبثقة
function createCard(product) {
    const card = document.createElement("div");
    const isAvailable = (product["متوفر"] || "").trim() !== "لا";

    card.className = isAvailable ? "card" : "card out-of-stock";

    const imgName = product["الصورة"] || product["الصوره"] || "";
    const imgPath = imgName ? `images/${imgName}` : "images/no-image.png";
    const imgHtml = `<img src="${imgPath}" onerror="this.src='images/no-image.png'" alt="صورة المنتج" class="clickable-img">`;

    const phone = "201000000000";
    const message = `انا عاوز اشتري ${product["الاسم"] || ""}`;
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    const btnHtml = isAvailable
        ? `<a href="${waLink}" target="_blank" class="btn-whatsapp">اطلب عبر واتساب 🟢</a>`
        : `<div class="btn-disabled">🔴 غير متوفر حاليا</div>`;

    card.innerHTML = `
        ${imgHtml}
        <h3 class="clickable-title">${product["الاسم"] || "بدون اسم"}</h3>
        <p>${product["الوصف"] || ""}</p>
        <h2>${product["السعر"] || "0"} جنيه</h2>
        ${btnHtml}
    `;

    // ربط الصورة والعنوان بفتح النافذة المنبثقة
    const imgEl = card.querySelector(".clickable-img");
    const titleEl = card.querySelector(".clickable-title");
    if (imgEl) imgEl.addEventListener("click", () => openModal(product, isAvailable, waLink));
    if (titleEl) titleEl.addEventListener("click", () => openModal(product, isAvailable, waLink));

    return card;
}

// دالة فتح النافذة المنبثقة وعرض التفاصيل الكاملة
function openModal(product, isAvailable, waLink) {
    const modal = document.getElementById("productModal");
    const modalBody = document.getElementById("modalBody");
    if (!modal || !modalBody) return;

    const imgName = product["الصورة"] || product["الصوره"] || "";
    const imgPath = imgName ? `images/${imgName}` : "images/no-image.png";

    const btnHtml = isAvailable
        ? `<a href="${waLink}" target="_blank" class="btn-whatsapp">اطلب عبر واتساب 🟢</a>`
        : `<div class="btn-disabled">🔴 غير متوفر حاليا</div>`;

    modalBody.innerHTML = `
        <img src="${imgPath}" onerror="this.src='images/no-image.png'" class="modal-img">
        <h3 class="modal-title">${product["الاسم"] || "بدون اسم"}</h3>
        <h2 class="modal-price">${product["السعر"] || "0"} جنيه</h2>
        <div class="modal-desc">${product["الوصف"] || "لا يوجد وصف إضافي لهذا المنتج."}</div>
        ${btnHtml}
    `;

    modal.style.display = "block";
}