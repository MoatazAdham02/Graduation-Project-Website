import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './ForgotPassword.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      return 'Email is required'
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    
    if (emailError) {
      setError(emailError)
      return
    }

    setIsSubmitting(true)
    setError('')

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1000)
  }

  if (isSubmitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1>Check Your Email</h1>
          <p>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="instruction">
            Please check your email and follow the instructions to reset your password.
          </p>
          <Link to="/login" className="back-to-login">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className={error ? 'error' : ''}
              placeholder="Enter your email"
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="forgot-password-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

