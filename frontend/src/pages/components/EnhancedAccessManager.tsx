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
  Users,
  Clock,
  FileText,
  Key
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
  granularPermissions?: GranularPermission[];
}

export interface GranularPermission {
  id: string;
  permission_type_id: string;
  permission_name: string;
  permission_codename: string;
  granted_at: string;
  granted_by: string;
}

export interface PermissionType {
  id: string;
  name: string;
  codename: string;
  description: string;
}

export interface Connection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  status: 'active' | 'pending' | 'declined';
}

export interface AuditLogEntry {
  id: string;
  user_email: string;
  template_title: string;
  action: 'grant' | 'revoke' | 'modify' | 'access';
  timestamp: string;
  performed_by_email: string;
  old_permission: string | null;
  new_permission: string | null;
}

interface CurrentUser {
  id: number;
  username: string;
  email: string;
}

interface EnhancedAccessManagerProps {
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

const EnhancedAccessManager: React.FC<EnhancedAccessManagerProps> = ({
  templateId,
  templateTitle,
  initialUsers = [],
  onUpdatePermissions
}) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserPermission[]>(initialUsers);
  const [connections, setConnections] = useState<Connection[]>([]);
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
  const [permissionTypes, setPermissionTypes] = useState<PermissionType[]>([]);
  const [showGranularPermissions, setShowGranularPermissions] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLogFilter, setAuditLogFilter] = useState<string>('all');

  // Fetch current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/users/auth-status/');
        if (response.data.isAuthenticated) {
          setCurrentUser({
            id: response.data.user.id,
            username: response.data.user.username,
            email: response.data.user.email
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching current user:', error);
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

  // Update default owner when current user is loaded
  useEffect(() => {
    if (!isLoading && currentUser && initialUsers.length === 0) {
      setUsers([createDefaultOwner()]);
    }
  }, [currentUser, isLoading, initialUsers.length]);

  // Fetch permission types
  useEffect(() => {
    const fetchPermissionTypes = async () => {
      try {
        const response = await axios.get('/permission-types/');
        setPermissionTypes(response.data);
      } catch (error) {
        console.error('Error fetching permission types:', error);
      }
    };

    fetchPermissionTypes();
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get(`/templates/${templateId}/audit-logs/`);
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // Update parent component when users change
  useEffect(() => {
    if (onUpdatePermissions) {
      onUpdatePermissions(users);
    }
  }, [users, onUpdatePermissions]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter connections that are not already users
  const availableConnections = connections.filter(
    connection => !users.some(user => user.email.toLowerCase() === connection.email.toLowerCase())
  );

  // Handle adding a new user
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

  // Handle updating a user's permission level
  const handleUpdatePermission = (userId: string, permissionLevel: PermissionLevel) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, permissionLevel } : user
    ));
    setEditingUserId(null);
  };

  // Handle removing a user
  const handleRemoveUser = (userId: string) => {
    // Don't allow removing the owner
    if (users.find(user => user.id === userId)?.permissionLevel === 'owner') {
      alert('You cannot remove the owner of the template.');
      return;
    }

    setUsers(users.filter(user => user.id !== userId));
  };

  // Handle showing granular permissions for a user
  const handleShowGranularPermissions = (userId: string) => {
    setSelectedUserId(userId);
    setShowGranularPermissions(true);
  };

  // Handle showing audit log
  const handleShowAuditLog = () => {
    fetchAuditLogs();
    setShowAuditLog(true);
  };

  return (
    <div className="access-manager">
      <div className="access-manager-header">
        <h2>Manage Access for "{templateTitle}"</h2>
        <div className="header-actions">
          <button 
            className="audit-log-button"
            onClick={handleShowAuditLog}
          >
            <Clock size={16} />
            View Audit Log
          </button>
        </div>
      </div>

      {/* Rest of the component similar to AccessManager but with enhanced features */}
      
      {/* Granular permissions modal */}
      {showGranularPermissions && selectedUserId && (
        <div className="modal-overlay">
          <div className="granular-permissions-modal">
            <div className="modal-header">
              <h3>Granular Permissions</h3>
              <button className="close-button" onClick={() => setShowGranularPermissions(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-content">
              {/* Granular permissions content */}
            </div>
          </div>
        </div>
      )}

      {/* Audit log modal */}
      {showAuditLog && (
        <div className="modal-overlay">
          <div className="audit-log-modal">
            <div className="modal-header">
              <h3>Audit Log</h3>
              <button className="close-button" onClick={() => setShowAuditLog(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-content">
              {/* Audit log content */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAccessManager;
