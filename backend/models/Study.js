const mongoose = require('mongoose');

const studySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  studyId: {
    type: String,
    required: [true, 'Study ID is required'],
    unique: true,
    trim: true
  },
  modality: {
    type: String,
    enum: ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'PET', 'Other'],
    required: [true, 'Modality is required']
  },
  studyDate: {
    type: Date,
    required: [true, 'Study date is required'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  bodyPart: {
    type: String,
    trim: true
  },
  files: [{
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    filePath: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dicomData: {
    width: Number,
    height: Number,
    pixelSpacing: String,
    sliceThickness: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
studySchema.index({ patientId: 1 });
studySchema.index({ studyId: 1 });
studySchema.index({ studyDate: -1 });

module.exports = mongoose.model('Study', studySchema);

