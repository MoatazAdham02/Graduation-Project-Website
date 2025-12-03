import React, { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import Navigation from '../components/Navigation'
import { format } from 'date-fns'
import './PatientManagement.css'
import { FiSearch, FiFilter, FiPlus, FiCalendar, FiUser } from 'react-icons/fi'

const PatientManagement = () => {
  const { patients, studies, addPatient } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const patientId = patient.patientId || patient._id || patient.id
      const matchesSearch = 
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patientId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterStatus === 'all' || patient.status === filterStatus
      
      return matchesSearch && matchesFilter
    })
  }, [patients, searchTerm, filterStatus])

  const getPatientStudies = (patientId) => {
    return studies.filter(s => s.patientId === patientId)
  }

  const handleAddPatient = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData(e.target)
      const dob = formData.get('dob')
      const gender = formData.get('gender')
      
      // Validate required fields
      if (!dob || !gender) {
        alert('Please fill in all required fields (Date of Birth and Gender)')
        return
      }
      
      const newPatient = {
        name: formData.get('name'),
        patientId: formData.get('id'), // Backend expects 'patientId', not 'id'
        email: formData.get('email') || undefined,
        dateOfBirth: dob,
        gender: gender,
        status: 'active'
      }
      
      await addPatient(newPatient)
      setShowAddModal(false)
      e.target.reset()
    } catch (error) {
      console.error('Error adding patient:', error)
      alert(error.message || 'Failed to add patient. Please try again.')
    }
  }

  return (
    <div className="page-container">
      <Navigation />
      <div className="patient-management">
      <div className="page-header">
        <h1>Patient Management</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>
          <FiPlus /> Add Patient
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search patients by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FiFilter />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="patients-grid">
        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <FiUser size={48} />
            <p>No patients found</p>
            <button onClick={() => setShowAddModal(true)}>Add First Patient</button>
          </div>
        ) : (
          filteredPatients.map(patient => {
            const patientId = patient.patientId || patient._id || patient.id
            const patientStudies = getPatientStudies(patientId)
            const recentStudy = patientStudies.sort((a, b) => 
              new Date(b.uploadedAt) - new Date(a.uploadedAt)
            )[0]

            return (
              <div 
                key={patient._id || patient.patientId || patient.id} 
                className="patient-card"
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="patient-header">
                  <div className="patient-avatar">
                    <FiUser />
                  </div>
                  <div className="patient-info">
                    <h3>{patient.name || 'Unknown'}</h3>
                    <p className="patient-id">ID: {patient.patientId || patient._id || patient.id}</p>
                  </div>
                  <span className={`status-badge ${patient.status || 'active'}`}>
                    {patient.status || 'active'}
                  </span>
                </div>
                <div className="patient-details">
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{patient.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">DOB:</span>
                    <span className="value">{patient.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Gender:</span>
                    <span className="value">{patient.gender || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Studies:</span>
                    <span className="value">{patientStudies.length}</span>
                  </div>
                </div>
                {recentStudy && (
                  <div className="recent-study">
                    <FiCalendar />
                    <span>Last study: {format(new Date(recentStudy.uploadedAt), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Patient</h2>
            <form onSubmit={handleAddPatient}>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" name="name" required />
              </div>
              <div className="form-group">
                <label>Patient ID *</label>
                <input type="text" name="id" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input type="date" name="dob" required />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select name="gender" required>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit">Add Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="patient-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Patient History: {selectedPatient.name}</h2>
            <div className="patient-timeline">
              {getPatientStudies(selectedPatient.patientId || selectedPatient._id || selectedPatient.id).map(study => (
                <div key={study.id} className="timeline-item">
                  <div className="timeline-date">
                    {format(new Date(study.uploadedAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div className="timeline-content">
                    <h4>{study.modality || 'CT Scan'}</h4>
                    <p>{study.description || 'Medical imaging study'}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="close-modal" onClick={() => setSelectedPatient(null)}>Close</button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default PatientManagement

