import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Crown, Check, X, Gift, Zap, Lock } from 'lucide-react';
import { subscriptionAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Navbar from '../components/common/Navbar';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [showGiftCodeModal, setShowGiftCodeModal] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [giftCodeLoading, setGiftCodeLoading] = useState(false);

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      features: [
        { text: '50 Questions per day', included: true },
        { text: 'Chapter-wise Questions', included: true },
        { text: 'Chapter Tests', included: false },
        { text: 'Formulas & Flashcards', included: false },
        { text: 'Mock Tests', included: false },
        { text: 'Detailed Analytics', included: false }
      ]
    },
    silver: {
      name: 'Silver',
      popular: false,
      features: [
        { text: '200 Questions per day', included: true },
        { text: 'Chapter-wise Questions', included: true },
        { text: '10 Chapter Tests per day', included: true },
        { text: 'Formulas & Flashcards', included: false },
        { text: 'Mock Tests', included: false },
        { text: 'Detailed Analytics', included: true }
      ],
      pricing: [
        { duration: '1month', mrp: 100, sp: 49, days: 30, save: 51 },
        { duration: '6months', mrp: 500, sp: 249, days: 180, save: 50 },
        { duration: '1year', mrp: 1000, sp: 399, days: 365, save: 60 }
      ]
    },
    gold: {
      name: 'Gold',
      popular: true,
      features: [
        { text: '5000 Questions per day', included: true },
        { text: 'Unlimited Chapter Questions', included: true },
        { text: '50 Chapter Tests per day', included: true },
        { text: 'Unlimited Formulas & Flashcards', included: true },
        { text: '8 Mock Tests per day', included: true },
        { text: 'Advanced Analytics & Reports', included: true }
      ],
      pricing: [
        { duration: '1month', mrp: 600, sp: 299, days: 30, save: 50 },
        { duration: '6months', mrp: 2500, sp: 1299, days: 180, save: 48 },
        { duration: '1year', mrp: 5000, sp: 2000, days: 365, save: 60 }
      ]
    }
  };

  // Check if user already has subscription
  useEffect(() => {
    if (user?.subscription && user.subscription !== 'free') {
      const isActive = user.subscriptionEndTime && new Date(user.subscriptionEndTime) > new Date();
      if (isActive && window.location.pathname === '/subscription') {
        // Don't redirect, allow upgrade
      }
    }
  }, [user]);

  const handlePayment = async (planType, pricingOption) => {
  if (!window.Razorpay) {
    toast.error('Payment service is loading. Please wait...');
    setTimeout(() => window.location.reload(), 1000);
    return;
  }

  if (loading) return; // Prevent multiple clicks

  const buttonId = `${planType}-${pricingOption.duration}`;
  setActiveButton(buttonId);
  setLoading(true);

  try {
    console.log('Creating order...', { planType, duration: pricingOption.duration });

    const orderResponse = await subscriptionAPI.createOrder({
      subscriptionType: planType,
      duration: pricingOption.duration
    });

    console.log('Order response:', orderResponse);

    if (!orderResponse.success) {
      throw new Error(orderResponse.message || 'Failed to create order');
    }

    const { order } = orderResponse;

    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'Zeta Exams',
      description: `${planType.toUpperCase()} - ${pricingOption.duration}`,
      order_id: order.id,
      prefill: {
        name: user?.userDetails?.name || '',
        email: user?.email || '',
        contact: user?.phoneNo || ''
      },
      theme: {
        color: '#0ea5e9'
      },
      handler: async function (response) {
        try {
          console.log('Payment successful, verifying...');
          
          const verifyResponse = await subscriptionAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            subscriptionType: planType,
            duration: pricingOption.duration
          });

          if (verifyResponse.success) {
            toast.success('Payment successful! Subscription activated.');
            await refreshUserProfile();
            setTimeout(() => navigate('/dashboard'), 2000);
          } else {
            toast.error('Payment verification failed');
          }
        } catch (error) {
          console.error('Verification error:', error);
          toast.error('Payment verification failed');
        }
      },
      modal: {
        ondismiss: function() {
          toast.error('Payment cancelled');
          setLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error('Payment error:', error);
    toast.error(error.message || 'Payment failed');
  } finally {
  setLoading(false);
  setActiveButton(null);
}
};

  const handleGiftCodeSubmit = async () => {
    if (!giftCode || giftCode.length !== 8) {
      toast.error('Please enter a valid 8-character gift code');
      return;
    }

    setGiftCodeLoading(true);

    try {
      // First validate
      const validateResponse = await subscriptionAPI.validateGiftCode(giftCode);
      
      if (!validateResponse.success) {
        toast.error('Invalid gift code');
        return;
      }

      // Then apply
      const applyResponse = await subscriptionAPI.applyGiftCode(giftCode);

      if (applyResponse.success) {
        toast.success('Gift code applied successfully!');
        setShowGiftCodeModal(false);
        setGiftCode('');
        await refreshUserProfile();
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to apply gift code');
    } finally {
      setGiftCodeLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Start your preparation journey with the perfect plan</p>
          
          {/* Current Subscription Badge */}
          {user?.subscription && user.subscription !== 'free' && (
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
              <Crown size={20} className="text-primary-600" />
              <span className="text-primary-700 font-medium">
                Current: {user.subscription.toUpperCase()}
                {user.subscriptionEndTime && ` (Valid till ${new Date(user.subscriptionEndTime).toLocaleDateString()})`}
              </span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* FREE Plan */}
          <div className="card relative">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">₹0</div>
              <p className="text-gray-600">Forever</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plans.free.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  {feature.included ? (
                    <Check className="text-success-500 mt-1 flex-shrink-0" size={20} />
                  ) : (
                    <X className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                  )}
                  <span className={`ml-3 ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSkip}
              className="w-full btn-secondary"
              disabled={user?.subscription !== 'free'}
            >
              {user?.subscription === 'free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* SILVER Plan */}
          <div className="card relative transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Silver</h3>
              <p className="text-sm text-gray-600 mb-4">Best for beginners</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plans.silver.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  {feature.included ? (
                    <Check className="text-success-500 mt-1 flex-shrink-0" size={20} />
                  ) : (
                    <X className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                  )}
                  <span className={`ml-3 ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Pricing Options */}
            <div className="space-y-3">
              {plans.silver.pricing.map((option) => (
                <div key={option.duration} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">
                      {option.duration === '1month' ? '1 Month' : option.duration === '6months' ? '6 Months' : '1 Year'}
                    </span>
                    <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded">
                      Save {option.save}%
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 mb-3">
                    <span className="text-2xl font-bold text-gray-900">₹{option.sp}</span>
                    <span className="text-sm text-gray-500 line-through">₹{option.mrp}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!loading) {
                        handlePayment('silver', option);
                      }
                    }}
                    disabled={loading || activeButton === `silver-${option.duration}`}
                    className="w-full btn-primary text-sm py-2"
                  >
                    {loading ? <Loader size="sm" /> : 'Subscribe Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* GOLD Plan */}
          <div className="card relative transform hover:scale-105 transition-all duration-300 ring-2 ring-yellow-400">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                <Zap size={16} />
                <span>Most Popular</span>
              </div>
            </div>

            <div className="text-center mb-6 mt-4">
              <Crown className="text-yellow-500 mx-auto mb-2" size={40} />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Gold</h3>
              <p className="text-sm text-gray-600 mb-4">Complete preparation package</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plans.gold.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="text-success-500 mt-1 flex-shrink-0" size={20} />
                  <span className="ml-3 text-gray-700 font-medium">{feature.text}</span>
                </li>
              ))}
            </ul>

            {/* Pricing Options */}
            <div className="space-y-3">
              {plans.gold.pricing.map((option) => (
                <div key={option.duration} className="border-2 border-yellow-400 rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">
                      {option.duration === '1month' ? '1 Month' : option.duration === '6months' ? '6 Months' : '1 Year'}
                    </span>
                    <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded">
                      Save {option.save}%
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 mb-3">
                    <span className="text-2xl font-bold text-gray-900">₹{option.sp}</span>
                    <span className="text-sm text-gray-500 line-through">₹{option.mrp}</span>
                  </div>
                  <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!loading) {
                          handlePayment('gold', option);
                        }
                      }}
                      disabled={loading || activeButton === `gold-${option.duration}`}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all"
                    >
                      {loading ? <Loader size="sm" /> : 'Subscribe Now'}
                    </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gift Code Section */}
        <div className="max-w-2xl mx-auto text-center">
          <button
            onClick={() => setShowGiftCodeModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
          >
            <Gift size={20} />
            <span>Have a Gift Code?</span>
          </button>
        </div>

        {/* Skip Button */}
        {user?.subscription === 'free' && (
          <div className="text-center mt-8">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Skip for now →
            </button>
          </div>
        )}
      </div>

      {/* Gift Code Modal */}
      <Modal
        isOpen={showGiftCodeModal}
        onClose={() => setShowGiftCodeModal(false)}
        title="Redeem Gift Code"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Gift className="text-purple-600 mx-auto mb-2" size={48} />
            <p className="text-gray-600">Enter your 8-character gift code</p>
          </div>

          <input
            type="text"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="XXXXXXXX"
            className="input-field text-center text-2xl tracking-widest font-bold uppercase"
            maxLength="8"
          />

          <button
            onClick={handleGiftCodeSubmit}
            disabled={giftCodeLoading || giftCode.length !== 8}
            className="w-full btn-primary"
          >
            {giftCodeLoading ? <Loader size="sm" /> : 'Apply Gift Code'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionPage;