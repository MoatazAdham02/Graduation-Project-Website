import React, { createContext, useContext, useState, useEffect } from 'react'
import { patientsAPI, studiesAPI, reportsAPI } from '../services/api'
import { useAuth } from './AuthContext'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [patients, setPatients] = useState([])
  const [studies, setStudies] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)

  // Load data from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData()
    } else {
      // Clear data when logged out
      setPatients([])
      setStudies([])
      setReports([])
    }
  }, [isAuthenticated])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [patientsData, studiesData, reportsData] = await Promise.all([
        patientsAPI.getAll().catch(() => []),
        studiesAPI.getAll().catch(() => []),
        reportsAPI.getAll().catch(() => [])
      ])
      
      setPatients(patientsData || [])
      setStudies(studiesData || [])
      setReports(reportsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPatient = async (patient) => {
    try {
      const newPatient = await patientsAPI.create(patient)
      setPatients(prev => [newPatient, ...prev])
      return newPatient
    } catch (error) {
      console.error('Failed to create patient:', error)
      throw error
    }
  }

  const updatePatient = async (id, updates) => {
    try {
      const updatedPatient = await patientsAPI.update(id, updates)
      setPatients(prev => prev.map(p => p._id === id ? updatedPatient : p))
      return updatedPatient
    } catch (error) {
      console.error('Failed to update patient:', error)
      throw error
    }
  }

  const deletePatient = async (id) => {
    try {
      await patientsAPI.delete(id)
      setPatients(prev => prev.filter(p => p._id !== id))
    } catch (error) {
      console.error('Failed to delete patient:', error)
      throw error
    }
  }

  const addStudy = async (study) => {
    try {
      const newStudy = await studiesAPI.create(study)
      setStudies(prev => [newStudy, ...prev])
      return newStudy
    } catch (error) {
      console.error('Failed to create study:', error)
      throw error
    }
  }

  const updateStudy = async (id, updates) => {
    try {
      const updatedStudy = await studiesAPI.update(id, updates)
      setStudies(prev => prev.map(s => s._id === id ? updatedStudy : s))
      return updatedStudy
    } catch (error) {
      console.error('Failed to update study:', error)
      throw error
    }
  }

  const deleteStudy = async (id) => {
    try {
      await studiesAPI.delete(id)
      setStudies(prev => prev.filter(s => s._id !== id))
    } catch (error) {
      console.error('Failed to delete study:', error)
      throw error
    }
  }

  const addReport = async (report) => {
    try {
      const newReport = await reportsAPI.create(report)
      setReports(prev => [newReport, ...prev])
      return newReport
    } catch (error) {
      console.error('Failed to create report:', error)
      throw error
    }
  }

  const updateReport = async (id, updates) => {
    try {
      const updatedReport = await reportsAPI.update(id, updates)
      setReports(prev => prev.map(r => r._id === id ? updatedReport : r))
      return updatedReport
    } catch (error) {
      console.error('Failed to update report:', error)
      throw error
    }
  }

  const deleteReport = async (id) => {
    try {
      await reportsAPI.delete(id)
      setReports(prev => prev.filter(r => r._id !== id))
    } catch (error) {
      console.error('Failed to delete report:', error)
      throw error
    }
  }

  const getPatientStudies = (patientId) => {
    return studies.filter(s => {
      const pid = s.patientId?._id || s.patientId
      return pid === patientId || pid?.toString() === patientId?.toString()
    })
  }

  const getStudyReports = (studyId) => {
    return reports.filter(r => {
      const sid = r.studyId?._id || r.studyId
      return sid === studyId || sid?.toString() === studyId?.toString()
    })
  }

  return (
    <DataContext.Provider value={{
      patients,
      studies,
      reports,
      loading,
      addPatient,
      updatePatient,
      deletePatient,
      addStudy,
      updateStudy,
      deleteStudy,
      addReport,
      updateReport,
      deleteReport,
      getPatientStudies,
      getStudyReports,
      refreshData: loadAllData
    }}>
      {children}
    </DataContext.Provider>
  )
}

