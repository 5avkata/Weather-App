import { fetchWeather } from "./api.js";
import { renderHistory, showError, updateTemperatureDisplay, renderForecast, renderSmartTips, showLoading, hideLoading, showContent } from "./ui.js";

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
    locationBtn: document.getElementById("location-btn"),
    forecastCards: document.getElementById("forecast-cards"),
    feelsLike: document.getElementById("feels-like"),
    uvIndex: document.getElementById("uv-index"),
    uvLevel: document.getElementById("uv-level"),
    humidity: document.getElementById("humidity"),
    tipsGrid: document.getElementById("tips-grid"),
    suggestionsDropdown: document.getElementById("suggestions-dropdown"),
    skeletonLoader: document.getElementById("skeleton-loader"),
    tipsSection: document.getElementById("tips-section"),
    forecastSection: document.getElementById("forecast-section")
};

let isCelsius = true;
let lastCelsius = null;
let currentSuggestions = [];
let selectedSuggestionIndex = -1;

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function fetchCitySuggestions(query) {
    if (query.length < 2) {
        DOM.suggestionsDropdown.classList.remove("show");
        return;
    }

    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            currentSuggestions = data.results;
            renderSuggestions(currentSuggestions);
            DOM.suggestionsDropdown.classList.add("show");
        } else {
            DOM.suggestionsDropdown.classList.remove("show");
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        DOM.suggestionsDropdown.classList.remove("show");
    }
}

function renderSuggestions(suggestions) {
    if (!DOM.suggestionsDropdown) return;

    DOM.suggestionsDropdown.innerHTML = "";

    suggestions.forEach((suggestion, index) => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        if (index === selectedSuggestionIndex) {
            item.classList.add("selected");
        }
        item.innerHTML = `
            <i class="fas fa-city"></i>
            <span class="suggestion-name">${suggestion.name}</span>
            <span class="suggestion-country">${suggestion.country || ""}</span>
        `;
        item.addEventListener("click", () => {
            DOM.searchInput.value = suggestion.name;
            DOM.suggestionsDropdown.classList.remove("show");
            fetchWeather(suggestion.name, DOM, () => isCelsius, () => lastCelsius, (temp) => (lastCelsius = temp));
        });
        DOM.suggestionsDropdown.appendChild(item);
    });
}

function handleKeyboardNavigation(e) {
    if (!DOM.suggestionsDropdown.classList.contains("show")) return;

    switch (e.key) {
        case "ArrowDown":
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
            renderSuggestions(currentSuggestions);
            break;
        case "ArrowUp":
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            renderSuggestions(currentSuggestions);
            break;
        case "Enter":
            if (selectedSuggestionIndex >= 0 && currentSuggestions[selectedSuggestionIndex]) {
                e.preventDefault();
                const selected = currentSuggestions[selectedSuggestionIndex];
                DOM.searchInput.value = selected.name;
                DOM.suggestionsDropdown.classList.remove("show");
                fetchWeather(selected.name, DOM, () => isCelsius, () => lastCelsius, (temp) => (lastCelsius = temp));
                selectedSuggestionIndex = -1;
            }
            break;
        case "Escape":
            DOM.suggestionsDropdown.classList.remove("show");
            selectedSuggestionIndex = -1;
            break;
    }
}

const debouncedFetchSuggestions = debounce(fetchCitySuggestions, 300);

DOM.searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    selectedSuggestionIndex = -1;
    debouncedFetchSuggestions(query);
});

DOM.searchInput.addEventListener("keydown", handleKeyboardNavigation);

document.addEventListener("click", (e) => {
    if (!DOM.searchInput.contains(e.target) && !DOM.suggestionsDropdown.contains(e.target)) {
        DOM.suggestionsDropdown.classList.remove("show");
        selectedSuggestionIndex = -1;
    }
});

async function loadWeatherByLocation() {
    if (!navigator.geolocation) {
        showError(DOM, "Your browser does not support geolocation");
        return;
    }

    showLoading(DOM);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=apparent_temperature,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,uv_index_max&timezone=auto`;
                const response = await fetch(weatherUrl);
                const data = await response.json();
                
                const current = data.current_weather;
                const feelsLike = data.hourly?.apparent_temperature?.[0];
                const humidity = data.hourly?.relativehumidity_2m?.[0];
                const uvIndex = data.daily?.uv_index_max?.[0];

                lastCelsius = current.temperature;
                updateTemperatureDisplay(DOM, lastCelsius, isCelsius);

                DOM.cityName.textContent = "📍 Current Location";
                DOM.windSpeed.textContent = `${current.windspeed} km/h`;

                if (DOM.feelsLike && feelsLike !== undefined) {
                    DOM.feelsLike.textContent = `${Math.round(feelsLike)}°C`;
                }
                if (DOM.humidity && humidity !== undefined) {
                    DOM.humidity.textContent = `${Math.round(humidity)}%`;
                }

                if (data.daily) {
                    renderForecast(DOM, data.daily);
                }
                if (DOM.tipsGrid) {
                    renderSmartTips(DOM, current.temperature, current.weathercode, uvIndex);
                }

                showContent(DOM);

            } catch (error) {
                console.error("Error:", error);
                showError(DOM, "Failed to load weather data");
            }
        },
        (error) => {
            console.error("Geolocation error:", error);
            showError(DOM, "Geolocation permission denied");
        }
    );
}

DOM.searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const city = DOM.searchInput.value.trim();

    if (city === "") {
        showError(DOM, "Please enter a city name");
        return;
    }

    DOM.suggestionsDropdown.classList.remove("show");
    fetchWeather(city, DOM, () => isCelsius, () => lastCelsius, (temp) => (lastCelsius = temp));
});

DOM.toggleButton.addEventListener("click", function () {
    isCelsius = !isCelsius;
    updateTemperatureDisplay(DOM, lastCelsius, isCelsius);
});

if (DOM.locationBtn) {
    DOM.locationBtn.addEventListener("click", function () {
        loadWeatherByLocation();
    });
}

const clearHistoryBtn = document.getElementById("clear-history-btn");
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", function() {
        if (confirm("Are you sure you want to clear all search history?")) {
            localStorage.removeItem("history");
            renderHistory(DOM, (city) =>
                fetchWeather(city, DOM, () => isCelsius, () => lastCelsius, (temp) => (lastCelsius = temp))
            );
            showError(DOM, "History cleared!");
            setTimeout(() => {
                if (DOM.errorDiv) DOM.errorDiv.style.display = "none";
            }, 1500);
        }
    });
}

renderHistory(DOM, (city) =>
    fetchWeather(city, DOM, () => isCelsius, () => lastCelsius, (temp) => (lastCelsius = temp))
);

loadWeatherByLocation();