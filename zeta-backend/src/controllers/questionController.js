import Question from '../models/Question.js';
import User from '../models/User.js';
import TestAttempt from '../models/TestAttempt.js';

// @desc    Get all subjects for an exam type
// @route   GET /api/questions/subjects/:examType
// @access  Private
export const getSubjects = async (req, res) => {
  try {
    const { examType } = req.params;

    const subjects = await Question.distinct('subject', { 
      examType, 
      isActive: true 
    });

    res.json({
      success: true,
      subjects: subjects.sort()
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get chapters by subject
// @route   GET /api/questions/chapters/:examType/:subject
// @access  Private
export const getChaptersBySubject = async (req, res) => {
  try {
    const { examType, subject } = req.params;

    const chapters = await Question.aggregate([
      { 
        $match: { 
          examType, 
          subject, 
          isActive: true 
        } 
      },
      {
        $group: {
          _id: '$chapter',
          chapterNumber: { $first: '$chapterNumber' }
        }
      },
      { $sort: { chapterNumber: 1 } }
    ]);

    res.json({
      success: true,
      chapters: chapters.map(c => ({
        name: c._id,
        number: c.chapterNumber
      }))
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get topics by chapter
// @route   GET /api/questions/topics/:examType/:subject/:chapter
// @access  Private
export const getTopicsByChapter = async (req, res) => {
  try {
    const { examType, subject, chapter } = req.params;

    const topics = await Question.aggregate([
      { 
        $match: { 
          examType, 
          subject, 
          chapter, 
          isActive: true 
        } 
      },
      {
        $group: {
          _id: '$topic',
          topicCode: { $first: '$topicCode' },
          questionCount: { $sum: 1 }
        }
      },
      { $sort: { topicCode: 1 } }
    ]);

    res.json({
      success: true,
      topics: topics.map(t => ({
        name: t._id,
        code: t.topicCode,
        questionCount: t.questionCount
      }))
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get questions by topic
// @route   GET /api/questions/topic/:examType/:subject/:chapter/:topic
// @access  Private
export const getQuestionsByTopic = async (req, res) => {
  try {
    const { examType, subject, chapter, topic } = req.params;

    const questions = await Question.find({
      examType,
      subject,
      chapter,
      topic,
      isActive: true
    })
    .select('-solution -solutionImageUrl -correctAttempts -totalAttempts')
    .sort({ serialNumber: 1 });

    res.json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single question by ID
// @route   GET /api/questions/:questionId
// @access  Private
export const getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId)
      .select('-solution -solutionImageUrl');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Submit answer for a question
// @route   POST /api/questions/submit-answer
// @access  Private
export const submitAnswer = async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;

    if (!questionId || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and answer are required'
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const isCorrect = question.answer.toLowerCase() === userAnswer.toLowerCase();

    // Update question analytics
    await question.recordAttempt(isCorrect);

    // Update user stats
    const user = await User.findById(req.user.id);
    user.totalQuestionsAttempted += 1;
    user.dailyLimit.questionsAttempted += 1;
    await user.save();

    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.answer,
      solution: question.solution || null,
      solutionImageUrl: question.solutionImageUrl || null
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Generate chapter test
// @route   POST /api/questions/chapter-test/generate
// @access  Private (Silver+)
export const getChapterTest = async (req, res) => {
  try {
    const { examType, subject, chapter } = req.body;

    if (!examType || !subject || !chapter) {
      return res.status(400).json({
        success: false,
        message: 'Exam type, subject, and chapter are required'
      });
    }

    // Get 10 random questions from the chapter
    const questions = await Question.aggregate([
      { 
        $match: { 
          examType, 
          subject, 
          chapter, 
          isActive: true 
        } 
      },
      { $sample: { size: 10 } },
      {
        $project: {
          solution: 0,
          solutionImageUrl: 0,
          correctAttempts: 0,
          totalAttempts: 0
        }
      }
    ]);

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions available for this chapter'
      });
    }

    // Create test attempt record
    const testAttempt = await TestAttempt.create({
      userId: req.user.id,
      testType: 'chapter',
      examType,
      attemptNumber: 1,
      startTime: new Date(),
      totalQuestions: questions.length,
      responses: questions.map((q, index) => ({
        questionId: q._id,
        questionNumber: index + 1,
        subject: q.subject,
        correctAnswer: q.answer,
        isAttempted: false
      }))
    });

    // Update user daily limit
    const user = await User.findById(req.user.id);
    user.dailyLimit.chapterTestsAttempted += 1;
    await user.save();

    res.json({
      success: true,
      testId: testAttempt._id,
      questions,
      duration: 20 // 20 minutes for chapter test
    });
  } catch (error) {
    console.error('Generate chapter test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Submit chapter test
// @route   POST /api/questions/chapter-test/submit
// @access  Private
export const submitChapterTest = async (req, res) => {
  try {
    const { testId, responses } = req.body;

    if (!testId || !responses) {
      return res.status(400).json({
        success: false,
        message: 'Test ID and responses are required'
      });
    }

    const testAttempt = await TestAttempt.findById(testId);
    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Update responses
    for (const response of responses) {
      const index = testAttempt.responses.findIndex(
        r => r.questionId.toString() === response.questionId
      );
      
      if (index !== -1) {
        testAttempt.responses[index].userAnswer = response.userAnswer;
        testAttempt.responses[index].isAttempted = true;
        testAttempt.responses[index].timeTaken = response.timeTaken || 0;
        testAttempt.responses[index].isCorrect = 
          testAttempt.responses[index].correctAnswer.toLowerCase() === 
          response.userAnswer.toLowerCase();
        
        // Calculate marks (assuming 4 marks per question, -1 for wrong)
        if (testAttempt.responses[index].isCorrect) {
          testAttempt.responses[index].marksAwarded = 4;
        } else {
          testAttempt.responses[index].marksAwarded = -1;
        }
      }
    }

    testAttempt.endTime = new Date();
    testAttempt.duration = Math.round((testAttempt.endTime - testAttempt.startTime) / 60000);
    testAttempt.status = 'completed';
    testAttempt.calculateResults();

    await testAttempt.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    user.totalTestsAttempted += 1;
    await user.save();

    res.json({
      success: true,
      message: 'Test submitted successfully',
      result: {
        score: testAttempt.score.total,
        accuracy: testAttempt.accuracy,
        attempted: testAttempt.attemptedQuestions,
        correct: testAttempt.correctAnswers,
        wrong: testAttempt.wrongAnswers
      }
    });
  } catch (error) {
    console.error('Submit chapter test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};