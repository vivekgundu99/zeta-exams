export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Outside India'
];

export const GRADES = [
  { value: '9th', label: '9th Class' },
  { value: '10th', label: '10th Class' },
  { value: '11th', label: '11th Class' },
  { value: '12th', label: '12th Class' },
  { value: '12th-passout', label: '12th Pass Out' },
  { value: 'other', label: 'Other' }
];

export const SUBSCRIPTION_LEVELS = {
  free: 0,
  silver: 1,
  gold: 2
};

export const DAILY_LIMITS = {
  free: { questions: 50, chapterTests: 0, mockTests: 0 },
  silver: { questions: 200, chapterTests: 10, mockTests: 0 },
  gold: { questions: 5000, chapterTests: 50, mockTests: 8 }
};

export const CLOUDFRONT_URL = import.meta.env.VITE_CLOUDFRONT_URL;
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;