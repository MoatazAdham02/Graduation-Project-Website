import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiHeart, FiActivity, FiShield, FiUsers, FiFileText, FiBarChart2, 
  FiArrowRight, FiFacebook, FiInstagram, FiYoutube, FiCheck, 
  FiTrendingUp, FiClock, FiAward, FiZap
} from 'react-icons/fi'
import './HomePage.css'

const HomePage = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState({})
  const [stats, setStats] = useState({ patients: 0, studies: 0, reports: 0 })
  const [activeSection, setActiveSection] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const sectionsRef = useRef({})

  useEffect(() => {
    // Set hero as visible immediately
    setIsVisible(prev => ({ ...prev, hero: true }))

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, [entry.target.id]: true }))
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    Object.values(sectionsRef.current).forEach(section => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80 // Account for sticky navbar
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      setIsMobileMenuOpen(false)
    }
  }

  const navLinks = [
    { id: 'features', label: 'Features' },
    { id: 'about', label: 'About' },
    { id: 'serve', label: 'Who We Serve' },
    { id: 'security', label: 'Security' },
    { id: 'cta', label: 'Get Started' }
  ]

  useEffect(() => {
    if (isVisible.stats) {
      const duration = 2000
      const steps = 60
      const interval = duration / steps

      const counters = {
        patients: { target: 10000, current: 0 },
        studies: { target: 50000, current: 0 },
        reports: { target: 25000, current: 0 }
      }

      const timer = setInterval(() => {
        let allComplete = true
        Object.keys(counters).forEach(key => {
          if (counters[key].current < counters[key].target) {
            const increment = (counters[key].target / steps)
            counters[key].current = Math.min(
              counters[key].current + increment,
              counters[key].target
            )
            allComplete = false
          }
        })

        setStats({
          patients: Math.floor(counters.patients.current),
          studies: Math.floor(counters.studies.current),
          reports: Math.floor(counters.reports.current)
        })

        if (allComplete) clearInterval(timer)
      }, interval)

      return () => clearInterval(timer)
    }
  }, [isVisible.stats])

  return (
    <div className="homepage">
      {/* Top Announcement Bar */}
      <div className="top-announcement">
        <div className="container">
          <div className="announcement-content">
            <div className="announcement-text">
              <FiZap />
              <span>New: AI-Powered DICOM Analysis Now Available</span>
            </div>
            <button className="announcement-link" onClick={() => navigate('/register')}>
              Learn More <FiArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className={`homepage-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-content">
            <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <h2>Plaqio</h2>
              <span className="nav-tagline">Detect. Analyze. Monitor</span>
            </div>
            <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              {navLinks.map(link => (
                <button
                  key={link.id}
                  className={`nav-link ${activeSection === link.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(link.id)}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="nav-actions">
              <button 
                className="nav-btn nav-btn-secondary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
              <button 
                className="nav-btn nav-btn-primary"
                onClick={() => navigate('/register')}
              >
                Get Started
              </button>
              <button 
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="gradient-orb orb-4"></div>
          <div className="grid-pattern"></div>
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                '--delay': `${i * 0.1}s`,
                '--x': `${Math.random() * 100}%`,
                '--y': `${Math.random() * 100}%`
              }}></div>
            ))}
          </div>
        </div>
        <div className="hero-content">
          <div className={`hero-text ${isVisible.hero ? 'fade-in-up' : ''}`}>
            <div className="hero-badge">
              <FiZap />
              <span>Trusted by Healthcare Professionals Worldwide</span>
            </div>
            <p className="hero-tagline">Detect. Analyze. Monitor</p>
            <h1 className="hero-title">
              Advanced Medical Imaging<br />
              <span className="gradient-text">Management System</span>
            </h1>
            <p className="hero-description">
              Empowering healthcare professionals with powerful tools to efficiently process DICOM files, 
              generate detailed medical reports, and maintain comprehensive patient records. 
              Streamline your workflow and enhance patient care with cutting-edge technology.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn btn-primary btn-pulse"
                onClick={() => navigate('/register')}
              >
                Get Started Free
                <FiArrowRight />
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
            <div className="hero-features">
              <div className="hero-feature">
                <FiCheck />
                <span>No credit card required</span>
              </div>
              <div className="hero-feature">
                <FiCheck />
                <span>14-day free trial</span>
              </div>
              <div className="hero-feature">
                <FiCheck />
                <span>HIPAA compliant</span>
              </div>
              <div className="hero-feature">
                <FiCheck />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <FiActivity />
            <span>DICOM Viewer</span>
            <small>Advanced Tools</small>
          </div>
          <div className="floating-card card-2">
            <FiFileText />
            <span>Reports</span>
            <small>Auto Generated</small>
          </div>
          <div className="floating-card card-3">
            <FiBarChart2 />
            <span>Analytics</span>
            <small>Real-time Data</small>
          </div>
          <div className="floating-card card-4">
            <FiShield />
            <span>Security</span>
            <small>HIPAA Compliant</small>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="trust-indicators">
            <div className="trust-item">
              <FiAward />
              <span>Industry Leading</span>
            </div>
            <div className="trust-item">
              <FiUsers />
              <span>10,000+ Users</span>
            </div>
            <div className="trust-item">
              <FiShield />
              <span>100% Secure</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section 
        id="stats" 
        ref={el => sectionsRef.current.stats = el}
        className={`stats-section ${isVisible.stats ? 'fade-in-up' : ''}`}
      >
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FiUsers />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.patients.toLocaleString()}+</div>
                <div className="stat-label">Active Patients</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FiActivity />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.studies.toLocaleString()}+</div>
                <div className="stat-label">Studies Processed</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FiFileText />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.reports.toLocaleString()}+</div>
                <div className="stat-label">Reports Generated</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        ref={el => sectionsRef.current.features = el}
        className={`features-section ${isVisible.features ? 'fade-in-up' : ''}`}
      >
        <div className="container">
          <div className={`section-header ${isVisible.features ? 'fade-in-up' : ''}`}>
            <span className="section-badge">Features</span>
            <h2>Powerful Tools for Medical Professionals</h2>
            <p>Everything you need to manage medical imaging studies efficiently</p>
          </div>
          <div className="features-grid">
            <div className={`feature-card ${isVisible.features ? 'slide-in-left' : ''}`} style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon">
                <FiActivity />
              </div>
              <h3>DICOM File Management</h3>
              <p>Upload, view, and analyze DICOM medical imaging files with advanced visualization tools and annotation capabilities.</p>
              <div className="feature-link">
                Learn more <FiArrowRight />
              </div>
            </div>
            <div className={`feature-card ${isVisible.features ? 'slide-in-up' : ''}`} style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon">
                <FiUsers />
              </div>
              <h3>Patient Management</h3>
              <p>Comprehensive patient record system with secure data storage and easy access to complete medical history.</p>
              <div className="feature-link">
                Learn more <FiArrowRight />
              </div>
            </div>
            <div className={`feature-card ${isVisible.features ? 'slide-in-right' : ''}`} style={{ animationDelay: '0.3s' }}>
              <div className="feature-icon">
                <FiFileText />
              </div>
              <h3>Medical Reports</h3>
              <p>Generate detailed medical reports with findings, recommendations, and export capabilities (PDF, Print).</p>
              <div className="feature-link">
                Learn more <FiArrowRight />
              </div>
            </div>
            <div className={`feature-card ${isVisible.features ? 'slide-in-left' : ''}`} style={{ animationDelay: '0.4s' }}>
              <div className="feature-icon">
                <FiBarChart2 />
              </div>
              <h3>Analytics Dashboard</h3>
              <p>Track and analyze medical data with visual insights and statistical reports for better decision-making.</p>
              <div className="feature-link">
                Learn more <FiArrowRight />
              </div>
            </div>
            <div className={`feature-card ${isVisible.features ? 'slide-in-up' : ''}`} style={{ animationDelay: '0.5s' }}>
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Secure & Private</h3>
              <p>Each healthcare professional has isolated access to their own patients and reports, ensuring complete privacy.</p>
              <div className="feature-link">
                Learn more <FiArrowRight />
              </div>
            </div>
            <div className={`feature-card ${isVisible.features ? 'slide-in-right' : ''}`} style={{ animationDelay: '0.6s' }}>
              <div className="feature-icon">
                <FiHeart />
              </div>
              <h3>User-Friendly Interface</h3>
              <p>Modern, intuitive design that makes complex medical data management simple and efficient.</p>
              <div className="feature-link">
                Learn more <FiArrowRight />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section 
        id="about" 
        ref={el => sectionsRef.current.about = el}
        className={`about-section ${isVisible.about ? 'fade-in-up' : ''}`}
      >
        <div className="container">
          <div className="about-content">
            <div className={`about-visual ${isVisible.about ? 'slide-in-left' : ''}`}>
              <div className={`about-card ${isVisible.about ? 'scale-in' : ''}`} style={{ animationDelay: '0.2s' }}>
                <FiAward />
                <h4>Industry Leading</h4>
                <p>Trusted by top medical institutions</p>
              </div>
              <div className={`about-card ${isVisible.about ? 'scale-in' : ''}`} style={{ animationDelay: '0.4s' }}>
                <FiClock />
                <h4>24/7 Support</h4>
                <p>Always here when you need us</p>
              </div>
            </div>
            <div className={`about-text ${isVisible.about ? 'slide-in-right' : ''}`}>
              <span className="section-badge">About Us</span>
              <h2>Our Purpose</h2>
              <p>
                Plaqio is a comprehensive web-based platform designed to revolutionize how healthcare 
                professionals manage, analyze, and report on medical imaging studies. Our mission is to provide 
                doctors and radiologists with powerful tools to efficiently process DICOM files, generate 
                detailed medical reports, and maintain comprehensive patient records.
              </p>
              <p>
                We understand the critical importance of accurate medical imaging analysis in patient care. 
                That's why we've built a system that combines cutting-edge technology with intuitive design, 
                making it easier for medical professionals to focus on what matters most - patient health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section 
        id="serve" 
        ref={el => sectionsRef.current.serve = el}
        className={`serve-section ${isVisible.serve ? 'fade-in-up' : ''}`}
      >
        <div className="container">
          <div className={`section-header ${isVisible.serve ? 'fade-in-up' : ''}`}>
            <span className="section-badge">Who We Serve</span>
            <h2>Designed for Healthcare Excellence</h2>
            <p className="serve-subtitle">Plaqio is designed for healthcare professionals including:</p>
          </div>
          <div className="serve-list">
            <div className={`serve-item ${isVisible.serve ? 'slide-in-left' : ''}`} style={{ animationDelay: '0.1s' }}>
              <div className="serve-icon">
                <FiUsers />
              </div>
              <span>Radiologists analyzing medical imaging studies</span>
            </div>
            <div className={`serve-item ${isVisible.serve ? 'slide-in-right' : ''}`} style={{ animationDelay: '0.2s' }}>
              <div className="serve-icon">
                <FiFileText />
              </div>
              <span>Doctors managing patient records and medical reports</span>
            </div>
            <div className={`serve-item ${isVisible.serve ? 'slide-in-left' : ''}`} style={{ animationDelay: '0.3s' }}>
              <div className="serve-icon">
                <FiActivity />
              </div>
              <span>Medical facilities requiring efficient DICOM file management</span>
            </div>
            <div className={`serve-item ${isVisible.serve ? 'slide-in-right' : ''}`} style={{ animationDelay: '0.4s' }}>
              <div className="serve-icon">
                <FiBarChart2 />
              </div>
              <span>Healthcare institutions seeking streamlined medical data workflows</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section 
        id="security" 
        ref={el => sectionsRef.current.security = el}
        className={`security-section ${isVisible.security ? 'fade-in-up' : ''}`}
      >
        <div className="container">
          <div className="security-content">
            <div className={`security-icon ${isVisible.security ? 'scale-in-rotate' : ''}`}>
              <FiShield />
            </div>
            <span className={`section-badge ${isVisible.security ? 'fade-in-up' : ''}`} style={{ animationDelay: '0.2s' }}>Security</span>
            <h2 className={isVisible.security ? 'fade-in-up' : ''} style={{ animationDelay: '0.3s' }}>Security & Privacy</h2>
            <p className={isVisible.security ? 'fade-in-up' : ''} style={{ animationDelay: '0.4s' }}>
              We take data security and patient privacy seriously. Our platform implements robust authentication 
              systems, encrypted data transmission, and ensures that each healthcare professional only has 
              access to their own patient records and reports. All data is stored securely and complies with 
              medical data protection standards.
            </p>
            <div className={`security-features ${isVisible.security ? 'fade-in-up' : ''}`} style={{ animationDelay: '0.5s' }}>
              <div className="security-feature">
                <FiCheck />
                <span>HIPAA Compliant</span>
              </div>
              <div className="security-feature">
                <FiCheck />
                <span>End-to-End Encryption</span>
              </div>
              <div className="security-feature">
                <FiCheck />
                <span>Regular Security Audits</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        id="cta" 
        ref={el => sectionsRef.current.cta = el}
        className={`cta-section ${isVisible.cta ? 'fade-in-up' : ''}`}
      >
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join healthcare professionals who trust Plaqio for their medical imaging needs</p>
          <div className="cta-buttons">
            <button 
              className="btn btn-primary btn-large btn-pulse"
              onClick={() => navigate('/register')}
            >
              Create Free Account
              <FiArrowRight />
            </button>
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Plaqio</h3>
              <p>Detect. Analyze. Monitor</p>
              <p className="footer-description">
                Advanced Medical Imaging Management System for Healthcare Professionals
              </p>
            </div>
            <div className="footer-social">
              <h4>Connect With Us</h4>
              <div className="social-links">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Facebook"
                >
                  <FiFacebook />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Instagram"
                >
                  <FiInstagram />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="YouTube"
                >
                  <FiYoutube />
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Plaqio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
