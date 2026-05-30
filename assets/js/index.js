// ============================================================
// COSMOS Space Dashboard - index.js
// Sections: Today in Space | Launches | Planets
// ============================================================

const NASA_API_KEY = "DEMO_KEY"; // استبدلها بـ API Key الخاص بيك من https://api.nasa.gov

// ============================================================
// 1. NAVIGATION - التنقل بين السكشنز
// ============================================================

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".app-section");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");

function showSection(sectionId) {
  sections.forEach((section) => {
    if (section.dataset.section === sectionId) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });

  navLinks.forEach((link) => {
    if (link.dataset.section === sectionId) {
      link.classList.add("bg-blue-500/10", "text-blue-400");
      link.classList.remove("text-slate-300", "hover:bg-slate-800");
    } else {
      link.classList.remove("bg-blue-500/10", "text-blue-400");
      link.classList.add("text-slate-300", "hover:bg-slate-800");
    }
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.dataset.section;
    showSection(target);

    // إغلاق الـ sidebar في الموبايل
    if (window.innerWidth < 1024) {
      sidebar.classList.add("-translate-x-full");
    }
  });
});

// Sidebar toggle للموبايل
sidebarToggle?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
});

// ============================================================
// 2. TODAY IN SPACE - NASA APOD API
// ============================================================

const apodImage = document.getElementById("apod-image");
const apodTitle = document.getElementById("apod-title");
const apodExplanation = document.getElementById("apod-explanation");
const apodCopyright = document.getElementById("apod-copyright");
const apodDateLabel = document.getElementById("apod-date");
const apodDateDetail = document.getElementById("apod-date-detail");
const apodDateInfo = document.getElementById("apod-date-info");
const apodMediaType = document.getElementById("apod-media-type");
const apodDateInput = document.getElementById("apod-date-input");
const apodDateWrapper = apodDateInput?.closest(".date-input-wrapper");
const loadDateBtn = document.getElementById("load-date-btn");
const todayApodBtn = document.getElementById("today-apod-btn");
const apodLoading = document.getElementById("apod-loading");

// تعيين أقصى تاريخ = اليوم
const todayDate = new Date().toISOString().split("T")[0];
if (apodDateInput) apodDateInput.max = todayDate;

// دالة بتحوّل yyyy-mm-dd لـ "Dec 17, 2025" زي الموقع الأصلي
function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  const date = new Date(Date.UTC(+year, +month - 1, +day));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// دالة بتحدّث الـ input value + الـ data-date على الـ wrapper معاً
function setDateInputValue(isoDate) {
  if (apodDateInput) apodDateInput.value = isoDate;
  if (apodDateWrapper)
    apodDateWrapper.setAttribute("data-date", formatDisplayDate(isoDate));
}

// تعيين التاريخ الابتدائي للـ wrapper
setDateInputValue(todayDate);

async function fetchAPOD(date = "") {
  try {
    showApodLoading(true);

    const dateParam = date ? `&date=${date}` : "";
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}${dateParam}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    renderAPOD(data);
  } catch (error) {
    console.error("APOD fetch error:", error);
    showApodError();
  } finally {
    showApodLoading(false);
  }
}

function renderAPOD(data) {
  const formattedDate = formatDate(data.date);

  // الصورة أو الفيديو
  if (data.media_type === "video") {
    // لو الـ media كانت فيديو نعمل iframe
    const container = document.getElementById("apod-image-container");
    const existingIframe = container.querySelector("iframe");
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.src = data.url;
    iframe.className = "w-full h-full";
    iframe.allow = "autoplay; encrypted-media";
    iframe.allowFullscreen = true;
    if (apodImage) apodImage.style.display = "none";
    container.insertBefore(iframe, container.firstChild);
  } else {
    const container = document.getElementById("apod-image-container");
    const existingIframe = container.querySelector("iframe");
    if (existingIframe) existingIframe.remove();

    if (apodImage) {
      // نخلي الصورة absolute عشان الـ overlay يقعد فوقها صح
      apodImage.style.position = "absolute";
      apodImage.style.inset = "0";
      apodImage.style.width = "100%";
      apodImage.style.height = "100%";
      apodImage.style.objectFit = "cover";
      apodImage.style.display = "block";
      apodImage.style.opacity = "0";
      apodImage.style.transition = "opacity 0.5s ease";

      // fade-in بعد تحميل الصورة
      apodImage.onload = () => {
        apodImage.style.opacity = "1";
      };
      apodImage.src = data.hdurl || data.url;
      apodImage.alt = data.title;
    }
  }

  // النصوص
  if (apodTitle) apodTitle.textContent = data.title;
  if (apodExplanation) apodExplanation.textContent = data.explanation;
  if (apodCopyright)
    apodCopyright.innerHTML = data.copyright
      ? `&copy; ${data.copyright}`
      : "&copy; NASA";
  if (apodDateLabel)
    apodDateLabel.textContent = `Astronomy Picture of the Day - ${formattedDate}`;
  if (apodDateDetail)
    apodDateDetail.innerHTML = `<i class="far fa-calendar mr-2"></i>${data.date}`;
  if (apodDateInfo) apodDateInfo.textContent = data.date;
  if (apodMediaType)
    apodMediaType.textContent = data.media_type === "video" ? "Video" : "Image";

  // تحديث الـ date input + data-date على الـ wrapper
  setDateInputValue(data.date);
}

function showApodLoading(show) {
  if (!apodLoading) return;
  if (show) {
    apodLoading.classList.remove("hidden");
  } else {
    apodLoading.classList.add("hidden");
  }
}

function showApodError() {
  if (apodTitle) apodTitle.textContent = "Failed to load image";
  if (apodExplanation)
    apodExplanation.textContent =
      "Could not fetch today's astronomy picture. Please try again later.";
}

// تحديث النص المعروض فوراً لما المستخدم يغيّر التاريخ من الـ picker
apodDateInput?.addEventListener("change", () => {
  if (apodDateInput.value) {
    setDateInputValue(apodDateInput.value);
  }
});

loadDateBtn?.addEventListener("click", () => {
  const selectedDate = apodDateInput?.value;
  if (selectedDate) fetchAPOD(selectedDate);
});

todayApodBtn?.addEventListener("click", () => {
  if (apodDateInput) apodDateInput.value = todayDate;
  fetchAPOD();
});

// ============================================================
// 3. LAUNCHES - SpaceDevs API (The Space Devs)
// ============================================================

const launchesGrid = document.getElementById("launches-grid");
const featuredLaunch = document.getElementById("featured-launch");

// API: https://ll.thespacedevs.com/2.2.0/launch/upcoming/
// بنستخدم الـ endpoint ده لأنه مجاني بدون API key (rate limited)
async function fetchLaunches() {
  try {
    showLaunchesLoading();

    const url =
      "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&format=json";
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    renderLaunches(data.results);

    // تحديث الـ counter في الهيدر
    const count = data.results?.length || 0;
    const launchesCount = document.getElementById("launches-count");
    const launchesCountMobile = document.getElementById(
      "launches-count-mobile",
    );
    if (launchesCount) launchesCount.textContent = `${count} Launches`;
    if (launchesCountMobile) launchesCountMobile.textContent = `${count}`;
  } catch (error) {
    console.error("Launches fetch error:", error);
    showLaunchesError();
  }
}

function renderLaunches(launches) {
  if (!launches || launches.length === 0) {
    if (launchesGrid)
      launchesGrid.innerHTML = `<p class="text-slate-400 col-span-3">No upcoming launches found.</p>`;
    return;
  }

  // Featured Launch - أول رحلة
  const featured = launches[0];
  if (featuredLaunch) {
    featuredLaunch.innerHTML = buildFeaturedLaunchHTML(featured);
  }

  // باقي الرحلات في الـ grid
  const rest = launches.slice(1);
  if (launchesGrid) {
    launchesGrid.innerHTML = rest.map(buildLaunchCardHTML).join("");
  }
}

function buildFeaturedLaunchHTML(launch) {
  const status = launch.status?.name || "Unknown";
  const statusColor = getLaunchStatusColor(status);
  const daysUntil = getDaysUntilLaunch(launch.net);
  const launchDate = formatLaunchDate(launch.net);
  const launchTime = formatLaunchTime(launch.net);
  const imageUrl = launch.image || "";
  const location =
    launch.pad?.location?.name || launch.pad?.name || "Unknown Location";
  const country = launch.pad?.location?.country_code || "N/A";
  const rocket = launch.rocket?.configuration?.name || "Unknown Rocket";
  const agency = launch.launch_service_provider?.name || "Unknown Agency";
  const description =
    launch.mission?.description || launch.name || "No description available.";

  return `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-star"></i> Featured Launch
              </span>
              <span class="px-4 py-1.5 ${statusColor.bg} ${statusColor.text} rounded-full text-sm font-semibold">
                ${status}
              </span>
            </div>
            <h3 class="text-3xl font-bold mb-3 leading-tight">${launch.name}</h3>
            <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
              <div class="flex items-center gap-2">
                <i class="fas fa-building"></i>
                <span>${agency}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-rocket"></i>
                <span>${rocket}</span>
              </div>
            </div>

            <div class="grid xl:grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-calendar"></i> Launch Date
                </p>
                <p class="font-semibold">${launchDate}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-clock"></i> Launch Time
                </p>
                <p class="font-semibold">${launchTime}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-map-marker-alt"></i> Location
                </p>
                <p class="font-semibold text-sm">${location}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-globe"></i> Country
                </p>
                <p class="font-semibold">${country}</p>
              </div>
            </div>
            <p class="text-slate-300 leading-relaxed mb-6">${description}</p>
          </div>
          <div class="flex flex-col md:flex-row gap-3">
            <a href="${launch.url || "#"}" target="_blank" rel="noopener"
              class="flex-1 self-start md:self-center px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2">
              <i class="fas fa-info-circle"></i> View Full Details
            </a>
          </div>
        </div>
        <div class="relative">
          <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
            ${
              imageUrl
                ? `<img src="${imageUrl}" alt="${launch.name}" class="w-full h-full object-cover" />`
                : `<div class="flex items-center justify-center h-full min-h-[400px] bg-slate-800">
                    <i class="fas fa-rocket text-9xl text-slate-700/50"></i>
                  </div>`
            }
            <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildLaunchCardHTML(launch) {
  const status = launch.status?.name || "Unknown";
  const statusColor = getLaunchStatusColor(status);
  const launchDate = formatLaunchDate(launch.net);
  const launchTime = formatLaunchTime(launch.net);
  const rocket = launch.rocket?.configuration?.name || "Unknown";
  const agency = launch.launch_service_provider?.name || "Unknown Agency";
  const location = launch.pad?.name || "Unknown Location";
  const imageUrl = launch.image || "";
  const iconClass = getLaunchIcon(agency);

  return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer">
      <div class="relative h-48 bg-slate-900/50 flex items-center justify-center">
        ${
          imageUrl
            ? `<img src="${imageUrl}" alt="${launch.name}" class="w-full h-full object-cover" />`
            : `<i class="${iconClass} text-5xl text-slate-700"></i>`
        }
        <div class="absolute top-3 right-3">
          <span class="px-3 py-1 ${statusColor.bg} text-white backdrop-blur-sm rounded-full text-xs font-semibold">
            ${status}
          </span>
        </div>
      </div>
      <div class="p-5">
        <div class="mb-3">
          <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
            ${launch.name}
          </h4>
          <p class="text-sm text-slate-400 flex items-center gap-2">
            <i class="fas fa-building text-xs"></i> ${agency}
          </p>
        </div>
        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-calendar text-slate-500 w-4"></i>
            <span class="text-slate-300">${launchDate}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-clock text-slate-500 w-4"></i>
            <span class="text-slate-300">${launchTime}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-rocket text-slate-500 w-4"></i>
            <span class="text-slate-300">${rocket}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-map-marker-alt text-slate-500 w-4"></i>
            <span class="text-slate-300 line-clamp-1">${location}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
          <a href="${launch.url || "#"}" target="_blank" rel="noopener"
            class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold text-center">
            Details
          </a>
          <button class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
            <i class="far fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function showLaunchesLoading() {
  if (launchesGrid) {
    launchesGrid.innerHTML = `
      <div class="col-span-3 flex flex-col items-center justify-center py-20 text-slate-400">
        <i class="fas fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
        <p>Loading upcoming launches...</p>
      </div>
    `;
  }
  if (featuredLaunch) {
    featuredLaunch.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-3xl text-slate-400">
        <i class="fas fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
        <p>Loading featured launch...</p>
      </div>
    `;
  }
}

function showLaunchesError() {
  if (launchesGrid) {
    launchesGrid.innerHTML = `
      <div class="col-span-3 flex flex-col items-center justify-center py-20 text-slate-400">
        <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
        <p>Failed to load launches. Please try again later.</p>
      </div>
    `;
  }
}

// ============================================================
// 4. PLANETS - Solar System OpenData API
// ============================================================

const PLANET_FACTS = {
  mercury: [
    "Closest planet to the Sun",
    "A year lasts only 88 Earth days",
    "Has no moons or rings",
    "Surface temperatures range from -180°C to 430°C",
  ],
  venus: [
    "Hottest planet (462°C average)",
    "Rotates backwards compared to most planets",
    "A day on Venus is longer than its year",
    "Has the thickest atmosphere of rocky planets",
  ],
  earth: [
    "Only known planet with life",
    "71% of surface covered by water",
    "Has one natural satellite — the Moon",
    "Protected by a strong magnetic field",
  ],
  mars: [
    "Home to the tallest volcano: Olympus Mons",
    "Has two small moons: Phobos and Deimos",
    "A day on Mars is 24 hours 37 minutes",
    "Red color comes from iron oxide (rust)",
  ],
  jupiter: [
    "Largest planet in the Solar System",
    "Great Red Spot is a storm older than 350 years",
    "Has at least 95 known moons",
    "Composed mostly of hydrogen and helium",
  ],
  saturn: [
    "Has the most extensive ring system",
    "Less dense than water — would float",
    "Winds can reach 1,800 km/h",
    "Has 82 known moons",
  ],
  uranus: [
    "Rotates on its side (97.77° axial tilt)",
    "An ice giant made of icy materials",
    "Has 13 known rings",
    "Coldest planetary atmosphere: -224°C",
  ],
  neptune: [
    "Strongest winds in the Solar System (2,100 km/h)",
    "Takes 165 Earth years to orbit the Sun",
    "Has a large storm called the Great Dark Spot",
    "Was predicted mathematically before being observed",
  ],
};

const PLANET_DESCRIPTIONS = {
  mercury:
    "Mercury is the smallest planet in the Solar System and the closest to the Sun. Its surface is heavily cratered and looks similar to Earth's Moon.",
  venus:
    "Venus is the second planet from the Sun and the hottest in the Solar System due to a strong greenhouse effect. It has a thick, toxic atmosphere.",
  earth:
    "Earth is the third planet from the Sun and the only astronomical object known to harbor life. It has liquid water, a protective atmosphere, and a magnetic field.",
  mars: "Mars is the fourth planet from the Sun, often called the Red Planet due to iron oxide on its surface. It has the Solar System's tallest volcano and deepest canyon.",
  jupiter:
    "Jupiter is the fifth planet from the Sun and the largest in the Solar System. A gas giant, it has a famous storm called the Great Red Spot.",
  saturn:
    "Saturn is the sixth planet from the Sun and is famous for its stunning ring system. It is a gas giant and the least dense planet in the Solar System.",
  uranus:
    "Uranus is the seventh planet from the Sun and rotates on its side. It is an ice giant with a pale blue-green color due to methane in its atmosphere.",
  neptune:
    "Neptune is the eighth and farthest planet from the Sun. It is an ice giant known for its deep blue color and the strongest winds in the Solar System.",
};

const PLANET_COLORS = {
  mercury: "#eab308",
  venus: "#f97316",
  earth: "#3b82f6",
  mars: "#ef4444",
  jupiter: "#fb923c",
  saturn: "#facc15",
  uranus: "#06b6d4",
  neptune: "#2563eb",
};

let planetsData = {};
let activePlanet = "earth";

async function fetchPlanets() {
  try {
    const url = "https://solar-system-opendata-proxy.vercel.app/api/planets";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();

    // تحويل البيانات إلى object بالـ id كـ key
    data.forEach((planet) => {
      const id = planet.englishName?.toLowerCase();
      if (id) planetsData[id] = planet;
    });

    renderPlanetDetail("earth");
  } catch (error) {
    console.error("Planets fetch error:", error);
    // لو فشل الـ API نستخدم البيانات الـ static اللي في الـ HTML
  }
}

function renderPlanetDetail(planetId) {
  activePlanet = planetId;
  const planet = planetsData[planetId];

  // تحديث الـ active state في الـ grid
  document.querySelectorAll(".planet-card").forEach((card) => {
    const cardId = card.dataset.planetId;
    if (cardId === planetId) {
      const color = PLANET_COLORS[cardId] || "#3b82f6";
      card.style.borderColor = color + "80";
      card.style.backgroundColor = color + "15";
    } else {
      card.style.borderColor = "#334155";
      card.style.backgroundColor = "";
    }
  });

  // الصورة
  const planetImage = document.getElementById("planet-detail-image");
  if (planetImage) {
    planetImage.src = `/assets/images/${planetId}.png`;
    planetImage.alt = `${planetId} planet`;
  }

  // الاسم
  const planetName = document.getElementById("planet-detail-name");
  if (planetName)
    planetName.textContent =
      planet?.englishName ||
      planetId.charAt(0).toUpperCase() + planetId.slice(1);

  // الوصف
  const planetDesc = document.getElementById("planet-detail-description");
  if (planetDesc)
    planetDesc.textContent =
      PLANET_DESCRIPTIONS[planetId] || "No description available.";

  if (planet) {
    // Semimajor Axis
    const distanceEl = document.getElementById("planet-distance");
    if (distanceEl) {
      const au = planet.semimajorAxis
        ? (planet.semimajorAxis / 1.496e8).toFixed(2) + " AU"
        : "N/A";
      distanceEl.textContent = au;
    }

    // Mean Radius
    const radiusEl = document.getElementById("planet-radius");
    if (radiusEl)
      radiusEl.textContent = planet.meanRadius
        ? `${planet.meanRadius.toLocaleString()} km`
        : "N/A";

    // Mass
    const massEl = document.getElementById("planet-mass");
    if (massEl) {
      if (planet.mass?.massValue && planet.mass?.massExponent) {
        massEl.textContent = `${planet.mass.massValue} × 10^${planet.mass.massExponent} kg`;
      } else {
        massEl.textContent = "N/A";
      }
    }

    // Density
    const densityEl = document.getElementById("planet-density");
    if (densityEl)
      densityEl.textContent = planet.density
        ? `${planet.density} g/cm³`
        : "N/A";

    // Orbital Period
    const orbitalEl = document.getElementById("planet-orbital-period");
    if (orbitalEl) {
      if (planet.sideralOrbit) {
        const days = Math.round(planet.sideralOrbit);
        orbitalEl.textContent =
          days > 365 ? `${(days / 365.25).toFixed(1)} years` : `${days} days`;
      } else {
        orbitalEl.textContent = "N/A";
      }
    }

    // Rotation Period
    const rotationEl = document.getElementById("planet-rotation");
    if (rotationEl) {
      if (planet.sideralRotation) {
        const hours = Math.abs(planet.sideralRotation);
        rotationEl.textContent =
          hours > 24
            ? `${(hours / 24).toFixed(1)} days`
            : `${hours.toFixed(1)} hours`;
      } else {
        rotationEl.textContent = "N/A";
      }
    }

    // Moons
    const moonsEl = document.getElementById("planet-moons");
    if (moonsEl)
      moonsEl.textContent = planet.moons
        ? planet.moons.length
        : planet.aroundPlanet
          ? "0"
          : "0";

    // Gravity
    const gravityEl = document.getElementById("planet-gravity");
    if (gravityEl)
      gravityEl.textContent = planet.gravity ? `${planet.gravity} m/s²` : "N/A";

    // Discovery Info
    const discovererEl = document.getElementById("planet-discoverer");
    if (discovererEl)
      discovererEl.textContent = planet.discoveredBy || "Known since antiquity";

    const discoveryDateEl = document.getElementById("planet-discovery-date");
    if (discoveryDateEl)
      discoveryDateEl.textContent = planet.discoveryDate || "Ancient";

    const bodyTypeEl = document.getElementById("planet-body-type");
    if (bodyTypeEl) bodyTypeEl.textContent = planet.bodyType || "Planet";

    const volumeEl = document.getElementById("planet-volume");
    if (volumeEl) {
      if (planet.vol?.volValue && planet.vol?.volExponent) {
        volumeEl.textContent = `${planet.vol.volValue} × 10^${planet.vol.volExponent} km³`;
      } else {
        volumeEl.textContent = "N/A";
      }
    }
  }

  // Quick Facts
  const factsEl = document.getElementById("planet-facts");
  if (factsEl) {
    const facts = PLANET_FACTS[planetId] || [];
    factsEl.innerHTML = facts
      .map(
        (fact) => `
      <li class="flex items-start">
        <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
        <span class="text-slate-300">${fact}</span>
      </li>`,
      )
      .join("");
  }

  // تحديث الـ table row
  updatePlanetsTable(planetId);
}

function updatePlanetsTable(activePlanetId) {
  document.querySelectorAll("#planets-table-body tr").forEach((row) => {
    row.classList.remove("bg-blue-500/10");
  });
  const activeRow = document.querySelector(
    `#planets-table-body tr[data-planet-id="${activePlanetId}"]`,
  );
  if (activeRow) activeRow.classList.add("bg-blue-500/10");
}

// Planet card click events
document.querySelectorAll(".planet-card").forEach((card) => {
  card.addEventListener("click", () => {
    const planetId = card.dataset.planetId;
    if (planetId) renderPlanetDetail(planetId);
  });
});

// ============================================================
// 5. HELPER FUNCTIONS
// ============================================================

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatLaunchDate(net) {
  if (!net) return "TBD";
  const date = new Date(net);
  if (isNaN(date)) return "TBD";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLaunchTime(net) {
  if (!net) return "TBD";
  const date = new Date(net);
  if (isNaN(date)) return "TBD";
  return (
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

function getDaysUntilLaunch(net) {
  if (!net) return "?";
  const now = new Date();
  const launch = new Date(net);
  if (isNaN(launch)) return "?";
  const diff = Math.ceil((launch - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getLaunchStatusColor(status) {
  const s = status?.toLowerCase() || "";
  if (s.includes("go") || s.includes("success"))
    return { bg: "bg-green-500/90", text: "text-white" };
  if (s.includes("tbc") || s.includes("to be confirmed"))
    return { bg: "bg-yellow-500/90", text: "text-white" };
  if (s.includes("tbd") || s.includes("to be determined"))
    return { bg: "bg-blue-500/90", text: "text-white" };
  if (s.includes("hold") || s.includes("failure"))
    return { bg: "bg-red-500/90", text: "text-white" };
  return { bg: "bg-slate-600/90", text: "text-white" };
}

function getLaunchIcon(agency) {
  const a = agency?.toLowerCase() || "";
  if (a.includes("spacex")) return "fas fa-space-shuttle";
  if (a.includes("rocket lab")) return "fas fa-rocket";
  if (a.includes("nasa")) return "fas fa-satellite";
  if (a.includes("esa") || a.includes("ariane")) return "fas fa-satellite-dish";
  if (a.includes("roscosmos")) return "fas fa-globe";
  return "fas fa-rocket";
}

// ============================================================
// 6. INITIALIZATION - تشغيل كل حاجة
// ============================================================

function init() {
  // جيب بيانات APOD
  fetchAPOD();

  // جيب بيانات الكواكب
  fetchPlanets();

  // جيب بيانات الـ Launches لما المستخدم يروح عليها
  let launchesLoaded = false;
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (link.dataset.section === "launches" && !launchesLoaded) {
        launchesLoaded = true;
        fetchLaunches();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
