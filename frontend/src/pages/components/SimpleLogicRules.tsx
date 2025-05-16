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
}

const SimpleLogicRules: React.FC<SimpleLogicRulesProps> = ({ onClose, rules, onRulesChange, buttonPosition }) => {
  const [activeTriggerIndex, setActiveTriggerIndex] = useState<number | null>(null);
  const triggerMenuRef = useRef<HTMLDivElement>(null);

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
          const buttonRect = buttonElement.getBoundingClientRect();
          const availableSpaceRight = window.innerWidth - buttonRect.right;
          const availableSpaceBelow = window.innerHeight - buttonRect.bottom;

          let top = availableSpaceBelow > 300 ? buttonRect.bottom + 5 : buttonRect.top - 300 - 5;
          let left = availableSpaceRight > 300 ? buttonRect.left : Math.max(10, buttonRect.right - 300);

          // Make sure the menu doesn't go off the screen
          top = Math.max(10, Math.min(top, window.innerHeight - 310));
          left = Math.max(10, Math.min(left, window.innerWidth - 310));

          setTriggerMenuPosition({ top, left });
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      // Clean up refs when component unmounts
      triggerButtonRefs.current = [];
    };
  }, [activeTriggerIndex]);

  const handleAddRule = () => {
    const newRule: LogicRule = {
      id: `rule_${Math.random().toString(36).substring(2, 9)}`,
      condition: "is",
      value: null,
      trigger: null
    };
    onRulesChange([...rules, newRule]);
  };

  const handleDeleteRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
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
      // Get the button's position and dimensions
      const buttonRect = buttonElement.getBoundingClientRect();

      // Calculate the available space to the right and below
      const availableSpaceRight = window.innerWidth - buttonRect.right;
      const availableSpaceBelow = window.innerHeight - buttonRect.bottom;

      // Determine the best position for the menu
      // If there's enough space below, position it there, otherwise position it above
      let top = availableSpaceBelow > 300 ? buttonRect.bottom + 5 : buttonRect.top - 300 - 5;

      // If there's enough space to the right, position it there, otherwise position it to the left
      let left = availableSpaceRight > 300 ? buttonRect.left : Math.max(10, buttonRect.right - 300);

      // Make sure the menu doesn't go off the screen
      top = Math.max(10, Math.min(top, window.innerHeight - 310));
      left = Math.max(10, Math.min(left, window.innerWidth - 310));

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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1040
        }}
      />
      <div
        className="Logic-Rules"
        style={{
          top: buttonPosition ? `${buttonPosition.top + buttonPosition.height + 10}px` : '50%',
          left: buttonPosition ? `${buttonPosition.left}px` : '50%',
          transform: buttonPosition ? 'none' : 'translate(-50%, -50%)'
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
                    <option value="is">is</option>
                    <option value="is not">is not</option>
                    <option value="contains">contains</option>
                    <option value="not contains">not contains</option>
                  </select>
                  <input
                    type="text"
                    className="Logic-Rules-input"
                    placeholder="Enter value"
                    value={rule.value as string || ''}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  />
                  <button className="Logic-Rules-delete" onClick={() => handleDeleteRule(index)}>
                    <X size={16} />
                  </button>
                </div>
                <div className="Logic-Rules-then">then</div>
                <div className="Logic-Rules-trigger">
                  {rule.trigger ? (
                    <div className="Logic-Rules-selected-trigger">
                      {rule.trigger === "require_action" && "Require action"}
                      {rule.trigger === "require_evidence" && "Require evidence"}
                      {rule.trigger === "notify" && "Notify"}
                      {rule.trigger === "ask_questions" && "Ask questions"}
                      {rule.trigger === "display_message" && "Display message"}
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <button
                        className="Logic-Rules-add-trigger"
                        onClick={(e) => handleTriggerButtonClick(index, e)}
                        ref={(el) => { triggerButtonRefs.current[index] = el; }}
                      >
                        <Plus size={16} /> Add trigger
                      </button>

                      {activeTriggerIndex === index && (
                        <div
                          className="Logic-Rules-trigger-menu-external"
                          ref={triggerMenuRef}
                          style={{
                            position: 'fixed',
                            top: `${triggerMenuPosition?.top || 0}px`,
                            left: `${triggerMenuPosition?.left || 0}px`,
                            zIndex: 1100
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
                  )}
                </div>
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
      Edit logic
    </button>
  );
};

export default SimpleLogicRules;
