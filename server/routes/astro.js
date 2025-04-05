require('dotenv').config();
const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const escapeHtml = require('escape-html');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const numerologyMeanings = {
    1: ["Leader, independent, ambitious"],
    2: ["Cooperative, sensitive, peaceful"],
    3: ["Creative, joyful, expressive"],
    4: ["Disciplined, structured, practical"],
    5: ["Adventurous, adaptable, energetic"],
    6: ["Responsible, loving, caretaker"],
    7: ["Spiritual, thoughtful, analytical"],
    8: ["Powerful, materialistic, successful"],
    9: ["Compassionate, selfless, humanitarian"]
};

const planetMap = {
    1: "Sun",
    2: "Moon",
    3: "Jupiter",
    4: "Rahu",
    5: "Mercury",
    6: "Venus",
    7: "Ketu",
    8: "Saturn",
    9: "Mars"
};

const friendlyNumbersMap = {
    1: [1, 2,,3, 4,7,9],
    2: [1, 2,4,5, 7],
    3: [1,2,3,4,7, 9],
    4: [1,2,3,4,7, 9],
    5: [1, 4, ,5,6],
    6: [5, 6, 8],
    7: [1,2,4, 5, 7],
    8: [5, 6],
    9: [1,2,3,4, 7, 9]
};

function calculateNumerology(input) {
    let sum = input.split('').reduce((acc, char) => acc + parseInt(char), 0);
    while (sum > 9) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return sum;
}

function calculateNameNumerology(name) {
    const alphabetValues = {
        A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1, K: 2, L: 3, M: 4,
        N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
    };
    let sum = name.toUpperCase().split('').reduce((acc, char) => acc + (alphabetValues[char] || 0), 0);
    return calculateNumerology(sum.toString());
}

function calculateDOBNumerology(dob) {
    const numericDOB = dob.replace(/[^0-9]/g, "");
    return calculateNumerology(numericDOB);
}

function getSunNumber(dateOfBirth) {
    const day = parseInt(dateOfBirth.split('-')[2]);
    return calculateNumerology(day.toString());
}

function getFriendlyEnemyNeutral(base, compare) {
    const friendly = friendlyNumbersMap[base];
    if (friendly.includes(compare)) return "Friendly";
    if (base === compare) return "Same";
    return "Enemy";
}

function analyzeMobileNumberPlanets(mobileNumber) {
    const digitToPlanet = {
        1: "Sun",
        2: "Moon",
        3: "Jupiter",
        4: "Rahu",
        5: "Mercury",
        6: "Venus",
        7: "Ketu",
        8: "Saturn",
        9: "Mars",
       
    };

    const planetFrequency = {};

    mobileNumber.split('').forEach(digit => {
        const planet = digitToPlanet[parseInt(digit)];
        if (planet) {
            planetFrequency[planet] = (planetFrequency[planet] || 0) + 1;
        }
    });

    return planetFrequency;
}

async function getAIgeneratedMeaning(data) {
    try {
        const planetsBreakdown = Object.entries(data.mobilePlanetFrequency)
            .map(([planet, count]) => `${planet}: ${count} times`).join(', ');

        const prompt = `
Give a precise and emotionally engaging Indian numerology prediction in hindi language but use english alphabet to write hindi use english sometimes (Hindi + English mix).

Name Number: ${data.nameNumber} (${planetMap[data.nameNumber]})
Mobile Number: ${data.mobileNumber} (${planetMap[data.mobileNumber]})
DOB Number: ${data.dobNumber} (${planetMap[data.dobNumber]})
Sun Number: ${data.sunNumber}

🪐 Mobile Number Planet Distribution: ${planetsBreakdown}

📊 Combinations:
- Name + Mobile: ${data.nameMobileCombo} (${getFriendlyEnemyNeutral(data.nameNumber, data.mobileNumber)})
- DOB + Name: ${data.dobNameCombo} (${getFriendlyEnemyNeutral(data.dobNumber, data.nameNumber)})
- DOB + Mobile: ${data.dobMobileCombo} (${getFriendlyEnemyNeutral(data.dobNumber, data.mobileNumber)})

Gender: ${data.gender}
Place of Birth: ${data.placeOfBirth}

Make it personalized, accurate, and fun with a spiritual Indian feel.
        `;
console.log(prompt)
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt
        });
        const pdata=`### **Name Number**: ${data.nameNumber} (${planetMap[data.nameNumber]})
### **Mobile Number**: ${data.mobileNumber} (${planetMap[data.mobileNumber]})
### **DOB Number**: ${data.dobNumber} (${planetMap[data.dobNumber]})
### **Sun Number**: ${data.sunNumber}

## **Mobile Number Planet Distribution**: ### ${planetsBreakdown}

📊 Combinations:
- **Name + Mobile**: ${data.nameMobileCombo} (${getFriendlyEnemyNeutral(data.nameNumber, data.mobileNumber)})
- **DOB + Name**: ${data.dobNameCombo} (${getFriendlyEnemyNeutral(data.dobNumber, data.nameNumber)})
-**DOB + Mobile**: ${data.dobMobileCombo} (${getFriendlyEnemyNeutral(data.dobNumber, data.mobileNumber)})

**Gender**: ${data.gender}
**Place of Birth**: ${data.placeOfBirth} \n
${response.text}`
        return pdata
    } catch (err) {
        console.error("AI error:", err);
        return "AI prediction could not be generated.";
    }
}

router.get('/', async (req, res) => {
    const { mobileNumber, name, dateOfBirth, gender, placeOfBirth } = req.query;

    if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
        return res.json({ error: "Invalid mobile number." });
    }
    if (!name || !dateOfBirth || !gender || !placeOfBirth) {
        return res.json({ error: "All fields are required." });
    }

    const mobileNumberNumerology = calculateNumerology(mobileNumber);
    const nameNumerology = calculateNameNumerology(name);
    const dobNumerology = calculateDOBNumerology(dateOfBirth);
    const sunNumber = getSunNumber(dateOfBirth);

    const combos = {
        nameMobileCombo: calculateNumerology((nameNumerology + mobileNumberNumerology).toString()),
        dobNameCombo: calculateNumerology((dobNumerology + nameNumerology).toString()),
        dobMobileCombo: calculateNumerology((dobNumerology + mobileNumberNumerology).toString()),
    };

    const mobilePlanetFrequency = analyzeMobileNumberPlanets(mobileNumber);

    const basePrediction = numerologyMeanings[mobileNumberNumerology][0];

    const aiPrediction = await getAIgeneratedMeaning({
        nameNumber: nameNumerology,
        mobileNumber: mobileNumberNumerology,
        dobNumber: dobNumerology,
        sunNumber,
        gender,
        placeOfBirth,
        ...combos,
        mobilePlanetFrequency
    });

    const finalPrediction = `${basePrediction}. AI Insights: ${aiPrediction}`;
    const safePrediction = escapeHtml(finalPrediction);

    res.json({
        title: "Advanced Numerology Prediction",
        nameNumerology,
        mobileNumberNumerology,
        dobNumerology,
        sunNumber,
        planets: {
            name: planetMap[nameNumerology],
            mobile: planetMap[mobileNumberNumerology],
            dob: planetMap[dobNumerology]
        },
        mobilePlanets: mobilePlanetFrequency,
        combinations: {
            nameMobile: combos.nameMobileCombo,
            dobName: combos.dobNameCombo,
            dobMobile: combos.dobMobileCombo
        },
        prediction: safePrediction,
        error: null
    });
});

module.exports = router;
