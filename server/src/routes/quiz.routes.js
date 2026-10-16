import express from 'express';
import { DataStore } from '../services/dataStore.js';
import { AIService } from '../services/aiService.js';

const router = express.Router();

// GET all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await DataStore.getQuizzes();
    res.json({ success: true, count: quizzes.length, data: quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET quiz by ID
router.get('/:id', async (req, res) => {
  try {
    const quiz = await DataStore.getQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    res.json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create new quiz
router.post('/', async (req, res) => {
  try {
    const { title, description, category, difficulty, questions, createdBy, creatorId } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Title and at least one question are required' });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} must have question text and at least 2 options`
        });
      }
      if (q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} must specify a valid correct answer option index`
        });
      }
    }

    const newQuiz = await DataStore.createQuiz({
      title,
      description: description || '',
      category: category || 'General',
      difficulty: difficulty || 'Medium',
      createdBy: createdBy || 'Host',
      creatorId: creatorId || null,
      questions
    });

    res.status(201).json({ success: true, data: newQuiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update existing quiz
router.put('/:id', async (req, res) => {
  try {
    const updated = await DataStore.updateQuiz(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE quiz
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await DataStore.deleteQuiz(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST AI Quiz Generator
router.post('/generate-ai', async (req, res) => {
  try {
    const { topic, count, difficulty } = req.body;
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a topic for quiz generation' });
    }

    const generated = await AIService.generateQuiz({
      topic: topic.trim(),
      count: Math.min(15, Math.max(2, Number(count) || 5)),
      difficulty: difficulty || 'Medium'
    });

    res.json({ success: true, data: generated });
  } catch (err) {
    console.error('AI generation route error:', err);
    res.status(500).json({ success: false, message: err.message || 'Quiz generation failed' });
  }
});

export default router;
