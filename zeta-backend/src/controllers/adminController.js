import Question from '../models/Question.js';
import Formula from '../models/Formula.js';
import MockTest from '../models/MockTest.js';
import User from '../models/User.js';
import GiftCode from '../models/GiftCode.js';
import TestAttempt from '../models/TestAttempt.js';
import { parseCSVText } from '../utils/csvParser.js';

// @desc    Bulk upload questions via CSV TEXT
// @route   POST /api/admin/questions/bulk-upload
// @access  Private/Admin
export const bulkUploadQuestions = async (req, res) => {
  try {
    const { csvText, examType } = req.body;

    console.log('Bulk upload request:', { 
      hasCsvText: !!csvText, 
      csvTextLength: csvText?.length,
      examType 
    });

    if (!csvText || !csvText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide CSV text'
      });
    }

    if (!examType || !['JEE', 'NEET'].includes(examType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid exam type is required (JEE or NEET)'
      });
    }

    // Parse CSV text
    const questions = await parseCSVText(csvText);

    console.log('Parsed questions:', questions.length);

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found in CSV text. Please check the format.'
      });
    }

    const results = {
      success: [],
      errors: []
    };

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      try {
        const q = questions[i];

        console.log(`Processing question ${i + 1}:`, {
          type: q.type,
          subject: q.subject,
          chapter: q.chapter,
          topic: q.topic
        });

        // Validate required fields
        if (!q.type || !q.subject || !q.chapter || !q.topic || !q.question || !q.answer) {
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields',
            question: q.question?.substring(0, 50)
          });
          continue;
        }

        // Validate question type
        if (!['S', 'N'].includes(q.type)) {
          results.errors.push({
            row: i + 1,
            error: `Invalid question type: ${q.type}. Must be S or N`,
            question: q.question?.substring(0, 50)
          });
          continue;
        }

        // Get or create chapter number
        const existingChapter = await Question.findOne({
          examType,
          subject: q.subject,
          chapter: q.chapter
        });

        let chapterNumber;
        if (existingChapter) {
          chapterNumber = existingChapter.chapterNumber;
        } else {
          const maxChapter = await Question.findOne({ examType, subject: q.subject })
            .sort({ chapterNumber: -1 })
            .limit(1);
          chapterNumber = maxChapter ? maxChapter.chapterNumber + 1 : 1;
        }

        // Get or create topic code
        const existingTopic = await Question.findOne({
          examType,
          subject: q.subject,
          chapter: q.chapter,
          topic: q.topic
        });

        let topicCode;
        if (existingTopic) {
          topicCode = existingTopic.topicCode;
        } else {
          const topicsInChapter = await Question.distinct('topicCode', {
            examType,
            subject: q.subject,
            chapter: q.chapter
          });
          topicCode = String.fromCharCode(65 + topicsInChapter.length);
        }

        // Generate question ID and serial number
        const questionId = await Question.generateQuestionId(examType);
        const serialNumber = await Question.generateSerialNumber(examType, chapterNumber, topicCode);

        // Prepare question data
        const questionData = {
          questionId,
          serialNumber,
          type: q.type,
          examType,
          subject: q.subject,
          chapter: q.chapter,
          chapterNumber,
          topic: q.topic,
          topicCode,
          question: q.question,
          questionImageUrl: q.questionImageUrl || null,
          answer: q.answer,
          createdBy: req.user.id,
          lastModifiedBy: req.user.id
        };

        // Add options for MCQ type
        if (q.type === 'S') {
          // Validate that options exist
          if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
            results.errors.push({
              row: i + 1,
              error: 'MCQ question must have all 4 options (A, B, C, D)',
              question: q.question?.substring(0, 50)
            });
            continue;
          }

          questionData.options = {
            A: {
              text: q.optionA || '',
              imageUrl: q.optionAImageUrl || null
            },
            B: {
              text: q.optionB || '',
              imageUrl: q.optionBImageUrl || null
            },
            C: {
              text: q.optionC || '',
              imageUrl: q.optionCImageUrl || null
            },
            D: {
              text: q.optionD || '',
              imageUrl: q.optionDImageUrl || null
            }
          };

          // Validate answer is A, B, C, or D
          if (!['A', 'B', 'C', 'D'].includes(q.answer.toUpperCase())) {
            results.errors.push({
              row: i + 1,
              error: 'MCQ answer must be A, B, C, or D',
              question: q.question?.substring(0, 50)
            });
            continue;
          }
        }

        // Create question
        const savedQuestion = await Question.create(questionData);

        results.success.push({
          row: i + 1,
          questionId: savedQuestion.questionId,
          serialNumber: savedQuestion.serialNumber
        });

        console.log(`✅ Question ${i + 1} saved:`, savedQuestion.questionId);

      } catch (error) {
        console.error(`Error processing question ${i + 1}:`, error);
        results.errors.push({
          row: i + 1,
          error: error.message,
          question: questions[i]?.question?.substring(0, 50)
        });
      }
    }

    // Send response
    res.json({
      success: true,
      message: `Processed ${questions.length} questions. Successfully uploaded ${results.success.length}.`,
      totalProcessed: questions.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      successDetails: results.success,
      errors: results.errors
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV text: ' + error.message
    });
  }
};

// @desc    Add single question
// @route   POST /api/admin/questions/add
// @access  Private/Admin
export const addSingleQuestion = async (req, res) => {
  try {
    const questionData = req.body;

    if (!questionData.examType || !questionData.subject || !questionData.chapter || 
        !questionData.topic || !questionData.question || !questionData.answer || !questionData.type) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const existingChapter = await Question.findOne({
      examType: questionData.examType,
      subject: questionData.subject,
      chapter: questionData.chapter
    });

    let chapterNumber;
    if (existingChapter) {
      chapterNumber = existingChapter.chapterNumber;
    } else {
      const maxChapter = await Question.findOne({ 
        examType: questionData.examType, 
        subject: questionData.subject 
      })
      .sort({ chapterNumber: -1 })
      .limit(1);
      chapterNumber = maxChapter ? maxChapter.chapterNumber + 1 : 1;
    }

    const existingTopic = await Question.findOne({
      examType: questionData.examType,
      subject: questionData.subject,
      chapter: questionData.chapter,
      topic: questionData.topic
    });

    let topicCode;
    if (existingTopic) {
      topicCode = existingTopic.topicCode;
    } else {
      const topicsInChapter = await Question.distinct('topicCode', {
        examType: questionData.examType,
        subject: questionData.subject,
        chapter: questionData.chapter
      });
      topicCode = String.fromCharCode(65 + topicsInChapter.length);
    }

    const questionId = await Question.generateQuestionId(questionData.examType);
    const serialNumber = await Question.generateSerialNumber(questionData.examType, chapterNumber, topicCode);

    const newQuestion = await Question.create({
      ...questionData,
      questionId,
      serialNumber,
      chapterNumber,
      topicCode,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      question: newQuestion
    });

  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add question'
    });
  }
};

// @desc    Update question
// @route   PUT /api/admin/questions/:questionId
// @access  Private/Admin
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const updates = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== 'questionId' && key !== 'serialNumber') {
        question[key] = updates[key];
      }
    });

    question.lastModifiedBy = req.user.id;
    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      question
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
};

// @desc    Delete question
// @route   DELETE /api/admin/questions/:questionId
// @access  Private/Admin
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Soft delete
    question.isActive = false;
    await question.save();

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
};

// @desc    Search question by ID or serial number
// @route   GET /api/admin/questions/search
// @access  Private/Admin
export const searchQuestion = async (req, res) => {
  try {
    const { query, examType } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchQuery = {
      $or: [
        { questionId: query },
        { serialNumber: query }
      ]
    };

    if (examType) {
      searchQuery.examType = examType;
    }

    const questions = await Question.find(searchQuery);

    res.json({
      success: true,
      count: questions.length,
      questions
    });

  } catch (error) {
    console.error('Search question error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};
// FORMULA MANAGEMENT

// @desc    Add formula
// @route   POST /api/admin/formulas/add
// @access  Private/Admin
export const addFormula = async (req, res) => {
  try {
    const { examType, subject, chapter, topicName, pdfUrl, description } = req.body;

    if (!examType || !subject || !chapter || !topicName || !pdfUrl) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const formula = await Formula.create({
      examType,
      subject,
      chapter,
      topicName,
      pdfUrl,
      description: description || '',
      uploadedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Formula added successfully',
      formula
    });

  } catch (error) {
    console.error('Add formula error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add formula'
    });
  }
};

// @desc    Update formula
// @route   PUT /api/admin/formulas/:formulaId
// @access  Private/Admin
export const updateFormula = async (req, res) => {
  try {
    const { formulaId } = req.params;
    const updates = req.body;

    const formula = await Formula.findByIdAndUpdate(
      formulaId,
      { ...updates, uploadedBy: req.user.id },
      { new: true }
    );

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    res.json({
      success: true,
      message: 'Formula updated successfully',
      formula
    });

  } catch (error) {
    console.error('Update formula error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update formula'
    });
  }
};

// @desc    Delete formula
// @route   DELETE /api/admin/formulas/:formulaId
// @access  Private/Admin
export const deleteFormula = async (req, res) => {
  try {
    const { formulaId } = req.params;

    const formula = await Formula.findById(formulaId);
    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    formula.isActive = false;
    await formula.save();

    res.json({
      success: true,
      message: 'Formula deleted successfully'
    });

  } catch (error) {
    console.error('Delete formula error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete formula'
    });
  }
};

// @desc    Get all formulas for exam type
// @route   GET /api/admin/formulas/:examType
// @access  Private/Admin
export const getAllFormulas = async (req, res) => {
  try {
    const { examType } = req.params;

    const formulas = await Formula.find({ examType, isActive: true })
      .sort({ subject: 1, chapter: 1, order: 1 });

    res.json({
      success: true,
      count: formulas.length,
      formulas
    });

  } catch (error) {
    console.error('Get formulas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch formulas'
    });
  }
};

// MOCK TEST MANAGEMENT

// @desc    Create mock test
// @route   POST /api/admin/mock-tests/create
// @access  Private/Admin
export const createMockTest = async (req, res) => {
  try {
    const { examType, testName, questionIds } = req.body;

    if (!examType || !testName || !questionIds || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam type, test name and questions are required'
      });
    }

    // Generate test ID
    const testId = await MockTest.generateTestId(examType);

    // Get default config
    const config = MockTest.getDefaultConfig(examType);

    // Prepare questions array
    const questions = [];
    let questionNumber = 1;

    for (const qId of questionIds) {
      const question = await Question.findById(qId);
      if (!question) continue;

      questions.push({
        questionId: question._id,
        subject: question.subject,
        section: question.subject,
        marks: 4,
        negativeMarks: -1,
        questionNumber: questionNumber++
      });
    }

    // Validate question count
    if (examType === 'JEE' && questions.length !== 90) {
      return res.status(400).json({
        success: false,
        message: 'JEE mock test must have exactly 90 questions'
      });
    }

    if (examType === 'NEET' && questions.length !== 180) {
      return res.status(400).json({
        success: false,
        message: 'NEET mock test must have exactly 180 questions'
      });
    }

    const mockTest = await MockTest.create({
      testId,
      testName,
      examType,
      ...config,
      questions,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Mock test created successfully',
      mockTest
    });

  } catch (error) {
    console.error('Create mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mock test'
    });
  }
};

// @desc    Update mock test
// @route   PUT /api/admin/mock-tests/:testId
// @access  Private/Admin
export const updateMockTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const updates = req.body;

    const mockTest = await MockTest.findByIdAndUpdate(
      testId,
      updates,
      { new: true }
    );

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    res.json({
      success: true,
      message: 'Mock test updated successfully',
      mockTest
    });

  } catch (error) {
    console.error('Update mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mock test'
    });
  }
};

// @desc    Delete mock test
// @route   DELETE /api/admin/mock-tests/:testId
// @access  Private/Admin
export const deleteMockTest = async (req, res) => {
  try {
    const { testId } = req.params;

    const mockTest = await MockTest.findById(testId);
    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    mockTest.isActive = false;
    await mockTest.save();

    res.json({
      success: true,
      message: 'Mock test deleted successfully'
    });

  } catch (error) {
    console.error('Delete mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mock test'
    });
  }
};

// @desc    Create mock test from CSV text
// @route   POST /api/admin/mock-tests/create
// @access  Private/Admin
export const createMockTestFromCSV = async (req, res) => {
  try {
    const { examType, testName, csvText } = req.body;

    if (!examType || !testName || !csvText) {
      return res.status(400).json({
        success: false,
        message: 'Exam type, test name, and CSV text are required'
      });
    }

    // Parse CSV text
    const parsedQuestions = await parseCSVText(csvText);

    if (!parsedQuestions || parsedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found in CSV text'
      });
    }

    // Validate question count
    const expectedCount = examType === 'JEE' ? 90 : 180;
    if (parsedQuestions.length !== expectedCount) {
      return res.status(400).json({
        success: false,
        message: `${examType} mock test must have exactly ${expectedCount} questions. Found ${parsedQuestions.length}.`
      });
    }

    // First, save all questions to database
    const questionIds = [];
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];

      // Get or create chapter/topic codes
      const existingChapter = await Question.findOne({
        examType,
        subject: q.subject,
        chapter: q.chapter
      });

      let chapterNumber;
      if (existingChapter) {
        chapterNumber = existingChapter.chapterNumber;
      } else {
        const maxChapter = await Question.findOne({ examType, subject: q.subject })
          .sort({ chapterNumber: -1 })
          .limit(1);
        chapterNumber = maxChapter ? maxChapter.chapterNumber + 1 : 1;
      }

      const existingTopic = await Question.findOne({
        examType,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic
      });

      let topicCode;
      if (existingTopic) {
        topicCode = existingTopic.topicCode;
      } else {
        const topicsInChapter = await Question.distinct('topicCode', {
          examType,
          subject: q.subject,
          chapter: q.chapter
        });
        topicCode = String.fromCharCode(65 + topicsInChapter.length);
      }

      const questionId = await Question.generateQuestionId(examType);
      const serialNumber = await Question.generateSerialNumber(examType, chapterNumber, topicCode);

      const questionData = {
        questionId,
        serialNumber,
        type: q.type,
        examType,
        subject: q.subject,
        chapter: q.chapter,
        chapterNumber,
        topic: q.topic,
        topicCode,
        question: q.question,
        questionImageUrl: q.questionImageUrl || null,
        answer: q.answer,
        createdBy: req.user.id,
        lastModifiedBy: req.user.id
      };

      if (q.type === 'S') {
        questionData.options = {
          A: { text: q.optionA || '', imageUrl: q.optionAImageUrl || null },
          B: { text: q.optionB || '', imageUrl: q.optionBImageUrl || null },
          C: { text: q.optionC || '', imageUrl: q.optionCImageUrl || null },
          D: { text: q.optionD || '', imageUrl: q.optionDImageUrl || null }
        };
      }

      const savedQuestion = await Question.create(questionData);
      questionIds.push(savedQuestion._id);
    }

    // Create mock test
    const testId = await MockTest.generateTestId(examType);
    const config = MockTest.getDefaultConfig(examType);

    const questions = [];
    questionIds.forEach((qId, index) => {
      const question = parsedQuestions[index];
      questions.push({
        questionId: qId,
        subject: question.subject,
        section: question.subject,
        marks: 4,
        negativeMarks: -1,
        questionNumber: index + 1
      });
    });

    const mockTest = await MockTest.create({
      testId,
      testName,
      examType,
      ...config,
      questions,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Mock test created successfully with all questions saved',
      mockTest: {
        _id: mockTest._id,
        testId: mockTest.testId,
        testName: mockTest.testName,
        totalQuestions: mockTest.totalQuestions
      }
    });

  } catch (error) {
    console.error('Create mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mock test: ' + error.message
    });
  }
};

// USER MANAGEMENT

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, subscription, examType } = req.query;

    const query = { isAdmin: false };
    if (subscription) query.subscription = subscription;
    if (examType) query.examType = examType;

    const users = await User.find(query)
      .select('-password -loginDeviceId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:userId
// @access  Private/Admin
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const mockTests = await TestAttempt.countDocuments({
      userId,
      testType: 'mock',
      status: 'completed'
    });

    const chapterTests = await TestAttempt.countDocuments({
      userId,
      testType: 'chapter',
      status: 'completed'
    });

    const avgScore = await TestAttempt.aggregate([
      { $match: { userId: user._id, testType: 'mock', status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$score.total' } } }
    ]);

    res.json({
      success: true,
      user,
      stats: {
        mockTestsCompleted: mockTests,
        chapterTestsCompleted: chapterTests,
        averageScore: avgScore[0]?.avgScore || 0
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
};

// @desc    Update user subscription
// @route   PUT /api/admin/users/:userId/subscription
// @access  Private/Admin
export const updateUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscription, days } = req.body;

    if (!subscription || !days) {
      return res.status(400).json({
        success: false,
        message: 'Subscription type and duration are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    user.subscription = subscription;
    user.subscriptionStartTime = now;
    user.subscriptionEndTime = endTime;
    await user.save();

    res.json({
      success: true,
      message: 'User subscription updated successfully',
      subscription: {
        type: subscription,
        endTime
      }
    });

  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription'
    });
  }
};

// @desc    Deactivate user
// @route   PUT /api/admin/users/:userId/deactivate
// @access  Private/Admin
export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    user.isLoggedIn = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user'
    });
  }
};

// GIFT CODE MANAGEMENT

// @desc    Generate gift codes
// @route   POST /api/admin/giftcodes/generate
// @access  Private/Admin
export const generateGiftCodes = async (req, res) => {
  try {
    const { subscriptionType, duration, quantity, notes } = req.body;

    if (!subscriptionType || !duration || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Subscription type, duration and quantity are required'
      });
    }

    if (quantity > 100) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate more than 100 codes at once'
      });
    }

    const generatedCodes = [];

    for (let i = 0; i < quantity; i++) {
      const { code, durationInDays } = GiftCode.generateCode(subscriptionType, duration);

      const giftCode = await GiftCode.create({
        code,
        subscriptionType,
        duration,
        durationInDays,
        generatedBy: req.user.id,
        notes: notes || ''
      });

      generatedCodes.push(giftCode);
    }

    res.status(201).json({
      success: true,
      message: `Generated ${quantity} gift codes successfully`,
      codes: generatedCodes
    });

  } catch (error) {
    console.error('Generate gift codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate gift codes'
    });
  }
};

// @desc    Get all gift codes
// @route   GET /api/admin/giftcodes
// @access  Private/Admin
export const getAllGiftCodes = async (req, res) => {
  try {
    const { isUsed } = req.query;

    const query = {};
    if (isUsed !== undefined) {
      query.isUsed = isUsed === 'true';
    }

    const giftCodes = await GiftCode.find(query)
      .populate('usedBy', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: giftCodes.length,
      giftCodes
    });

  } catch (error) {
    console.error('Get gift codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gift codes'
    });
  }
};

// @desc    Delete gift code
// @route   DELETE /api/admin/giftcodes/:codeId
// @access  Private/Admin
export const deleteGiftCode = async (req, res) => {
  try {
    const { codeId } = req.params;

    await GiftCode.findByIdAndDelete(codeId);

    res.json({
      success: true,
      message: 'Gift code deleted successfully'
    });

  } catch (error) {
    console.error('Delete gift code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gift code'
    });
  }
};

// ADMIN STATS

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const activeUsers = await User.countDocuments({ isAdmin: false, isActive: true });
    const freeUsers = await User.countDocuments({ subscription: 'free' });
    const silverUsers = await User.countDocuments({ subscription: 'silver' });
    const goldUsers = await User.countDocuments({ subscription: 'gold' });

    const totalQuestions = await Question.countDocuments({ isActive: true });
    const jeeQuestions = await Question.countDocuments({ examType: 'JEE', isActive: true });
    const neetQuestions = await Question.countDocuments({ examType: 'NEET', isActive: true });

    const totalMockTests = await MockTest.countDocuments({ isActive: true });
    const totalTestAttempts = await TestAttempt.countDocuments({ status: 'completed' });

    const activeGiftCodes = await GiftCode.countDocuments({ isUsed: false });
    const usedGiftCodes = await GiftCode.countDocuments({ isUsed: true });

    // Recent activities
    const recentUsers = await User.find({ isAdmin: false })
      .select('email createdAt subscription')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAttempts = await TestAttempt.find({ status: 'completed' })
      .populate('userId', 'email')
      .populate('testId', 'testName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          free: freeUsers,
          silver: silverUsers,
          gold: goldUsers
        },
        questions: {
          total: totalQuestions,
          jee: jeeQuestions,
          neet: neetQuestions
        },
        tests: {
          mockTests: totalMockTests,
          totalAttempts: totalTestAttempts
        },
        giftCodes: {
          active: activeGiftCodes,
          used: usedGiftCodes
        },
        recentActivity: {
          users: recentUsers,
          testAttempts: recentAttempts
        }
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};