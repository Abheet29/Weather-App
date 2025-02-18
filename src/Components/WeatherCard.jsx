const WeatherCard = ({ date, city, temperature, condition, icon, theme }) => {
    return (
        <div className={`fade-in p-4 rounded-lg shadow-lg transition-all duration-300
        ${theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-black"}`}>

            {date && <h2 className="text-xl font-bold">{date}</h2>}
            {city && <h2 className="text-xl font-bold">{city}</h2>}

            <img src={`https://openweathermap.org/img/wn/${icon}@2x.png`} alt={condition} className="mx-auto" />
            <p className="text-1xl">{temperature}°C</p>
            <p className="white:text-gray-600 ">{condition}</p>
        </div>
    );
};


export default WeatherCard;