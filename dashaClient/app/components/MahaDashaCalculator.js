"use client"
import { useState } from 'react';

const MahaDashaCalculator = () => {
  // Planetary periods in years (Vimshottari Dasha system)
  const planetaryPeriods = {
    'Ketu': 7,
    'Venus': 20,
    'Sun': 6,
    'Moon': 10,
    'Mars': 7,
    'Rahu': 18,
    'Jupiter': 16,
    'Saturn': 19,
    'Mercury': 17
  };

  // Order of dashas
  const dashaOrder = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

  // Nakshatras with their lords and starting points
  const nakshatras = [
    { name: 'Ashwini', lord: 'Ketu', start: 0 },
    { name: 'Bharani', lord: 'Venus', start: 13.3333 },
    { name: 'Krittika', lord: 'Sun', start: 26.6667 },
    { name: 'Rohini', lord: 'Moon', start: 40 },
    { name: 'Mrigashira', lord: 'Mars', start: 53.3333 },
    { name: 'Ardra', lord: 'Rahu', start: 66.6667 },
    { name: 'Punarvasu', lord: 'Jupiter', start: 80 },
    { name: 'Pushya', lord: 'Saturn', start: 93.3333 },
    { name: 'Ashlesha', lord: 'Mercury', start: 106.6667 },
    { name: 'Magha', lord: 'Ketu', start: 120 },
    { name: 'Purva Phalguni', lord: 'Venus', start: 133.3333 },
    { name: 'Uttara Phalguni', lord: 'Sun', start: 146.6667 },
    { name: 'Hasta', lord: 'Moon', start: 160 },
    { name: 'Chitra', lord: 'Mars', start: 173.3333 },
    { name: 'Swati', lord: 'Rahu', start: 186.6667 },
    { name: 'Vishakha', lord: 'Jupiter', start: 200 },
    { name: 'Anuradha', lord: 'Saturn', start: 213.3333 },
    { name: 'Jyeshtha', lord: 'Mercury', start: 226.6667 },
    { name: 'Mula', lord: 'Ketu', start: 240 },
    { name: 'Purva Ashadha', lord: 'Venus', start: 253.3333 },
    { name: 'Uttara Ashadha', lord: 'Sun', start: 266.6667 },
    { name: 'Shravana', lord: 'Moon', start: 280 },
    { name: 'Dhanishta', lord: 'Mars', start: 293.3333 },
    { name: 'Shatabhisha', lord: 'Rahu', start: 306.6667 },
    { name: 'Purva Bhadrapada', lord: 'Jupiter', start: 320 },
    { name: 'Uttara Bhadrapada', lord: 'Saturn', start: 333.3333 },
    { name: 'Revati', lord: 'Mercury', start: 346.6667 }
  ];

  // State variables
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthPlace, setBirthPlace] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [dashaResults, setDashaResults] = useState(null);
  const [error, setError] = useState('');

  // Function to calculate Moon position (simplified approximation)
  const calculateMoonPosition = (birthDate) => {
    // This is a simplified calculation - in a real app, use an astrology API
    // For demonstration, we'll use a rough estimate based on date
    
    // Get day of year (1-365)
    const startOfYear = new Date(birthDate.getFullYear(), 0, 0);
    const diff = birthDate - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Moon completes ~1 cycle every 27.3 days through nakshatras
    const moonCycleDays = 27.3;
    const positionInCycle = (dayOfYear % moonCycleDays) / moonCycleDays;
    
    // Convert to degrees (0-360)
    return positionInCycle * 360;
  };

  const calculateDasha = async () => {
    if (!birthDate || !birthPlace) {
      setError('Please enter your birth date and place');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would call an astrology API here
      // For this example, we'll use our simplified calculation
      const birthDateObj = new Date(birthDate);
      const moonPosition = calculateMoonPosition(birthDateObj);

      // Find the nakshatra based on moon position
      let nakshatra = null;
      for (let i = 0; i < nakshatras.length; i++) {
        if (moonPosition >= nakshatras[i].start && 
            (i === nakshatras.length - 1 || moonPosition < nakshatras[i + 1].start)) {
          nakshatra = nakshatras[i];
          break;
        }
      }

      if (!nakshatra) {
        throw new Error('Could not determine nakshatra');
      }

      // Calculate remaining degrees in nakshatra
      const nextNakshatraIndex = (nakshatras.findIndex(n => n.name === nakshatra.name) + 1) % nakshatras.length;
      const nextNakshatraStart = nakshatras[nextNakshatraIndex].start;
      const nakshatraSpan = nextNakshatraStart > nakshatra.start 
        ? nextNakshatraStart - nakshatra.start 
        : (360 - nakshatra.start) + nextNakshatraStart;
      
      const remainingDegrees = nextNakshatraStart - moonPosition;
      const portion = remainingDegrees / nakshatraSpan;

      // Calculate time remaining in the first dasha
      const firstDashaLord = nakshatra.lord;
      const firstDashaYears = planetaryPeriods[firstDashaLord];
      const firstDashaRemainingYears = portion * firstDashaYears;

      // Calculate birth date and current date in milliseconds
      const currentDateObj = new Date(currentDate);
      
      // Calculate time elapsed since birth in years
      const timeElapsed = (currentDateObj - birthDateObj) / (1000 * 60 * 60 * 24 * 365.25);

      // Calculate total dasha years
      const totalDashaYears = Object.values(planetaryPeriods).reduce((a, b) => a + b, 0);

      // Calculate elapsed time in dasha cycles
      let elapsedTimeInDasha = timeElapsed + firstDashaRemainingYears;
      const completedCycles = Math.floor(elapsedTimeInDasha / totalDashaYears);
      elapsedTimeInDasha = elapsedTimeInDasha - (completedCycles * totalDashaYears);

      // Find current dasha and next dashas
      let currentDasha = null;
      let nextDashas = [];
      let accumulatedTime = 0;
      let foundCurrent = false;

      // Start with the first dasha lord
      let currentLordIndex = dashaOrder.findIndex(lord => lord === firstDashaLord);

      for (let i = 0; i < dashaOrder.length; i++) {
        const lordIndex = (currentLordIndex + i) % dashaOrder.length;
        const lord = dashaOrder[lordIndex];
        const period = planetaryPeriods[lord];

        if (!foundCurrent) {
          if (accumulatedTime + period > elapsedTimeInDasha) {
            currentDasha = {
              lord,
              start: new Date(birthDateObj.getTime() + (elapsedTimeInDasha - accumulatedTime) * 365.25 * 24 * 60 * 60 * 1000),
              end: new Date(birthDateObj.getTime() + (elapsedTimeInDasha - accumulatedTime + period) * 365.25 * 24 * 60 * 60 * 1000),
              remainingYears: (accumulatedTime + period - elapsedTimeInDasha).toFixed(2)
            };
            foundCurrent = true;
          } else {
            accumulatedTime += period;
          }
        } else if (nextDashas.length < 3) {
          nextDashas.push({
            lord,
            years: period,
            start: new Date(currentDasha.end.getTime() + (nextDashas.reduce((a, b) => a + b.years, 0) * 365.25 * 24 * 60 * 60 * 1000)),
            end: new Date(currentDasha.end.getTime() + (nextDashas.reduce((a, b) => a + b.years, 0) + period) * 365.25 * 24 * 60 * 60 * 1000)
          });
        }
      }

      setDashaResults({
        moonPosition: moonPosition.toFixed(2),
        nakshatra: nakshatra.name,
        nakshatraLord: nakshatra.lord,
        currentDasha,
        nextDashas
      });

    } catch (error) {
      setError('Error calculating dasha: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to integrate with a real astrology API (placeholder)
  const fetchAstroData = async (birthDate, birthTime, birthPlace) => {
    // In a real implementation, you would call an API like:
    // const response = await fetch(`https://astrology-api.com/api?date=${birthDate}&time=${birthTime}&place=${birthPlace}`);
    // return await response.json();
    
    // For demo purposes, return mock data
    return {
      moonPosition: 102.34, // Example position for Pushya Nakshatra
      moonSign: "Cancer"
    };
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700">Advanced Maha Dasha Calculator</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Birth Time (24-hour format)</label>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place (City, Country)</label>
          <input
            type="text"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="e.g., Mumbai, India"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Date</label>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <button
          onClick={calculateDasha}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
          }`}
        >
          {isLoading ? 'Calculating...' : 'Calculate Maha Dasha'}
        </button>
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        {dashaResults && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-indigo-50 rounded-md">
              <h2 className="font-semibold text-indigo-800">Birth Details</h2>
              <p className="text-indigo-600">Moon Position: {dashaResults.moonPosition}°</p>
              <p className="text-indigo-600">Nakshatra: {dashaResults.nakshatra} ({dashaResults.nakshatraLord})</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-md">
              <h2 className="font-semibold text-green-800">Current Maha Dasha</h2>
              <p className="text-lg font-bold text-green-700">{dashaResults.currentDasha.lord}</p>
              <p className="text-sm text-green-600">
                {dashaResults.currentDasha.start.toLocaleDateString()} to {dashaResults.currentDasha.end.toLocaleDateString()}
              </p>
              <p className="text-sm text-green-600">
                Remaining: {dashaResults.currentDasha.remainingYears} years
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-md">
              <h2 className="font-semibold text-blue-800">Next Maha Dashas</h2>
              <div className="space-y-3 mt-2">
                {dashaResults.nextDashas.map((dasha, index) => (
                  <div key={index} className="border-b border-blue-100 pb-2 last:border-0">
                    <p className="font-medium text-blue-700">{dasha.lord} ({dasha.years} years)</p>
                    <p className="text-xs text-blue-600">
                      {dasha.start.toLocaleDateString()} to {dasha.end.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>Note: This calculator uses simplified calculations. For precise results, integrate with a professional astrology API.</p>
        </div>
      </div>
    </div>
  );
};

export default MahaDashaCalculator;