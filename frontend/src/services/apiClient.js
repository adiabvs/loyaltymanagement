// API Client for backend communication
// Replace localhost with your backend URL in production

// For web, use localhost. For mobile devices, use your computer's IP address
const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default to localhost for web development
  // For mobile: replace with your computer's IP (e.g., http://192.168.1.100:3000/api)
  return "http://localhost:3000/api";
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Don't throw error for 401 Unauthorized - it's expected when no token
        if (response.status === 401) {
          const error = new Error("Unauthorized");
          error.status = 401;
          throw error;
        }
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Don't log 401 errors as they're expected when no token
      if (error.status === 401 || error.message.includes("Unauthorized") || error.message.includes("No token provided")) {
        throw error; // Re-throw without logging
      }
      
      // Enhanced error handling
      if (
        error.message.includes("Failed to fetch") || 
        error.message.includes("NetworkError") ||
        error.message.includes("Network request failed") ||
        error.name === "TypeError"
      ) {
        console.error("API request failed: Cannot connect to backend server.");
        console.error("Attempted URL:", url);
        console.error("Base URL:", API_BASE_URL);
        console.error("Make sure the backend is running on:", API_BASE_URL.replace('/api', ''));
        throw new Error(
          `Cannot connect to server at ${API_BASE_URL}. ` +
          `Please ensure the backend is running on port 3000. ` +
          `Check: 1) Backend server is started, 2) Port 3000 is not blocked, 3) CORS is configured correctly.`
        );
      }
      console.error("API request failed:", error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

