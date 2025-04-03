import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown"
import "./App.css";
import welcomingSardar from "./assets/welcome.webp";
import thinkingSardar from "./assets/analysis.webp";
import TypingMarkdown from "./TypingMarkdown";
import { toJpeg } from 'html-to-image';
import jsPDF from "jspdf";


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
  const [isSpeaking, setIsSpeaking] = useState(false);
const [nameNumerology,setNameNumerology]=useState(null)
const [dobNumerology,setDobNumerology]=useState(null)
  const generatePDF = async () => {
    const reportElement = document.getElementById('numerology-report');

    try {
        const originalStyles = {
            position: reportElement.style.position,
            left: reportElement.style.left,
            visibility: reportElement.style.visibility,
        };

        reportElement.style.position = 'relative';
        reportElement.style.left = '0';
        reportElement.style.visibility = 'visible';

        await new Promise(resolve => setTimeout(resolve, 100));

        // Convert HTML to an image (JPEG for smaller size)
        const dataUrl = await toJpeg(reportElement, {
            quality: 0.8,
            backgroundColor: "#ffffff",
            pixelRatio: 2
        });

        reportElement.style.position = originalStyles.position;
        reportElement.style.left = originalStyles.left;
        reportElement.style.visibility = originalStyles.visibility;

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const canvas = document.createElement('canvas');
        const img = new Image();

        img.onload = async () => {
            const imgWidth = pageWidth - 20;
            const scaleFactor = imgWidth / img.width;  // Scale proportionally

            // Ensure valid dimensions
            if (img.width === 0 || img.height === 0) {
                console.error("Image dimensions are invalid.");
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            let yPos = 0;
            let page = 0;
            const cropHeight = (pageHeight - 20) / scaleFactor; // Convert to canvas scale

            while (yPos < img.height) {
                const croppedCanvas = document.createElement('canvas');
                croppedCanvas.width = img.width;
                croppedCanvas.height = Math.min(cropHeight, img.height - yPos);
                const croppedCtx = croppedCanvas.getContext('2d');

                croppedCtx.drawImage(
                    img,
                    0, yPos, img.width, croppedCanvas.height,
                    0, 0, img.width, croppedCanvas.height
                );

                const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.8);
                if (page > 0) pdf.addPage();
                pdf.addImage(croppedImage, 'JPEG', 10, 10, imgWidth, (croppedCanvas.height * imgWidth) / img.width);

                yPos += cropHeight;
                page++;
            }

            pdf.save(`Numerology-Report-${name || 'User'}.pdf`);
        };

        img.onerror = () => {
            console.error("Error loading image.");
        };

        img.src = dataUrl; // Set image source after assigning event handlers

    } catch (error) {
        console.error('Error generating PDF:', error);
        setError('Failed to generate PDF. Please try again.');
    }
};

  // Load ResponsiveVoice script dynamically

 

  const fallbackHindiTTS = (text) => {
    // Google TTS workaround (for Hindi)
    const audio = new Audio(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=hi&q=${encodeURIComponent(text)}`
    );
    audio.play().catch(e => console.error("Google TTS error:", e));
  };

  const handlePauseSpeech = () => {
    if (window.responsiveVoice) {
      if (isSpeaking) {
        window.responsiveVoice.pause();
        setIsSpeaking(false);
      } else {
        window.responsiveVoice.resume();
        setIsSpeaking(true);
      }
    }
  };
  
  const speakPrediction = (text) => {
    // Cancel any ongoing speech
    if (window.responsiveVoice) {
      window.responsiveVoice.cancel();
    }
  
    const isHindi = /[\u0900-\u097F]/.test(text);
    if (isHindi) {
      window.responsiveVoice.speak(text, "Hindi Female", {
        rate: 0.8,
        pitch: 1,
        onstart: () => setIsSpeaking(true),
        onend: () => setIsSpeaking(false),
        onerror: () => fallbackHindiTTS(text)
      });
    } else {
      if (window.responsiveVoice) {
        window.responsiveVoice.speak(text, "UK English Female", {
          rate: 0.85,
          pitch: 0.9,
          onstart: () => setIsSpeaking(true),
          onend: () => setIsSpeaking(false)
        });
      }
    }
  };
  useEffect(() => {
    return () => {
      if (window.responsiveVoice) {
        window.responsiveVoice.cancel();
      }
    };
  }, []);
  const handleTypingComplete = () => {
    speakPrediction(prediction);
    setIsSpeaking(true);
  };

  const handleSpeak = (text) => {
    speakPrediction(text);
    setIsSpeaking(true);
  };



  const handleFetchPrediction = async () => {
    // Validate mobile number
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
  
    // Validate all fields are filled
    if (!name || !dateOfBirth || !gender || !placeOfBirth) {
      setError("Please fill in all fields.");
      return;
    }
  
    // Validate age (minimum 12 years)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  
    if (age < 12) {
      setError("You must be at least 12 years old to use this service.");
      return;
    }
  
    setError(null);
    setLoading(true);
  
    try {
      const response = await fetch(
        `https://astro-fj9w.onrender.com/?name=${encodeURIComponent(name)}&mobileNumber=${mobileNumber}&dateOfBirth=${dateOfBirth}&gender=${gender}&placeOfBirth=${encodeURIComponent(placeOfBirth)}`
      );
      const data = await response.json();
  
      if (data.error) {
        setError(data.error);
        setPrediction(null);
        setNumerologyNumber(null);
      } else {
        setNumerologyNumber(data.mobileNumberNumerology);
        setNameNumerology(data.nameNumerology);
        setDobNumerology(data.dobNumerology);
        setPrediction(data.prediction);
      }
    } catch (error) {
      setError("Failed to fetch prediction. Please try again later.");
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
    onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} // Only allow letters and spaces
    className="w-50 p-2 mt-4 mx-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    required
  />

  <input
    type="tel"
    placeholder="Enter Mobile Number"
    value={mobileNumber}
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
      if (value.length <= 10) setMobileNumber(value);
    }}
    className="w-50 p-2 mt-4 mx-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    required
  />

  <input
    type="date"
    value={dateOfBirth}
    onChange={(e) => setDateOfBirth(e.target.value)}
    max={new Date().toISOString().split('T')[0]} // Disable future dates
    className="w-50 p-2 mt-4 mx-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    required
  />

  <select
    value={gender}
    onChange={(e) => setGender(e.target.value)}
    className="w-50 p-2 mt-4 mx-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    required
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
  onChange={(e) => setPlaceOfBirth(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} // Only allow letters and spaces
  className="w-full p-2 mt-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  required
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
      {!loading && prediction && (
  <>
    <h2 className="text-xl font-semibold text-gray-700 mt-4">
      Your Numerology Number: {numerologyNumber}
    </h2>
    <div className="prediction-box">
      <h3 className="prediction-title">Prediction:</h3>
      <TypingMarkdown 
        content={prediction}
        typingSpeed={2}
        onTypingComplete={handleTypingComplete}
        isSpeaking={isSpeaking}
        onSpeak={handleSpeak}
        onPauseSpeech={handlePauseSpeech}
      />
      <button
        onClick={generatePDF}
        className="mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg"
      >
        Download PDF Report
      </button>
    </div>
  </>
)}
   {/* Hidden report template for PDF generation */}
   <div id="numerology-report" style={{ 
  position: 'absolute', 
  left: '-9999px', 
  width: '794px', 
  padding: '40px', 
  background: 'white',
  fontFamily: 'Arial, sans-serif',
  lineHeight: 1.6
}}>
  {/* Header Section */}
  <div style={{ 
    textAlign: 'center', 
    marginBottom: '30px',
    borderBottom: '2px solid #4299e1',
    paddingBottom: '20px'
  }}>
    <h1 style={{ 
      color: '#2d3748', 
      marginBottom: '10px',
      fontSize: '28px',
      fontWeight: 'bold'
    }}>Numerology Report</h1>
    <p style={{ 
      color: '#718096', 
      fontSize: '14px',
      marginTop: '0'
    }}>Generated on {new Date().toLocaleDateString()}</p>
  </div>

  {/* Personal Details Section */}
  <div style={{ 
    marginBottom: '40px',
    background: '#f8fafc',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }}>
    <h2 style={{ 
      color: '#2d3748', 
      fontSize: '20px',
      marginBottom: '15px',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '10px'
    }}>Personal Details</h2>
    
    <table style={{ 
      width: '100%', 
      borderCollapse: 'collapse',
      fontSize: '15px'
    }}>
      <tbody>
        <tr>
          <td style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid #edf2f7', 
            width: '35%',
            fontWeight: '600',
            color: '#4a5568'
          }}>Full Name:</td>
          <td style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid #edf2f7',
            color: '#2d3748'
          }}>{name}</td>
        </tr>
        <tr>
          <td style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid #edf2f7',
            fontWeight: '600',
            color: '#4a5568'
          }}>Mobile Number:</td>
          <td style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid #edf2f7',
            color: '#2d3748'
          }}>{mobileNumber}</td>
        </tr>
        <tr>
          <td style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid #edf2f7',
            fontWeight: '600',
            color: '#4a5568'
          }}>Date of Birth:</td>
          <td style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid #edf2f7',
            color: '#2d3748'
          }}>{dateOfBirth}</td>
        </tr>
        <tr>
          <td style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid #edf2f7',
            fontWeight: '600',
            color: '#4a5568'
          }}>Gender:</td>
          <td style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid #edf2f7',
            color: '#2d3748'
          }}>{gender}</td>
        </tr>
        <tr>
          <td style={{ 
            padding: '12px 0',
            fontWeight: '600',
            color: '#4a5568'
          }}>Place of Birth:</td>
          <td style={{ padding: '12px 0', color: '#2d3748' }}>{placeOfBirth}</td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Numerology Numbers Section */}
  <div style={{ 
    marginBottom: '40px',
    background: '#f8fafc',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }}>
    <h2 style={{ 
      color: '#2d3748', 
      fontSize: '20px',
      marginBottom: '20px',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '10px'
    }}>Numerology Numbers</h2>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      {/* Name Number */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '20px',
        flex: '1 1 30%',
        minWidth: '200px'
      }}>
        <h3 style={{ 
          color: '#2d3748',
          fontSize: '16px',
          marginBottom: '10px'
        }}>Name Number</h3>
        <div style={{ 
          display: 'inline-block', 
          background: 'linear-gradient(135deg, #4299e1, #3182ce)',
          color: 'white', 
          padding: '15px 25px', 
          borderRadius: '50%',
          fontSize: '28px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(66, 153, 225, 0.3)'
        }}>
          {nameNumerology}
        </div>
      </div>
      
      {/* DOB Number */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '20px',
        flex: '1 1 30%',
        minWidth: '200px'
      }}>
        <h3 style={{ 
          color: '#2d3748',
          fontSize: '16px',
          marginBottom: '10px'
        }}>DOB Number</h3>
        <div style={{ 
          display: 'inline-block', 
          background: 'linear-gradient(135deg, #4299e1, #3182ce)',
          color: 'white', 
          padding: '15px 25px', 
          borderRadius: '50%',
          fontSize: '28px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(66, 153, 225, 0.3)'
        }}>
          {dobNumerology}
        </div>
      </div>
      
      {/* Main Number */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '20px',
        flex: '1 1 30%',
        minWidth: '200px'
      }}>
        <h3 style={{ 
          color: '#2d3748',
          fontSize: '16px',
          marginBottom: '10px'
        }}>Life Path Number</h3>
        <div style={{ 
          display: 'inline-block', 
          background: 'linear-gradient(135deg, #4299e1, #3182ce)',
          color: 'white', 
          padding: '15px 25px', 
          borderRadius: '50%',
          fontSize: '28px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(66, 153, 225, 0.3)'
        }}>
          {numerologyNumber}
        </div>
      </div>
    </div>
  </div>

  {/* Prediction Section */}
  <div style={{ 
    marginBottom: '30px',
    background: '#f8fafc',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }}>
    <h2 style={{ 
      color: '#2d3748', 
      fontSize: '20px',
      marginBottom: '15px',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '10px'
    }}>Numerology Prediction</h2>
    
    <div style={{ 
      background: 'white', 
      padding: '20px', 
      borderRadius: '6px',
      borderLeft: '4px solid #4299e1',
      fontSize: '15px',
      lineHeight: 1.8
    }}>
      <ReactMarkdown>{prediction}</ReactMarkdown>
    </div>
  </div>

  {/* Footer */}
  <div style={{ 
    textAlign: 'center', 
    color: '#718096', 
    fontSize: '12px',
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0'
  }}>
    <p>© {new Date().getFullYear()} Sunita Numerology Prediction. All rights reserved.</p>
  </div>
</div></div>
  );
}

export default App;