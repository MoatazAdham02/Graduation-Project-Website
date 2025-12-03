import React, { useMemo } from 'react'
import { useData } from '../context/DataContext'
import Navigation from '../components/Navigation'
import { format, subDays, startOfDay } from 'date-fns'
import './Analytics.css'
import { FiTrendingUp, FiUsers, FiFileText, FiActivity, FiBarChart2 } from 'react-icons/fi'

const Analytics = () => {
  const { patients, studies, reports } = useData()

  const stats = useMemo(() => {
    const totalPatients = patients.length
    const totalStudies = studies.length
    const totalReports = reports.length
    const activePatients = patients.filter(p => p.status === 'active').length

    // Studies by modality
    const studiesByModality = studies.reduce((acc, study) => {
      const modality = study.modality || 'Unknown'
      acc[modality] = (acc[modality] || 0) + 1
      return acc
    }, {})

    // Studies in last 7 days
    const sevenDaysAgo = startOfDay(subDays(new Date(), 7))
    const recentStudies = studies.filter(s => 
      new Date(s.uploadedAt) >= sevenDaysAgo
    ).length

    // Reports by status
    const reportsByStatus = reports.reduce((acc, report) => {
      const status = report.findings?.some(f => f.status === 'critical') ? 'critical' :
                     report.findings?.some(f => f.status === 'warning') ? 'warning' : 'normal'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Daily studies for last 7 days
    const dailyStudies = []
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i))
      const count = studies.filter(s => {
        const studyDate = startOfDay(new Date(s.uploadedAt))
        return studyDate.getTime() === date.getTime()
      }).length
      dailyStudies.push({ date, count })
    }

    return {
      totalPatients,
      activePatients,
      totalStudies,
      totalReports,
      recentStudies,
      studiesByModality,
      reportsByStatus,
      dailyStudies
    }
  }, [patients, studies, reports])

  const maxDailyCount = Math.max(...stats.dailyStudies.map(d => d.count), 1)

  return (
    <div className="page-container">
      <Navigation />
      <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(102, 126, 234, 0.1)', color: '#667eea' }}>
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPatients}</h3>
            <p>Total Patients</p>
            <span className="stat-subtitle">{stats.activePatients} active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(40, 167, 69, 0.1)', color: '#28a745' }}>
            <FiFileText />
          </div>
          <div className="stat-content">
            <h3>{stats.totalStudies}</h3>
            <p>Total Studies</p>
            <span className="stat-subtitle">{stats.recentStudies} in last 7 days</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
            <FiActivity />
          </div>
          <div className="stat-content">
            <h3>{stats.totalReports}</h3>
            <p>Total Reports</p>
            <span className="stat-subtitle">Generated</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>{stats.reportsByStatus.critical || 0}</h3>
            <p>Critical Reports</p>
            <span className="stat-subtitle">Requires attention</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>Studies by Modality</h2>
          <div className="modality-chart">
            {Object.entries(stats.studiesByModality).map(([modality, count]) => {
              const percentage = (count / stats.totalStudies) * 100
              return (
                <div key={modality} className="modality-item">
                  <div className="modality-header">
                    <span className="modality-name">{modality}</span>
                    <span className="modality-count">{count}</span>
                  </div>
                  <div className="modality-bar">
                    <div 
                      className="modality-fill" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="chart-card">
          <h2>Daily Studies (Last 7 Days)</h2>
          <div className="daily-chart">
            {stats.dailyStudies.map((day, idx) => {
              const height = (day.count / maxDailyCount) * 100
              return (
                <div key={idx} className="daily-bar-container">
                  <div 
                    className="daily-bar" 
                    style={{ height: `${height}%` }}
                    title={`${day.count} studies`}
                  >
                    <span className="daily-count">{day.count}</span>
                  </div>
                  <span className="daily-label">
                    {format(day.date, 'EEE')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="reports-breakdown">
        <div className="chart-card">
          <h2>Reports by Status</h2>
          <div className="status-breakdown">
            <div className="status-item">
              <div className="status-indicator normal"></div>
              <span className="status-label">Normal</span>
              <span className="status-count">{stats.reportsByStatus.normal || 0}</span>
            </div>
            <div className="status-item">
              <div className="status-indicator warning"></div>
              <span className="status-label">Warning</span>
              <span className="status-count">{stats.reportsByStatus.warning || 0}</span>
            </div>
            <div className="status-item">
              <div className="status-indicator critical"></div>
              <span className="status-label">Critical</span>
              <span className="status-count">{stats.reportsByStatus.critical || 0}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Analytics

