const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  studyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study',
    required: [true, 'Study ID is required']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
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

