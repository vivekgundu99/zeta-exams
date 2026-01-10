// CSV Parser for bulk question upload with LaTeX support
// Format: Type#Subject#Chapter#Topic#Question#OptA#OptB#OptC#OptD#Answer#QImg#OptAImg#OptBImg#OptCImg#OptDImg

// Convert LaTeX notation to proper format
const convertLatex = (text) => {
  if (!text) return text;
  
  // Match latex:(...) pattern and convert to LaTeX format
  const latexRegex = /latex:(.*?)(?=#|$)/g;
  
  return text.replace(latexRegex, (match, formula) => {
    // Wrap in LaTeX delimiters for rendering
    return `$$${formula.trim()}$$`;
  });
};

export const parseCSVText = async (csvText) => {
  try {
    if (!csvText || !csvText.trim()) {
      throw new Error('CSV text is empty');
    }

    const lines = csvText.split('\n').filter(line => line.trim());
    const questions = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by # delimiter
      const parts = line.split('#').map(p => p.trim());

      if (parts.length < 11) {
        console.warn(`Line ${i + 1}: Insufficient data (needs at least 11 parts)`);
        continue;
      }

      const [
        type,
        subject,
        chapter,
        topic,
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        answer,
        questionImageUrl,
        optionAImageUrl,
        optionBImageUrl,
        optionCImageUrl,
        optionDImageUrl
      ] = parts;

      // Validate type
      if (!['S', 'N', 'M'].includes(type.toUpperCase())) {
        console.warn(`Line ${i + 1}: Invalid question type '${type}' (must be S, N, or M)`);
        continue;
      }

      // Validate required fields
      if (!subject || !chapter || !topic || !question || !answer) {
        console.warn(`Line ${i + 1}: Missing required fields`);
        continue;
      }

      const questionData = {
        type: type.toUpperCase() === 'M' ? 'S' : type.toUpperCase(), // M is also MCQ
        subject,
        chapter,
        topic,
        question: convertLatex(question), // Apply LaTeX conversion
        answer,
        questionImageUrl: questionImageUrl || null
      };

      // Add options for MCQ type (S or M)
      if (type.toUpperCase() === 'S' || type.toUpperCase() === 'M') {
        questionData.optionA = convertLatex(optionA) || '';
        questionData.optionB = convertLatex(optionB) || '';
        questionData.optionC = convertLatex(optionC) || '';
        questionData.optionD = convertLatex(optionD) || '';
        questionData.optionAImageUrl = optionAImageUrl || null;
        questionData.optionBImageUrl = optionBImageUrl || null;
        questionData.optionCImageUrl = optionCImageUrl || null;
        questionData.optionDImageUrl = optionDImageUrl || null;
      }

      questions.push(questionData);
    }

    if (questions.length === 0) {
      throw new Error('No valid questions found in CSV text. Please check the format.');
    }

    return questions;

  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error('Failed to parse CSV text: ' + error.message);
  }
};

// Legacy CSV file parser (kept for backward compatibility)
export const parseCSV = async (csvData) => {
  return parseCSVText(csvData);
};