/**
 * Utility function for making API requests
 */
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for auth
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    // Get the error message from the response
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || `API error: ${response.status}`;
    } catch (e) {
      errorMessage = `API error: ${response.status}`;
    }
    
    throw new Error(errorMessage);
  }

  return response;
} 