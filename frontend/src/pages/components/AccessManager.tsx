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
  Copy,
  ExternalLink,
  Users
} from 'lucide-react';
import './AccessManager.css';

// Define permission types
export type PermissionLevel = 'owner' | 'admin' | 'editor' | 'viewer';

export interface UserPermission {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  permissionLevel: PermissionLevel;
  status: 'active' | 'pending' | 'expired';
  lastAccessed?: Date;
}

export interface Connection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  status: 'active' | 'pending' | 'declined';
}

interface CurrentUser {
  id: number;
  username: string;
  email: string;
}

interface AccessManagerProps {
  templateId: string;
  templateTitle: string;
  initialUsers?: UserPermission[];
  onUpdatePermissions?: (users: UserPermission[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const getPermissionLabel = (level: PermissionLevel): string => {
  switch (level) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Administrator';
    case 'editor':
      return 'Editor';
    case 'viewer':
      return 'Viewer';
    default:
      return 'Unknown';
  }
};

const getPermissionDescription = (level: PermissionLevel): string => {
  switch (level) {
    case 'owner':
      return 'Full control including template deletion and ownership transfer';
    case 'admin':
      return 'Can edit template, manage users, and publish';
    case 'editor':
      return 'Can edit template content but cannot publish or manage users';
    case 'viewer':
      return 'Can only view and use the template';
    default:
      return '';
  }
};

const AccessManager: React.FC<AccessManagerProps> = ({
  templateId,
  templateTitle,
  initialUsers = [],
  onUpdatePermissions
}) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/users/auth-status/', {
          withCredentials: true
        });
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        // If we can't get the user from API, try to get from localStorage
        const email = localStorage.getItem('username');
        if (email) {
          setCurrentUser({
            id: 0,
            username: email.split('@')[0],
            email: email
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Create default owner based on current user
  const createDefaultOwner = (): UserPermission => {
    return {
      id: generateId(),
      name: currentUser ? (currentUser.username || currentUser.email.split('@')[0]) : 'You',
      email: currentUser ? currentUser.email : 'current.user@example.com',
      permissionLevel: 'owner',
      status: 'active',
      lastAccessed: new Date()
    };
  };

  const [users, setUsers] = useState<UserPermission[]>(
    initialUsers.length > 0 ? initialUsers : [createDefaultOwner()]
  );

  // Update default owner when current user is loaded
  useEffect(() => {
    if (!isLoading && currentUser && initialUsers.length === 0) {
      setUsers([createDefaultOwner()]);
    }
  }, [currentUser, isLoading, initialUsers.length]);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState<PermissionLevel>('viewer');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showShareLink, setShowShareLink] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPermissionDetails, setShowPermissionDetails] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [inviteTab, setInviteTab] = useState<'email' | 'connections'>('email');

  // Sample connections data for demonstration
  // Map to store individual permission levels for each connection
  const [connectionPermissions, setConnectionPermissions] = useState<Record<string, PermissionLevel>>({});

  const [connections, setConnections] = useState<Connection[]>([
    {
      id: '1',
      name: 'Grace Miller',
      email: 'grace.miller@example.com',
      initials: 'GM',
      status: 'active'
    },
    {
      id: '2',
      name: 'John Martinez',
      email: 'john.martinez@example.com',
      initials: 'JM',
      status: 'active'
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      initials: 'SJ',
      status: 'active'
    },
    {
      id: '4',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      initials: 'MB',
      status: 'active'
    },
    {
      id: '5',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      initials: 'ED',
      status: 'active'
    }
  ]);

  // Generate a share link
  useEffect(() => {
    setShareLink(`https://fashcognitive.com/templates/share/${templateId}?token=${generateId()}`);
  }, [templateId]);

  // Update parent component when users change
  useEffect(() => {
    if (onUpdatePermissions) {
      onUpdatePermissions(users);
    }
  }, [users, onUpdatePermissions]);

  const handleAddUser = () => {
    if (!newUserEmail.trim()) return;

    // Check if user already exists
    if (users.some(user => user.email.toLowerCase() === newUserEmail.toLowerCase())) {
      alert('This user has already been invited.');
      return;
    }

    const newUser: UserPermission = {
      id: generateId(),
      name: newUserEmail.split('@')[0], // Extract name from email
      email: newUserEmail,
      permissionLevel: newUserPermission,
      status: 'pending'
    };

    setUsers([...users, newUser]);
    setNewUserEmail('');
    setNewUserPermission('viewer');
    setShowInviteForm(false);
  };

  const handleAddConnection = (connection: Connection, permissionLevel: PermissionLevel) => {
    // Check if connection already exists as a user
    if (users.some(user => user.email.toLowerCase() === connection.email.toLowerCase())) {
      alert('This user has already been invited.');
      return;
    }

    const newUser: UserPermission = {
      id: generateId(),
      name: connection.name,
      email: connection.email,
      avatar: connection.avatar,
      permissionLevel: permissionLevel,
      status: 'pending'
    };

    setUsers([...users, newUser]);
    setShowInviteForm(false);
  };

  // Initialize connection permissions with default values
  useEffect(() => {
    const newPermissions: Record<string, PermissionLevel> = {};
    connections.forEach(connection => {
      if (!connectionPermissions[connection.id]) {
        newPermissions[connection.id] = 'viewer';
      }
    });

    if (Object.keys(newPermissions).length > 0) {
      setConnectionPermissions(prev => ({ ...prev, ...newPermissions }));
    }
  }, [connections, connectionPermissions]);

  const handleConnectionPermissionChange = (connectionId: string, permissionLevel: PermissionLevel) => {
    setConnectionPermissions(prev => ({
      ...prev,
      [connectionId]: permissionLevel
    }));
  };

  // Filter connections that are not already users
  const availableConnections = connections.filter(
    connection => !users.some(user => user.email.toLowerCase() === connection.email.toLowerCase())
  );

  const handleUpdatePermission = (userId: string, permissionLevel: PermissionLevel) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, permissionLevel } : user
    ));
    setEditingUserId(null);
  };

  const handleRemoveUser = (userId: string) => {
    // Don't allow removing the owner
    if (users.find(user => user.id === userId)?.permissionLevel === 'owner') {
      alert('You cannot remove the owner of the template.');
      return;
    }

    setUsers(users.filter(user => user.id !== userId));
  };

  const handleTransferOwnership = (userId: string) => {
    // Find current owner and new owner
    const currentOwner = users.find(user => user.permissionLevel === 'owner');
    const newOwner = users.find(user => user.id === userId);

    if (!currentOwner || !newOwner) return;

    // Swap permissions
    setUsers(users.map(user => {
      if (user.id === currentOwner.id) {
        return { ...user, permissionLevel: 'admin' };
      }
      if (user.id === userId) {
        return { ...user, permissionLevel: 'owner' };
      }
      return user;
    }));

    setEditingUserId(null);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="access-manager">
      <div className="access-header">
        <h2>Manage Access</h2>
        <p>Control who can view and edit "{templateTitle}"</p>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading user information...</p>
        </div>
      )}

      <div className="access-actions">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="action-buttons">
          <button
            className="share-link-button"
            onClick={() => setShowShareLink(!showShareLink)}
          >
            <ExternalLink size={16} />
            Share Link
          </button>

          <button
            className="invite-button"
            onClick={() => setShowInviteForm(!showInviteForm)}
          >
            <UserPlus size={16} />
            Invite User
          </button>
        </div>
      </div>

      {showShareLink && (
        <div className="share-link-container">
          <div className="share-link-header">
            <h3>Share Template</h3>
            <button className="close-button" onClick={() => setShowShareLink(false)}>
              <X size={16} />
            </button>
          </div>
          <p>Anyone with this link can view this template:</p>
          <div className="share-link-input">
            <input type="text" value={shareLink} readOnly />
            <button onClick={copyShareLink}>
              <Copy size={16} />
              {linkCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {showInviteForm && (
        <div className="invite-form">
          <div className="invite-form-header">
            <h3>Invite User</h3>
            <button className="close-button" onClick={() => setShowInviteForm(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="invite-tabs">
            <button
              className={`invite-tab ${inviteTab === 'email' ? 'active' : ''}`}
              onClick={() => setInviteTab('email')}
            >
              <Mail size={16} />
              Email
            </button>
            <button
              className={`invite-tab ${inviteTab === 'connections' ? 'active' : ''}`}
              onClick={() => setInviteTab('connections')}
            >
              <Users size={16} />
              My Connections
            </button>
          </div>

          {inviteTab === 'email' ? (
            <div className="tab-content">
              <div className="form-group">
                <label>Email Address</label>
                <div className="email-input">
                  <Mail size={18} className="email-icon" />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Permission Level
                  <button
                    className="info-button"
                    onClick={() => setShowPermissionDetails(!showPermissionDetails)}
                  >
                    <Info size={14} />
                  </button>
                </label>
                <select
                  value={newUserPermission}
                  onChange={(e) => setNewUserPermission(e.target.value as PermissionLevel)}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {showPermissionDetails && (
                <div className="permission-details">
                  <div className="permission-item">
                    <h4>Viewer</h4>
                    <p>Can view and use the template but cannot make changes</p>
                  </div>
                  <div className="permission-item">
                    <h4>Editor</h4>
                    <p>Can edit template content but cannot publish or manage users</p>
                  </div>
                  <div className="permission-item">
                    <h4>Administrator</h4>
                    <p>Can edit template, manage users, and publish</p>
                  </div>
                  <div className="permission-item">
                    <h4>Owner</h4>
                    <p>Full control including template deletion and ownership transfer</p>
                  </div>
                </div>
              )}

              <div className="invite-actions">
                <button className="cancel-button" onClick={() => setShowInviteForm(false)}>Cancel</button>
                <button
                  className="send-invite-button"
                  onClick={handleAddUser}
                  disabled={!newUserEmail.trim()}
                >
                  Send Invite
                </button>
              </div>
            </div>
          ) : (
            <div className="tab-content">
              <div className="form-group">
                <label>
                  Permission Levels
                  <button
                    className="info-button"
                    onClick={() => setShowPermissionDetails(!showPermissionDetails)}
                  >
                    <Info size={14} />
                  </button>
                </label>
                <p className="permission-hint">Set permission level for each connection individually</p>
              </div>

              {showPermissionDetails && (
                <div className="permission-details">
                  <div className="permission-item">
                    <h4>Viewer</h4>
                    <p>Can view and use the template but cannot make changes</p>
                  </div>
                  <div className="permission-item">
                    <h4>Editor</h4>
                    <p>Can edit template content but cannot publish or manage users</p>
                  </div>
                  <div className="permission-item">
                    <h4>Administrator</h4>
                    <p>Can edit template, manage users, and publish</p>
                  </div>
                  <div className="permission-item">
                    <h4>Owner</h4>
                    <p>Full control including template deletion and ownership transfer</p>
                  </div>
                </div>
              )}

              <div className="connections-list-container">
                <h4 className="connections-list-title">
                  Select from your connections
                  <span className="connections-count">({availableConnections.length})</span>
                </h4>

                {availableConnections.length === 0 ? (
                  <div className="no-connections-message">
                    <p>All your connections have already been invited to this template.</p>
                  </div>
                ) : (
                  <div className="connections-select-list">
                    {availableConnections.map(connection => (
                      <div key={connection.id} className="connection-select-item">
                        <div className="connection-info">
                          {connection.avatar ? (
                            <img src={connection.avatar} alt={connection.name} className="connection-avatar" />
                          ) : (
                            <div className="connection-initials">{connection.initials}</div>
                          )}
                          <div className="connection-details">
                            <span className="connection-name">{connection.name}</span>
                            <span className="connection-email">{connection.email}</span>
                          </div>
                        </div>
                        <div className="connection-actions">
                          <select
                            className="connection-permission-select"
                            value={connectionPermissions[connection.id] || 'viewer'}
                            onChange={(e) => handleConnectionPermissionChange(connection.id, e.target.value as PermissionLevel)}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            className="add-connection-btn"
                            onClick={() => handleAddConnection(connection, connectionPermissions[connection.id] || 'viewer')}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="invite-actions">
                <button className="cancel-button" onClick={() => setShowInviteForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="users-list-container">
        <div className="users-list-header">
          <div className="user-column">User</div>
          <div className="permission-column">Permission</div>
          <div className="status-column">Status</div>
          <div className="actions-column">Actions</div>
        </div>

        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <AlertCircle size={24} />
              <p>No users found matching "{searchTerm}"</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>

                <div className="user-permission">
                  {editingUserId === user.id ? (
                    <select
                      value={user.permissionLevel}
                      onChange={(e) => handleUpdatePermission(user.id, e.target.value as PermissionLevel)}
                      className="permission-select"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrator</option>
                      <option value="owner">Owner (Transfer Ownership)</option>
                    </select>
                  ) : (
                    <div className={`permission-badge ${user.permissionLevel}`}>
                      <Shield size={14} />
                      <span>{getPermissionLabel(user.permissionLevel)}</span>
                    </div>
                  )}
                </div>

                <div className="user-status">
                  <div className={`status-badge ${user.status}`}>
                    {user.status === 'active' && <Check size={14} />}
                    {user.status === 'pending' && <Mail size={14} />}
                    {user.status === 'expired' && <AlertCircle size={14} />}
                    <span>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                  </div>
                </div>

                <div className="user-actions">
                  {user.permissionLevel !== 'owner' && (
                    <>
                      {editingUserId === user.id ? (
                        <button
                          className="save-button"
                          onClick={() => setEditingUserId(null)}
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <button
                          className="edit-button"
                          onClick={() => setEditingUserId(user.id)}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button
                        className="delete-button"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {user.permissionLevel === 'owner' && (
                    <div className="owner-badge">
                      <User size={14} />
                      <span>Owner</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessManager;
