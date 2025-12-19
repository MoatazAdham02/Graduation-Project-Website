const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  studyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study',
    required: false // Make optional so reports can be created even without study
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: false // Make optional so reports can be created even without patient
  },
  patientName: {
    type: String,
    trim: true
  },
  patientDateOfBirth: {
    type: Date
  },
  patientGender: {
    type: String,
    trim: true
  },
  patientAge: {
    type: String,
    trim: true
  },
  studyDate: {
    type: Date
  },
  studyTime: {
    type: String,
    trim: true
  },
  modality: {
    type: String,
    trim: true
  },
  studyDescription: {
    type: String,
    trim: true
  },
  bodyPartExamined: {
    type: String,
    trim: true
  },
  institutionName: {
    type: String,
    trim: true
  },
  studyInstanceUID: {
    type: String,
    trim: true
  },
  reportId: {
    type: String,
    required: [true, 'Report ID is required'],
    unique: true,
    trim: true
  },
  findings: [{
    title: {
      type: String,
      required: [true, 'Finding title is required']
    },
    value: {
      type: String,
      required: [true, 'Finding value is required']
    },
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical'],
      default: 'normal'
    }
  }],
  recommendations: [{
    type: String,
    trim: true
  }],
  physicianName: {
    type: String,
    trim: true
  },
  physicianTitle: {
    type: String,
    trim: true
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for faster queries
reportSchema.index({ studyId: 1 });
reportSchema.index({ patientId: 1 });
reportSchema.index({ reportId: 1 });
reportSchema.index({ reportDate: -1 });

module.exports = mongoose.model('Report', reportSchema);

