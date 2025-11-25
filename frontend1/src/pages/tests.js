import React from 'react';
import Sidebar from './sidebar';
import { Target, Clock, Award, TrendingUp } from 'lucide-react';

const Tests = () => {
  const availableTests = [
    {
      id: 1,
      title: 'Basic Phishing Recognition',
      description: 'Test your ability to identify common phishing attempts',
      questions: 20,
      duration: '30 min',
      difficulty: 'Beginner',
      category: 'Phishing',
      completed: false,
      score: null
    },
    {
      id: 2,
      title: 'Advanced Phishing Techniques',
      description: 'Challenge yourself with sophisticated phishing scenarios',
      questions: 25,
      duration: '45 min',
      difficulty: 'Intermediate',
      category: 'Phishing',
      completed: true,
      score: 85
    },
    {
      id: 3,
      title: 'Social Engineering Awareness',
      description: 'Assess your understanding of human-focused attacks',
      questions: 15,
      duration: '25 min',
      difficulty: 'Intermediate',
      category: 'Social Engineering',
      completed: false,
      score: null
    },
    {
      id: 4,
      title: 'Email Security Protocols',
      description: 'Test your knowledge of email security best practices',
      questions: 18,
      duration: '35 min',
      difficulty: 'Advanced',
      category: 'Email Security',
      completed: true,
      score: 92
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Security Tests</h1>
            <p className="text-lg text-gray-600 mt-2">
              Test your cybersecurity knowledge and track your progress
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Tests Completed</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">2</p>
                </div>
                <Target className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average Score</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">88.5%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Time Spent</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">1h 20m</p>
                </div>
                <Clock className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Current Rank</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">#42</p>
                </div>
                <Award className="w-10 h-10 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Available Tests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableTests.map((test) => (
              <div key={test.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{test.title}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        test.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {test.category}
                      </span>
                    </div>
                  </div>
                  {test.completed && (
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">{test.score}%</span>
                      <p className="text-sm text-gray-500">Score</p>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">{test.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      {test.questions} questions
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {test.duration}
                    </span>
                  </div>
                </div>
                
                <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  test.completed
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                  {test.completed ? 'Retake Test' : 'Start Test'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


export default Tests;