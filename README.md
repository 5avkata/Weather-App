# Weather App

Weather App is a browser-based project built with HTML, CSS, and JavaScript. It uses the free Open-Meteo APIs, so it does not require registration, API keys, a backend server, or additional libraries.

## Features

- Search weather by city name
- City autocomplete suggestions
- Current temperature, weather condition, wind speed, humidity, feels-like temperature, and UV index
- Celsius and Fahrenheit switch
- Search history saved in localStorage
- Clear all history and delete single history items
- Geolocation button for current location weather
- Five-day forecast
- Smart weather tips
- Loading skeleton and error messages
- Responsive layout

## Technologies

- HTML5
- CSS3
- JavaScript ES modules
- Open-Meteo Geocoding API
- Open-Meteo Forecast API
- Font Awesome icons

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
- `styles.css` contains the visual design, responsive layout, loading skeleton, cards, and buttons.
- `js/app.js` stores DOM references, event listeners, search suggestions, geolocation, and temperature unit state.
- `js/api.js` contains the asynchronous API logic for geocoding, weather data, forecast data, and error handling.
- `js/ui.js` contains display functions for loading, errors, weather content, history, forecast, and smart tips.
- `js/weather-codes.js` converts Open-Meteo weather codes to text descriptions and Font Awesome icon classes.
- `script.old.phase1.js` is the older single-file version kept only as project history.

## How To Run

Because the project uses JavaScript modules, open it through a local static server instead of double-clicking `index.html`.

Recommended options:

- Use the Live Server extension in VS Code.
- Or run `python -m http.server` inside the project folder and open the shown localhost address.

## API Flow

1. The user enters a city name.
2. The app sends a request to the Open-Meteo Geocoding API.
3. The app reads the latitude and longitude from the first result.  
4. The app sends a second request to the Open-Meteo Forecast API.
5. The app displays current weather, forecast, and extra details.

## Required Extension Work

- Fixed error handling through a central `showError` function.
- DOM references are collected in one `DOM` object.
- JavaScript is split into separate modules.
- Celsius/Fahrenheit switching is implemented without extra API requests.
- Search history is saved in `localStorage`.
- Extra features include geolocation, forecast, suggestions, UV index, and smart tips.

