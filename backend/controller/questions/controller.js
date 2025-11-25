const { spawn } = require('child_process');
const path = require('path');
const questions = require('../../data/cybersecurity_questions.json');
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

exports.getQuestions = (req, res) => {
  const publicQuestions = questions.map(q => ({
    id: q.id,
    text: q.text,
    blanks: q.blanks
  }));
  res.json(publicQuestions);
};

exports.checkAnswers = async (req, res) => {
  try {
    const userAnswers = req.body;

    if (!userAnswers || typeof userAnswers !== 'object' || Object.keys(userAnswers).length === 0) {
      return res.status(400).json({ error: 'Invalid input: Must provide answers object' });
    }

    try {
      await new Promise((resolve, reject) => {
        const check = spawn(PYTHON_PATH, ['--version']);
        check.on('error', reject);
        check.on('close', (code) => (code === 0 ? resolve() : reject(new Error('Python not found in PATH'))));
      });
    } catch (error) {
      console.error('Python check failed:', error.message);
      return res.status(500).json({ error: 'Server error: Python not found. Ensure Python is installed.' });
    }

    const results = {};
    for (const question of questions) {
      const userAns = userAnswers[question.id];
      if (!Array.isArray(userAns) || userAns.length !== question.blanks || userAns.some(ans => typeof ans !== 'string')) {
        results[question.id] = {
          overall: 'Incorrect. Try again.',
          details: [`Invalid answers: Expected ${question.blanks} strings, got ${userAns ? userAns.length : 0} items`],
          blanks: []
        };
        continue;
      }

      const inputData = JSON.stringify({
        question: question.text,
        userAnswers: userAns,
        blanks: question.blanks,
        correctAnswers: question.correctAnswers
      });

      const pythonScript = path.resolve(__dirname, '.', 'evaluate.py');
      const python = spawn(PYTHON_PATH, [pythonScript]);

      let stdoutData = '';
      let stderrData = '';

      python.stdin.write(inputData);
      python.stdin.end();

      python.stdout.on('data', (data) => { stdoutData += data.toString(); });
      python.stderr.on('data', (data) => { stderrData += data.toString(); });

      await new Promise((resolve) => {
        python.on('error', (error) => {
          console.error(`Python error for Q${question.id}:`, error.message);
          results[question.id] = {
            overall: 'Error evaluating answers.',
            details: [`Python process failed: ${error.message}`],
            blanks: []
          };
          resolve();
        });

        python.on('close', (code) => {
          const output = stdoutData.trim() || stderrData.trim();
          console.log(`Python output for Q${question.id} (code ${code}): ${output.substring(0, 200)}...`);

          if (code !== 0) {
            try {
              const parsedError = JSON.parse(output);
              results[question.id] = {
                overall: parsedError.overall || 'Error evaluating answers.',
                details: parsedError.details ? [parsedError.details] : [`Python script failed: ${output}`],
                blanks: parsedError.blanks || []
              };
            } catch {
              results[question.id] = {
                overall: 'Error evaluating answers.',
                details: [`Python script failed with code ${code}: ${output || 'No output'}`],
                blanks: []
              };
            }
            return resolve();
          }

          try {
            const parsed = JSON.parse(output);
            const details = parsed.blanks.map((blank, idx) =>
              `Blank ${idx + 1}: ${blank.isCorrect ? 'Correct' : `Incorrect. Correct: ${blank.correctAnswers}`}`
            );
            results[question.id] = {
              overall: parsed.overall,
              details,
              blanks: parsed.blanks
            };
          } catch (parseError) {
            console.error(`Parse error for Q${question.id}: ${parseError.message}, Output: ${output}`);
            results[question.id] = {
              overall: 'Error evaluating answers.',
              details: [`Unable to parse response: ${parseError.message}. Raw output: ${output}`],
              blanks: []
            };
          }
          resolve();
        });
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: `Server error occurred: ${error.message}` });
  }
};
