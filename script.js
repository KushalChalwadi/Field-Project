// DOM Elements
const authScreen = document.getElementById('auth-screen');
const mainDashboard = document.getElementById('main-dashboard');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const healthDataForm = document.getElementById('health-data-form');
const welcomeMessage = document.getElementById('welcome-message');
const suggestionsOutput = document.getElementById('suggestions-output');

// Global Variables
let registeredUser = { username: 'test', password: 'password123' };
let currentUser = null;
let healthChartInstance = null; // Chart.js instance for management

// --- Authentication & UI Logic ---
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('new-username').value;
    const newPassword = document.getElementById('new-password').value;
    
    if (newUsername.length < 3 || newPassword.length < 6) {
        alert('Username must be 3+ chars and Password 6+ chars.');
        return;
    }

    registeredUser = { username: newUsername, password: newPassword };
    alert('Registration successful! Please login.');
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === registeredUser.username && password === registeredUser.password) {
        currentUser = username;
        welcomeMessage.textContent = `Hello, ${currentUser.toUpperCase()}!`;
        authScreen.classList.add('hidden');
        mainDashboard.classList.remove('hidden');
    } else {
        alert('Invalid username or password.');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    authScreen.classList.remove('hidden');
    mainDashboard.classList.add('hidden');
    healthDataForm.reset();
    suggestionsOutput.innerHTML = '<p>Submit your data to get personalized advice!</p>';
    document.getElementById('bmi-result').textContent = 'BMI: --';
    document.getElementById('bp-result').textContent = 'Blood Pressure: --';
    document.getElementById('hr-result').textContent = 'Heart Rate: --';
    document.getElementById('cholesterol-result').textContent = 'Total Cholesterol: --';
    document.getElementById('sugar-result').textContent = 'Sugar Level: --';
    if (healthChartInstance) {
        healthChartInstance.destroy();
        healthChartInstance = null;
    }
});

// --- Google Sign-in Placeholder Logic ---
const handleGoogleLogin = (e) => {
    e.preventDefault();
    alert('⚠️ Google Sign-In requires a Backend Server for secure integration (OAuth 2.0). Please use the Username/Password fields for this demo.');
};

document.getElementById('google-login-btn').addEventListener('click', handleGoogleLogin);
document.getElementById('google-signup-btn').addEventListener('click', handleGoogleLogin);


// --- Health Analysis & Suggestion Logic ---

// script.js (healthDataForm.addEventListener की नई परिभाषा)

healthDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!currentUser) {
        alert("Please log in first to save your data.");
        return;
    }

    // Get ALL Input Values
    const data = {
        username: currentUser, // Sending the username to link the data
        weight: parseFloat(document.getElementById('weight').value),
        height: parseFloat(document.getElementById('height').value),
        systolic: parseFloat(document.getElementById('systolic').value) || 120,
        diastolic: parseFloat(document.getElementById('diastolic').value) || 80,
        heartrate: parseFloat(document.getElementById('heartrate').value) || 75,
        cholesterol: parseFloat(document.getElementById('cholesterol').value) || 180,
        sugar: parseFloat(document.getElementById('sugar').value) || 100, 
        sleep: parseFloat(document.getElementById('sleep').value) || 8, 
        // BMI will be calculated by the server, but we can still calculate it locally for the immediate report
    };
    
    // Local calculation for immediate feedback
    const heightInMeters = data.height / 100;
    const bmi = (data.weight / (heightInMeters * heightInMeters)).toFixed(2);
    
    // 1. Send data to the backend API
    try {
        const response = await fetch('http://localhost/health_assistant_api/save_health_data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to save data on the server.');
        }

        const result = await response.json(); 
           if (result.status === "success") {
        alert('Data saved successfully to PHP/MySQL!');
        } else {
         alert('PHP Error: ' + result.message);
    }
    
    } catch (error) {
        console.error("Backend Error:", error);
        alert('Could not connect to the PHP server or save data. Check XAMPP/WAMP.');
    }
    
    // 2. Generate and Display Local Report (Your existing logic)
    const suggestions = generateSuggestions(bmi, data.systolic, data.diastolic, data.heartrate, data.cholesterol, data.sugar, data.sleep);

    document.getElementById('bmi-result').textContent = `BMI: ${bmi} (${getWeightStatus(bmi)})`;
    document.getElementById('bp-result').textContent = `Blood Pressure: ${data.systolic}/${data.diastolic} mmHg (${getBPStatus(data.systolic, data.diastolic)})`;
    document.getElementById('hr-result').textContent = `Heart Rate: ${data.heartrate} BPM (${getHRStatus(data.heartrate)})`;
    document.getElementById('cholesterol-result').textContent = `Total Cholesterol: ${data.cholesterol} mg/dL (${getCholesterolStatus(data.cholesterol)})`;
    document.getElementById('sugar-result').textContent = `Sugar Level: ${data.sugar} mg/dL (${getSugarStatus(data.sugar)})`;
    suggestionsOutput.innerHTML = suggestions;
    
    renderChart(bmi, data.systolic, data.heartrate, data.cholesterol, data.sugar); 
});

// New Function to fetch history (Example for future comparison feature)
async function fetchHealthHistory(username) {
    try {
        const response = await fetch(`http://localhost:3000/api/health/history/${username}`);
        const history = await response.json();
        
        console.log('Last 10 Health Readings:', history);
        // FUTURE STEP: Use this history data to show progress over time on the dashboard!

    } catch (error) {
        console.error("Error fetching history:", error);
    }
}

// --- STATUS HELPER FUNCTIONS ---

function getWeightStatus(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi >= 18.5 && bmi <= 24.9) return 'Normal Weight';
    if (bmi >= 25 && bmi <= 29.9) return 'Overweight';
    if (bmi >= 30) return 'Obesity';
    return 'N/A';
}

function getBPStatus(sys, dia) {
    if (sys < 120 && dia < 80) return 'Normal';
    if (sys >= 120 && sys <= 129 && dia < 80) return 'Elevated';
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return 'Stage 1 Hypertension';
    if (sys >= 140 || dia >= 90) return 'Stage 2 Hypertension';
    return 'N/A';
}

function getHRStatus(hr) {
    if (hr < 60) return 'Low (Bradycardia)';
    if (hr >= 60 && hr <= 100) return 'Normal';
    if (hr > 100) return 'High (Tachycardia)';
    return 'N/A';
}

function getCholesterolStatus(chol) {
    if (chol < 200) return 'Desirable';
    if (chol >= 200 && chol <= 239) return 'Borderline High';
    if (chol >= 240) return 'High Risk';
    return 'N/A';
}

function getSugarStatus(sugar) {
    if (sugar < 100) return 'Normal';
    if (sugar >= 100 && sugar <= 125) return 'Pre-diabetic';
    if (sugar > 125) return 'Diabetic Range';
    return 'N/A';
}

// --- MAIN SUGGESTION GENERATOR ---

function generateSuggestions(bmi, systolic, diastolic, heartrate, cholesterol, sugar, sleep) {
    let html = '';

    // 1. Weight/Diet Suggestions
    if (bmi >= 25) {
        html += '<p>🥗 **Diet:** Your BMI is high. Focus on reducing carb intake and increase lean protein/fiber. Portion control is key.</p>';
    } else if (bmi < 18.5) {
        html += '<p>🍎 **Diet:** Your BMI is low. Increase healthy calorie intake from complex carbs, nuts, and healthy fats.</p>';
    }

    // 2. Cardiovascular (BP/HR/Cholesterol) Suggestions
    if (getBPStatus(systolic, diastolic).includes('Hypertension')) {
        html += '<p>🛑 **BP Alert:** High Blood Pressure detected. Reduce sodium (salt) and alcohol intake. Increase potassium-rich foods (banana, spinach).</p>';
    }
    if (getHRStatus(heartrate) !== 'Normal') {
        html += '<p>💖 **Heart Rate:** Heart Rate is outside the normal range. Practice deep breathing exercises and avoid excessive caffeine.</p>';
    }
    if (getCholesterolStatus(cholesterol).includes('High')) {
        html += '<p>🧈 **Cholesterol Alert:** High Cholesterol. Replace saturated fats (butter, red meat) with unsaturated fats (avocado, olive oil). Increase oats and barley.</p>';
    }

    // 3. Metabolic/Sleep Suggestions
    if (getSugarStatus(sugar) !== 'Normal') {
        html += '<p>🩸 **Sugar Alert:** Sugar is not in the normal range. Avoid sugary drinks and processed foods. Regular exercise helps regulate blood sugar.</p>';
    }
    if (sleep < 7.0 || sleep > 9.0) {
        html += `<p>😴 **Rest:** You reported ${sleep} hours. Aim for 7-9 hours. Maintain a fixed sleep schedule, even on weekends.</p>`;
    }
    
    // Default message
    if (html === '') {
        html = '<p>✅ **Great Job!** Your key health metrics are currently in the healthy range. Maintain your current lifestyle!</p>';
    }

    return html;
}

// --- ANIMATED CHART RENDERER (Updated with all 5 key metrics) ---

function renderChart(bmi, systolic, heartrate, cholesterol, sugar) {
    const ctx = document.getElementById('healthChart').getContext('2d');
    
    // Normalize data to a 0-120 "Health Score" for visualization (Higher is better)
    const bmiScore = Math.max(0, (24.9 - Math.abs(22 - bmi)) * 5); 
    const bpScore = Math.max(0, 150 - systolic); // Lower BP score if systolic > 150
    const hrScore = Math.max(0, 100 - Math.abs(75 - heartrate)); // Lower HR score if far from 75
    const cholesterolScore = Math.max(0, 250 - cholesterol); // Lower score if cholesterol > 250
    const sugarScore = Math.max(0, 150 - sugar); // Lower score if sugar > 150

    const data = {
        labels: ['BMI', 'Blood Pressure', 'Heart Rate', 'Cholesterol', 'Sugar Level'],
        datasets: [{
            label: 'Your Current Metrics Score',
            data: [bmiScore, bpScore, hrScore, cholesterolScore, sugarScore],
            backgroundColor: [
                'rgba(75, 192, 192, 0.8)', 
                'rgba(255, 159, 64, 0.8)', 
                'rgba(255, 99, 132, 0.8)', 
                'rgba(54, 162, 235, 0.8)', 
                'rgba(153, 102, 255, 0.8)' 
            ],
            borderWidth: 1
        }]
    };
    
    if (healthChartInstance) {
        healthChartInstance.destroy();
    }

    healthChartInstance = new Chart(ctx, {
        type: 'bar', 
        data: data,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 120, 
                    title: {
                        display: true,
                        text: 'Health Score (Higher is Better)'
                    }
                }
            },
            plugins: {
                legend: { display: false }
            },
            animation: {
                duration: 1200, 
                easing: 'easeOutQuart'
            }
        }
    });
}