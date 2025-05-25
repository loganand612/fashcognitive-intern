import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Clock,
  User,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Calendar,
  Download
} from 'lucide-react';
import './AuditLogViewer.css';

export interface AuditLogEntry {
  id: string;
  user_email: string;
  template_title: string;
  action: 'grant' | 'revoke' | 'modify' | 'access';
  timestamp: string;
  performed_by_email: string;
  old_permission: string | null;
  new_permission: string | null;
  ip_address: string | null;
  additional_data: any;
}

interface AuditLogViewerProps {
  templateId?: string;
  userId?: string;
  onClose?: () => void;
  standalone?: boolean;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  templateId,
  userId,
  onClose,
  standalone = false
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<number>(7); // Default to 7 days
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      let url = '';
      
      if (templateId) {
        url = `/templates/${templateId}/audit-logs/?days=${dateRange}`;
        if (actionFilter !== 'all') {
          url += `&action=${actionFilter}`;
        }
        if (userFilter) {
          url += `&user=${userFilter}`;
        }
      } else if (userId) {
        url = `/users/${userId}/audit-logs/?days=${dateRange}`;
        if (actionFilter !== 'all') {
          url += `&action=${actionFilter}`;
        }
      } else {
        url = `/recent-audit-logs/?days=${dateRange}`;
        if (actionFilter !== 'all') {
          url += `&action=${actionFilter}`;
        }
      }
      
      const response = await axios.get(url);
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [templateId, userId, actionFilter, dateRange]);

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get action label
  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'grant':
        return 'Permission Granted';
      case 'revoke':
        return 'Permission Revoked';
      case 'modify':
        return 'Permission Modified';
      case 'access':
        return 'Resource Accessed';
      default:
        return action;
    }
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'grant':
        return <User size={16} className="action-icon grant" />;
      case 'revoke':
        return <User size={16} className="action-icon revoke" />;
      case 'modify':
        return <FileText size={16} className="action-icon modify" />;
      case 'access':
        return <Clock size={16} className="action-icon access" />;
      default:
        return <Clock size={16} className="action-icon" />;
    }
  };

  // Toggle expanded log
  const toggleExpandLog = (id: string) => {
    const newExpandedLogIds = new Set(expandedLogIds);
    if (newExpandedLogIds.has(id)) {
      newExpandedLogIds.delete(id);
    } else {
      newExpandedLogIds.add(id);
    }
    setExpandedLogIds(newExpandedLogIds);
  };

  // Sort logs
  const sortedLogs = [...auditLogs].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Export logs as CSV
  const exportLogsAsCsv = () => {
    const headers = [
      'ID',
      'User',
      'Template',
      'Action',
      'Timestamp',
      'Performed By',
      'Old Permission',
      'New Permission',
      'IP Address'
    ];
    
    const csvRows = [
      headers.join(','),
      ...sortedLogs.map(log => [
        log.id,
        log.user_email,
        log.template_title,
        getActionLabel(log.action),
        log.timestamp,
        log.performed_by_email,
        log.old_permission || '',
        log.new_permission || '',
        log.ip_address || ''
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`audit-log-viewer ${standalone ? 'standalone' : ''}`}>
      {!standalone && (
        <div className="audit-log-header">
          <h3>Audit Log</h3>
          <button className="close-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="audit-log-filters">
        <div className="filter-group">
          <label>Action:</label>
          <select 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
            className="action-filter"
          >
            <option value="all">All Actions</option>
            <option value="grant">Permission Granted</option>
            <option value="revoke">Permission Revoked</option>
            <option value="modify">Permission Modified</option>
            <option value="access">Resource Accessed</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Time Range:</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="date-filter"
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
        
        <div className="filter-actions">
          <button 
            className="refresh-button"
            onClick={fetchAuditLogs}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          
          <button 
            className="export-button"
            onClick={exportLogsAsCsv}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="audit-log-list">
        <div className="audit-log-header-row">
          <div className="log-column action-column">Action</div>
          <div className="log-column user-column">User</div>
          <div className="log-column resource-column">Resource</div>
          <div 
            className="log-column timestamp-column sortable"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            Timestamp
            {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
          <div className="log-column performed-by-column">Performed By</div>
          <div className="log-column details-column">Details</div>
        </div>
        
        {isLoading ? (
          <div className="loading-indicator">
            <RefreshCw size={24} className="spinning" />
            <p>Loading audit logs...</p>
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="no-logs">
            <p>No audit logs found for the selected filters.</p>
          </div>
        ) : (
          sortedLogs.map(log => (
            <div key={log.id} className="audit-log-item">
              <div className="audit-log-row">
                <div className="log-column action-column">
                  {getActionIcon(log.action)}
                  <span>{getActionLabel(log.action)}</span>
                </div>
                <div className="log-column user-column">{log.user_email}</div>
                <div className="log-column resource-column">{log.template_title}</div>
                <div className="log-column timestamp-column">{formatTimestamp(log.timestamp)}</div>
                <div className="log-column performed-by-column">{log.performed_by_email}</div>
                <div className="log-column details-column">
                  <button 
                    className="details-button"
                    onClick={() => toggleExpandLog(log.id)}
                  >
                    {expandedLogIds.has(log.id) ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
              
              {expandedLogIds.has(log.id) && (
                <div className="audit-log-details">
                  <div className="detail-row">
                    <span className="detail-label">IP Address:</span>
                    <span className="detail-value">{log.ip_address || 'N/A'}</span>
                  </div>
                  {log.old_permission && (
                    <div className="detail-row">
                      <span className="detail-label">Old Permission:</span>
                      <span className="detail-value">{log.old_permission}</span>
                    </div>
                  )}
                  {log.new_permission && (
                    <div className="detail-row">
                      <span className="detail-label">New Permission:</span>
                      <span className="detail-value">{log.new_permission}</span>
                    </div>
                  )}
                  {log.additional_data && (
                    <div className="detail-row">
                      <span className="detail-label">Additional Data:</span>
                      <pre className="detail-value json">
                        {JSON.stringify(log.additional_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLogViewer;
