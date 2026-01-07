import User from '../models/User.js';

// Reset daily limits for all users at 4 AM IST
export const resetDailyLimits = async () => {
  try {
    const result = await User.updateMany(
      {},
      {
        $set: {
          'dailyLimit.questionsAttempted': 0,
          'dailyLimit.chapterTestsAttempted': 0,
          'dailyLimit.mockTestsAttempted': 0,
          'dailyLimit.lastReset': new Date(),
          'dailyLimit.isLimitReached': false
        }
      }
    );

    console.log(`✅ Daily limits reset for ${result.modifiedCount} users at ${new Date().toISOString()}`);
    return result;

  } catch (error) {
    console.error('❌ Error resetting daily limits:', error);
    throw error;
  }
};

// Check and reset daily limit for a specific user (called on each request)
export const checkAndResetUserLimit = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    const now = new Date();
    const lastReset = user.dailyLimit.lastReset;
    
    // Check if it's a new day (after 4 AM IST)
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const nowIST = new Date(now.getTime() + istOffset);
    const lastResetIST = new Date(lastReset.getTime() + istOffset);
    
    const resetHourIST = 4; // 4 AM
    
    // Calculate if reset is needed
    let needsReset = false;
    
    if (nowIST.getDate() !== lastResetIST.getDate()) {
      // Different day
      if (nowIST.getHours() >= resetHourIST) {
        needsReset = true;
      } else if (lastResetIST.getHours() < resetHourIST && nowIST.getHours() < resetHourIST) {
        // Same calendar day but before 4 AM on both
        needsReset = false;
      } else {
        needsReset = true;
      }
    }
    
    if (needsReset) {
      user.dailyLimit = {
        questionsAttempted: 0,
        chapterTestsAttempted: 0,
        mockTestsAttempted: 0,
        lastReset: new Date(),
        isLimitReached: false
      };
      await user.save();
      console.log(`Daily limit reset for user ${userId}`);
    }

    return needsReset;

  } catch (error) {
    console.error('Error checking user daily limit:', error);
    return false;
  }
};