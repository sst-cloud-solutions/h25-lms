import React from 'react';
import Sidebar from './sidebar';
import { BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';

const Results = () => {
  const testResults = [
    {
      id: 1,
      testName: 'Advanced Phishing Techniques',
      date: '2025-11-24',
      score: 85,
      totalQuestions: 25,
      correctAnswers: 21,
      timeSpent: '32:15',
      category: 'Phishing',
      difficulty: 'Intermediate'
    },
    {
      id: 2,
      testName: 'Email Security Protocols',
      date: '2025-11-22',
      score: 92,
      totalQuestions: 18,
      correctAnswers: 17,
      timeSpent: '28:42',
      category: 'Email Security',
      difficulty: 'Advanced'
    },
    {
      id: 3,
      testName: 'Basic Phishing Recognition',
      date: '2025-11-20',
      score: 78,
      totalQuestions: 20,
      correctAnswers: 16,
      timeSpent: '25:10',
      category: 'Phishing',
      difficulty: 'Beginner'
    }
  ];

  const performanceStats = {
    averageScore: 85,
    testsCompleted: 3,
    totalTime: '1h 26m',
    bestScore: 92,
    improvement: '+7%'
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Test Results</h1>
            <p className="text-lg text-gray-600 mt-2">
              Track your performance and monitor your cybersecurity learning progress
            </p>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average Score</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{performanceStats.averageScore}%</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Tests Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{performanceStats.testsCompleted}</p>
                </div>
                <Award className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Time</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{performanceStats.totalTime}</p>
                </div>
                <Calendar className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Improvement</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{performanceStats.improvement}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Test History</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {testResults.map((result) => (
                <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{result.testName}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                            result.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {result.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {result.date}
                        </div>
                        <div>
                          <span className="font-medium">Questions:</span> {result.totalQuestions}
                        </div>
                        <div>
                          <span className="font-medium">Correct:</span> {result.correctAnswers}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {result.timeSpent}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className={`text-3xl font-bold ${
                        result.score >= 90 ? 'text-green-600' :
                        result.score >= 80 ? 'text-blue-600' :
                        result.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.score}%
                      </div>
                      <p className="text-sm text-gray-500">Score</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Performance</span>
                      <span>{result.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          result.score >= 90 ? 'bg-green-500' :
                          result.score >= 80 ? 'bg-blue-500' :
                          result.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${result.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Tips */}
          <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Performance Tips</h3>
            <ul className="text-blue-800 space-y-2">
              <li>• Focus on improving your phishing detection skills - this is your most tested area</li>
              <li>• Review the explanations for questions you answered incorrectly</li>
              <li>• Practice regularly to maintain your learning streak</li>
              <li>• Consider retaking tests to reinforce your knowledge</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
