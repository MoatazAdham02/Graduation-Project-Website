import React from 'react'
import Navigation from '../components/Navigation'
import { FiFacebook, FiInstagram, FiYoutube, FiHeart, FiActivity, FiShield, FiUsers } from 'react-icons/fi'
import './About.css'

const About = () => {
  return (
    <div className="page-container">
      <Navigation />
      <div className="about-page">
        <div className="about-header">
          <h1>About Medical DICOM</h1>
          <p className="about-subtitle">Advanced Medical Imaging Management System</p>
        </div>

        <div className="about-content">
          <section className="about-section">
            <div className="section-icon">
              <FiHeart />
            </div>
            <h2>Our Purpose</h2>
            <p>
              Medical DICOM is a comprehensive web-based platform designed to revolutionize how healthcare 
              professionals manage, analyze, and report on medical imaging studies. Our mission is to provide 
              doctors and radiologists with powerful tools to efficiently process DICOM files, generate 
              detailed medical reports, and maintain comprehensive patient records.
            </p>
            <p>
              We understand the critical importance of accurate medical imaging analysis in patient care. 
              That's why we've built a system that combines cutting-edge technology with intuitive design, 
              making it easier for medical professionals to focus on what matters most - patient health.
            </p>
          </section>

          <section className="about-section">
            <div className="section-icon">
              <FiActivity />
            </div>
            <h2>Key Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>DICOM File Management</h3>
                <p>Upload, view, and analyze DICOM medical imaging files with advanced visualization tools.</p>
              </div>
              <div className="feature-card">
                <h3>Patient Management</h3>
                <p>Comprehensive patient record system with secure data storage and easy access to medical history.</p>
              </div>
              <div className="feature-card">
                <h3>Medical Reports</h3>
                <p>Generate detailed medical reports with findings, recommendations, and export capabilities (PDF, Print).</p>
              </div>
              <div className="feature-card">
                <h3>Analytics Dashboard</h3>
                <p>Track and analyze medical data with visual insights and statistical reports.</p>
              </div>
              <div className="feature-card">
                <h3>Secure & Private</h3>
                <p>Each doctor has isolated access to their own patients and reports, ensuring complete privacy.</p>
              </div>
              <div className="feature-card">
                <h3>User-Friendly Interface</h3>
                <p>Modern, intuitive design that makes complex medical data management simple and efficient.</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <div className="section-icon">
              <FiShield />
            </div>
            <h2>Security & Privacy</h2>
            <p>
              We take data security and patient privacy seriously. Our platform implements robust authentication 
              systems, encrypted data transmission, and ensures that each healthcare professional only has 
              access to their own patient records and reports. All data is stored securely and complies with 
              medical data protection standards.
            </p>
          </section>

          <section className="about-section">
            <div className="section-icon">
              <FiUsers />
            </div>
            <h2>Who We Serve</h2>
            <p>
              Medical DICOM is designed for healthcare professionals including:
            </p>
            <ul className="served-list">
              <li>Radiologists analyzing medical imaging studies</li>
              <li>Doctors managing patient records and medical reports</li>
              <li>Medical facilities requiring efficient DICOM file management</li>
              <li>Healthcare institutions seeking streamlined medical data workflows</li>
            </ul>
          </section>

          <section className="about-section social-section">
            <h2>Connect With Us</h2>
            <p>Stay updated with our latest features, medical imaging insights, and healthcare technology news.</p>
            <div className="social-links">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link facebook"
                aria-label="Facebook"
              >
                <FiFacebook />
                <span>Facebook</span>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link instagram"
                aria-label="Instagram"
              >
                <FiInstagram />
                <span>Instagram</span>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link youtube"
                aria-label="YouTube"
              >
                <FiYoutube />
                <span>YouTube</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default About

