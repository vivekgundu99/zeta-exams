import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Briefcase, GraduationCap, Building, MapPin, Target } from 'lucide-react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import { INDIAN_STATES, GRADES } from '../utils/constants';

const UserDetailsPage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    profession: '',
    grade: '',
    preparingFor: '',
    collegeName: '',
    state: '',
    lifeAmbition: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Character limit for text fields
    if (['name', 'collegeName', 'lifeAmbition'].includes(name) && value.length > 50) {
      return;
    }

    setFormData({ ...formData, [name]: value });

    // Auto-select 'other' grade for teachers
    if (name === 'profession' && value === 'teacher') {
      setFormData(prev => ({ ...prev, [name]: value, grade: 'other' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.profession || !formData.preparingFor || !formData.state) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.profession === 'student' && !formData.grade) {
      toast.error('Please select your grade');
      return;
    }

    setLoading(true);

    try {
      const response = await userAPI.updateDetails(formData);
      
      if (response.success) {
        updateUser({ userDetailsCompleted: true, userDetails: formData });
        toast.success('Profile updated successfully!');
        navigate('/select-exam');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
            <User className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Tell us more about yourself to personalize your experience</p>
        </div>

        {/* Form Card */}
        <div className="card animate-slideUp">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="input-field pl-10"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{formData.name.length}/50 characters</p>
              </div>

              {/* Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="text-gray-400" size={20} />
                  </div>
                  <select
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className="input-field pl-10"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </div>

              {/* Grade (only for students) */}
              {formData.profession === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GraduationCap className="text-gray-400" size={20} />
                    </div>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="input-field pl-10"
                      required
                    >
                      <option value="">Select grade...</option>
                      {GRADES.map(grade => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Preparing For */}
              <div className={formData.profession === 'student' ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preparing For <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Target className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="text"
                    name="preparingFor"
                    value={formData.preparingFor}
                    onChange={handleChange}
                    placeholder="e.g., JEE Main 2025, NEET 2025"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              {/* College Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College/School Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="text"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleChange}
                    placeholder="Your institution name"
                    className="input-field pl-10"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{formData.collegeName.length}/50 characters</p>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-gray-400" size={20} />
                  </div>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input-field pl-10"
                    required
                  >
                    <option value="">Select state...</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Life Ambition */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Life Ambition
                </label>
                <textarea
                  name="lifeAmbition"
                  value={formData.lifeAmbition}
                  onChange={handleChange}
                  placeholder="What do you aspire to become?"
                  className="input-field resize-none"
                  rows="3"
                />
                <p className="mt-1 text-xs text-gray-500">{formData.lifeAmbition.length}/50 characters</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader size="sm" /> : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-primary-600"></div>
              <span className="font-medium">Step 1</span>
            </div>
            <span>→</span>
            <div className="flex items-center space-x-1 opacity-50">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>Step 2</span>
            </div>
            <span>→</span>
            <div className="flex items-center space-x-1 opacity-50">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>Step 3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;