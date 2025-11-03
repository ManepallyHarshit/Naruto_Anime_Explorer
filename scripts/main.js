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

    // 🔹 Known key mapping to handle singulars and camelCase
    const keyMap = {
      characters: "characters",
      "tailed-beasts": "tailedBeasts",
      akatsuki: "akatsuki",
      kara: "kara"
    };

    const normalizedKeys = Object.keys(data);
    let key = keyMap[category] || category;

    // 🔹 If not found, try fuzzy matching
    if (!data[key]) {
      const possible = Object.keys(data).find(k => k.toLowerCase().includes("tailed"));
      key = possible || key;
    }

    // 🔹 Still not found — give up
    if (!key || !data[key]) {
      // fallback: try to find the first property that is an array of objects
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

      // if data itself is an array, use it
      const items = data[key];
      if (!Array.isArray(items) || items.length === 0) {
        console.error(`Empty array for ${category}`);
        window.location.href = "404.html";
        return;
      }

      console.log(`✅ Loaded ${category}:`, items.length, "items, key used:", key);

      // ✅ Pagination fix
      const pageSize = data.pageSize || items.length || 20;
      const total = data.total || (data.totalItems ?? items.length * 5); // fallback if API doesn’t include total
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      displayCards(category, items, cardsContainer);
      updatePagination(category, page, totalPages, pageInfo, nextBtn, prevBtn);

      // ✅ Clean event wiring
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