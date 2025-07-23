import React, { useState, useRef } from 'react';
import { Calculator, Shield, Heart, Sparkles, Cloud, TrendingUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    city: '',
    annualIncome: '',
    dependents: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState(null);

  const resultRef = useRef();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.age || !formData.city || !formData.annualIncome || !formData.dependents) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/calculate-coverage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setShowForm(false);
      } else {
        throw new Error(data.error || 'Failed to calculate coverage');
      }

    } catch (error) {
      console.error('Error calculating coverage:', error);
      setError(error.message);

      const fallbackResult = await calculateCoverageFallback(formData);
      setResult(fallbackResult);
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  const calculateCoverageFallback = async (formData) => {
    const income = parseInt(formData.annualIncome);
    const age = parseInt(formData.age);
    const dependents = parseInt(formData.dependents);

    let baseCoverage = income * 12;
    if (age > 45) baseCoverage *= 1.2;
    else if (age > 35) baseCoverage *= 1.1;
    baseCoverage += dependents * income * 2;

    const coverage = Math.round(baseCoverage / 100000) * 100000;
    const monthlyPremium = Math.round(coverage * 0.009);

    return {
      coverage,
      monthlyPremium,
      reasoning: `Based on your profile, we recommend ₹${coverage.toLocaleString()} coverage. (Note: Using fallback calculation - backend services temporarily unavailable)`,
      weatherInfo: null,
      marketInfo: null
    };
  };

  const downloadPDF = () => {
    const input = resultRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("coverage_quote.pdf");
    });
  };

  const resetForm = () => {
    setShowForm(true);
    setResult(null);
    setError(null);
    setFormData({
      name: '',
      age: '',
      city: '',
      annualIncome: '',
      dependents: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nicsan-blue mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Analyzing Your Profile...</h3>
          <p className="text-gray-600 mb-2">Fetching weather data for {formData.city}</p>
          <p className="text-gray-600 mb-4">Checking current market conditions</p>
          <div className="flex justify-center space-x-1 mt-4">
            <div className="w-2 h-2 bg-nicsan-blue rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-nicsan-red rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-nicsan-blue rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!showForm && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 pt-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-nicsan-blue" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Perfect Coverage</h1>
            <p className="text-gray-600">AI-powered recommendation with live data</p>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-yellow-800 text-sm">⚠️ Using fallback calculation - some features limited</p>
            </div>
          )}

          <div ref={resultRef} className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-nicsan-blue">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-nicsan-blue mb-2">
                ₹{result.coverage.toLocaleString()}
              </div>
              <p className="text-gray-600 text-sm">Recommended Health Coverage</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Monthly Premium</span>
                <span className="text-2xl font-bold text-nicsan-red">
                  ₹{result.monthlyPremium.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">0.9% of coverage amount</p>
            </div>

            {(result.weatherInfo || result.marketInfo) && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                  Live Market Data Considered
                </h4>
                {result.weatherInfo && (
                  <div className="flex items-center mb-2">
                    <Cloud className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="text-sm text-gray-700">
                      {result.weatherInfo.city}: {result.weatherInfo.temperature}°C, {result.weatherInfo.description}
                    </span>
                  </div>
                )}
                {result.marketInfo && (
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm text-gray-700">
                      Bitcoin: {result.marketInfo.btcPrice}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                AI Recommendation
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {result.reasoning}
              </p>
            </div>
          </div>

          <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 mb-4">
            <div className="flex items-center justify-center">
              <span className="text-2xl mr-3">📱</span>
              WhatsApp Quote
            </div>
          </button>

          <button
            onClick={downloadPDF}
            className="w-full bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-600 transition-colors mb-4"
          >
            Download as PDF
          </button>

          <button 
            onClick={resetForm}
            className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Calculate Again
          </button>

          <div className="fixed top-20 right-4 animate-bounce">
            <Heart className="w-6 h-6 text-red-400 fill-current" />
          </div>
          <div className="fixed top-32 left-4 animate-pulse">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-4 pt-4">
          <div className="mx-auto mb-4">
            <img src="/logo.png" alt="NICSAN Logo" className="h-10 md:h-8 object-contain inline-block" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Coverage Check</h1>
          <p className="text-gray-600">AI-powered with live market data</p>
        </div>


        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none" placeholder="Enter your full name" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleInputChange} required min="18" max="80" className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none" placeholder="Your age" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none" placeholder="Your city (for weather data)" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Income (₹)</label>
              <input type="number" name="annualIncome" value={formData.annualIncome} onChange={handleInputChange} required min="100000" className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none" placeholder="Your annual income" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Dependents</label>
              <select name="dependents" value={formData.dependents} onChange={handleInputChange} required className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none bg-white">
                <option value="">Select dependents</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </div>

            <button onClick={handleSubmit} className="w-full bg-gradient-to-r from-nicsan-blue to-nicsan-red text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-center">
                <Calculator className="w-5 h-5 mr-2" />
                Calculate My Coverage
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mb-4">
          🔄 Powered by live APIs: Weather + Crypto + AI
        </div>

        <div className="fixed bottom-20 right-4 animate-bounce">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🛡️</span>
          </div>
        </div>
        <div className="fixed bottom-32 left-4 animate-pulse">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl">💝</span>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mt-8">
          <p>Crafted with ❤️ by P. Kumaraswamy • NICSAN 2025</p>
        </div>
      </div>
    </div>
  );
};

export default App;
