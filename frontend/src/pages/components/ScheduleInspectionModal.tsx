import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Info, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './ScheduleInspectionModal.css';
import { fetchCSRFToken } from '../../utils/csrf';

interface Template {
  id: number;
  title: string;
  description?: string;
}

interface Inspector {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface ScheduleInspectionModalProps {
  onClose: () => void;
  onAssignmentCreated?: () => void;
}

const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({ onClose, onAssignmentCreated }) => {
  const [formData, setFormData] = useState({
    template: '',
    site: '',
    asset: '',
    assignedTo: '',
    howOften: 'Once',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    title: 'Once',
    allowLateSubmission: true,
    dueDate: '',
    notes: ''
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load templates and inspectors on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load templates
        const templatesResponse = await axios.get('/api/users/templates/', {
          withCredentials: true
        });
        setTemplates(templatesResponse.data);

        // Load inspectors
        const inspectorsResponse = await axios.get('/api/users/inspectors/', {
          withCredentials: true
        });
        setInspectors(inspectorsResponse.data);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load templates and inspectors');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreate = async () => {
    if (!formData.template || !formData.assignedTo) {
      setError('Please select both a template and an inspector');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const csrfToken = await fetchCSRFToken();

      // Create a comprehensive assignment with all form data
      const assignmentData = {
        template_id: parseInt(formData.template),
        assigned_to_id: parseInt(formData.assignedTo),
        due_date: formData.dueDate || null,
        notes: formData.notes || '',
        // Include scheduling details in notes for now
        schedule_details: {
          site: formData.site,
          asset: formData.asset,
          frequency: formData.howOften,
          start_time: formData.startTime,
          end_time: formData.endTime,
          title: formData.title,
          allow_late_submission: formData.allowLateSubmission
        }
      };

      // Combine notes with schedule details
      let combinedNotes = formData.notes || '';
      if (formData.site || formData.asset || formData.title !== 'Once') {
        const scheduleInfo = [];
        if (formData.site) scheduleInfo.push(`Site: ${formData.site}`);
        if (formData.asset) scheduleInfo.push(`Asset: ${formData.asset}`);
        if (formData.title !== 'Once') scheduleInfo.push(`Title: ${formData.title}`);
        scheduleInfo.push(`Frequency: ${formData.howOften}`);
        scheduleInfo.push(`Time: ${formData.startTime} - ${formData.endTime}`);
        if (formData.allowLateSubmission) scheduleInfo.push('Late submissions allowed');

        const scheduleText = `Schedule Details:\n${scheduleInfo.join('\n')}`;
        combinedNotes = combinedNotes ? `${combinedNotes}\n\n${scheduleText}` : scheduleText;
      }

      console.log('🔍 Form data before processing:', formData);
      console.log('🔍 Template value:', formData.template, 'Type:', typeof formData.template);
      console.log('🔍 AssignedTo value:', formData.assignedTo, 'Type:', typeof formData.assignedTo);
      console.log('🔍 parseInt(template):', parseInt(formData.template));
      console.log('🔍 parseInt(assignedTo):', parseInt(formData.assignedTo));

      // Validate and parse the IDs
      const templateId = parseInt(formData.template);
      const assignedToId = parseInt(formData.assignedTo);

      if (isNaN(templateId) || isNaN(assignedToId)) {
        console.error('🔍 Invalid template or assignedTo ID:', {
          template: formData.template,
          assignedTo: formData.assignedTo,
          templateId,
          assignedToId
        });
        setError('Please select both a template and an inspector.');
        return;
      }

      const finalAssignmentData = {
        template_id: templateId,
        assigned_to_id: assignedToId,
        due_date: formData.dueDate || null,
        notes: combinedNotes
      };

      console.log('🔍 Final assignment data being sent:', finalAssignmentData);

      await axios.post('/api/users/template-assignments/', finalAssignmentData, {
        withCredentials: true,
        headers: {
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/json'
        }
      });

      // Call the callback to refresh the parent component
      if (onAssignmentCreated) {
        onAssignmentCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError('Failed to create schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <h2>Schedule Inspection</h2>
          <button className="schedule-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="schedule-modal-content">
          {error && (
            <div className="schedule-error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="schedule-loading">Loading templates and inspectors...</div>
          ) : (
            <div className="schedule-form">
              {/* Template Field */}
              <div className="schedule-form-group">
                <label htmlFor="template">Template</label>
                <div className="schedule-select-container">
                  <select
                    id="template"
                    value={formData.template}
                    onChange={(e) => handleInputChange('template', e.target.value)}
                    className="schedule-select"
                    disabled={isSubmitting}
                  >
                    <option value="">Add template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id.toString()}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="schedule-select-icon" />
                </div>
                <div className="schedule-warning">
                  <Info size={16} />
                  <span>You have locked templates in your templates list</span>
                </div>
                <div className="schedule-warning-sub">Your free plan only allows for 5 active templates</div>
              </div>

              {/* Site Field */}
              <div className="schedule-form-group">
                <label htmlFor="site">Site</label>
                <div className="schedule-select-container">
                  <select
                    id="site"
                    value={formData.site}
                    onChange={(e) => handleInputChange('site', e.target.value)}
                    className="schedule-select"
                    disabled={isSubmitting}
                  >
                    <option value="">Select</option>
                    <option value="site1">Site 1</option>
                    <option value="site2">Site 2</option>
                  </select>
                  <ChevronDown size={16} className="schedule-select-icon" />
                </div>
              </div>

              {/* Asset Field */}
              <div className="schedule-form-group">
                <label htmlFor="asset">Asset</label>
                <div className="schedule-select-container">
                  <select
                    id="asset"
                    value={formData.asset}
                    onChange={(e) => handleInputChange('asset', e.target.value)}
                    className="schedule-select"
                    disabled={isSubmitting}
                  >
                    <option value="">Select</option>
                    <option value="asset1">Asset 1</option>
                    <option value="asset2">Asset 2</option>
                  </select>
                  <ChevronDown size={16} className="schedule-select-icon" />
                </div>
              </div>

              {/* Assigned to Field */}
              <div className="schedule-form-group">
                <label htmlFor="assignedTo">Assigned to</label>
                <div className="schedule-select-container">
                  <select
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className="schedule-select"
                    disabled={isSubmitting}
                  >
                    <option value="">Assignee</option>
                    {inspectors.map((inspector) => (
                      <option key={inspector.id} value={inspector.id.toString()}>
                        {inspector.first_name && inspector.last_name
                          ? `${inspector.first_name} ${inspector.last_name} (${inspector.email})`
                          : `${inspector.username} (${inspector.email})`
                        }
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="schedule-select-icon" />
                </div>
              </div>

              {/* How often Field */}
              <div className="schedule-form-group">
                <label htmlFor="howOften">How often</label>
                <div className="schedule-select-container">
                  <select
                    id="howOften"
                    value={formData.howOften}
                    onChange={(e) => handleInputChange('howOften', e.target.value)}
                    className="schedule-select"
                    disabled={isSubmitting}
                  >
                    <option value="Once">Once</option>
                    <option value="Every day">Every day</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <ChevronDown size={16} className="schedule-select-icon" />
                </div>
              </div>

              {/* Time Fields */}
              <div className="schedule-time-row">
                <div className="schedule-form-group">
                  <div className="schedule-select-container">
                    <select
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="schedule-select"
                      disabled={isSubmitting}
                    >
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                    </select>
                    <ChevronDown size={16} className="schedule-select-icon" />
                  </div>
                </div>
                <div className="schedule-form-group">
                  <div className="schedule-select-container">
                    <select
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="schedule-select"
                      disabled={isSubmitting}
                    >
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                      <option value="7:00 PM">7:00 PM</option>
                    </select>
                    <ChevronDown size={16} className="schedule-select-icon" />
                  </div>
                </div>
              </div>

              <div className="schedule-date-info">First schedule starts on 29 May 2025.</div>

              {/* Checkbox */}
              <div className="schedule-checkbox-group">
                <input
                  type="checkbox"
                  id="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onChange={(e) => handleInputChange('allowLateSubmission', e.target.checked)}
                  className="schedule-checkbox"
                  disabled={isSubmitting}
                />
                <label htmlFor="allowLateSubmission">
                  Allow inspections to be submitted after the due date
                  <Info size={16} className="schedule-info-icon" />
                </label>
              </div>

              {/* Title Field */}
              <div className="schedule-form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="schedule-input"
                  placeholder="Once"
                  disabled={isSubmitting}
                />
              </div>

              {/* Additional Fields for Assignment */}
              <div className="schedule-form-group">
                <label htmlFor="dueDate">Due Date (Optional)</label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="schedule-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="schedule-form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="schedule-textarea"
                  placeholder="Add any additional notes for the inspector..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

        </div>

        <div className="schedule-modal-footer">
          <button
            className="schedule-cancel-button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="schedule-create-button"
            onClick={handleCreate}
            disabled={isSubmitting || loading || !formData.template || !formData.assignedTo}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInspectionModal;
