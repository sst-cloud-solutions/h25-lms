// src/pages/dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Brain, Target, BarChart3, MessageCircle, TrendingUp, Award, Clock } from 'lucide-react';
import Sidebar from './sidebar';

const BACKEND_URL = 'http://localhost:8000';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in again');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message || 'Network error. Is backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-8 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, <span className="text-blue-600">{stats?.user?.name?.split(' ')[0] || 'Learner'}!</span>
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Level: <span className="font-bold text-blue-600">{stats?.user?.level || 'Beginner'}</span> • 
          Global Rank: <span className="font-bold">#{stats?.user?.rank || 'N/A'}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Score</p>
              <p className="text-3xl font-bold mt-1">{stats?.user?.total_score?.toLocaleString() || 0}</p>
            </div>
            <Shield className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Accuracy</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats?.user?.accuracy || 0}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Streak</p>
              <p className="text-3xl font-bold mt-1">{stats?.user?.streak || 0} days</p>
            </div>
            <div className="text-5xl">Fire</div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tests Completed</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats?.user?.tests_completed || 0}</p>
            </div>
            <Award className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/dashboard/chat"
            className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center text-center"
          >
            <MessageCircle className="w-16 h-16 mb-4" />
            <span className="text-xl font-bold">AI Tutor Chat</span>
            <span className="text-sm opacity-90 mt-2">Talk to CyberBot</span>
          </Link>

          <Link
            to="/dashboard/tests"
            className="group bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center text-center"
          >
            <Target className="w-16 h-16 mb-4" />
            <span className="text-xl font-bold">Take a Test</span>
            <span className="text-sm opacity-90 mt-2">Challenge yourself</span>
          </Link>

          <Link
            to="/dashboard/learn"
            className="group bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center text-center"
          >
            <Brain className="w-16 h-16 mb-4" />
            <span className="text-xl font-bold">Learning Modules</span>
            <span className="text-sm opacity-90 mt-2">Structured courses</span>
          </Link>

          <Link
            to="/dashboard/results"
            className="group bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center text-center"
          >
            <BarChart3 className="w-16 h-16 mb-4" />
            <span className="text-xl font-bold">My Results</span>
            <span className="text-sm opacity-90 mt-2">View performance</span>
          </Link>
        </div>
      </div>

    
      </div>
    </div>
  );
};

export default DashboardHome;
