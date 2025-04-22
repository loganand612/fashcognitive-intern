import React, { useState } from 'react';
import { Plus, X, Search, Mail, Check, User } from 'lucide-react';
import './ConnectionsPanel.css';

export interface Connection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  status: 'active' | 'pending' | 'declined';
}

interface ConnectionsPanelProps {
  connections: Connection[];
  onAddConnection: (email: string) => void;
  onRemoveConnection: (id: string) => void;
  maxDisplayed?: number;
}

const ConnectionsPanel: React.FC<ConnectionsPanelProps> = ({
  connections,
  onAddConnection,
  onRemoveConnection,
  maxDisplayed = 3
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');

  const activeConnections = connections.filter(c => c.status === 'active');
  const pendingConnections = connections.filter(c => c.status === 'pending');

  const displayedConnections = activeConnections.slice(0, maxDisplayed);
  const remainingCount = activeConnections.length - maxDisplayed;

  // Filter connections based on search term and active tab
  const filteredConnections = connections.filter(connection => {
    const matchesSearch =
      connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && connection.status === 'active';
    if (activeTab === 'pending') return matchesSearch && connection.status === 'pending';

    return matchesSearch;
  });

  const handleAddConnection = () => {
    if (newEmail.trim()) {
      onAddConnection(newEmail.trim());
      setNewEmail('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="connections-panel">
      <div className="connections-container">
        <div className="connections-display">
        {displayedConnections.map(connection => (
          <div key={connection.id} className="connection-avatar" title={connection.name}>
            {connection.avatar ? (
              <img src={connection.avatar} alt={connection.name} />
            ) : (
              <div className="avatar-initials">{connection.initials}</div>
            )}
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            className="connection-more"
            onClick={() => setShowAllConnections(true)}
            title="View all connections"
          >
            +{remainingCount}
          </div>
        )}

        <button
          className="add-connection-button"
          onClick={() => setShowAddModal(true)}
          title="Add connection"
        >
          <Plus size={16} />
        </button>
      </div>
      <button
        className="view-connections-button"
        onClick={() => setShowAllConnections(true)}
      >
        View Connections
      </button>
    </div>

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="connection-modal">
            <div className="modal-header">
              <h3>Add Connection</h3>
              <button className="close-button" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-content">
              <p>Enter the email address of the person you want to connect with.</p>

              <div className="email-input-container">
                <Mail size={18} className="email-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              {pendingConnections.length > 0 && (
                <div className="pending-connections">
                  <h4>Pending Invitations</h4>
                  {pendingConnections.map(connection => (
                    <div key={connection.id} className="pending-connection">
                      <div className="pending-user">
                        {connection.avatar ? (
                          <img src={connection.avatar} alt={connection.name} className="pending-avatar" />
                        ) : (
                          <div className="pending-initials">{connection.initials}</div>
                        )}
                        <div className="pending-details">
                          <span className="pending-name">{connection.name}</span>
                          <span className="pending-email">{connection.email}</span>
                        </div>
                      </div>
                      <div className="pending-status">Pending</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button
                className="send-button"
                onClick={handleAddConnection}
                disabled={!newEmail.trim()}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View All Connections Modal */}
      {showAllConnections && (
        <div className="modal-overlay">
          <div className="connection-modal all-connections-modal">
            <div className="modal-header">
              <h3>My Connections</h3>
              <button className="close-button" onClick={() => setShowAllConnections(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="connections-summary">
              <div className="connection-stat">
                <span className="stat-count">{activeConnections.length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="connection-stat">
                <span className="stat-count">{pendingConnections.length}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="connection-stat">
                <span className="stat-count">{connections.length}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>

            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="connection-tabs">
              <button
                className={`connection-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({connections.length})
              </button>
              <button
                className={`connection-tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active ({activeConnections.length})
              </button>
              <button
                className={`connection-tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({pendingConnections.length})
              </button>
            </div>

            <div className="connections-list">
              {filteredConnections.length === 0 ? (
                <div className="no-connections">
                  <User size={24} />
                  <p>No connections found</p>
                </div>
              ) : (
                filteredConnections.map(connection => (
                  <div key={connection.id} className="connection-item">
                    <div className="connection-info">
                      {connection.avatar ? (
                        <img src={connection.avatar} alt={connection.name} className="connection-list-avatar" />
                      ) : (
                        <div className="connection-list-initials">{connection.initials}</div>
                      )}
                      <div className="connection-details">
                        <span className="connection-name">{connection.name}</span>
                        <span className="connection-email">{connection.email}</span>
                      </div>
                    </div>

                    <div className="connection-status-actions">
                      {connection.status === 'pending' ? (
                        <div className="connection-status pending">
                          <Mail size={14} />
                          <span>Pending</span>
                        </div>
                      ) : connection.status === 'active' ? (
                        <div className="connection-status active">
                          <Check size={14} />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <div className="connection-status declined">
                          <X size={14} />
                          <span>Declined</span>
                        </div>
                      )}

                      <button
                        className="remove-connection"
                        onClick={() => onRemoveConnection(connection.id)}
                        title="Remove connection"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button className="close-list-button" onClick={() => setShowAllConnections(false)}>
                Close
              </button>
              <button className="add-more-button" onClick={() => {
                setShowAllConnections(false);
                setShowAddModal(true);
              }}>
                <Plus size={16} />
                Add Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionsPanel;
