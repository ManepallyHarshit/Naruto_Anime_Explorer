//Search Part

const searchInput = document.querySelector(".search-input");
const searchResults = document.createElement("div");
searchResults.classList.add("search-results");
searchInput.closest(".search-container").appendChild(searchResults);

let searchTimeout;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  const query = searchInput.value.trim().toLowerCase();

  if(!query){
    searchResults.innerHTML = "";
    return;
  }

  searchTimeout = setTimeout(() => searchDattebayyo(query), 400);
});

async function searchDattebayyo(query) {
  const categories = ["characters", "tailed-beasts", "akatsuki", "kara"];
  searchResults.innerHTML = "<p style='padding: 10px;'>Searching...</p>";

  try {
  const promises = categories.map((cat) => {
    return fetch(`https://dattebayo-api.onrender.com/${cat}?limit=100`)
      .then((res) => res.json())
      .then((data) => ({
        category: cat,
        items:data[cat.replace("-", "")] ||
              data[cat] ||
              Object.values(data).find((v) => Array.isArray(v))
      }));
  });

  const results = await Promise.all(promises);
  let combined = [];

  for(const {category, items} of results){
    if(!items) continue;
    const filtered = items.filter((item) =>
      item.name && item.name.toLowerCase().includes(query));
    combined = combined.concat(
      filtered.map((item) => ({
        id: item.id,
        name: item.name,
        category,
      }))
    );
    }
    displaySearchResults(combined.slice(0, 12));
  } catch (err) {
    console.error("Search error:", err);
    searchResults.innerHTML = "<p style='padding: 10px;'>Error during search.</p>";
  }
}

function displaySearchResults(results) {
  searchResults.innerHTML = "";
  if (results.length === 0) {
    searchResults.innerHTML = "<p style='padding: 10px;'>No results found.</p>";
    return;
  }

  results.forEach(({ name, id, category }) => {
    const p = document.createElement("p");
    p.textContent = `${name} (${category})`;
    p.style.cursor = "pointer";
    p.style.padding = "10px";
    p.addEventListener("mouseover", () => {
      p.style.backgroundColor = "#facc15",
      p.style.color = "#000000";
    });
    p.addEventListener("mouseout", () => {
      p.style.backgroundColor = "",
      p.style.color = "";
    });
    p.addEventListener("click", () => {
      window.location.href = `details.html?id=${id}&category=${category}`;
    });
    searchResults.appendChild(p);
  });

  Object.assign(searchResults.style, {
    position: "absolute",
    top: "100%",
    left: "35px",
    right: "35px",
    background: "#1a1a1a",
    color: "#fff",
    borderRadius: "10px",
    maxHeight: "300px",
    overflowY: "auto",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
    zIndex: "2000",
    marginTop: "6px",
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    searchResults.innerHTML = "";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchResults.innerHTML = "";
  }
});

//Loading Part

const loader = document.getElementById("chakra-loader");

function showLoader() {
  if (!loader) return;
  loader.classList.remove("hidden");
  loader.style.display = "flex";
}

function hideLoader() {
  if (!loader) return;
  loader.classList.add("hidden");
  setTimeout(() => {
    loader.style.display = "none";
  }, 900);
}

//Back to top Part

const backToTop = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  const scrollPosition = window.scrollY;

  if (scrollPosition > 500) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }
});

const shruiken = document.getElementById("shruiken");
let lastScrollTop = 0;
let rotation = 0;
let targetRotation = 0;

function animate() {
  rotation += (targetRotation - rotation) * 0.1;
  shruiken.style.transform = `rotate(${rotation}deg)`;
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const scrollDelta = scrollTop - lastScrollTop;

  targetRotation += scrollDelta * 0.1;

  targetRotation = Math.max(-999999, Math.min(999999, targetRotation));

  lastScrollTop = scrollTop;
});

backToTop.addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

//API Data Retrieval

import { fetchData } from "./utils.js";

async function loadData(category, page = 1) {
  const apiUrl = `https://dattebayo-api.onrender.com/${category}?page=${page}`;
  const cardsContainer = document.getElementById(`cards-${category}`);
  const pageInfo = document.getElementById(`page-info-${category}`);
  const nextBtn = document.getElementById(`next-${category}`);
  const prevBtn = document.getElementById(`prev-${category}`);

  try {
    showLoader();

    const data = await fetchData(apiUrl);
    if (!data) {
      console.error(`No data returned for ${category}`);
      window.location.href = "404.html";
      return;
    }

    // Key mapping to handle singulars and camelCase
    const keyMap = {
      characters: "characters",
      "tailed-beasts": "tailedBeasts",
      akatsuki: "akatsuki",
      kara: "kara"
    };

    const normalizedKeys = Object.keys(data);
    let key = keyMap[category] || category;

    if (!data[key]) {
      const possible = Object.keys(data).find(k => k.toLowerCase().includes("tailed"));
      key = possible || key;
    }

    if (!key || !data[key]) {
      const arrEntry = Object.values(data).find((v) => Array.isArray(v) && v.length && typeof v[0] === "object");

      if (arrEntry) {
        console.warn(`Fallback used for ${category}`);
        displayCards(category, arrEntry, cardsContainer)
        return;
      }

      console.error(`Invalid response for ${category}`, data);
      window.location.href = "404.html";
      return;
    }

      const items = data[key];
      if (!Array.isArray(items) || items.length === 0) {
        console.error(`Empty array for ${category}`);
        window.location.href = "404.html";
        return;
      }

      console.log(`Loaded ${category}:`, items.length, "items, key used:", key);

      // Pagination fix
      const pageSize = data.pageSize || items.length || 20;
      const total = data.total || (data.totalItems ?? items.length * 5);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      displayCards(category, items, cardsContainer);
      updatePagination(category, page, totalPages, pageInfo, nextBtn, prevBtn);

      //  Clean event wiring
      if (nextBtn) {
        nextBtn.onclick = null;
        nextBtn.addEventListener("click", () => {
          if (page < totalPages) loadData(category, page + 1);
        });
      }
      if (prevBtn) {
        prevBtn.onclick = null;
        prevBtn.addEventListener("click", () => {
          if (page > 1) loadData(category, page - 1);
        });
      }
      return;
      } catch (err) {
    console.error(`Error loading ${category}:`, err);
    window.location.href = "404.html";
  } finally {
    hideLoader();
  }
}

function displayCards(category, items, cardsContainer) {
  cardsContainer.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add(`${category}-card`);
    card.innerHTML = `
      <img src="${item.images[0]}" alt="${item.name}" loading="lazy">
      <h3>${item.name}</h3>
      <button data-id="${item.id}" class="details-btn-${category}">View Details</button>
    `;
    cardsContainer.appendChild(card);
  });

  cardsContainer.querySelectorAll(`.details-btn-${category}`).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      if (id) window.location.href = `details.html?id=${id}&category=${category}`;
    });
  });
  wireFeaturedLearnMore();
}

function wireFeaturedLearnMore() {
  document.querySelectorAll(".learn-more").forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      const figcap = el.closest("figcaption");
      if (!figcap) return;
      const nameEl = figcap.querySelector(".name");
      const name = nameEl ? nameEl.textContent.trim() : null;
      if (name) {
        window.location.href = `details.html?name=${encodeURIComponent(name)}`;
      }
    });
  });
} 

function updatePagination(category, current, total, pageInfo, nextBtn, prevBtn) {
  pageInfo.textContent = `Page ${current} of ${total}`;
  prevBtn.disabled = current === 1;
  nextBtn.disabled = current === total;
}

["characters", "tailed-beasts", "akatsuki", "kara"].forEach((cat) => loadData(cat));