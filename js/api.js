import { getWeatherCondition, getWeatherIcon } from "./weather-codes.js";
import { showLoading, hideLoading, showError, updateTemperatureDisplay, saveToHistory, renderHistory, renderForecast, renderSmartTips, showContent, updateWeatherBackground } from "./ui.js";

function getUVLevel(uv) {
    if (uv == null) return { text: "", color: "#a5b4fc" };
    if (uv <= 2) return { text: "Low", color: "#4ade80" };
    if (uv <= 5) return { text: "Moderate", color: "#facc15" };
    if (uv <= 7) return { text: "High", color: "#fb923c" };
    if (uv <= 10) return { text: "Very High", color: "#ef4444" };
    return { text: "Extreme", color: "#7c3aed" };
}

/**
 * Gets weather data for a city or direct coordinates and updates the UI.
 * @param {string} city - City name or display label for coordinate-based weather.
 * @param {Object} DOM - Object containing all DOM references used by the app.
 * @param {Function} isCelsius - Returns true when the current unit is Celsius.
 * @param {Function} getLastTemp - Returns the latest Celsius temperature.
 * @param {Function} setLastTemp - Stores the latest Celsius temperature.
 * @param {Function} setLastFeelsLike - Stores the latest apparent temperature in Celsius.
 * @param {{latitude: number, longitude: number} | null} coords - Optional coordinates that skip geocoding.
 */
export async function fetchWeather(city, DOM, isCelsius, getLastTemp, setLastTemp, setLastFeelsLike = () => {}, coords = null) {
    showLoading(DOM);

    try {
        let latitude, longitude, name;

        if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
            name = city;
        } else {
            // The weather API needs coordinates, so a city search starts with geocoding.
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
            }

            ({ latitude, longitude, name } = geoData.results[0]);
        }

        // One forecast request returns current weather, forecast data, humidity, feels-like temperature, and UV index.
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=apparent_temperature,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,uv_index_max&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        const current = weatherData.current_weather;
        // Match current_weather.time to the hourly arrays so humidity and feels-like use the same hour.
        const hourlyIndex = weatherData.hourly?.time?.indexOf(current.time) ?? -1;
        const feelsLike = hourlyIndex >= 0 ? weatherData.hourly?.apparent_temperature?.[hourlyIndex] : null;
        const humidity = hourlyIndex >= 0 ? weatherData.hourly?.relativehumidity_2m?.[hourlyIndex] : null;
        const uvIndex = weatherData.daily?.uv_index_max?.[0];
        const uv = getUVLevel(uvIndex);

        setLastTemp(current.temperature);
        setLastFeelsLike(feelsLike ?? null);
        updateTemperatureDisplay(DOM, getLastTemp(), isCelsius(), feelsLike);

        DOM.cityName.textContent = name;
        DOM.weatherCondition.textContent = getWeatherCondition(current.weathercode);
        DOM.windSpeed.textContent = `${current.windspeed} km/h`;
        DOM.weatherIcon.className = getWeatherIcon(current.weathercode);
        updateWeatherBackground(current.weathercode);

        if (DOM.humidity && humidity !== undefined) {
            DOM.humidity.textContent = `${Math.round(humidity)}%`;
        }
        if (DOM.uvIndex) {
            DOM.uvIndex.textContent = uvIndex !== undefined ? uvIndex : "--";
            DOM.uvIndex.style.color = uv.color;
            DOM.uvIndex.style.fontWeight = "700";
        }
        if (DOM.uvLevel) {
            DOM.uvLevel.textContent = uv.text;
            DOM.uvLevel.style.color = uv.color;
        }

        saveToHistory(name);
        renderHistory(DOM, (city) => fetchWeather(city, DOM, isCelsius, getLastTemp, setLastTemp, setLastFeelsLike));

        if (weatherData.daily) {
            renderForecast(DOM, weatherData.daily);
        }

        renderSmartTips(DOM, current.temperature, current.weathercode, uvIndex);

        showContent(DOM);

    } catch (error) {
        showError(DOM, error.message);
    } finally {
        hideLoading(DOM);
    }
}
