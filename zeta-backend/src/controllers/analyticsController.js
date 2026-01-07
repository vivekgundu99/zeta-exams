import TestAttempt from '../models/TestAttempt.js';
import User from '../models/User.js';

// @desc    Get user overview analytics
// @route   GET /api/analytics/overview
// @access  Private
export const getUserAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const mockTests = await TestAttempt.find({
      userId: req.user.id,
      testType: 'mock',
      status: 'completed'
    }).sort({ createdAt: -1 });

    const chapterTests = await TestAttempt.find({
      userId: req.user.id,
      testType: 'chapter',
      status: 'completed'
    }).sort({ createdAt: -1 });

    const totalTests = mockTests.length + chapterTests.length;
    
    const avgMockScore = mockTests.length > 0
      ? mockTests.reduce((sum, test) => sum + test.score.total, 0) / mockTests.length
      : 0;

    const avgChapterScore = chapterTests.length > 0
      ? chapterTests.reduce((sum, test) => sum + test.score.total, 0) / chapterTests.length
      : 0;

    const avgAccuracy = totalTests > 0
      ? (mockTests.reduce((sum, test) => sum + test.accuracy, 0) + 
         chapterTests.reduce((sum, test) => sum + test.accuracy, 0)) / totalTests
      : 0;

    res.json({
      success: true,
      analytics: {
        totalQuestionsAttempted: user.totalQuestionsAttempted,
        totalTestsAttempted: totalTests,
        mockTestsCompleted: mockTests.length,
        chapterTestsCompleted: chapterTests.length,
        averageMockScore: avgMockScore.toFixed(2),
        averageChapterScore: avgChapterScore.toFixed(2),
        averageAccuracy: avgAccuracy.toFixed(2),
        subscription: user.subscription,
        examType: user.examType
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subject-wise analysis
// @route   GET /api/analytics/subject-wise/:examType
// @access  Private
export const getSubjectWiseAnalysis = async (req, res) => {
  try {
    const { examType } = req.params;

    const tests = await TestAttempt.find({
      userId: req.user.id,
      examType,
      status: 'completed'
    });

    const subjectAnalysis = {};
    const subjects = examType === 'JEE' 
      ? ['physics', 'chemistry', 'mathematics']
      : ['physics', 'chemistry', 'biology'];

    subjects.forEach(subject => {
      const subjectData = {
        totalAttempts: 0,
        totalScore: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalQuestions: 0,
        averageScore: 0,
        averageAccuracy: 0
      };

      tests.forEach(test => {
        if (test.subjectAnalysis && test.subjectAnalysis[subject]) {
          const analysis = test.subjectAnalysis[subject];
          subjectData.totalAttempts++;
          subjectData.totalScore += analysis.marks || 0;
          subjectData.totalCorrect += analysis.correct || 0;
          subjectData.totalWrong += analysis.wrong || 0;
          subjectData.totalQuestions += (analysis.attempted || 0);
        }
      });

      if (subjectData.totalAttempts > 0) {
        subjectData.averageScore = (subjectData.totalScore / subjectData.totalAttempts).toFixed(2);
        subjectData.averageAccuracy = subjectData.totalQuestions > 0
          ? ((subjectData.totalCorrect / subjectData.totalQuestions) * 100).toFixed(2)
          : 0;
      }

      subjectAnalysis[subject] = subjectData;
    });

    res.json({
      success: true,
      examType,
      subjectAnalysis
    });

  } catch (error) {
    console.error('Get subject analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get chapter-wise analysis
// @route   GET /api/analytics/chapter-wise/:examType/:subject
// @access  Private
export const getChapterWiseAnalysis = async (req, res) => {
  try {
    const { examType, subject } = req.params;

    // Get all test attempts with responses
    const tests = await TestAttempt.find({
      userId: req.user.id,
      examType,
      status: 'completed'
    }).populate('responses.questionId');

    const chapterAnalysis = {};

    tests.forEach(test => {
      test.responses.forEach(response => {
        if (response.questionId && response.questionId.subject.toLowerCase() === subject.toLowerCase()) {
          const chapter = response.questionId.chapter;
          
          if (!chapterAnalysis[chapter]) {
            chapterAnalysis[chapter] = {
              attempted: 0,
              correct: 0,
              wrong: 0,
              accuracy: 0
            };
          }

          if (response.isAttempted) {
            chapterAnalysis[chapter].attempted++;
            if (response.isCorrect) {
              chapterAnalysis[chapter].correct++;
            } else {
              chapterAnalysis[chapter].wrong++;
            }
          }
        }
      });
    });

    // Calculate accuracy for each chapter
    Object.keys(chapterAnalysis).forEach(chapter => {
      const data = chapterAnalysis[chapter];
      data.accuracy = data.attempted > 0
        ? ((data.correct / data.attempted) * 100).toFixed(2)
        : 0;
    });

    res.json({
      success: true,
      examType,
      subject,
      chapterAnalysis
    });

  } catch (error) {
    console.error('Get chapter analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get test history
// @route   GET /api/analytics/test-history
// @access  Private
export const getTestHistory = async (req, res) => {
  try {
    const { testType, limit = 20 } = req.query;

    const query = {
      userId: req.user.id,
      status: 'completed'
    };

    if (testType) {
      query.testType = testType;
    }

    const tests = await TestAttempt.find(query)
      .populate('testId', 'testName examType')
      .select('testType attemptNumber score accuracy createdAt duration')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: tests.length,
      tests
    });

  } catch (error) {
    console.error('Get test history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get performance trend
// @route   GET /api/analytics/performance-trend
// @access  Private
export const getPerformanceTrend = async (req, res) => {
  try {
    const { days = 30, testType = 'mock' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const tests = await TestAttempt.find({
      userId: req.user.id,
      testType,
      status: 'completed',
      createdAt: { $gte: startDate }
    })
    .select('score.total accuracy createdAt')
    .sort({ createdAt: 1 });

    const trend = tests.map(test => ({
      date: test.createdAt.toISOString().split('T')[0],
      score: test.score.total,
      accuracy: test.accuracy
    }));

    res.json({
      success: true,
      period: `${days} days`,
      testType,
      trend
    });

  } catch (error) {
    console.error('Get performance trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get strength and weakness analysis
// @route   GET /api/analytics/strength-weakness
// @access  Private
export const getStrengthWeakness = async (req, res) => {
  try {
    const tests = await TestAttempt.find({
      userId: req.user.id,
      status: 'completed'
    }).populate('responses.questionId');

    const topicAnalysis = {};

    tests.forEach(test => {
      test.responses.forEach(response => {
        if (response.questionId && response.isAttempted) {
          const topic = `${response.questionId.subject} - ${response.questionId.chapter} - ${response.questionId.topic}`;
          
          if (!topicAnalysis[topic]) {
            topicAnalysis[topic] = {
              attempted: 0,
              correct: 0,
              accuracy: 0
            };
          }

          topicAnalysis[topic].attempted++;
          if (response.isCorrect) {
            topicAnalysis[topic].correct++;
          }
        }
      });
    });

    // Calculate accuracy and sort
    const topics = Object.keys(topicAnalysis).map(topic => ({
      topic,
      ...topicAnalysis[topic],
      accuracy: ((topicAnalysis[topic].correct / topicAnalysis[topic].attempted) * 100).toFixed(2)
    }));

    topics.sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy));

    const strengths = topics.slice(0, 10); // Top 10
    const weaknesses = topics.slice(-10).reverse(); // Bottom 10

    res.json({
      success: true,
      strengths,
      weaknesses
    });

  } catch (error) {
    console.error('Get strength/weakness error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get accuracy report
// @route   GET /api/analytics/accuracy-report
// @access  Private
export const getAccuracyReport = async (req, res) => {
  try {
    const tests = await TestAttempt.find({
      userId: req.user.id,
      testType: 'mock',
      status: 'completed'
    });

    const accuracyData = {
      overall: 0,
      byQuestionType: {
        mcq: { attempted: 0, correct: 0, accuracy: 0 },
        numerical: { attempted: 0, correct: 0, accuracy: 0 }
      },
      trend: []
    };

    let totalAttempted = 0;
    let totalCorrect = 0;

    tests.forEach(test => {
      totalAttempted += test.attemptedQuestions;
      totalCorrect += test.correctAnswers;

      accuracyData.trend.push({
        date: test.createdAt.toISOString().split('T')[0],
        accuracy: test.accuracy
      });

      test.responses.forEach(response => {
        if (response.isAttempted) {
          const isMCQ = response.questionId && response.questionId.type === 'S';
          const type = isMCQ ? 'mcq' : 'numerical';
          
          accuracyData.byQuestionType[type].attempted++;
          if (response.isCorrect) {
            accuracyData.byQuestionType[type].correct++;
          }
        }
      });
    });

    accuracyData.overall = totalAttempted > 0
      ? ((totalCorrect / totalAttempted) * 100).toFixed(2)
      : 0;

    Object.keys(accuracyData.byQuestionType).forEach(type => {
      const data = accuracyData.byQuestionType[type];
      data.accuracy = data.attempted > 0
        ? ((data.correct / data.attempted) * 100).toFixed(2)
        : 0;
    });

    res.json({
      success: true,
      accuracyData
    });

  } catch (error) {
    console.error('Get accuracy report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get time analysis
// @route   GET /api/analytics/time-analysis
// @access  Private
export const getTimeAnalysis = async (req, res) => {
  try {
    const tests = await TestAttempt.find({
      userId: req.user.id,
      testType: 'mock',
      status: 'completed'
    });

    const timeData = {
      averageTestDuration: 0,
      averageTimePerQuestion: 0,
      fastestTest: null,
      slowestTest: null
    };

    if (tests.length === 0) {
      return res.json({
        success: true,
        message: 'No test data available',
        timeData
      });
    }

    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);
    timeData.averageTestDuration = (totalDuration / tests.length).toFixed(2);

    const totalQuestions = tests.reduce((sum, test) => sum + test.attemptedQuestions, 0);
    timeData.averageTimePerQuestion = totalQuestions > 0
      ? ((totalDuration / totalQuestions) * 60).toFixed(2) // Convert to seconds
      : 0;

    const sortedByDuration = [...tests].sort((a, b) => a.duration - b.duration);
    timeData.fastestTest = {
      duration: sortedByDuration[0].duration,
      score: sortedByDuration[0].score.total,
      date: sortedByDuration[0].createdAt
    };
    timeData.slowestTest = {
      duration: sortedByDuration[sortedByDuration.length - 1].duration,
      score: sortedByDuration[sortedByDuration.length - 1].score.total,
      date: sortedByDuration[sortedByDuration.length - 1].createdAt
    };

    res.json({
      success: true,
      timeData
    });

  } catch (error) {
    console.error('Get time analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};