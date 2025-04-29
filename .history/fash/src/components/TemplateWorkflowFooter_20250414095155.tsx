import React from 'react';
import { ArrowRight, CheckCircle, Smartphone } from 'lucide-react';
import './TemplateWorkflowFooter.css';

interface TemplateWorkflowFooterProps {
  activeTab: number;
  onNext: () => void;
  onPublish: () => void;
  onPreview: () => void;
  isPublishing?: boolean;
}

const TemplateWorkflowFooter: React.FC<TemplateWorkflowFooterProps> = ({
  activeTab,
  onNext,
  onPublish,
  onPreview,
  isPublishing = false
}) => {
  // Determine which button to show based on the active tab
  const showNextButton = activeTab < 3; // Show Next on Build (0) and Report (2) tabs
  const showPublishButton = activeTab === 3; // Show Publish only on Access (3) tab

  return (
    <div className="template-workflow-footer">
      <div className="footer-content">
        <div className="footer-message">
          {activeTab === 0 && "Step 1: Build your template by adding sections and questions"}
          {activeTab === 2 && "Step 2: Configure how reports will be generated from this template"}
          {activeTab === 3 && "Step 3: Manage who can access and edit this template"}
        </div>

        <div className="footer-actions">
          {activeTab === 0 && (
            <button
              className="preview-button"
              onClick={onPreview}
            >
              Preview
              <Smartphone size={16} />
            </button>
          )}

          {showNextButton && (
            <button
              className="next-button"
              onClick={onNext}
            >
              Next
              <ArrowRight size={16} />
            </button>
          )}

          {showPublishButton && (
            <button
              className="publish-button"
              onClick={onPublish}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publish Template"}
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateWorkflowFooter;
