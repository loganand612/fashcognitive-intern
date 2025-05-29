import React, { useState } from 'react';
import { X, ChevronDown, Info } from 'lucide-react';
import './ScheduleInspectionModal.css';

interface ScheduleInspectionModalProps {
  onClose: () => void;
}

const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    template: '',
    site: '',
    asset: '',
    assignedTo: '',
    howOften: 'Every day',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    title: 'Every day',
    allowLateSubmission: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreate = () => {
    // Handle form submission logic here
    console.log('Creating schedule with data:', formData);
    onClose();
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
                >
                  <option value="">Add template...</option>
                  <option value="template1">Template 1</option>
                  <option value="template2">Template 2</option>
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
                >
                  <option value="">Assignee</option>
                  <option value="user1">User 1</option>
                  <option value="user2">User 2</option>
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
                >
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
                placeholder="Every day"
              />
            </div>
          </div>
        </div>

        <div className="schedule-modal-footer">
          <button className="schedule-cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button className="schedule-create-button" onClick={handleCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInspectionModal;
