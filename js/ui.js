import { getWeatherIcon, getWeatherCondition } from "./weather-codes.js";

export function showLoading(DOM) {
    if (DOM.skeletonLoader) DOM.skeletonLoader.style.display = "block";
    if (DOM.loadingDiv) DOM.loadingDiv.style.display = "block";
    if (DOM.weatherInfo) DOM.weatherInfo.style.display = "none";
    if (DOM.tipsSection) DOM.tipsSection.style.display = "none";
    if (DOM.forecastSection) DOM.forecastSection.style.display = "none";
    if (DOM.errorDiv) DOM.errorDiv.style.display = "none";
}

export function hideLoading(DOM) {
    if (DOM.skeletonLoader) DOM.skeletonLoader.style.display = "none";
    if (DOM.loadingDiv) DOM.loadingDiv.style.display = "none";
}

/**
 * Displays an error message and hides weather sections that may contain stale data.
 * @param {Object} DOM - Object with cached DOM references.
 * @param {string} message - Message shown to the user.
 */
export function showError(DOM, message) {
    if (DOM.errorDiv) {
        DOM.errorDiv.textContent = message;
        DOM.errorDiv.style.display = "block";
    }
    if (DOM.loadingDiv) DOM.loadingDiv.style.display = "none";
    if (DOM.skeletonLoader) DOM.skeletonLoader.style.display = "none";
    if (DOM.weatherInfo) DOM.weatherInfo.style.display = "none";
    if (DOM.tipsSection) DOM.tipsSection.style.display = "none";
    if (DOM.forecastSection) DOM.forecastSection.style.display = "none";

    setTimeout(() => {
        if (DOM.errorDiv && DOM.errorDiv.style.display === "block") {
            DOM.errorDiv.style.display = "none";
        }
    }, 5000);
}

export function showContent(DOM) {
    if (DOM.weatherInfo) DOM.weatherInfo.style.display = "block";
    if (DOM.tipsSection) DOM.tipsSection.style.display = "block";
    if (DOM.forecastSection) DOM.forecastSection.style.display = "block";
    if (DOM.skeletonLoader) DOM.skeletonLoader.style.display = "none";
}

/**
 * Changes the page background according to the current Open-Meteo weather code.
 * @param {number} weatherCode - Open-Meteo weather code.
 */
export function updateWeatherBackground(weatherCode) {
    const weatherClasses = [
        "weather-sunny",
        "weather-cloudy",
        "weather-rainy",
        "weather-snowy",
        "weather-foggy",
        "weather-stormy"
    ];

    document.body.classList.remove(...weatherClasses);

    if ([0, 1].includes(weatherCode)) {
        document.body.classList.add("weather-sunny");
    } else if ([2, 3].includes(weatherCode)) {
        document.body.classList.add("weather-cloudy");
    } else if ([45, 48].includes(weatherCode)) {
        document.body.classList.add("weather-foggy");
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
        document.body.classList.add("weather-rainy");
    } else if ([71, 73, 75].includes(weatherCode)) {
        document.body.classList.add("weather-snowy");
    } else if ([95].includes(weatherCode)) {
        document.body.classList.add("weather-stormy");
    }
}

/**
 * Updates the main temperature and apparent temperature without making a new API request.
 * @param {Object} DOM - Object with cached DOM references.
 * @param {number} temp - Current temperature in Celsius.
 * @param {boolean} isCelsius - Whether the UI should show Celsius.
 * @param {number | null} feelsLikeCelsius - Apparent temperature in Celsius.
 */
export function updateTemperatureDisplay(DOM, temp, isCelsius, feelsLikeCelsius = null) {
    if (temp === null || temp === undefined) return;

    if (isCelsius) {
        DOM.temperature.textContent = `${temp}`;
        if (DOM.toggleButton) DOM.toggleButton.textContent = "°C";
        if (DOM.feelsLike && feelsLikeCelsius !== null && feelsLikeCelsius !== undefined) {
            DOM.feelsLike.textContent = `${Math.round(feelsLikeCelsius)}°C`;
        }
    } else {
        const fahrenheit = (temp * 9) / 5 + 32;
        DOM.temperature.textContent = `${fahrenheit.toFixed(0)}`;
        if (DOM.toggleButton) DOM.toggleButton.textContent = "°F";
        if (DOM.feelsLike && feelsLikeCelsius !== null && feelsLikeCelsius !== undefined) {
            const feelsLikeFahrenheit = (feelsLikeCelsius * 9) / 5 + 32;
            DOM.feelsLike.textContent = `${Math.round(feelsLikeFahrenheit)}°F`;
        }
    }
}

/**
 * Saves a city to localStorage while keeping only the five most recent searches.
 * @param {string} city - City name to save.
 */
export function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    const cityLower = city.toLowerCase();

    history = history.filter((c) => c.toLowerCase() !== cityLower);
    history.unshift(city);
    history = history.slice(0, 5);

    localStorage.setItem("history", JSON.stringify(history));
}

/**
 * Renders saved search history and connects each city to a new weather request.
 * @param {Object} DOM - Object with cached DOM references.
 * @param {Function} fetchWeather - Function called when a history item is selected.
 */
export function renderHistory(DOM, fetchWeather) {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    if (!DOM.searchHistoryDiv) return;
    DOM.searchHistoryDiv.innerHTML = "";

    history.forEach((city) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "history-item";
        
        const cityBtn = document.createElement("button");
        cityBtn.textContent = city;
        cityBtn.className = "city-btn";
        cityBtn.addEventListener("click", () => {
            if (DOM.searchInput) DOM.searchInput.value = city;
            fetchWeather(city);
        });
        
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.className = "delete-item-btn";
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            let updatedHistory = JSON.parse(localStorage.getItem("history")) || [];
            updatedHistory = updatedHistory.filter(c => c !== city);
            localStorage.setItem("history", JSON.stringify(updatedHistory));
            renderHistory(DOM, fetchWeather);
        });
        
        itemDiv.appendChild(cityBtn);
        itemDiv.appendChild(deleteBtn);
        DOM.searchHistoryDiv.appendChild(itemDiv);
    });
}

/**
 * Renders the next five days of forecast cards.
 * @param {Object} DOM - Object with cached DOM references.
 * @param {Object} dailyData - Daily weather data returned from Open-Meteo.
 */
export function renderForecast(DOM, dailyData) {
    if (!DOM.forecastCards) return;

    DOM.forecastCards.innerHTML = "";

    const days = dailyData.time.slice(0, 5);
    const maxTemps = dailyData.temperature_2m_max.slice(0, 5);
    const minTemps = dailyData.temperature_2m_min.slice(0, 5);
    const codes = dailyData.weathercode.slice(0, 5);

    days.forEach((date, index) => {
        const dayName = index === 0 ? "Today" : new Date(date).toLocaleDateString("en-US", { weekday: "short" });
        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <div class="day">${dayName}</div>
            <i class="${getWeatherIcon(codes[index])}"></i>
            <div class="temp-range">${Math.round(maxTemps[index])}° / ${Math.round(minTemps[index])}°</div>
            <div class="condition">${getWeatherCondition(codes[index])}</div>
        `;

        DOM.forecastCards.appendChild(card);
    });

    DOM.forecastCards.style.display = "flex";
}

/**
 * Generates short practical tips from the current weather conditions.
 * @param {Object} DOM - Object with cached DOM references.
 * @param {number} temp - Current temperature in Celsius.
 * @param {number} weatherCode - Open-Meteo weather code.
 * @param {number | undefined} uvIndex - Current day's UV index.
 */
export function renderSmartTips(DOM, temp, weatherCode, uvIndex) {
    if (!DOM.tipsGrid) return;

    const isRainy = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode);
    const isSnowy = [71, 73, 75].includes(weatherCode);
    const isClear = [0, 1].includes(weatherCode);
    const isCloudy = [2, 3].includes(weatherCode);
    const isFoggy = [45, 48].includes(weatherCode);
    const isThunderstorm = weatherCode === 95;

    const tips = [
        {
            icon: "☔",
            question: "Bring umbrella?",
            answer: isRainy ? "Yes, rain expected!" : isSnowy ? "Snow, bring umbrella" : "No need",
            color: isRainy ? "#60a5fa" : "#a5b4fc"
        },
        {
            icon: "🕶️",
            question: "Wear sunglasses?",
            answer: isClear ? "Yes, sunny!" : uvIndex > 5 ? "UV is high!" : "Not necessary",
            color: isClear ? "#fbbf24" : "#a5b4fc"
        },
        {
            icon: "🧥",
            question: "Wear a jacket?",
            answer: temp < 10 ? "Yes, cold!" : temp < 20 ? "Light jacket" : "No need",
            color: temp < 10 ? "#60a5fa" : "#a5b4fc"
        },
        {
            icon: "🏃",
            question: "Go for a run?",
            answer: isRainy || isThunderstorm ? "Not ideal" : temp > 5 && temp < 30 ? "Go for it!" : "Too extreme",
            color: !isRainy && temp > 5 && temp < 30 ? "#4ade80" : "#fbbf24"
        },
        {
            icon: "📸",
            question: "Good for photos?",
            answer: isClear ? "Perfect!" : isCloudy ? "Flat lighting" : "Not ideal",
            color: isClear ? "#4ade80" : "#fbbf24"
        },
        {
            icon: "🪟",
            question: "Open windows?",
            answer: !isRainy && !isFoggy && temp > 10 ? "Fresh air!" : "Keep closed",
            color: !isRainy && !isFoggy && temp > 10 ? "#4ade80" : "#ef4444"
        }
    ];

    DOM.tipsGrid.innerHTML = "";

    tips.forEach(tip => {
        const tipCard = document.createElement("div");
        tipCard.className = "tip-card";
        tipCard.style.borderLeft = `3px solid ${tip.color}`;
        tipCard.innerHTML = `
            <div class="tip-icon">${tip.icon}</div>
            <div class="tip-content">
                <span class="tip-question">${tip.question}</span>
                <span class="tip-answer">${tip.answer}</span>
            </div>
        `;
        DOM.tipsGrid.appendChild(tipCard);
    });

    DOM.tipsGrid.style.display = "grid";
}
