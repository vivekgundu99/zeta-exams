export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const calculateDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getSubscriptionColor = (subscription) => {
  const colors = {
    free: 'bg-gray-100 text-gray-700',
    silver: 'bg-gray-200 text-gray-800',
    gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
  };
  return colors[subscription] || colors.free;
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};