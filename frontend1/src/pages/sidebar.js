import React from 'react';
import Logo from '../assets/logo.png'
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Brain, 
  MessageCircle, 
  Target, 
  BarChart3, 
  User, 
  LogOut,
  Shield
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/dashboard/learn', icon: Brain, label: 'Learning' },
    { path: '/dashboard/chat', icon: MessageCircle, label: 'AI Tutor' },
    { path: '/dashboard/tests', icon: Target, label: 'Tests' },
    { path: '/dashboard/results', icon: BarChart3, label: 'Results' },
    { path: '/dashboard/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-indigo-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold">SSTCLOUD</h1>
            <p className="text-xs text-blue-300">Cyber Security Training</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-lg'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-blue-200 hover:bg-blue-800 hover:text-white rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
