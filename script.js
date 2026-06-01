const DOM = {
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    cityName: document.getElementById("city-name"),
    weatherIcon: document.getElementById("weather-icon"),
    temperature: document.getElementById("temperature"),
    weatherCondition: document.getElementById("weather-condition"),
    windSpeed: document.getElementById("wind-speed"),
    loadingDiv: document.getElementById("loading"),
    errorDiv: document.getElementById("error"),
    weatherInfo: document.getElementById("weather-info"),
    toggleButton: document.getElementById("toggle-unit"),
    searchHistoryDiv: document.getElementById("search-history"),

    uvIndex: document.getElementById("uv-index")
};

function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    city = city.toLowerCase();

    history = history.filter(c => c.toLowerCase() !== city.toLowerCase());

    history.unshift(city);

    history = history.slice(0, 5);

    localStorage.setItem("history", JSON.stringify(history));
}

function renderHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    DOM.searchHistoryDiv.innerHTML = "";

    history.forEach(city => {
        const btn = document.createElement("button");
        btn.textContent = city;

        btn.addEventListener("click", () => {
            fetchWeather(city);
        });

        DOM.searchHistoryDiv.appendChild(btn);
    });
}

let isCelsius = true;
let lastCelsius = null;

function updateTemperatureDisplay() {
    if (lastCelsius === null) return;

    if (isCelsius) {
        DOM.temperature.textContent = `${lastCelsius}°C`;
    } else {
        const f = (lastCelsius * 9 / 5 + 32).toFixed(1);
        DOM.temperature.textContent = `${f}°F`;
    }
}

function showLoading() {
    DOM.loadingDiv.style.display = "block";
    DOM.errorDiv.style.display = "none";
    DOM.weatherInfo.style.display = "none";
}

function hideLoading() {
    DOM.loadingDiv.style.display = "none";
}

function showError(message) {
    DOM.errorDiv.textContent = message;
    DOM.errorDiv.style.display = "block";
    DOM.loadingDiv.style.display = "none";
    DOM.weatherInfo.style.display = "none";
}

function getWeatherCondition(code) {
    const conditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Snow",
        73: "Snow",
        75: "Heavy snow",
        80: "Rain showers",
        81: "Rain showers",
        82: "Violent showers",
        95: "Thunderstorm"
    };

    return conditions[code] || "Unknown";
}

function getWeatherIcon(code) {
    const icons = {
        0: "fas fa-sun",
        1: "fas fa-cloud-sun",
        2: "fas fa-cloud-sun",
        3: "fas fa-cloud",
        45: "fas fa-smog",
        48: "fas fa-smog",
        51: "fas fa-cloud-rain",
        53: "fas fa-cloud-rain",
        55: "fas fa-cloud-rain",
        61: "fas fa-cloud-rain",
        63: "fas fa-cloud-showers-heavy",
        65: "fas fa-cloud-showers-heavy",
        71: "fas fa-snowflake",
        73: "fas fa-snowflake",
        75: "fas fa-snowflake",
        80: "fas fa-cloud-rain",
        81: "fas fa-cloud-showers-heavy",
        82: "fas fa-cloud-showers-heavy",
        95: "fas fa-bolt"
    };

    return icons[code] || "fas fa-cloud";
}

async function fetchWeather(city) {
    showLoading();

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found");
        }

        const { latitude, longitude, name } = geoData.results[0];

        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=uv_index_max&timezone=auto`;

        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        const current = weatherData.current_weather;

        const uvIndex = weatherData.daily?.uv_index_max?.[0];

        lastCelsius = current.temperature;
        updateTemperatureDisplay();

        DOM.cityName.textContent = name;
        DOM.weatherCondition.textContent = getWeatherCondition(current.weathercode);
        DOM.windSpeed.textContent = current.windspeed;
        DOM.weatherIcon.className = getWeatherIcon(current.weathercode);

        // UV INDEX
        if (DOM.uvIndex) {
            DOM.uvIndex.textContent = uvIndex ?? "--";
        }

        DOM.weatherInfo.style.display = "block";

        saveToHistory(name);
        renderHistory();

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

DOM.searchForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const city = DOM.searchInput.value.trim();

    if (city === "") {
        showError("Моля, въведете име на град");
        return;
    }

    fetchWeather(city);
});

DOM.toggleButton.addEventListener("click", function () {
    isCelsius = !isCelsius;
    updateTemperatureDisplay();
    DOM.toggleButton.textContent = isCelsius ? "°C / °F" : "°F / °C";
});

renderHistory();