import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  UserPlus,
  Mail,
  Shield,
  Check,
  X,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  Info,
  Users,
  ClipboardCheck
} from 'lucide-react';
import './AccessManager.css'; // Reuse the base styles
import './TemplateAssignmentManager.css'; // Add specific styles
import { fetchCSRFToken } from '../../utils/csrf';

// Define assignment status types
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'revoked' | 'expired';

export interface TemplateAssignment {
  id?: number;
  template: number;
  template_title?: string;
  inspector: number;
  inspector_email?: string;
  inspector_name?: string;
  assigned_by?: number;
  assigned_by_email?: string;
  assigned_by_name?: string;
  status: AssignmentStatus;
  status_display?: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  revoked_at?: string;
  expired_at?: string;
  due_date?: string;
  notes?: string;
}

interface Inspector {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
}

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  user_role: string;
}

interface TemplateAssignmentManagerProps {
  templateId: string | number;
  templateTitle: string;
  onAssignmentUpdated?: () => void;
}

const TemplateAssignmentManager: React.FC<TemplateAssignmentManagerProps> = ({
  templateId,
  templateTitle,
  onAssignmentUpdated
}) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<TemplateAssignment[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check if template has been saved to database (has numeric ID)
  const isTemplateSaved = String(templateId).match(/^\d+$/);
  const templateNotSavedMessage = "This template must be saved before it can be assigned to inspectors. Please save the template first.";

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log('Fetching current user data...');
        const response = await axios.get('http://localhost:8000/api/users/auth-status/', {
          withCredentials: true
        });
        console.log('Current user data:', response.data);

        if (response.data.user) {
          setCurrentUser(response.data.user);
          console.log('User role from API:', response.data.user.user_role);

          // Store user role in localStorage for persistence
          localStorage.setItem('user_role', response.data.user.user_role);
        } else {
          throw new Error('User data not found in response');
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        // If we can't get the user from API, try to get from localStorage
        const email = localStorage.getItem('username');
        const storedRole = localStorage.getItem('user_role');

        if (email) {
          setCurrentUser({
            id: 0,
            username: email.split('@')[0],
            email: email,
            user_role: storedRole || 'regular' // Use stored role or default to regular
          });
          console.log('Using localStorage user role:', storedRole || 'regular');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch template assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/users/template-assignments/', {
          withCredentials: true
        });

        // Filter assignments for this template
        const templateAssignments = response.data.filter(
          (assignment: TemplateAssignment) => assignment.template.toString() === templateId.toString()
        );

        setAssignments(templateAssignments);
      } catch (error) {
        console.error('Failed to fetch template assignments:', error);
        setError('Failed to load template assignments. Please try again later.');
      }
    };

    // Only fetch assignments if template is saved and user is loaded
    if (!isLoading && currentUser && isTemplateSaved) {
      fetchAssignments();
    }
  }, [isLoading, currentUser, templateId, isTemplateSaved]);

  // Fetch inspectors
  useEffect(() => {
    const fetchInspectors = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/users/inspectors/', {
          withCredentials: true
        });

        // Transform the data to match our Inspector interface
        const inspectorsList = response.data.map((user: any) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim() || user.username || user.email.split('@')[0],
          email: user.email,
          initials: `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
        }));

        setInspectors(inspectorsList);
      } catch (error) {
        console.error('Failed to fetch inspectors:', error);

        // If the API endpoint doesn't exist, create some dummy data for testing
        setInspectors([
          {
            id: 4,
            name: 'Inspector User',
            email: 'sloganand11@gmail.com',
            initials: 'IU'
          }
        ]);
      }
    };

    // Only fetch inspectors if template is saved and user is loaded
    if (!isLoading && currentUser && isTemplateSaved) {
      fetchInspectors();
    }
  }, [isLoading, currentUser, isTemplateSaved]);

  // Create a new assignment
  const handleCreateAssignment = async () => {
    if (!selectedInspector) {
      setError('Please select an inspector');
      return;
    }

    // Check if template is saved before allowing assignment
    if (!isTemplateSaved) {
      setError(templateNotSavedMessage);
      return;
    }

    try {
      // First check if the current user is an admin
      if (currentUser?.user_role !== 'admin') {
        setError('Only admin users can assign templates to inspectors.');
        return;
      }

      // Get a fresh CSRF token
      const csrfToken = await fetchCSRFToken();
      console.log('CSRF Token for assignment creation:', csrfToken);

      const assignmentData = {
        template: templateId,
        inspector: selectedInspector,
        notes: assignmentNotes
      };

      console.log('🔍 Frontend assignment data:', assignmentData);
      console.log('🔍 Template ID:', templateId, 'Type:', typeof templateId);
      console.log('🔍 Selected Inspector:', selectedInspector, 'Type:', typeof selectedInspector);
      console.log('🔍 Is template saved:', isTemplateSaved);

      // Make the request with the CSRF token
      const response = await axios.post(
        'http://localhost:8000/api/users/template-assignments/',
        assignmentData,
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Assignment created successfully:', response.data);

      // Add the new assignment to the list
      setAssignments([...assignments, response.data]);

      // Reset form
      setSelectedInspector(null);
      setAssignmentNotes('');
      setShowAssignForm(false);
      setError(null);

      // Notify parent component
      if (onAssignmentUpdated) {
        onAssignmentUpdated();
      }
    } catch (error: any) {
      console.error('Failed to create assignment:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to assign templates. Only admin users can assign templates.');
      } else {
        setError(error.response?.data?.detail || 'Failed to create assignment. Please try again.');
      }
    }
  };

  // Revoke an assignment
  const handleRevokeAssignment = async (assignmentId: number) => {
    try {
      // First check if the current user is an admin
      if (currentUser?.user_role !== 'admin') {
        setError('Only admin users can revoke template assignments.');
        return;
      }

      // Get a fresh CSRF token
      const csrfToken = await fetchCSRFToken();
      console.log('CSRF Token for assignment revocation:', csrfToken);

      await axios.post(
        `http://localhost:8000/api/users/template-assignments/${assignmentId}/revoke/`,
        {},
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Assignment revoked successfully');

      // Update the assignment status in the list
      setAssignments(assignments.map(assignment =>
        assignment.id === assignmentId
          ? { ...assignment, status: 'revoked' }
          : assignment
      ));

      // Notify parent component
      if (onAssignmentUpdated) {
        onAssignmentUpdated();
      }
    } catch (error: any) {
      console.error('Failed to revoke assignment:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to revoke assignments. Only admin users can revoke assignments.');
      } else {
        setError(error.response?.data?.detail || 'Failed to revoke assignment. Please try again.');
      }
    }
  };

  // Filter inspectors based on search term
  const filteredInspectors = inspectors.filter(inspector =>
    inspector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspector.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter out inspectors who already have active assignments
  const availableInspectors = filteredInspectors.filter(inspector =>
    !assignments.some(assignment =>
      assignment.inspector === inspector.id &&
      ['assigned', 'in_progress'].includes(assignment.status)
    )
  );

  // Get status display text
  const getStatusDisplay = (status: AssignmentStatus): string => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'revoked': return 'Revoked';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  return (
    <div className="access-manager">
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        <div className="access-header">
          <div className="tam-header-content">
            <div className="tam-header-icon">
              <ClipboardCheck size={32} />
            </div>
            <div className="tam-header-text">
              <h2>Assign Template to Inspector</h2>
              <p>Assign "{templateTitle}" to inspectors who will complete the inspections</p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading assignment information...</p>
          </div>
        )}

        {!isLoading && !isTemplateSaved && (
          <div className="info-message">
            <Info size={16} />
            <span>{templateNotSavedMessage}</span>
          </div>
        )}

        {!isLoading && isTemplateSaved && currentUser?.user_role !== 'admin' && (
          <div className="info-message">
            <Info size={16} />
            <span>Only admin users can assign templates to inspectors. Contact an admin if you need to assign this template.</span>
          </div>
        )}



        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="access-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search inspectors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="action-buttons">
            <button
              className="tam-main-assign-button"
              onClick={() => setShowAssignForm(!showAssignForm)}
              disabled={!isTemplateSaved || currentUser?.user_role !== 'admin'}
              title={!isTemplateSaved ? templateNotSavedMessage : undefined}
            >
              <UserPlus size={16} />
              Assign Template
            </button>
          </div>
        </div>

        {showAssignForm && (
          <div className="tam-assign-form">
            <div className="tam-form-header">
              <div className="tam-form-title">
                <UserPlus size={20} />
                <h3>Assign Template to Inspector</h3>
              </div>
              <button className="tam-close-button" onClick={() => setShowAssignForm(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="tam-form-content">
              <div className="tam-form-group">
                <label className="tam-form-label">
                  <User size={16} />
                  Select Inspector
                </label>
                <select
                  value={selectedInspector || ''}
                  onChange={(e) => setSelectedInspector(Number(e.target.value))}
                  className="tam-inspector-select"
                >
                  <option value="">-- Choose an inspector --</option>
                  {availableInspectors.map(inspector => (
                    <option key={inspector.id} value={inspector.id}>
                      {inspector.name} ({inspector.email})
                    </option>
                  ))}
                </select>
                {availableInspectors.length === 0 && (
                  <div className="tam-no-inspectors">
                    <AlertCircle size={16} />
                    <span>No available inspectors found. All inspectors may already be assigned to this template.</span>
                  </div>
                )}
              </div>

              <div className="tam-form-group">
                <label className="tam-form-label">
                  <Edit2 size={16} />
                  Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Add any special instructions or notes for this assignment..."
                  rows={3}
                  className="tam-notes-textarea"
                />
              </div>

              <div className="tam-form-actions">
                <button className="tam-cancel-button" onClick={() => setShowAssignForm(false)}>
                  Cancel
                </button>
                <button
                  className="tam-assign-button"
                  onClick={handleCreateAssignment}
                  disabled={!selectedInspector || !isTemplateSaved}
                  title={!isTemplateSaved ? templateNotSavedMessage : undefined}
                >
                  <Check size={16} />
                  Assign Template
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="users-list-container">
          <div className="users-list-header">
            <div className="user-column">Inspector</div>
            <div className="permission-column">Status</div>
            <div className="status-column">Assigned Date</div>
            <div className="actions-column">Actions</div>
          </div>

          <div className="users-list">
            {!isTemplateSaved ? (
              <div className="no-users">
                <ClipboardCheck size={24} />
                <p>Save the template to view and manage assignments</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="no-users">
                <ClipboardCheck size={24} />
                <p>No assignments found for this template</p>
              </div>
            ) : (
              assignments.map(assignment => (
                <div key={assignment.id} className="user-item">
                  <div className="user-info">
                    <div className="user-avatar">
                      <div className="avatar-placeholder">
                        {assignment.inspector_name?.[0]?.toUpperCase() || 'I'}
                      </div>
                    </div>
                    <div className="user-details">
                      <div className="user-name">{assignment.inspector_name || 'Inspector'}</div>
                      <div className="user-email">{assignment.inspector_email}</div>
                    </div>
                  </div>

                  <div className="user-permission">
                    <div className={`status-badge ${assignment.status}`}>
                      {assignment.status === 'assigned' && <Check size={14} />}
                      {assignment.status === 'in_progress' && <ClipboardCheck size={14} />}
                      {assignment.status === 'completed' && <Check size={14} />}
                      {assignment.status === 'revoked' && <X size={14} />}
                      {assignment.status === 'expired' && <AlertCircle size={14} />}
                      <span>{assignment.status_display || getStatusDisplay(assignment.status)}</span>
                    </div>
                  </div>

                  <div className="user-status">
                    <span>{new Date(assignment.assigned_at || '').toLocaleDateString()}</span>
                  </div>

                  <div className="user-actions">
                    {['assigned', 'in_progress'].includes(assignment.status) && currentUser?.user_role === 'admin' && (
                      <button
                        className="delete-button"
                        onClick={() => assignment.id && handleRevokeAssignment(assignment.id)}
                        title="Revoke Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateAssignmentManager;
