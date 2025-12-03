const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Log API URL on load (for debugging)
console.log('[API] API_URL:', API_URL);

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Convert body to JSON if it's an object
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    console.log(`[API] Calling: ${API_URL}${endpoint}`, config.method || 'GET');
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        console.error(`[API] Non-JSON error response: ${response.status}`);
        throw new Error(`Request failed with status ${response.status}`);
      }
      return { success: true };
    }

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[API] Error response:`, data);
      throw new Error(data.error || 'Request failed');
    }

    console.log(`[API] Success:`, endpoint);
    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`[API] Network error:`, error);
      throw new Error('Network error: Could not connect to server. Make sure the backend is running on http://localhost:5000');
    }
    console.error(`[API] Error:`, error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: userData,
  }),
  
  login: (email, password) => apiCall('/auth/login', {
    method: 'POST',
    body: { email, password },
  }),
  
  getCurrentUser: () => apiCall('/auth/me'),
};

// Patients API
export const patientsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/patients${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => apiCall(`/patients/${id}`),
  
  create: (patientData) => apiCall('/patients', {
    method: 'POST',
    body: patientData,
  }),
  
  update: (id, patientData) => apiCall(`/patients/${id}`, {
    method: 'PUT',
    body: patientData,
  }),
  
  delete: (id) => apiCall(`/patients/${id}`, {
    method: 'DELETE',
  }),
};

// Studies API
export const studiesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/studies${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => apiCall(`/studies/${id}`),
  
  create: (studyData) => apiCall('/studies', {
    method: 'POST',
    body: studyData,
  }),
  
  update: (id, studyData) => apiCall(`/studies/${id}`, {
    method: 'PUT',
    body: studyData,
  }),
  
  delete: (id) => apiCall(`/studies/${id}`, {
    method: 'DELETE',
  }),
};

// Reports API
export const reportsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => apiCall(`/reports/${id}`),
  
  create: (reportData) => apiCall('/reports', {
    method: 'POST',
    body: reportData,
  }),
  
  update: (id, reportData) => apiCall(`/reports/${id}`, {
    method: 'PUT',
    body: reportData,
  }),
  
  delete: (id) => apiCall(`/reports/${id}`, {
    method: 'DELETE',
  }),
};

