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
      const matchesSearch = 
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterStatus === 'all' || patient.status === filterStatus
      
      return matchesSearch && matchesFilter
    })
  }, [patients, searchTerm, filterStatus])

  const getPatientStudies = (patientId) => {
    return studies.filter(s => s.patientId === patientId)
  }

  const handleAddPatient = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newPatient = {
      name: formData.get('name'),
      id: formData.get('id'),
      email: formData.get('email'),
      dateOfBirth: formData.get('dob'),
      gender: formData.get('gender'),
      status: 'active'
    }
    addPatient(newPatient)
    setShowAddModal(false)
    e.target.reset()
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
            const patientStudies = getPatientStudies(patient.id)
            const recentStudy = patientStudies.sort((a, b) => 
              new Date(b.uploadedAt) - new Date(a.uploadedAt)
            )[0]

            return (
              <div 
                key={patient.id} 
                className="patient-card"
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="patient-header">
                  <div className="patient-avatar">
                    <FiUser />
                  </div>
                  <div className="patient-info">
                    <h3>{patient.name || 'Unknown'}</h3>
                    <p className="patient-id">ID: {patient.id}</p>
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
                  <label>Date of Birth</label>
                  <input type="date" name="dob" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender">
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
              {getPatientStudies(selectedPatient.id).map(study => (
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

