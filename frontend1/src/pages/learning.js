import React from 'react';
import Sidebar from './sidebar';
import { BookOpen, Video, FileText, CheckCircle } from 'lucide-react';

const Learning = () => {
  const modules = [
    {
      title: 'Basic Phishing Recognition',
      description: 'Learn to identify common phishing attempts and suspicious emails',
      icon: BookOpen,
      progress: 75,
      lessons: 10,
      completed: 7
    },
    {
      title: 'Advanced Phishing Techniques',
      description: 'Understand sophisticated phishing methods and evasion techniques',
      icon: Video,
      progress: 40,
      lessons: 12,
      completed: 5
    },
    {
      title: 'Social Engineering',
      description: 'Learn about human-focused attack techniques and psychology',
      icon: FileText,
      progress: 20,
      lessons: 8,
      completed: 2
    },
    {
      title: 'Email Security Best Practices',
      description: 'Master email security protocols, tools, and preventive measures',
      icon: CheckCircle,
      progress: 10,
      lessons: 15,
      completed: 1
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Learning Modules</h1>
            <p className="text-lg text-gray-600 mt-2">
              Master cybersecurity concepts through structured learning paths
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.lessons} lessons</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">{module.progress}%</span>
                      <p className="text-sm text-gray-500">Complete</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{module.completed}/{module.lessons} lessons</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${module.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200">
                    {module.progress === 100 ? 'Review Course' : 'Continue Learning'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;
