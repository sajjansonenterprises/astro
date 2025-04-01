require('dotenv').config();
const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const escapeHtml = require('escape-html');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Static numerology meanings
const numerologyMeanings = {
    1: ["You are a leader, independent, and ambitious.", "You have strong determination and high energy."],
    2: ["You are cooperative, diplomatic, and harmonious.", "You are a natural mediator with deep emotions."],
    3: ["You are creative, expressive, and optimistic.", "Your artistic nature makes you stand out."],
    4: ["You are practical, disciplined, and hardworking.", "People rely on your structured thinking."],
    5: ["You are adventurous, dynamic, and freedom-loving.", "Your love for change keeps you moving forward."],
    6: ["You are caring, responsible, and family-oriented.", "You nurture and protect those around you."],
    7: ["You are analytical, spiritual, and introspective.", "Your curiosity makes you seek deep truths."],
    8: ["You are powerful, business-minded, and goal-oriented.", "Success follows your disciplined approach."],
    9: ["You are compassionate, humanitarian, and selfless.", "You thrive when helping others."]
};

// Function to calculate numerology number from a string of digits
const calculateNumerology = (input) => {
    let sum = input.split('').reduce((acc, char) => acc + parseInt(char), 0);
    while (sum > 9) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return sum;
};

// Function to calculate name numerology
const calculateNameNumerology = (name) => {
    const alphabetValues = {
        A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, 
        Q: 1, R: 2, S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
    };
    
    let sum = name.toUpperCase().split('').reduce((acc, char) => {
        return acc + (alphabetValues[char] || 0);
    }, 0);
    
    return calculateNumerology(sum.toString());
};

// Function to calculate DOB numerology (DDMMYYYY)
const calculateDOBNumerology = (dob) => {
    const numericDOB = dob.replace(/[^0-9]/g, ""); // Remove non-numeric characters
    return calculateNumerology(numericDOB);
};

// Function to get AI-generated numerology prediction
async function getAIgeneratedMeaning(nameNumber, mobileNumber, dobNumber, gender, placeOfBirth) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `Provide a detailed numerology prediction in a casual, conversational Indian Hindi-English mix (Hinglish). 
            Name Numerology: ${nameNumber}, Mobile Number Numerology: ${mobileNumber}, Date of Birth Numerology: ${dobNumber}.
            Gender: ${gender}, Place of Birth: ${placeOfBirth}.
            Please make it fun, engaging, and accurate according to Indian numerology traditions.`
        });

        return response.text || "AI prediction is currently unavailable.";
    } catch (error) {
        console.error("Error fetching AI prediction:", error);
        return "AI prediction failed.";
    }
}

// ✅ GET Route to return JSON response
router.get('/', async (req, res) => {
    const { mobileNumber, name, dateOfBirth, gender, placeOfBirth } = req.query;
    
    // Validate input
    if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
        return res.json({ error: "Invalid mobile number. Please provide a 10-digit number." });
    }
    if (!name || !dateOfBirth || !gender || !placeOfBirth) {
        return res.json({ error: "All fields (name, date of birth, gender, place of birth) are required for accurate prediction." });
    }

    // Calculate numerology numbers
    const mobileNumberNumerology = calculateNumerology(mobileNumber);
    const nameNumerology = calculateNameNumerology(name);
    const dobNumerology = calculateDOBNumerology(dateOfBirth);

    // Pick a random base prediction
    let basePrediction = numerologyMeanings[mobileNumberNumerology][Math.floor(Math.random() * numerologyMeanings[mobileNumberNumerology].length)];

    // Get AI-generated prediction
    const aiPrediction = await getAIgeneratedMeaning(nameNumerology, mobileNumberNumerology, dobNumerology, gender, placeOfBirth);

    // Combine the base prediction with AI insights
    const finalPrediction = `${basePrediction} AI Insights: ${aiPrediction}`;
    const safePrediction = escapeHtml(finalPrediction); // Escape HTML to prevent XSS attacks

    // Send response
    res.json({
        title: "Numerology Prediction",
        nameNumerology,
        mobileNumberNumerology,
        dobNumerology,
        gender,
        placeOfBirth,
        prediction: safePrediction,
        error: null
    });
});

module.exports = router;
