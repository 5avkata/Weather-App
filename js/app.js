import { fetchWeather } from "./api.js";
import { renderHistory, showError, updateTemperatureDisplay, showLoading, hideLoading } from "./ui.js";

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

// State shared between searches and the unit switch.
let isCelsius = true;
let lastCelsius = null;
let lastFeelsLikeCelsius = null;
let currentSuggestions = [];
let selectedSuggestionIndex = -1;

function getIsCelsius() { return isCelsius; }
function getLastTemp() { return lastCelsius; }
function setLastTemp(temp) { lastCelsius = temp; }
function setLastFeelsLike(temp) { lastFeelsLikeCelsius = temp; }

/**
 * Fetches weather for a typed city and keeps shared app state in one place.
 * @param {string} city - City name entered by the user.
 */
function doFetchWeather(city) {
    fetchWeather(city, DOM, getIsCelsius, getLastTemp, setLastTemp, setLastFeelsLike);
}

/**
 * Creates a delayed version of a function to avoid too many API calls while typing.
 * @param {Function} func - Function to run after the delay.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Loads city suggestions from Open-Meteo's geocoding API.
 * @param {string} query - Partial city name from the search input.
 */
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
            doFetchWeather(suggestion.name);
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
                doFetchWeather(selected.name);
                selectedSuggestionIndex = -1;
            }
            break;
        case "Escape":
            DOM.suggestionsDropdown.classList.remove("show");
            selectedSuggestionIndex = -1;
            break;
    }
}

// Search suggestions are debounced so typing does not send a request for every key press.
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

/**
 * Uses browser geolocation and then loads weather directly from coordinates.
 */
async function loadWeatherByLocation() {
    if (!navigator.geolocation) {
        showError(DOM, "Your browser does not support geolocation");
        return;
    }

    showLoading(DOM);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            fetchWeather("Current Location", DOM, getIsCelsius, getLastTemp, setLastTemp, setLastFeelsLike, { latitude, longitude });
        },
        (error) => {
            console.error("Geolocation error:", error);
            showError(DOM, "Geolocation permission denied");
            hideLoading(DOM);
        }
    );
}

// Main user actions: search, switch units, use geolocation, and clear history.
DOM.searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const city = DOM.searchInput.value.trim();

    if (city === "") {
        showError(DOM, "Please enter a city name");
        return;
    }

    DOM.suggestionsDropdown.classList.remove("show");
    doFetchWeather(city);
});

DOM.toggleButton.addEventListener("click", function () {
    isCelsius = !isCelsius;
    updateTemperatureDisplay(DOM, lastCelsius, isCelsius, lastFeelsLikeCelsius);
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
            renderHistory(DOM, doFetchWeather);
            if (DOM.errorDiv) {
                DOM.errorDiv.textContent = "History cleared!";
                DOM.errorDiv.style.display = "block";
            }
            setTimeout(() => {
                if (DOM.errorDiv) DOM.errorDiv.style.display = "none";
            }, 1500);
        }
    });
}

renderHistory(DOM, doFetchWeather);

loadWeatherByLocation();
