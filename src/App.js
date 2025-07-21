import React, { useState } from "react";
import { Calculator, Shield, Heart, Sparkles } from "lucide-react";

const App = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    city: "",
    annualIncome: "",
    dependents: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateCoverage = async (formData) => {
    // Simulate AI recommendation logic
    const income = parseInt(formData.annualIncome);
    const age = parseInt(formData.age);
    const dependents = parseInt(formData.dependents);

    // Base coverage calculation (typically 10-15x annual income)
    let baseCoverage = income * 12;

    // Age adjustment
    if (age > 45) baseCoverage *= 1.2;
    else if (age > 35) baseCoverage *= 1.1;

    // Dependents adjustment
    baseCoverage += dependents * income * 2;

    // Round to nearest lakh
    const coverage = Math.round(baseCoverage / 100000) * 100000;

    return {
      coverage: coverage,
      reasoning: `Based on your age (${age}), annual income (₹${income.toLocaleString()}), and ${dependents} dependent(s), we recommend a coverage amount of ₹${coverage.toLocaleString()}.`,
    };
  };

  const handleSubmit = async () => {
    // Validate form
    if (
      !formData.name ||
      !formData.age ||
      !formData.city ||
      !formData.annualIncome ||
      !formData.dependents
    ) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const aiResult = await calculateCoverage(formData);
      const coverage = aiResult.coverage;
      const monthlyPremium = Math.round(coverage * 0.009); // 0.9% of coverage

      setResult({
        coverage,
        monthlyPremium,
        reasoning: aiResult.reasoning,
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error calculating coverage:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(true);
    setResult(null);
    setFormData({
      name: "",
      age: "",
      city: "",
      annualIncome: "",
      dependents: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nicsan-blue mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Analyzing Your Profile...
          </h3>
          <p className="text-gray-600">
            Our AI is calculating the perfect coverage for you
          </p>
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
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-nicsan-blue" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Your Perfect Coverage
            </h1>
            <p className="text-gray-600">Recommended just for you</p>
          </div>

          {/* Result Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-nicsan-blue">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-nicsan-blue mb-2">
                ₹{result.coverage.toLocaleString()}
              </div>
              <p className="text-gray-600 text-sm">
                Recommended Health Coverage
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">
                  Monthly Premium
                </span>
                <span className="text-2xl font-bold text-nicsan-red">
                  ₹{result.monthlyPremium.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                0.9% of coverage amount
              </p>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                Why This Amount?
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {result.reasoning}
              </p>
            </div>

            {/* WhatsApp Button */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Hi, I’d like a quote for ₹${result.coverage.toLocaleString()} health coverage with ₹${result.monthlyPremium.toLocaleString()} monthly premium.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 block text-center mb-4"
            >
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-3">📱</span>
                WhatsApp Quote
              </div>
            </a>

            {/* Back Button */}
            <button
              onClick={resetForm}
              className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Calculate Again
            </button>
          </div>

          {/* Fun Element - Floating Hearts */}
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
        {/* Header with Logo Space */}
        <div className="text-center mb-8 pt-8">
          <div className="w-32 mx-auto mb-4">
            <img src="/logo.png" alt="NICSAN Logo" className="w-full object-contain" />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Coverage Check
          </h1>
          <p className="text-gray-600">
            Find your perfect health coverage in minutes
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            {/* Age Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                required
                min="18"
                max="80"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none transition-colors"
                placeholder="Your age"
              />
            </div>

            {/* City Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none transition-colors"
                placeholder="Your city"
              />
            </div>

            {/* Annual Income Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Annual Income (₹)
              </label>
              <input
                type="number"
                name="annualIncome"
                value={formData.annualIncome}
                onChange={handleInputChange}
                required
                min="100000"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none transition-colors"
                placeholder="Your annual income"
              />
            </div>

            {/* Dependents Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Dependents
              </label>
              <select
                name="dependents"
                value={formData.dependents}
                onChange={handleInputChange}
                required
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-nicsan-blue focus:outline-none transition-colors bg-white"
              >
                <option value="">Select dependents</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-nicsan-blue to-nicsan-red text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <Calculator className="w-5 h-5 mr-2" />
                Calculate My Coverage
              </div>
            </button>
          </div>
        </div>

        {/* Fun Creative Element - Floating Icons */}
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

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>Powered by AI • Secure & Confidential</p>
        </div>
      </div>
    </div>
  );
};

export default App;
