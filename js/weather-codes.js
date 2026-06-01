export function getWeatherCondition(code) {
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

export function getWeatherIcon(code) {
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