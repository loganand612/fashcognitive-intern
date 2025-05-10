import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AccessManager from './AccessManager';

interface CurrentUser {
  id: number;
  username: string;
  email: string;
}

const AccessManagerTest: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/users/auth-status/', {
          withCredentials: true
        });
        setCurrentUser(response.data.user);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        setError('Failed to fetch user data. Using localStorage fallback.');
        
        // Fallback to localStorage
        const email = localStorage.getItem('username');
        if (email) {
          setCurrentUser({
            id: 0,
            username: email.split('@')[0],
            email: email
          });
        } else {
          setError('No user data available. Please log in again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Access Manager Test</h1>
      
      {isLoading ? (
        <p>Loading user information...</p>
      ) : error ? (
        <div>
          <p style={{ color: 'red' }}>{error}</p>
          {currentUser && (
            <div>
              <p>Using fallback user data:</p>
              <p>Username: {currentUser.username}</p>
              <p>Email: {currentUser.email}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>Current User:</h2>
          <p>ID: {currentUser?.id}</p>
          <p>Username: {currentUser?.username}</p>
          <p>Email: {currentUser?.email}</p>
        </div>
      )}

      <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px' }}>
        <h2>Access Manager Component:</h2>
        <AccessManager 
          templateId="test-template-123"
          templateTitle="Test Template"
          initialUsers={[]}
          onUpdatePermissions={(users) => console.log('Updated permissions:', users)}
        />
      </div>
    </div>
  );
};

export default AccessManagerTest;
