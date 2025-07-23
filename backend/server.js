const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced MongoDB Connection with logging
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nicsan_coverage';
console.log('🔗 Attempting to connect to MongoDB:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
});

// Monitor connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected');
});

// Coverage Request Schema
const CoverageRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  city: { type: String, required: true },
  annualIncome: { type: Number, required: true },
  dependents: { type: Number, required: true },
  recommendedCoverage: { type: Number, required: true },
  monthlyPremium: { type: Number, required: true },
  weatherData: { type: Object }, // Store weather API response
  cryptoData: { type: Object },  // Store crypto API response
  timestamp: { type: Date, default: Date.now }
});

const CoverageRequest = mongoose.model('CoverageRequest', CoverageRequestSchema);

// API Response Schema (to track all external API calls)
const ApiResponseSchema = new mongoose.Schema({
  apiType: { type: String, required: true }, // 'weather', 'crypto', etc.
  endpoint: { type: String, required: true },
  request: { type: Object },
  response: { type: Object },
  timestamp: { type: Date, default: Date.now },
  userId: { type: String } // Optional: link to user session
});

const ApiResponse = mongoose.model('ApiResponse', ApiResponseSchema);

// Helper function to fetch weather data
async function fetchWeatherData(city) {
  console.log(`🌤️ Fetching weather data for: ${city}`);
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: city,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });
    
    console.log('✅ Weather API response received');
    
    // Save API response to database
    try {
      const apiResponse = new ApiResponse({
        apiType: 'weather',
        endpoint: 'openweathermap.org/data/2.5/weather',
        request: { city },
        response: response.data
      });
      
      const savedResponse = await apiResponse.save();
      console.log('✅ Weather API response saved to database:', savedResponse._id);
    } catch (dbError) {
      console.error('❌ Failed to save weather API response to database:', dbError.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Weather API Error:', error.message);
    return null;
  }
}

// Helper function to fetch crypto data
async function fetchCryptoData() {
  console.log('₿ Fetching crypto data...');
  try {
    const response = await axios.get('https://api.coindesk.com/v1/bpi/currentprice.json');
    
    console.log('✅ Crypto API response received');
    
    // Save API response to database
    try {
      const apiResponse = new ApiResponse({
        apiType: 'crypto',
        endpoint: 'api.coindesk.com/v1/bpi/currentprice.json',
        request: {},
        response: response.data
      });
      
      const savedResponse = await apiResponse.save();
      console.log('✅ Crypto API response saved to database:', savedResponse._id);
    } catch (dbError) {
      console.error('❌ Failed to save crypto API response to database:', dbError.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Crypto API Error:', error.message);
    return null;
  }
}

// Enhanced coverage calculation with external data
function calculateCoverage(formData, weatherData, cryptoData) {
  console.log('🧮 Calculating coverage for:', formData);
  
  const { annualIncome, age, dependents } = formData;
  
  // Base coverage calculation
  let baseCoverage = annualIncome * 12;
  console.log('📊 Base coverage:', baseCoverage);
  
  // Age adjustment
  if (age > 45) baseCoverage *= 1.2;
  else if (age > 35) baseCoverage *= 1.1;
  
  // Dependents adjustment
  baseCoverage += dependents * annualIncome * 2;
  
  // Weather-based adjustment (example: harsh weather = higher coverage)
  if (weatherData && weatherData.main) {
    const temp = weatherData.main.temp;
    if (temp > 40 || temp < 5) {
      baseCoverage *= 1.05; // 5% increase for extreme weather
      console.log('🌡️ Weather adjustment applied:', temp + '°C');
    }
  }
  
  // Crypto market adjustment (example: volatile market = slight coverage increase)
  if (cryptoData && cryptoData.bpi && cryptoData.bpi.USD) {
    const btcPrice = parseFloat(cryptoData.bpi.USD.rate.replace(',', ''));
    if (btcPrice > 50000) {
      baseCoverage *= 1.02; // 2% increase in bull market
      console.log('₿ Crypto adjustment applied, BTC price:', btcPrice);
    }
  }
  
  // Round to nearest lakh
  const coverage = Math.round(baseCoverage / 100000) * 100000;
  const monthlyPremium = Math.round(coverage * 0.009);
  
  console.log('✅ Final calculation - Coverage:', coverage, 'Premium:', monthlyPremium);
  
  return { coverage, monthlyPremium };
}

// Main API endpoint for coverage calculation
app.post('/api/calculate-coverage', async (req, res) => {
  console.log('\n🚀 New coverage calculation request received');
  console.log('📥 Request body:', req.body);
  
  try {
    const { name, age, city, annualIncome, dependents } = req.body;
    
    // Validate input
    if (!name || !age || !city || !annualIncome || dependents === undefined) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    console.log('✅ Input validation passed');
    
    // Fetch external API data
    console.log('🌐 Fetching external API data...');
    const weatherData = await fetchWeatherData(city);
    const cryptoData = await fetchCryptoData();
    
    // Calculate coverage
    const { coverage, monthlyPremium } = calculateCoverage(
      { annualIncome: parseInt(annualIncome), age: parseInt(age), dependents: parseInt(dependents) },
      weatherData,
      cryptoData
    );
    
    // Prepare coverage request data
    const coverageRequestData = {
      name,
      age: parseInt(age),
      city,
      annualIncome: parseInt(annualIncome),
      dependents: parseInt(dependents),
      recommendedCoverage: coverage,
      monthlyPremium,
      weatherData,
      cryptoData
    };
    
    console.log('💾 Attempting to save coverage request to database...');
    console.log('📄 Data to save:', JSON.stringify(coverageRequestData, null, 2));
    
    // Save coverage request to database
    try {
      const coverageRequest = new CoverageRequest(coverageRequestData);
      const savedRequest = await coverageRequest.save();
      console.log('✅ Coverage request saved successfully!');
      console.log('🆔 Saved with ID:', savedRequest._id);
      console.log('⏰ Timestamp:', savedRequest.timestamp);
    } catch (saveError) {
      console.error('❌ Failed to save coverage request:', saveError);
      console.error('🔍 Save error details:', saveError.message);
      if (saveError.errors) {
        console.error('📋 Validation errors:', saveError.errors);
      }
      // Continue with response even if save fails
    }
    
    // Generate reasoning
    const reasoning = `Based on your profile (Age: ${age}, Income: ₹${parseInt(annualIncome).toLocaleString()}, Dependents: ${dependents}) and current market conditions in ${city}, we recommend ₹${coverage.toLocaleString()} coverage.`;
    
    const responseData = {
      success: true,
      data: {
        coverage,
        monthlyPremium,
        reasoning,
        weatherInfo: weatherData ? {
          temperature: weatherData.main?.temp,
          description: weatherData.weather?.[0]?.description,
          city: weatherData.name
        } : null,
        marketInfo: cryptoData ? {
          btcPrice: cryptoData.bpi?.USD?.rate,
          lastUpdated: cryptoData.time?.updated
        } : null
      }
    };
    
    console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
    
  } catch (error) {
    console.error('💥 Coverage calculation error:', error);
    console.error('🔍 Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// API to get all coverage requests (for debugging)
app.get('/api/coverage-requests', async (req, res) => {
  console.log('📋 Fetching all coverage requests...');
  try {
    const requests = await CoverageRequest.find().sort({ timestamp: -1 }).limit(50);
    console.log('✅ Found', requests.length, 'coverage requests');
    res.json({ success: true, data: requests, count: requests.length });
  } catch (error) {
    console.error('❌ Failed to fetch coverage requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// API to get all external API responses (for monitoring)
app.get('/api/api-responses', async (req, res) => {
  console.log('📡 Fetching all API responses...');
  try {
    const responses = await ApiResponse.find().sort({ timestamp: -1 }).limit(100);
    console.log('✅ Found', responses.length, 'API responses');
    res.json({ success: true, data: responses, count: responses.length });
  } catch (error) {
    console.error('❌ Failed to fetch API responses:', error);
    res.status(500).json({ error: 'Failed to fetch API responses' });
  }
});

// Database stats endpoint (for debugging)
app.get('/api/db-stats', async (req, res) => {
  try {
    const coverageCount = await CoverageRequest.countDocuments();
    const apiResponseCount = await ApiResponse.countDocuments();
    const dbState = mongoose.connection.readyState;
    
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const stats = {
      database: {
        state: states[dbState],
        coverageRequests: coverageCount,
        apiResponses: apiResponseCount
      },
      mongodb: {
        uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
        connected: dbState === 1
      }
    };
    
    console.log('📊 Database stats:', stats);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Failed to get database stats:', error);
    res.status(500).json({ error: 'Failed to get database stats' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: {
      hasWeatherKey: !!process.env.OPENWEATHER_API_KEY,
      mongoUri: !!process.env.MONGODB_URI
    }
  };
  
  console.log('🏥 Health check:', health);
  res.json(health);
});

// Start server
// Add this to the end of your server.js, replace the existing environment check:

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Coverage requests: http://localhost:${PORT}/api/coverage-requests`);
  console.log(`📡 API responses: http://localhost:${PORT}/api/api-responses`);
  console.log(`📈 Database stats: http://localhost:${PORT}/api/db-stats`);
  console.log(`\n💡 Environment check:`);
  console.log(`   - MongoDB URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  console.log(`   - Weather API Key: ${process.env.OPENWEATHER_API_KEY ? '✅ Set' : '❌ Missing'}`);
  
  // Debug: Show first 20 chars of URI (without credentials)
  if (process.env.MONGODB_URI) {
    console.log(`   - MongoDB URI preview: ${process.env.MONGODB_URI.substring(0, 20)}...`);
  }
});