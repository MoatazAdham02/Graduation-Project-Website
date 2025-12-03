const express = require('express');
const router = express.Router();
const Study = require('../models/Study');
const { protect } = require('../middleware/auth');

// @route   GET /api/studies
// @desc    Get all studies
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { patientId, modality } = req.query;
    const query = {};

    if (patientId) {
      query.patientId = patientId;
    }

    if (modality) {
      query.modality = modality;
    }

    const studies = await Study.find(query)
      .populate('patientId', 'name patientId')
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ uploadedAt: -1 });

    res.json(studies);
  } catch (error) {
    console.error('Get studies error:', error);
    res.status(500).json({ error: 'Failed to fetch studies' });
  }
});

// @route   GET /api/studies/:id
// @desc    Get single study
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const study = await Study.findById(req.params.id)
      .populate('patientId')
      .populate('uploadedBy', 'firstName lastName email');

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    res.json(study);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Study not found' });
    }
    res.status(500).json({ error: 'Failed to fetch study' });
  }
});

// @route   POST /api/studies
// @desc    Create new study
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const studyData = {
      ...req.body,
      uploadedBy: req.user._id
    };

    const study = new Study(studyData);
    await study.save();

    const populatedStudy = await Study.findById(study._id)
      .populate('patientId')
      .populate('uploadedBy', 'firstName lastName email');

    res.status(201).json(populatedStudy);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Study ID already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Create study error:', error);
    res.status(500).json({ error: 'Failed to create study' });
  }
});

// @route   PUT /api/studies/:id
// @desc    Update study
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const study = await Study.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('patientId')
      .populate('uploadedBy', 'firstName lastName email');

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    res.json(study);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Study not found' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Update study error:', error);
    res.status(500).json({ error: 'Failed to update study' });
  }
});

// @route   DELETE /api/studies/:id
// @desc    Delete study
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const study = await Study.findByIdAndDelete(req.params.id);

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    res.json({ message: 'Study deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Study not found' });
    }
    console.error('Delete study error:', error);
    res.status(500).json({ error: 'Failed to delete study' });
  }
});

module.exports = router;

