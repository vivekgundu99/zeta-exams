// CSV Parser for bulk question upload
// Format: Type#Subject#Chapter#Topic#Question#OptA#OptB#OptC#OptD#Answer#QImg#OptAImg#OptBImg#OptCImg#OptDImg

export const parseCSV = async (csvData) => {
  try {
    const lines = csvData.split('\n').filter(line => line.trim());
    const questions = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by # delimiter
      const parts = line.split('#').map(p => p.trim());

      if (parts.length < 11) {
        console.warn(`Line ${i + 1}: Insufficient data`);
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
      if (!['S', 'N'].includes(type)) {
        console.warn(`Line ${i + 1}: Invalid question type`);
        continue;
      }

      const questionData = {
        type,
        subject,
        chapter,
        topic,
        question,
        answer,
        questionImageUrl: questionImageUrl || null
      };

      // Add options for MCQ type
      if (type === 'S') {
        questionData.optionA = optionA || '';
        questionData.optionB = optionB || '';
        questionData.optionC = optionC || '';
        questionData.optionD = optionD || '';
        questionData.optionAImageUrl = optionAImageUrl || null;
        questionData.optionBImageUrl = optionBImageUrl || null;
        questionData.optionCImageUrl = optionCImageUrl || null;
        questionData.optionDImageUrl = optionDImageUrl || null;
      }

      questions.push(questionData);
    }

    return questions;

  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error('Failed to parse CSV file');
  }
};

// Alternative: Parse CSV with headers
export const parseCSVWithHeaders = (csvData) => {
  try {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const questions = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        console.warn(`Line ${i + 1}: Column count mismatch`);
        continue;
      }

      const question = {};
      headers.forEach((header, index) => {
        question[header] = values[index];
      });

      questions.push(question);
    }

    return questions;

  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error('Failed to parse CSV file');
  }
};