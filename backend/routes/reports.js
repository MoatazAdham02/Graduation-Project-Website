const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { patientId, studyId } = req.query;
    const query = {};

    if (patientId) {
      query.patientId = patientId;
    }

    if (studyId) {
      query.studyId = studyId;
    }

    const reports = await Report.find(query)
      .populate('patientId', 'name patientId')
      .populate('studyId', 'studyId modality studyDate')
      .populate('createdBy', 'firstName lastName email')
      .sort({ reportDate: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('patientId')
      .populate('studyId')
      .populate('createdBy', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// @route   POST /api/reports
// @desc    Create new report
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      createdBy: req.user._id
    };

    const report = new Report(reportData);
    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate('patientId')
      .populate('studyId')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json(populatedReport);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Report ID already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('patientId')
      .populate('studyId')
      .populate('createdBy', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Report not found' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Report not found' });
    }
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

module.exports = router;

