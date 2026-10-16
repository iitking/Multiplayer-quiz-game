import express from 'express';
import { DataStore } from '../services/dataStore.js';

const router = express.Router();

// GET recent game histories
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const history = await DataStore.getGameHistories(limit);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET game history by ID
router.get('/:id', async (req, res) => {
  try {
    const histories = await DataStore.getGameHistories(100);
    const item = histories.find(h => (h.id === req.params.id || h._id === req.params.id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Game record not found' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
