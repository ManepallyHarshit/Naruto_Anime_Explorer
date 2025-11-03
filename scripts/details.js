// 🌀 Loading Part
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

// 🦊 API Data Retrieval
import { fetchData, getQueryParam } from "./utils.js";

const id = getQueryParam("id");
const name = getQueryParam("name");
const category = getQueryParam("category") || "characters";

// ✅ Correct key mapping
const keyMap = {
  characters: "characters",
  villages: "villages",
  clans: "clans",
  teams: "teams",
  "kekkei-genkai": "kekkeiGenkai",
  "tailed-beasts": "tailedBeasts",
  akatsuki: "akatsuki",
  kara: "kara",
};

async function findDataByName(targetName, category) {
  const base = `https://dattebayo-api.onrender.com/${category}?page=`;
  let page = 1;
  const normalize = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const targetNorm = normalize(targetName || "");

  const first = await fetchData(base + page);
  const dataKey = keyMap[category] || category;
  if (!first || !first[dataKey]) return null;

  const pageSize = first.pageSize || first[dataKey].length || 20;
  const total = first.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  let found = first[dataKey].find(
    (c) => c.name && normalize(c.name) === targetNorm
  );
  if (found) return found;

  while (++page <= totalPages) {
    const data = await fetchData(base + page);
    if (!data || !data[dataKey]) return null;
    const found = data[dataKey].find(
      (c) => c.name && normalize(c.name) === targetNorm
    );
    if (found) return found;
  }

  return null;
}

async function loadDetails() {
  const detailsDiv = document.getElementById("details");

  try {
    showLoader();
    let item = null;

    if (id) {
      const apiUrl = `https://dattebayo-api.onrender.com/${category}/${id}`;
      console.log("📡 Fetching by ID:", apiUrl);
      item = await fetchData(apiUrl);
    } else if (name) {
      console.log("🔍 Searching by name:", name);
      item = await findDataByName(name, category);
    }

    // 🧠 Unwrap nested objects like { tailedBeast: {...} }
    if (item && typeof item === "object") {
      const possibleInner = Object.values(item).find(
        (v) => v && typeof v === "object" && v.name
      );
      if (possibleInner) item = possibleInner;
    }

    hideLoader();

    if (!item) {
      console.error("❌ No data found for:", category);
      smoothRedirectTo404();
      return;
    }

    displayDetails(item, category);
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("toggle-jutsu")) {
        const button = e.target;
        const hiddenPart = button.previousElementSibling;
        const isVisible = hiddenPart.style.display === "inline";

        hiddenPart.style.display = isVisible ? "none" : "inline";
        button.textContent = isVisible ? "Show More ▼" : "Show Less ▲";
      }
    });
  } catch (error) {
    console.error("💥 Error loading details:", error);
    smoothRedirectTo404();
  }
}

// 🌫️ Smooth redirect with fade
function smoothRedirectTo404() {
  document.body.style.transition = "opacity 0.6s ease";
  document.body.style.opacity = "0";
  setTimeout(() => {
    window.location.href = "404.html";
  }, 600);
}

// 💎 Display logic
function displayDetails(item, category) {
  const detailsDiv = document.getElementById("details");
  const safeImg =
    item.images?.[0] || item.image || "assets/images/naruto-placeholder.jpg";

  let html = `<h2>${item.name || "Unknown"}</h2>`;
  html += `<img src="${safeImg}" alt="${item.name || category}" />`;
  html += `<div class="${category}-details"><ul>`;

  switch (category) {
    case "characters":
      // ✅ Limit long Jutsu lists with toggle dropdown
      const maxVisibleJutsu = 5;
      const jutsus = item.jutsu || [];
      let jutsuHTML = "Unknown";

      if (jutsus.length > 0) {
        const visible = jutsus.slice(0, maxVisibleJutsu);
        const hidden = jutsus.slice(maxVisibleJutsu);
        jutsuHTML = `
          <div class="jutsu-list">
            ${visible.map(j => `<span class="jutsu">${j}</span>`).join(", ")}
            ${
              hidden.length > 0
                ? `<span class="extra-jutsu" style="display:none;">, ${hidden
                    .map(j => `<span class="jutsu">${j}</span>`)
                    .join(", ")}</span>
                  <button class="toggle-jutsu">Show More ▼</button>`
                : ""
            }
          </div>`;
      }

      html += `
        <li><b>Rank:</b> ${
          item.rank?.ninjaRank?.["Part II"] ||
          item.rank?.ninjaRank?.["Part I"] ||
          "Unknown"
        }</li>
        <li><b>Affiliation:</b> ${item.personal?.affiliation?.join(", ")   || "Unknown"}</li>
        <li><b>Clan:</b> ${item.personal?.clan || "Unknown"}</li>
        <li><b>Nature Type:</b> ${item.natureType?.join(", ") || "Unknown"}</li>
        <li><b>Tools:</b> ${item.tools?.join(", ") || "Unknown"}</li>
        <li><b>Jutsu:</b> ${jutsuHTML}</li>
        <li><b>Debut (Anime):</b> ${item.debut?.anime || "Unknown"}</li>
        <li><b>Debut (Manga):</b> ${item.debut?.manga || "Unknown"}</li>`;
      break;

    case "tailed-beasts":
      html += `
        <li><b>Tails:</b> ${item.tails || "Unknown"}</li>
        <li><b>Jinchūriki:</b> ${item.jinchūriki?.join(", ") || "Unknown"}</li>
        <li><b>Unique Traits:</b> ${item.uniqueTraits?.join(", ") || "Unknown"}</li>
        <li><b>Debut (Anime):</b> ${item.debut?.anime || "Unknown"}</li>
        <li><b>Debut (Manga):</b> ${item.debut?.manga || "Unknown"}</li>`;
      break;

    case "akatsuki":
      html += `
        <li><b>Name:</b> ${item.name || "Unknown"}</li>
        <li><b>Affiliation:</b> ${item.affiliate?.join(", ") || "Unknown"}</li>
        <li><b>Partner:</b> ${item.partner?.join(", ") || "Unknown"}</li>
        <li><b>Debut (Anime):</b> ${item.debut?.anime || "Unknown"}</li>
        <li><b>Debut (Manga):</b> ${item.debut?.manga || "Unknown"}</li>`;
      break;

    case "kara":
      html += `
        <li><b>Name:</b> ${item.name || "Unknown"}</li>
        <li><b>Affiliation:</b> ${item.affiliation?.join(", ") || "Unknown"}</li>
        <li><b>Role:</b> ${item.role || "Unknown"}</li>
        <li><b>Debut (Anime):</b> ${item.debut?.anime || "Unknown"}</li>
        <li><b>Debut (Manga):</b> ${item.debut?.manga || "Unknown"}</li>`;
      break;

    default:
      html += `<li>Unsupported category: ${category}</li>`;
  }

  html += `</ul></div>`;
  detailsDiv.innerHTML = html;
  document.title = `${item.name || category} | Naruto Explorer`;
}

loadDetails();