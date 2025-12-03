import React, { createContext, useContext, useState, useEffect } from 'react'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const [patients, setPatients] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('patients')
        return saved ? JSON.parse(saved) : []
      } catch (e) {
        return []
      }
    }
    return []
  })

  const [studies, setStudies] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('studies')
        return saved ? JSON.parse(saved) : []
      } catch (e) {
        return []
      }
    }
    return []
  })

  const [reports, setReports] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('reports')
        return saved ? JSON.parse(saved) : []
      } catch (e) {
        return []
      }
    }
    return []
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('patients', JSON.stringify(patients))
      } catch (e) {
        console.warn('Failed to save patients to localStorage:', e)
      }
    }
  }, [patients])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('studies', JSON.stringify(studies))
      } catch (e) {
        console.warn('Failed to save studies to localStorage:', e)
      }
    }
  }, [studies])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('reports', JSON.stringify(reports))
      } catch (e) {
        console.warn('Failed to save reports to localStorage:', e)
      }
    }
  }, [reports])

  const addPatient = (patient) => {
    const newPatient = {
      id: Date.now().toString(),
      ...patient,
      createdAt: new Date().toISOString()
    }
    setPatients(prev => [newPatient, ...prev])
    return newPatient
  }

  const updatePatient = (id, updates) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const addStudy = (study) => {
    const newStudy = {
      id: Date.now().toString(),
      ...study,
      uploadedAt: new Date().toISOString()
    }
    setStudies(prev => [newStudy, ...prev])
    return newStudy
  }

  const addReport = (report) => {
    const newReport = {
      id: Date.now().toString(),
      version: 1,
      history: [],
      ...report,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setReports(prev => [newReport, ...prev])
    return newReport
  }

  const updateReport = (id, updates) => {
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        const historyEntry = {
          version: r.version,
          data: { ...r },
          updatedAt: r.updatedAt
        }
        return {
          ...r,
          ...updates,
          version: r.version + 1,
          history: [...(r.history || []), historyEntry],
          updatedAt: new Date().toISOString()
        }
      }
      return r
    }))
  }

  const getPatientStudies = (patientId) => {
    return studies.filter(s => s.patientId === patientId)
  }

  const getStudyReports = (studyId) => {
    return reports.filter(r => r.studyId === studyId)
  }

  return (
    <DataContext.Provider value={{
      patients,
      studies,
      reports,
      addPatient,
      updatePatient,
      addStudy,
      addReport,
      updateReport,
      getPatientStudies,
      getStudyReports
    }}>
      {children}
    </DataContext.Provider>
  )
}

