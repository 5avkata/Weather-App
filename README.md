# Weather App

Weather App is a browser-based project built with HTML, CSS, and JavaScript. It uses the free Open-Meteo APIs, so it does not require registration, API keys, or a backend server.

[Live Preview](https://my-weather-app-project.pages.dev/)

## Features

- Search weather by city name
- City autocomplete suggestions
- Current temperature, weather condition, wind speed, humidity, feels-like temperature, and UV index
- Celsius and Fahrenheit switch
- Search history saved in localStorage
- Clear all history and delete single history items
- Automatic geolocation on page load and a geolocation button for current location weather
- Five-day forecast
- Smart weather tips
- Dynamic gradient background that changes with the current weather
- Loading skeleton and error messages
- Responsive layout

## Technologies

- HTML5
- CSS3
- JavaScript ES modules
- Open-Meteo Geocoding API
- Open-Meteo Forecast API
- Font Awesome icons
- Google Fonts

## Project Structure

```text
weather_app_project/
  index.html
  styles.css
  README.md
  LICENSE
  script.old.phase1.js
  js/
    app.js
    api.js
    ui.js
    weather-codes.js
```

## Files

- `index.html` contains the page structure and links the CSS, Font Awesome, and JavaScript module.
- `styles.css` contains the visual design, responsive layout, loading skeleton, cards, buttons, and weather-based backgrounds.
- `js/app.js` stores DOM references, event listeners, search suggestions, geolocation, and temperature unit state.
- `js/api.js` contains the asynchronous API logic for geocoding, weather data, forecast data, and error handling.
- `js/ui.js` contains display functions for loading, errors, weather content, history, forecast, smart tips, and dynamic backgrounds.
- `js/weather-codes.js` converts Open-Meteo weather codes to text descriptions and Font Awesome icon classes.
- `script.old.phase1.js` is the older single-file version kept only as project history.

## How To Run

Because the project uses JavaScript modules, open it through a local static server instead of double-clicking `index.html`.

Recommended options:

- Use the Live Server extension in VS Code.
- Or run `py -m http.server 8000` on Windows inside the project folder and open `http://localhost:8000`.
- On systems where `python` is available, `python -m http.server 8000` works too.

## API Flow

1. The app can load weather from browser geolocation or from a city search.
2. For city searches, the app sends a request to the Open-Meteo Geocoding API.
3. The app reads the latitude and longitude from the first result.
4. The app sends a second request to the Open-Meteo Forecast API.
5. The app displays current weather, forecast, extra details, and the matching background.

## Required Extension Work

- Fixed error handling through a central `showError` function.
- DOM references are collected in one `DOM` object.
- JavaScript is split into separate modules.
- Celsius/Fahrenheit switching is implemented without extra API requests.
- Search history is saved in `localStorage`.
- Extra features include geolocation, forecast, suggestions, UV index, smart tips, and dynamic weather backgrounds.

## Notes

- The browser may ask for location permission when the page opens because automatic geolocation is enabled.
- Font Awesome and Google Fonts are loaded through CDN links in `index.html`; the weather logic itself uses plain JavaScript with no framework.
