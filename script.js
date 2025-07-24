document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    whatsappNumber: "91XXXXXXXXXX",
    carouselImages: [
      "images/hero1.jpg",
      "images/hero2.jpg",
      "images/hero3.jpg",
      "images/hero4.jpg",
    ],
    carouselInterval: 4000,
  };

  // Setup functions that run on all pages
  setupScrollTopButton();
  setupWhatsAppButtons(CONFIG);
  setupNavbarScrollBehavior();

  // Page-specific setups
  if (document.body.classList.contains("home-page")) {
    setupHeroCarousel(CONFIG);
    setupHomeProducts();
    setupHomeSearch();
  }

  if (document.body.classList.contains("products-page")) {
    setupProductPage();
  }
});

/**
 * Reusable function to fetch product data.
 * It can fetch from a server API or a local JSON file for development.
 * @returns {Promise<Array>} A promise that resolves to an array of products.
 */
async function fetchProducts() {
  try {
    // For local development, create 'products.json' and use the line below
    // const response = await fetch('products.json'); 
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return []; // Return an empty array on error to prevent site crashes
  }
}

/* ========== GENERAL UTILITIES ========== */

function setupScrollTopButton() {
  const scrollBtn = document.getElementById("scrollTopBtn");
  if (!scrollBtn) return;

  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 300 ? "block" : "none";
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setupWhatsAppButtons(CONFIG) {
  // Use event delegation for efficiency
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("whatsapp-btn")) {
      const productName = e.target.getAttribute("data-name");
      const message = encodeURIComponent(
        `Hi, I'm interested in ${productName}.`
      );
      // Use number from CONFIG object
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${message}`, "_blank");
    }
  });
}

function setupNavbarScrollBehavior() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScrollY = window.scrollY;
  const scrollThreshold = 50; // Pixels to scroll before hiding/showing

  window.addEventListener('scroll', () => {
    if (window.scrollY > lastScrollY && window.scrollY > navbar.offsetHeight + scrollThreshold) {
      // Scrolling down and past the navbar height + threshold
      navbar.classList.add('navbar-hidden');
    } else if (window.scrollY < lastScrollY - scrollThreshold || window.scrollY < navbar.offsetHeight) {
      // Scrolling up or near the top of the page
      navbar.classList.remove('navbar-hidden');
    }
    lastScrollY = window.scrollY;
  });
}

/* ========== HOME PAGE ========== */

function setupHomeSearch() {
  const searchInput = document.getElementById('homeSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
      }
    }
  });
}

function setupHeroCarousel(CONFIG) {
  const { carouselImages, carouselInterval } = CONFIG;
  const imgEl = document.getElementById("carousel-img");
  const dotsContainer = document.getElementById("carousel-dots");
  const leftArrow = document.querySelector(".arrow.left");
  const rightArrow = document.querySelector(".arrow.right");

  if (!imgEl || !dotsContainer || !leftArrow || !rightArrow) return;

  let index = 0;
  let interval;

  const updateCarousel = () => {
    imgEl.src = carouselImages[index];
    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  };

  const resetInterval = () => {
    clearInterval(interval);
    interval = setInterval(() => {
      index = (index + 1) % carouselImages.length;
      updateCarousel();
    }, carouselInterval);
  };

  carouselImages.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => {
      index = i;
      updateCarousel();
      resetInterval();
    });
    dotsContainer.appendChild(dot);
  });

  leftArrow.addEventListener("click", () => {
    index = (index - 1 + carouselImages.length) % carouselImages.length;
    updateCarousel();
    resetInterval();
  });

  rightArrow.addEventListener("click", () => {
    index = (index + 1) % carouselImages.length;
    updateCarousel();
    resetInterval();
  });

  updateCarousel();
  resetInterval();
}

async function setupHomeProducts() {
  const container = document.getElementById("productCarousel");
  if (!container) return;

  const allProducts = await fetchProducts();
  if (allProducts.length === 0) {
    container.innerHTML = "<p>Unable to load featured products.</p>";
    return;
  }
  
  const featured = allProducts.slice(0, 8); // Showing more products in a carousel is often better
  renderProducts(featured, container);
}

/* ========== PRODUCT PAGE ========== */

async function setupProductPage() {
  const grid = document.getElementById("productGrid");
  const searchInput = document.getElementById("searchInput");
  const loader = document.querySelector('.loader');

  if (!grid) return;

  // Show loader
  if(loader) loader.style.display = 'block';

  // Centralize all filter event listeners
  document.querySelectorAll(".filter-header").forEach(header => {
    header.addEventListener('click', () => {
        header.closest(".filter-group").classList.toggle("open");
    });
  });

  const allProducts = await fetchProducts();
  
  // Hide loader
  if(loader) loader.style.display = 'none';

  if (allProducts.length === 0) {
    grid.innerHTML = "<p>Unable to load products at this time.</p>";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const searchTerm = urlParams.get("search");
  if (searchTerm && searchInput) {
    searchInput.value = searchTerm;
  }

  const preselectFilter = (name, value) => {
    if (value) {
      const checkbox = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    }
  };

  preselectFilter("age", urlParams.get("age"));
  preselectFilter("price", urlParams.get("price"));

  const applyAllFilters = () => {
    const searchVal = searchInput?.value.toLowerCase() || "";
    const selectedAges = Array.from(document.querySelectorAll("input[name='age']:checked")).map(cb => cb.value).filter(v => v !== "all");
    const selectedPrices = Array.from(document.querySelectorAll("input[name='price']:checked")).map(cb => cb.value).filter(v => v !== "all");
    const sortValue = document.querySelector("input[name='sort']:checked")?.value || "default";

    let filtered = allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchVal);
      const matchesAge = selectedAges.length === 0 || selectedAges.includes(p.age);
      const matchesPrice = selectedPrices.length === 0 || selectedPrices.some(range => {
        if (range === "0-299") return p.price < 299;
        if (range === "300-499") return p.price >= 300 && p.price <= 499;
        if (range === "500-799") return p.price >= 500 && p.price <= 799;
        if (range === "800plus") return p.price >= 800;
        return false;
      });
      return matchesSearch && matchesAge && matchesPrice;
    });

    switch (sortValue) {
      case "price-asc":  filtered.sort((a, b) => a.price - b.price); break;
      case "price-desc": filtered.sort((a, b) => b.price - a.price); break;
      case "name-asc":   filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc":  filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
    }

    renderProducts(filtered, grid);
    updateBreadcrumb(selectedAges, selectedPrices);
    updateActiveFilters();
  };
  
  // Listen for any change on the filter controls
  document.querySelectorAll("input[name='age'], input[name='price'], input[name='sort']").forEach(el => {
    el.addEventListener("change", applyAllFilters);
  });
  searchInput?.addEventListener("input", applyAllFilters);

  // Initial render
  applyAllFilters();
}

function updateActiveFilters() {
  document.querySelectorAll('.filter-group').forEach(group => {
    const header = group.querySelector('.filter-header');
    const inputs = group.querySelectorAll('input:checked');
    let isActive = false;
    inputs.forEach(input => {
      if (input.value !== 'all') {
        isActive = true;
      }
    });
    header.classList.toggle('active', isActive);
  });
}


/* ========== RENDERING & UI UPDATES ========== */

function renderProducts(products, container) {
  container.innerHTML = "";
  if (products.length === 0) {
    container.innerHTML = "<p>No products match the selected filters. 🙁</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute('data-aos', 'fade-up');
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <p class="price">₹${p.price}</p>
      <button class="whatsapp-btn" data-name="${p.name}">Shop now</button>
    `;
    fragment.appendChild(card);
  });
  container.appendChild(fragment);
  if (window.AOS) {
    AOS.refresh();
  }
}


function updateBreadcrumb(ages, prices) {
  const breadcrumbEl = document.getElementById("breadcrumb");
  if (!breadcrumbEl) return;

  let categoryText = "Products";
  if (ages.length > 0) {
      categoryText = `${ages[0].replace('-', '–')} years`;
  } else if (prices.length > 0) {
      if (prices[0] === '0-299') categoryText = 'Under ₹299';
      else if (prices[0] === '800plus') categoryText = '₹800+';
      else categoryText = `₹${prices[0].replace('-', ' – ₹')}`;
  }

  breadcrumbEl.innerHTML = `
    <a href="index.html">Home</a>
    <span>›</span>
    <a href="products.html">Products</a>
    ${categoryText !== 'Products' ? `<span>›</span> <span class="current">${categoryText}</span>` : ''}
  `;
}