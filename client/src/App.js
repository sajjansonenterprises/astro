import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";
import welcomingSardar from "./assets/welcome.webp";
import thinkingSardar from "./assets/analysis.webp";

function App() {
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [numerologyNumber, setNumerologyNumber] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load ResponsiveVoice script dynamically
  useEffect(() => {
    // Method 1: Load ResponsiveVoice (for Hindi support)
    const rvScript = document.createElement("script");
    rvScript.src = "https://code.responsivevoice.org/responsivevoice.js";
    rvScript.async = true;
    
    // Method 2: Load Google TTS helper (fallback)
    const gTTSscript = document.createElement("script");
    gTTSscript.src = "https://translate.google.com/translate_tts?client=tw-ob";
    
    document.body.appendChild(rvScript);
    document.body.appendChild(gTTSscript);

    return () => {
      document.body.removeChild(rvScript);
      document.body.removeChild(gTTSscript);
      if (window.responsiveVoice) {
        window.responsiveVoice.cancel();
      }
    };
  }, []);

  const speakHindi = (text) => {
    try {
      // Try ResponsiveVoice Hindi first
      if (window.responsiveVoice) {
        window.responsiveVoice.speak(text, "Hindi Female", {
          rate: 0.8,
          pitch: 1,
          onstart: () => console.log("Hindi speech started"),
          onerror: () => fallbackHindiTTS(text)
        });
        return;
      }
      
      // Fallback to Google TTS if available
      fallbackHindiTTS(text);
    } catch (err) {
      console.error("Hindi speech error:", err);
      fallbackHindiTTS(text);
    }
  };

  const fallbackHindiTTS = (text) => {
    // Google TTS workaround (for Hindi)
    const audio = new Audio(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=hi&q=${encodeURIComponent(text)}`
    );
    audio.play().catch(e => console.error("Google TTS error:", e));
  };

  const speakPrediction = (text) => {
    const isHindi = /[\u0900-\u097F]/.test(text); // Detect Hindi characters
    if (isHindi) {
      speakHindi(text);
    } else {
      // For English text, use Indian-like accent
      if (window.responsiveVoice) {
        window.responsiveVoice.speak(text, "UK English Female", {
          rate: 0.85,
          pitch: 0.9
        });
      }
    }
  };

  const handleFetchPrediction = async () => {
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost/?name=${name}&mobileNumber=${mobileNumber}&dateOfBirth=${dateOfBirth}&gender=${gender}&placeOfBirth=${placeOfBirth}`
      );
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setPrediction(null);
        setNumerologyNumber(null);
      } else {
        setNumerologyNumber(data.mobileNumberNumerology);
        setPrediction(data.prediction);

        setTimeout(() => {
          speakPrediction(data.prediction);
        }, 500);
      }
    } catch (error) {
      setError("Failed to fetch prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <header className="w-full max-w-xl bg-white shadow-md rounded-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Sunita Numerology Prediction</h1>

        <div className="sardar-container">
          {loading ? (
            <div className="flex flex-col text-xl items-center justify-center">
              <img src={thinkingSardar} alt="Sardar Ji Thinking" className="sardar-image animate-pulse" />
              Sunita is Trying to Predict Your Life
            </div>
          ) : (
            <img src={welcomingSardar} alt="Welcoming Sardar Ji" className="sardar-image" />
          )}
        </div>

        <div className="form-box grid-flow-row-dense grid-cols-2 grid-rows-2">
          <input
            type="text"
            placeholder="Enter Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-50 p-2 mt-4 mx-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Enter Mobile Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            className="w-50 p-2 mt-4 mx-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-50 p-2 mt-4 mx-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-50 p-2 mt-4 mx-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Enter Place of Birth"
          value={placeOfBirth}
          onChange={(e) => setPlaceOfBirth(e.target.value)}
          className="w-full p-2 mt-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleFetchPrediction}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg mt-4"
        >
          Get Prediction
        </button>
      </header>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {loading && <p className="text-gray-600 mt-2">Loading...</p>}

      {!loading && prediction ? (
        <>
          <h2 className="text-xl font-semibold text-gray-700 mt-4">
            Your Numerology Number: {numerologyNumber}
          </h2>
          <div className="prediction-box">
            <h3 className="prediction-title">Prediction:</h3>
            <div className="markdown-content">
              <ReactMarkdown>{prediction}</ReactMarkdown>
            </div>
          </div>
        </>
      ) : !loading ? (
        <h2 className="text-xl">Write Your Details For A Prediction</h2>
      ) : null}
    </div>
  );
}

export default App;