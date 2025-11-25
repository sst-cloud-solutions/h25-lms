import React, { useState } from 'react';
import Sidebar from './sidebar';
import { User, Mail, Shield, Award, TrendingUp, Calendar } from 'lucide-react';

const Profile = () => {
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    level: 'Intermediate',
    joinDate: '2025-11-20',
    totalScore: 1250,
    accuracy: 85,
    streak: 7,
    testsCompleted: 3
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userData);

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(userData);
  };

  const handleSave = () => {
    setUserData(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const achievements = [
    { name: 'First Test', description: 'Completed your first cybersecurity test', icon: Award },
    { name: 'Learning Streak', description: '7 days of continuous learning', icon: TrendingUp },
    { name: 'Phishing Expert', description: 'Scored 90%+ in phishing tests', icon: Shield },
    { name: 'Consistent Learner', description: 'Completed 3+ tests', icon: Calendar }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Profile</h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage your account and track your learning journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Full Name</span>
                      </div>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-lg text-gray-900">{userData.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email Address</span>
                      </div>
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-lg text-gray-900">{userData.email}</p>
                    )}
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Current Level</span>
                      </div>
                    </label>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userData.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                        userData.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {userData.level}
                      </span>
                      <span className="text-sm text-gray-600">
                        Member since {userData.joinDate}
                      </span>
                    </div>
                  </div>

                  {/* Edit Actions */}
                  {isEditing && (
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-blue-600">{userData.totalScore}</p>
                  <p className="text-sm text-gray-600">Total Score</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-green-600">{userData.accuracy}%</p>
                  <p className="text-sm text-gray-600">Accuracy</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-orange-600">{userData.streak}</p>
                  <p className="text-sm text-gray-600">Day Streak</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-purple-600">{userData.testsCompleted}</p>
                  <p className="text-sm text-gray-600">Tests Done</p>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievements</h2>
                <div className="space-y-4">
                  {achievements.map((achievement, index) => {
                    const Icon = achievement.icon;
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{achievement.name}</p>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Learning Progress */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Learning Progress</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Phishing Recognition</span>
                      <span>75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Social Engineering</span>
                      <span>40%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Email Security</span>
                      <span>60%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
