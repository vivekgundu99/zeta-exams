import MockTest from '../models/MockTest.js';
import TestAttempt from '../models/TestAttempt.js';
import Question from '../models/Question.js';
import User from '../models/User.js';

// @desc    Get all mock tests for an exam type
// @route   GET /api/mock-tests/all/:examType
// @access  Private (Gold)
export const getAllMockTests = async (req, res) => {
  try {
    const { examType } = req.params;

    const tests = await MockTest.find({ 
      examType, 
      isActive: true 
    })
    .select('-questions')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tests.length,
      tests
    });
  } catch (error) {
    console.error('Get all mock tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get mock test by ID
// @route   GET /api/mock-tests/:testId
// @access  Private (Gold)
export const getMockTestById = async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await MockTest.findById(testId)
      .select('-questions.questionId');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Get user's previous attempts
    const attempts = await TestAttempt.find({
      userId: req.user.id,
      testId: test._id,
      testType: 'mock'
    })
    .select('attemptNumber score.total accuracy status createdAt')
    .sort({ attemptNumber: -1 });

    res.json({
      success: true,
      test,
      previousAttempts: attempts
    });
  } catch (error) {
    console.error('Get mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Start mock test
// @route   POST /api/mock-tests/:testId/start
// @access  Private (Gold)
export const startMockTest = async (req, res) => {
  try {
    const { testId } = req.params;

    // Check for ongoing test
    const ongoingTest = await TestAttempt.findOne({
      userId: req.user.id,
      status: 'ongoing'
    });

    if (ongoingTest) {
      return res.status(400).json({
        success: false,
        message: 'You already have an ongoing test. Please complete it first.',
        ongoingTestId: ongoingTest._id
      });
    }

    const mockTest = await MockTest.findById(testId).populate('questions.questionId');

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Get next attempt number
    const lastAttempt = await TestAttempt.findOne({
      userId: req.user.id,
      testId: mockTest._id,
      testType: 'mock'
    })
    .sort({ attemptNumber: -1 })
    .limit(1);

    const attemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1;

    // Create test attempt with all questions loaded
    const responses = mockTest.questions.map(q => ({
      questionId: q.questionId._id,
      questionNumber: q.questionNumber,
      subject: q.subject,
      correctAnswer: q.questionId.answer,
      isAttempted: false,
      isFlagged: false,
      marksAwarded: 0
    }));

    const testAttempt = await TestAttempt.create({
      userId: req.user.id,
      testId: mockTest._id,
      testType: 'mock',
      examType: mockTest.examType,
      attemptNumber,
      startTime: new Date(),
      totalQuestions: mockTest.totalQuestions,
      responses,
      status: 'ongoing'
    });

    // Update user daily limit
    const user = await User.findById(req.user.id);
    user.dailyLimit.mockTestsAttempted += 1;
    await user.save();

    // Prepare questions without answers
    const questionsData = mockTest.questions.map(q => ({
      _id: q.questionId._id,
      questionNumber: q.questionNumber,
      type: q.questionId.type,
      subject: q.subject,
      question: q.questionId.question,
      questionImageUrl: q.questionId.questionImageUrl,
      options: q.questionId.type === 'S' ? q.questionId.options : null,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      section: q.section
    }));

    res.json({
      success: true,
      message: 'Mock test started successfully',
      attemptId: testAttempt._id,
      testName: mockTest.testName,
      duration: mockTest.duration,
      totalQuestions: mockTest.totalQuestions,
      totalMarks: mockTest.totalMarks,
      config: mockTest.examType === 'JEE' ? mockTest.jeeConfig : mockTest.neetConfig,
      questions: questionsData,
      startTime: testAttempt.startTime
    });
  } catch (error) {
    console.error('Start mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Submit mock test
// @route   POST /api/mock-tests/:testId/submit
// @access  Private
export const submitMockTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { attemptId, responses, flags } = req.body;

    if (!attemptId || !responses) {
      return res.status(400).json({
        success: false,
        message: 'Attempt ID and responses are required'
      });
    }

    const testAttempt = await TestAttempt.findById(attemptId);
    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    if (testAttempt.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Test already submitted'
      });
    }

    // Update responses
    for (const response of responses) {
      const index = testAttempt.responses.findIndex(
        r => r.questionNumber === response.questionNumber
      );
      
      if (index !== -1) {
        testAttempt.responses[index].userAnswer = response.userAnswer;
        testAttempt.responses[index].isAttempted = true;
        testAttempt.responses[index].timeTaken = response.timeTaken || 0;
        testAttempt.responses[index].isFlagged = flags?.includes(response.questionNumber) || false;
        
        // Check if answer is correct
        const isCorrect = 
          testAttempt.responses[index].correctAnswer.toLowerCase() === 
          response.userAnswer.toLowerCase();
        
        testAttempt.responses[index].isCorrect = isCorrect;
        
        // Get marks from mock test
        const mockTest = await MockTest.findById(testId);
        const questionConfig = mockTest.questions.find(
          q => q.questionNumber === response.questionNumber
        );
        
        if (isCorrect) {
          testAttempt.responses[index].marksAwarded = questionConfig?.marks || 4;
        } else {
          testAttempt.responses[index].marksAwarded = questionConfig?.negativeMarks || -1;
        }
      }
    }

    testAttempt.endTime = new Date();
    testAttempt.duration = Math.round((testAttempt.endTime - testAttempt.startTime) / 60000);
    testAttempt.status = 'completed';
    testAttempt.calculateResults();

    await testAttempt.save();

    // Calculate percentile
    await TestAttempt.calculatePercentile(testAttempt._id);

    // Update mock test analytics
    const mockTest = await MockTest.findById(testId);
    mockTest.totalAttempts += 1;
    const avgScore = ((mockTest.averageScore * (mockTest.totalAttempts - 1)) + testAttempt.score.total) / mockTest.totalAttempts;
    mockTest.averageScore = avgScore;
    await mockTest.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    user.totalMockTestsAttempted += 1;
    await user.save();

    res.json({
      success: true,
      message: 'Test submitted successfully',
      attemptId: testAttempt._id,
      redirectUrl: `/mock-tests/${testId}/result/${testAttempt._id}`
    });
  } catch (error) {
    console.error('Submit mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get mock test result
// @route   GET /api/mock-tests/:testId/result/:attemptId
// @access  Private
export const getMockTestResult = async (req, res) => {
  try {
    const { testId, attemptId } = req.params;

    const testAttempt = await TestAttempt.findById(attemptId)
      .populate('testId')
      .populate('responses.questionId');

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test result not found'
      });
    }

    // Verify ownership
    if (testAttempt.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      result: testAttempt
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's mock test attempts
// @route   GET /api/mock-tests/:testId/attempts
// @access  Private
export const getUserMockTestAttempts = async (req, res) => {
  try {
    const { testId } = req.params;

    const attempts = await TestAttempt.find({
      userId: req.user.id,
      testId,
      testType: 'mock'
    })
    .select('attemptNumber score accuracy status createdAt duration')
    .sort({ attemptNumber: -1 });

    res.json({
      success: true,
      count: attempts.length,
      attempts
    });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ongoing test
// @route   GET /api/mock-tests/ongoing
// @access  Private
export const getOngoingTest = async (req, res) => {
  try {
    const ongoingTest = await TestAttempt.findOne({
      userId: req.user.id,
      status: 'ongoing'
    })
    .populate('testId');

    if (!ongoingTest) {
      return res.json({
        success: true,
        hasOngoingTest: false,
        test: null
      });
    }

    // Calculate time remaining
    const elapsedMinutes = Math.round((new Date() - ongoingTest.startTime) / 60000);
    const timeRemaining = ongoingTest.testId.duration - elapsedMinutes;

    // Auto-submit if time expired
    if (timeRemaining <= 0) {
      ongoingTest.status = 'auto-submitted';
      ongoingTest.endTime = new Date();
      ongoingTest.duration = ongoingTest.testId.duration;
      ongoingTest.calculateResults();
      await ongoingTest.save();

      return res.json({
        success: true,
        hasOngoingTest: false,
        autoSubmitted: true,
        message: 'Test was auto-submitted due to time expiry'
      });
    }

    res.json({
      success: true,
      hasOngoingTest: true,
      test: {
        attemptId: ongoingTest._id,
        testId: ongoingTest.testId._id,
        testName: ongoingTest.testId.testName,
        timeRemaining,
        startTime: ongoingTest.startTime
      }
    });
  } catch (error) {
    console.error('Get ongoing test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};