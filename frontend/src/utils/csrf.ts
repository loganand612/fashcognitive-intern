/**
 * Fetches a fresh CSRF token from the server and returns it
 */
export async function fetchCSRFToken() {
    try {
      // Make a request to the CSRF token endpoint
      const response = await fetch("http://localhost:8000/api/users/get-csrf-token/", {
        method: "GET",
        credentials: "include", // Important: include cookies
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      // Wait for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Extract the CSRF token from cookies
      const csrfToken = document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];

      if (!csrfToken) {
        throw new Error("CSRF token not found in cookies after fetch");
      }

      console.log("Successfully fetched new CSRF token:", csrfToken);
      return csrfToken;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      throw error;
    }
  }