import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, MapPin, User, Eye } from 'lucide-react';
import { fetchData } from '../utils/api';
import './TemplateResults.css';

interface Inspection {
  id: number;
  title: string;
  conducted_by: string;
  conducted_at: string;
  location: string;
  site: string;
  status: string;
  created_at: string;
  updated_at: string;
  has_garment_data: boolean;
}

interface Template {
  id: number;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
}

interface TemplateResultsData {
  template: Template;
  inspections: Inspection[];
  total_inspections: number;
}

const TemplateResults: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [resultsData, setResultsData] = useState<TemplateResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplateResults = async () => {
      try {
        console.log(`Fetching results for template ID: ${templateId}`);
        const data = await fetchData(`users/template/${templateId}/inspections/`);
        console.log('Template results data:', data);
        setResultsData(data);
      } catch (err: any) {
        console.error('Error fetching template results:', err);
        setError(err.message || 'Failed to load template results');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplateResults();
    } else {
      setError('No template ID provided');
      setLoading(false);
    }
  }, [templateId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClass = status === 'completed' ? 'tr-status-completed' : 'tr-status-pending';
    return <span className={`tr-status-badge ${statusClass}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="tr-loading-container">
        <div className="tr-loading-spinner"></div>
        <p>Loading template results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tr-error-container">
        <h2>Error Loading Results</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="tr-back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!resultsData) {
    return (
      <div className="tr-error-container">
        <h2>No Results Found</h2>
        <p>No inspection results found for this template.</p>
        <button onClick={() => navigate('/dashboard')} className="tr-back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="tr-results-wrapper">
      <div className="tr-results-container">
        {/* Header */}
        <div className="tr-header">
          <div className="tr-header-left">
            <button 
              onClick={() => navigate(`/template/${templateId}`)} 
              className="tr-back-btn"
            >
              <ArrowLeft size={20} />
              Back to Template
            </button>
            <div className="tr-header-info">
              <h1>Inspection Results</h1>
              <h2>{resultsData.template.title}</h2>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="tr-template-info">
          <div className="tr-info-card">
            <h3>Template Information</h3>
            <div className="tr-info-grid">
              <div className="tr-info-item">
                <span className="tr-info-label">Created By:</span>
                <span className="tr-info-value">{resultsData.template.created_by}</span>
              </div>
              <div className="tr-info-item">
                <span className="tr-info-label">Created:</span>
                <span className="tr-info-value">{formatDate(resultsData.template.created_at)}</span>
              </div>
              <div className="tr-info-item">
                <span className="tr-info-label">Total Inspections:</span>
                <span className="tr-info-value">{resultsData.total_inspections}</span>
              </div>
              <div className="tr-info-item">
                <span className="tr-info-label">Description:</span>
                <span className="tr-info-value">{resultsData.template.description || 'No description'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inspections List */}
        <div className="tr-inspections-section">
          <h3>Inspection Reports</h3>
          {resultsData.inspections.length === 0 ? (
            <div className="tr-no-inspections">
              <FileText size={48} />
              <p>No inspections have been completed for this template yet.</p>
            </div>
          ) : (
            <div className="tr-inspections-grid">
              {resultsData.inspections.map((inspection) => (
                <div key={inspection.id} className="tr-inspection-card">
                  <div className="tr-card-header">
                    <h4>{inspection.title}</h4>
                    {getStatusBadge(inspection.status)}
                  </div>
                  
                  <div className="tr-card-content">
                    <div className="tr-card-info">
                      <div className="tr-card-item">
                        <User size={16} />
                        <span>Conducted by: {inspection.conducted_by}</span>
                      </div>
                      <div className="tr-card-item">
                        <Calendar size={16} />
                        <span>Date: {formatDate(inspection.conducted_at)}</span>
                      </div>
                      <div className="tr-card-item">
                        <MapPin size={16} />
                        <span>Location: {inspection.location}</span>
                      </div>
                      {inspection.site && (
                        <div className="tr-card-item">
                          <MapPin size={16} />
                          <span>Site: {inspection.site}</span>
                        </div>
                      )}
                      {inspection.has_garment_data && (
                        <div className="tr-card-item">
                          <FileText size={16} />
                          <span>Includes garment inspection data</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="tr-card-actions">
                    <button
                      onClick={() => navigate(`/inspection-report/${inspection.id}`)}
                      className="tr-view-report-btn"
                    >
                      <Eye size={16} />
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateResults;
