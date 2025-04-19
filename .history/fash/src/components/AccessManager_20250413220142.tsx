import React, { useState, useEffect } from 'react';
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
  ExternalLink
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
  // Default owner if no users provided
  const defaultOwner: UserPermission = {
    id: generateId(),
    name: 'You',
    email: 'current.user@example.com',
    permissionLevel: 'owner',
    status: 'active',
    lastAccessed: new Date()
  };

  const [users, setUsers] = useState<UserPermission[]>(
    initialUsers.length > 0 ? initialUsers : [defaultOwner]
  );
  
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState<PermissionLevel>('viewer');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showShareLink, setShowShareLink] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPermissionDetails, setShowPermissionDetails] = useState(false);

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
