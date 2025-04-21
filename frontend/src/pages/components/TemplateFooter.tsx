import React from 'react';
import { Save, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import './TemplateFooter.css';

export type TemplateStatus = 'draft' | 'published';

interface TemplateFooterProps {
  activeTab: number;
  templateStatus: TemplateStatus;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isValid: boolean;
  validationErrors?: string[];
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
}

const TemplateFooter: React.FC<TemplateFooterProps> = ({
  activeTab,
  templateStatus,
  isSaving,
  hasUnsavedChanges,
  isValid,
  validationErrors = [],
  onSave,
  onPublish,
  onPreview
}) => {
  // Determine which buttons to show based on the active tab
  const showSaveButton = hasUnsavedChanges || activeTab === 0; // Always show on Build tab
  const showPreviewButton = activeTab === 0; // Only on Build tab
  const showPublishButton = isValid && (templateStatus === 'draft' || hasUnsavedChanges);
  
  // Get tab-specific messages
  const getTabMessage = () => {
    switch (activeTab) {
      case 0: // Build
        return "Build your template by adding sections and questions";
      case 1: // Preview
        return "Preview how your template will look on mobile devices";
      case 2: // Report
        return "Configure how reports will be generated from this template";
      case 3: // Access
        return "Manage who can access and edit this template";
      default:
        return "";
    }
  };
  
  return (
    <div className="template-footer">
      <div className="footer-content">
        <div className="footer-status">
          {!isValid && (
            <div className="validation-error">
              <AlertCircle size={16} />
              <span>
                {validationErrors.length > 0 
                  ? validationErrors[0] 
                  : "Please fix validation errors before publishing"}
              </span>
            </div>
          )}
          
          {isValid && templateStatus === 'published' && (
            <div className="published-status">
              <CheckCircle size={16} />
              <span>Template published</span>
            </div>
          )}
          
          {isValid && templateStatus === 'draft' && (
            <div className="draft-status">
              <span>Draft</span>
            </div>
          )}
          
          <div className="tab-message">
            {getTabMessage()}
          </div>
        </div>
        
        <div className="footer-actions">
          {showPreviewButton && (
            <button 
              className="preview-button" 
              onClick={onPreview}
            >
              <Eye size={16} />
              Preview
            </button>
          )}
          
          {showSaveButton && (
            <button 
              className="save-button" 
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save"}
            </button>
          )}
          
          <button 
            className="publish-button" 
            onClick={onPublish}
            disabled={!isValid || (!hasUnsavedChanges && templateStatus === 'published')}
          >
            <CheckCircle size={16} />
            {templateStatus === 'published' && !hasUnsavedChanges ? "Published" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateFooter;
