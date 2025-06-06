import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, CornerDownRight, Equal, CircleEqual, CircleSlash, FileText, Bell, MessageSquare, Upload } from 'lucide-react';
import '../../pages/LogicRules.css';

type ResponseType =
  | "Site"
  | "Inspection date"
  | "Person"
  | "Inspection location"
  | "Text"
  | "Number"
  | "Checkbox"
  | "Yes/No"
  | "Multiple choice"
  | "Slider"
  | "Media"
  | "Annotation"
  | "Date & Time";

type LogicCondition =
  | "is"
  | "is not"
  | "contains"
  | "not contains"
  | "starts with"
  | "ends with"
  | "matches (regex)"
  | "less than"
  | "less than or equal to"
  | "equal to"
  | "not equal to"
  | "greater than or equal to"
  | "greater than"
  | "between"
  | "not between"
  | "is one of"
  | "is not one of";

type TriggerAction = "require_action" | "require_evidence" | "notify" | "ask_questions" | "display_message";

interface LogicRule {
  id: string;
  condition: LogicCondition;
  value: string | number | string[] | [number, number] | null;
  trigger: TriggerAction | null;
  message?: string;
  subQuestion?: {
    text: string;
    responseType: ResponseType;
  };
}

interface SimpleLogicRulesProps {
  onClose: () => void;
  rules: LogicRule[];
  onRulesChange: (rules: LogicRule[]) => void;
  buttonPosition?: { top: number; left: number; width: number; height: number };
  questionType?: ResponseType; // Add question type to customize logic conditions
}

const SimpleLogicRules: React.FC<SimpleLogicRulesProps> = ({ onClose, rules, onRulesChange, buttonPosition, questionType = "Text" }) => {
  const [activeTriggerIndex, setActiveTriggerIndex] = useState<number | null>(null);
  const triggerMenuRef = useRef<HTMLDivElement>(null);

  // We don't need a separate backdrop for the trigger menu anymore
  // since it will be positioned relative to the main dialog

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close the trigger menu if clicking outside of it
      if (
        activeTriggerIndex !== null &&
        triggerMenuRef.current &&
        !triggerMenuRef.current.contains(event.target as Node)
      ) {
        // Check if the click was on the trigger button itself
        const triggerButton = triggerButtonRefs.current[activeTriggerIndex];
        if (!triggerButton || !triggerButton.contains(event.target as Node)) {
          setActiveTriggerIndex(null);
        }
      }
    };

    // Handle window resize to reposition the menu if needed
    const handleResize = () => {
      if (activeTriggerIndex !== null) {
        const buttonElement = triggerButtonRefs.current[activeTriggerIndex];
        if (buttonElement) {
          // Get the button's position and dimensions relative to the viewport
          const buttonRect = buttonElement.getBoundingClientRect();

          // Get the parent dialog for reference
          const parentDialog = buttonElement.closest('.Logic-Rules');
          const parentRect = parentDialog ? parentDialog.getBoundingClientRect() : null;

          // Calculate the available space to the right and below
          const availableSpaceRight = window.innerWidth - buttonRect.right;
          const availableSpaceBelow = window.innerHeight - buttonRect.bottom;

          // Position the menu outside the main dialog
          // By default, position it to the right of the main dialog
          let left = parentRect ? parentRect.right + 10 : buttonRect.right + 10; // 10px offset from the dialog
          let top = buttonRect.top; // Align with the button vertically

          // If there's not enough space to the right of the dialog, position it below the button
          if (availableSpaceRight < 330) { // 330 = menu width (320) + offset (10)
            left = Math.max(10, buttonRect.left);
            top = buttonRect.bottom - 40; // Position it higher by using -40 instead of -20
          }

          // If there's not enough space below, position it above the button
          if (top + 300 > window.innerHeight && buttonRect.top > 300) {
            top = Math.max(10, buttonRect.top - 300);
          }

          // Make sure the menu doesn't go off the screen
          left = Math.min(left, window.innerWidth - 330);

          setTriggerMenuPosition({ top, left });
        }
      }
    };

    // Handle scroll to reposition the menu
    const handleScroll = () => {
      // Reuse the same logic as handleResize
      handleResize();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      // Clean up refs when component unmounts
      triggerButtonRefs.current = [];
    };
  }, [activeTriggerIndex]);

  // Get available conditions based on question type
  const getAvailableConditions = (type: ResponseType): LogicCondition[] => {
    switch (type) {
      case "Text":
        return ["is", "is not", "contains", "not contains", "starts with", "ends with", "matches (regex)"];
      case "Number":
      case "Slider":
        return [
          "less than",
          "less than or equal to",
          "equal to",
          "not equal to",
          "greater than or equal to",
          "greater than",
          "between",
          "not between",
        ];
      case "Checkbox":
      case "Yes/No":
        return ["is", "is not"];
      case "Multiple choice":
        return ["is", "is not", "is one of", "is not one of"];
      default:
        return ["is", "is not"];
    }
  };

  const handleAddRule = () => {
    // Set default condition based on question type
    const defaultCondition: LogicCondition =
      questionType === "Number" || questionType === "Slider" ? "equal to" : "is";

    const newRule: LogicRule = {
      id: `rule_${Math.random().toString(36).substring(2, 9)}`,
      condition: defaultCondition,
      value: null,
      trigger: null
    };
    onRulesChange([...rules, newRule]);
  };

  const handleDeleteRule = (index: number) => {
    if (window.confirm('Are you sure you want to delete this logic rule?')) {
      const newRules = [...rules];
      newRules.splice(index, 1);
      // Close any open trigger menus
      setActiveTriggerIndex(null);
      setTriggerMenuPosition(null);
      onRulesChange(newRules);
    }
  };

  const handleRemoveTrigger = (index: number) => {
    const newRules = [...rules];
    newRules[index].trigger = null;
    // Clear trigger-specific properties
    delete newRules[index].message;
    delete newRules[index].subQuestion;
    // Close any open trigger menus
    setActiveTriggerIndex(null);
    setTriggerMenuPosition(null);
    onRulesChange(newRules);
  };

  const handleConditionChange = (index: number, condition: LogicCondition) => {
    const newRules = [...rules];
    newRules[index].condition = condition;
    onRulesChange(newRules);
  };

  const handleValueChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index].value = value;
    onRulesChange(newRules);
  };

  const handleAddTrigger = (index: number | null) => {
    // If the index is already active, toggle it off
    if (activeTriggerIndex === index) {
      setActiveTriggerIndex(null);
    } else {
      setActiveTriggerIndex(index);
    }
  };

  const handleSelectTrigger = (index: number, trigger: TriggerAction) => {
    const newRules = [...rules];
    newRules[index].trigger = trigger;

    // Initialize subQuestion for ask_questions trigger
    if (trigger === "ask_questions") {
      newRules[index].subQuestion = {
        text: "Please provide additional information",
        responseType: "Text"
      };
    } else {
      // Clear subQuestion for other triggers
      delete newRules[index].subQuestion;
    }

    // Initialize or clear message property based on trigger type
    if (trigger === "display_message") {
      newRules[index].message = newRules[index].message || "";
    } else if (trigger === "require_action") {
      newRules[index].message = newRules[index].message || "";
    } else {
      // Clear message for triggers that don't use it
      delete newRules[index].message;
    }

    onRulesChange(newRules);
    setActiveTriggerIndex(null);
  };

  // Store the position of the trigger button for positioning the menu
  const [triggerMenuPosition, setTriggerMenuPosition] = useState<{top: number, left: number} | null>(null);
  const triggerButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Function to close the trigger menu
  const closeTriggerMenu = () => {
    setActiveTriggerIndex(null);
    setTriggerMenuPosition(null);
  };

  // Function to handle the trigger button click
  const handleTriggerButtonClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent event propagation to avoid closing the menu immediately
    event.stopPropagation();

    // Get the button element that was clicked
    const buttonElement = triggerButtonRefs.current[index];

    if (buttonElement) {
      // Get the button's position and dimensions relative to the viewport
      const buttonRect = buttonElement.getBoundingClientRect();

      // Get the parent dialog for reference
      const parentDialog = buttonElement.closest('.Logic-Rules');
      const parentRect = parentDialog ? parentDialog.getBoundingClientRect() : null;

      // Calculate the available space to the right and below
      const availableSpaceRight = window.innerWidth - buttonRect.right;
      const availableSpaceBelow = window.innerHeight - buttonRect.bottom;

      // Position the menu outside the main dialog
      // By default, position it to the right of the main dialog
      let left = parentRect ? parentRect.right + 10 : buttonRect.right + 10; // 10px offset from the dialog
      let top = buttonRect.top; // Align with the button vertically

      // If there's not enough space to the right of the dialog, position it below the button
      if (availableSpaceRight < 510) { // 510 = menu width (500) + offset (10)
        left = Math.max(10, buttonRect.left);
        top = buttonRect.bottom - 40; // Position it higher by using -40 instead of -20
      }

      // If there's not enough space below, position it above the button
      if (top + 300 > window.innerHeight && buttonRect.top > 300) {
        top = Math.max(10, buttonRect.top - 300);
      }

      // Make sure the menu doesn't go off the screen
      left = Math.min(left, window.innerWidth - 510);

      setTriggerMenuPosition({ top, left });
    }

    // Set the active trigger index
    handleAddTrigger(index);
  };

  return (
    <>
      <div
        className="Logic-Rules-backdrop"
        onClick={onClose}
      />
      <div
        className="Logic-Rules"
        style={{
          position: 'absolute',
          top: buttonPosition ? `${buttonPosition.top - 20}px` : '50%', /* Subtract 20px to move it higher */
          left: buttonPosition ? `${buttonPosition.left}px` : '50%',
          transform: buttonPosition ? 'none' : 'translate(-50%, -50%)',
          maxHeight: '80vh',
          zIndex: 1100
        }}
      >
        <div className="Logic-Rules-header">
          <div className="Logic-Rules-title">Logic Rules</div>
          <button className="Logic-Rules-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="Logic-Rules-content">
          {rules.length === 0 ? (
            <div className="Logic-Rules-empty">
              <p>No rules added yet. Add your first rule below.</p>
            </div>
          ) : (
            rules.map((rule, index) => (
              <div key={rule.id}>
                <div className="Logic-Rules-if">If answer</div>
                <div className="Logic-Rules-condition">
                  <div className="Logic-Rules-condition-operator">
                    {rule.condition === "is" ? <CircleEqual size={18} /> :
                     rule.condition === "is not" ? <CircleSlash size={18} /> :
                     <Equal size={18} />}
                  </div>
                  <select
                    className="Logic-Rules-condition-dropdown"
                    value={rule.condition}
                    onChange={(e) => handleConditionChange(index, e.target.value as LogicCondition)}
                  >
                    {getAvailableConditions(questionType).map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                  {/* Render different input types based on question type */}
                  {questionType === "Number" || questionType === "Slider" ? (
                    <input
                      type="number"
                      className="Logic-Rules-input"
                      placeholder="Enter value"
                      value={rule.value as number || ''}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                    />
                  ) : questionType === "Yes/No" ? (
                    <select
                      className="Logic-Rules-input"
                      value={rule.value as string || ''}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                    >
                      <option value="">Select value</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="N/A">N/A</option>
                    </select>
                  ) : questionType === "Checkbox" ? (
                    <select
                      className="Logic-Rules-input"
                      value={rule.value as string || ''}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                    >
                      <option value="">Select value</option>
                      <option value="true">Checked</option>
                      <option value="false">Unchecked</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="Logic-Rules-input"
                      placeholder="Enter value"
                      value={rule.value as string || ''}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                    />
                  )}
                  <button className="Logic-Rules-delete" onClick={() => handleDeleteRule(index)}>
                    <X size={16} />
                  </button>
                </div>
                <div className="Logic-Rules-then">then</div>
                <div className="Logic-Rules-trigger">
                  {rule.trigger ? (
                    <div className="Logic-Rules-selected-trigger-container" style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="Logic-Rules-selected-trigger">
                        {rule.trigger === "require_action" && "Require action"}
                        {rule.trigger === "require_evidence" && "Require evidence"}
                        {rule.trigger === "notify" && "Notify"}
                        {rule.trigger === "ask_questions" && "Ask questions"}
                        {rule.trigger === "display_message" && "Display message"}
                      </div>
                      <button
                        className="Logic-Rules-remove-trigger"
                        onClick={() => handleRemoveTrigger(index)}
                        title="Remove trigger"
                        style={{
                          marginLeft: '8px',
                          padding: '4px',
                          border: 'none',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="trigger-container" style={{ position: 'relative' }}>
                      <button
                        className="Logic-Rules-add-trigger"
                        onClick={(e) => handleTriggerButtonClick(index, e)}
                        ref={(el) => { triggerButtonRefs.current[index] = el; }}
                      >
                        <Plus size={16} /> Add trigger
                      </button>
                    </div>
                  )}
                </div>

                {/* Configuration for require_action trigger */}
                {rule.trigger === "require_action" && (
                  <div className="Logic-Rules-config" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                        Action required message:
                      </label>
                      <input
                        type="text"
                        value={rule.message || ""}
                        onChange={(e) => {
                          const newRules = [...rules];
                          newRules[index].message = e.target.value;
                          onRulesChange(newRules);
                        }}
                        placeholder="Enter action required message"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Configuration for display_message trigger */}
                {rule.trigger === "display_message" && (
                  <div className="Logic-Rules-config" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                        Message to display:
                      </label>
                      <input
                        type="text"
                        value={rule.message || ""}
                        onChange={(e) => {
                          const newRules = [...rules];
                          newRules[index].message = e.target.value;
                          onRulesChange(newRules);
                        }}
                        placeholder="Enter message to display"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Configuration for ask_questions trigger */}
                {rule.trigger === "ask_questions" && (
                  <div className="Logic-Rules-config" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                        Follow-up question:
                      </label>
                      <input
                        type="text"
                        value={rule.subQuestion?.text || ""}
                        onChange={(e) => {
                          const newRules = [...rules];
                          if (!newRules[index].subQuestion) {
                            newRules[index].subQuestion = { text: "", responseType: "Text" };
                          }
                          newRules[index].subQuestion!.text = e.target.value;
                          onRulesChange(newRules);
                        }}
                        placeholder="Enter follow-up question"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                        Response type:
                      </label>
                      <select
                        value={rule.subQuestion?.responseType || "Text"}
                        onChange={(e) => {
                          const newRules = [...rules];
                          if (!newRules[index].subQuestion) {
                            newRules[index].subQuestion = { text: "", responseType: "Text" };
                          }
                          newRules[index].subQuestion!.responseType = e.target.value as ResponseType;
                          onRulesChange(newRules);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="Text">Text</option>
                        <option value="Number">Number</option>
                        <option value="Yes/No">Yes/No</option>
                        <option value="Multiple choice">Multiple choice</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTriggerIndex === index && (
                  <div
                    className="Logic-Rules-trigger-menu-external"
                    ref={triggerMenuRef}
                    style={{
                      top: `${triggerMenuPosition?.top || 0}px`,
                      left: `${triggerMenuPosition?.left || 0}px`,
                      zIndex: 1300
                    }}
                  >
                    <div
                      className="Logic-Rules-trigger-option"
                      onClick={() => handleSelectTrigger(index, "require_action")}
                    >
                      <FileText size={16} className="trigger-icon" />
                      <div className="trigger-option-content">
                        <div className="trigger-option-title">Require action</div>
                        <div className="trigger-option-description">Require the user to take an action</div>
                      </div>
                    </div>

                    <div
                      className="Logic-Rules-trigger-option"
                      onClick={() => handleSelectTrigger(index, "require_evidence")}
                    >
                      <Upload size={16} className="trigger-icon" />
                      <div className="trigger-option-content">
                        <div className="trigger-option-title">Require evidence</div>
                        <div className="trigger-option-description">Require the user to upload evidence</div>
                      </div>
                    </div>

                    <div
                      className="Logic-Rules-trigger-option"
                      onClick={() => handleSelectTrigger(index, "notify")}
                    >
                      <Bell size={16} className="trigger-icon" />
                      <div className="trigger-option-content">
                        <div className="trigger-option-title">Notify</div>
                        <div className="trigger-option-description">Send a notification</div>
                      </div>
                    </div>

                    <div
                      className="Logic-Rules-trigger-option"
                      onClick={() => handleSelectTrigger(index, "ask_questions")}
                    >
                      <MessageSquare size={16} className="trigger-icon" />
                      <div className="trigger-option-content">
                        <div className="trigger-option-title">Ask questions</div>
                        <div className="trigger-option-description">Ask follow-up questions</div>
                      </div>
                    </div>

                    <div
                      className="Logic-Rules-trigger-option"
                      onClick={() => handleSelectTrigger(index, "display_message")}
                    >
                      <MessageSquare size={16} className="trigger-icon" />
                      <div className="trigger-option-content">
                        <div className="trigger-option-title">Display message</div>
                        <div className="trigger-option-description">Show a message to the user</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="Logic-Rules-actions">
          <button className="Logic-Rules-add-rule" onClick={handleAddRule}>
            <Plus size={16} /> Add rule
          </button>
          <button className="Logic-Rules-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
};

export const EditLogicButton: React.FC<{
  hasRules: boolean;
  onClick: () => void;
}> = ({ hasRules, onClick }) => {
  return (
    <button
      className={`edit-logic-button ${hasRules ? 'has-rules' : ''}`}
      onClick={onClick}
    >
      <CornerDownRight size={16} className="logic-icon" />
      <span>{hasRules ? 'Edit logic' : 'Add logic'}</span>
      {hasRules && <span className="rules-badge">!</span>}
    </button>
  );
};

export default SimpleLogicRules;
