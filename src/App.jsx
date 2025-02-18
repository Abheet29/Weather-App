import React, { useState, useEffect, useCallback } from "react";
import WeatherCard from "./Components/WeatherCard";
import debounce from "lodash.debounce";

const API_KEY = "8419f604c8ab5566464c452e93cacb76";

function App() {
  const [city, setCity] = useState(localStorage.getItem("lastCity") || "");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");

  const getCityFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      return data.length > 0 ? data[0].name : "Unknown City";
    } catch (error) {
      console.error("Error fetching city:", error);
      return "Unknown City";
    }
  };

  const fetchWeather = useCallback(async (city) => {
    if (!city) return;

    setLoading(true);
    setError(null);

    try {
      let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
      let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;

      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) throw new Error("City Not Found");

      const weatherData = await weatherResponse.json();
      setWeather({
        temperature: weatherData.main.temp,
        condition: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
      });

      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) throw new Error("Forecast not available");

      const forecastData = await forecastResponse.json();
      const dailyForecast = forecastData.list.filter((item) =>
        item.dt_txt.includes("12:00:00")
      );

      setForecast(
        dailyForecast.map((item) => ({
          date: new Date(item.dt * 1000).toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
          }),
          temperature: item.main.temp,
          condition: item.weather[0].description,
          icon: item.weather[0].icon,
        }))
      );
    } catch (e) {
      setError(e.message);
      setWeather(null);
      setForecast([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // If city is not manually set, use geolocation to fetch weather
    if (!city && !localStorage.getItem("lastCity")) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let detectedCity = await getCityFromCoordinates(latitude, longitude);
          setCity(detectedCity);
          fetchWeather(detectedCity);
        },
        (error) => console.error("Geolocation error:", error)
      );
    } else if (city) {
      fetchWeather(city);
    }
  }, [city, fetchWeather]);

  // Debounced city input
  const debouncedFetchWeather = useCallback(
    debounce(async (city) => {
      setCity(city);  // Set city only when the user has typed something
      fetchWeather(city);  // Fetch weather based on updated city
    }, 1000),
    [fetchWeather]
  );

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div
      className={`relative flex flex-col justify-center items-center min-h-screen transition-all duration-300 
        ${theme === "dark"
          ? "bg-black text-white before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_1px,transparent_1%)_0_0,radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15)_1px,transparent_1%)_50px_50px] before:bg-[size:100px_100px] before:pointer-events-none before:opacity-50"
          : "bg-gradient-to-br from-sky-300 via-white to-yellow-200 text-black"
        }`}
    >
      {/* Navbar with Theme Switch */}
      <nav className="w-full p-4 bg-transparent absolute top-0 left-0 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold">Weather App</h1>

        <div className="flex items-center space-x-4">
          {/* Theme Switch */}
          <label htmlFor="theme-toggle" className="flex items-center cursor-pointer">
            <span className="mr-2 text-lg">Light/Dark</span>
            <input
              id="theme-toggle"
              type="checkbox"
              className="hidden"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <div className="w-10 h-5 bg-gray-200 rounded-full p-1 flex items-center">
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 
                  ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}
              />
            </div>
          </label>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl relative z-10 mt-16">
        {/* Left card: Search & Current Weather */}
        <div
          className={`w-full md:w-1/3 p-6 rounded-lg shadow-lg transition-all duration-300 border
          ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
        >
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Enter a city..."
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                debouncedFetchWeather(e.target.value);
              }}
              className="border p-3 rounded-lg w-full bg-transparent outline-none dark:border-gray-600 dark:text-dark text-lg font-medium"
            />
            <span className="absolute top-3 right-4 text-gray-400">🔍</span>
          </div>

          {loading && <p className="text-center animate-pulse">Fetching weather...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {weather && (
            <WeatherCard
              city={city}
              temperature={weather.temperature}
              condition={weather.condition}
              icon={weather.icon}
              theme={theme}
            />
          )}
        </div>

        {/* Right card: Future Forecasts */}
        <div
          className={`w-full md:w-2/3 p-6 rounded-lg shadow-lg transition-all duration-300 border
          ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
        >
          <h2 className="text-2xl font-bold mb-4 text-center">5-Day Forecast</h2>
          <div className="grid grid-cols-3 gap-4">
            {forecast.map((day, index) => (
              <WeatherCard
                key={index}
                date={day.date}
                temperature={day.temperature}
                condition={day.condition}
                icon={day.icon}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
