const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');

// @route   GET /api/patients
// @desc    Get all patients for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {
      createdBy: req.user._id // Only get patients created by the logged-in user
    };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get single patient
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      createdBy: req.user._id // Only allow access to own patients
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      createdBy: req.user._id // Link patient to the logged-in user
    };
    
    const patient = new Patient(patientData);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Patient ID already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    // First check if patient exists and belongs to the user
    const existingPatient = await Patient.findById(req.params.id);
    
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if the patient belongs to the logged-in user
    if (existingPatient.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this patient' });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(patient);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // First check if patient exists and belongs to the user
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if the patient belongs to the logged-in user
    if (patient.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this patient' });
    }

    await Patient.findByIdAndDelete(req.params.id);

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;

