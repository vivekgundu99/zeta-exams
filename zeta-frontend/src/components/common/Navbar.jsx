import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, BookOpen, FileText, Target, BarChart3, User, 
  LogOut, Menu, X, Crown, Gift 
} from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/questions', label: 'Questions', icon: BookOpen },
    { path: '/chapter-tests', label: 'Chapter Tests', icon: FileText, requireSilver: true },
    { path: '/formulas', label: 'Formulas', icon: BookOpen, requireGold: true },
    { path: '/mock-tests', label: 'Mock Tests', icon: Target, requireGold: true },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/account', label: 'Account', icon: User },
  ];

  const subscriptionBadge = {
    free: { color: 'bg-gray-100 text-gray-700', label: 'Free' },
    silver: { color: 'bg-gray-200 text-gray-800', label: 'Silver', icon: Crown },
    gold: { color: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white', label: 'Gold', icon: Crown }
  };

  const currentBadge = subscriptionBadge[user?.subscription] || subscriptionBadge.free;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">Zeta Exams</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const canAccess = 
                (!link.requireSilver && !link.requireGold) ||
                (link.requireSilver && ['silver', 'gold'].includes(user?.subscription)) ||
                (link.requireGold && user?.subscription === 'gold');

              return (
                <Link
                  key={link.path}
                  to={canAccess ? link.path : '/subscription'}
                  onClick={(e) => {
                    if (!canAccess) {
                      e.preventDefault();
                      toast.error(`${link.requireGold ? 'Gold' : 'Silver'} subscription required`);
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-700'
                      : canAccess
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{link.label}</span>
                  {!canAccess && <Crown size={14} className="text-yellow-500" />}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Subscription Badge */}
            <Link to="/subscription" className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentBadge.color} transition-all duration-200 hover:shadow-md`}>
              {currentBadge.icon && <currentBadge.icon size={16} />}
              <span className="text-sm font-semibold">{currentBadge.label}</span>
            </Link>

            {/* Exam Type Badge */}
            {user?.examType && (
              <div className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                {user.examType}
              </div>
            )}

            {/* Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 text-sm font-medium"
              >
                Admin Panel
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            {/* Subscription & Exam Type */}
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/subscription"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentBadge.color}`}
              >
                {currentBadge.icon && <currentBadge.icon size={16} />}
                <span className="text-sm font-semibold">{currentBadge.label}</span>
              </Link>
              {user?.examType && (
                <div className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                  {user.examType}
                </div>
              )}
            </div>

            {/* Navigation Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const canAccess = 
                (!link.requireSilver && !link.requireGold) ||
                (link.requireSilver && ['silver', 'gold'].includes(user?.subscription)) ||
                (link.requireGold && user?.subscription === 'gold');

              return (
                <Link
                  key={link.path}
                  to={canAccess ? link.path : '/subscription'}
                  onClick={(e) => {
                    if (!canAccess) {
                      e.preventDefault();
                      toast.error(`${link.requireGold ? 'Gold' : 'Silver'} subscription required`);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-700'
                      : canAccess
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.label}</span>
                  {!canAccess && <Crown size={16} className="text-yellow-500 ml-auto" />}
                </Link>
              );
            })}

            {/* Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 bg-purple-600 text-white rounded-lg"
              >
                <User size={20} />
                <span className="font-medium">Admin Panel</span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;