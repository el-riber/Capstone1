'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  Shield, 
  LogOut, 
  Menu, 
  BarChart3,
  X,
  Brain
} from 'lucide-react';

const NavBar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login'; 
  };

  const links = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Overview & insights'
  },
  { 
    href: '/journal', 
    label: 'Journal', 
    icon: BookOpen,
    description: 'Track your mood'
  },
  { 
    href: '/chat', 
    label: 'AI Assistant', 
    icon: MessageSquare,
    description: 'Get support'
  },
  { 
    href: '/analytics', 
    label: 'Analytics', 
    icon: BarChart3,
    description: 'Clinical insights'
  },
  { 
    href: '/safety-plan', 
    label: 'Safety Plan', 
    icon: Shield,
    description: 'Crisis resources',
    priority: true 
  },
];

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-2 group-hover:scale-105 transition-transform duration-200">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SymptoCare
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Wellness Companion</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {links.map(({ href, label, icon: Icon, description, priority }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative group px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? priority
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      : priority
                        ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${priority ? 'text-red-500' : ''}`} />
                  <span>{label}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                      {description}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center space-x-4">
            {/* User Info (Desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500">Tracking wellness</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
                </span>
              </div>
            </div>

            {/* Sign Out Button (Desktop) */}
            <button
              onClick={handleSignOut}
              className="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ href, label, icon: Icon, description, priority }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? priority
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      : priority
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${priority ? 'text-red-500' : ''}`} />
                  <div>
                    <div>{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                </Link>
              );
            })}
            
            {/* Mobile User Info & Sign Out */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="px-3 py-2 text-sm text-gray-600">
                Signed in as {user?.email?.split('@')[0] || 'User'}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;