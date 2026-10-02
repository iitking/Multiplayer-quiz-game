import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  duration: { type: Number, default: 15 }, // seconds
  imageUrl: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  explanation: { type: String, default: '' }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  createdBy: { type: String, default: 'System' },
  creatorId: { type: String, default: null },
  isPublic: { type: Boolean, default: true },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const QuizModel = mongoose.model('Quiz', quizSchema);
