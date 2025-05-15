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
}

const SimpleLogicRules: React.FC<SimpleLogicRulesProps> = ({ onClose, rules, onRulesChange }) => {
  const [required, setRequired] = useState(false);
  const [flag, setFlag] = useState(false);
  const [activeTriggerIndex, setActiveTriggerIndex] = useState<number | null>(null);
  const triggerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerMenuRef.current && !triggerMenuRef.current.contains(event.target as Node)) {
        setActiveTriggerIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleAddTrigger = (index: number) => {
    setActiveTriggerIndex(index);
  };

  const handleSelectTrigger = (index: number, trigger: TriggerAction) => {
    const newRules = [...rules];
    newRules[index].trigger = trigger;
    onRulesChange(newRules);
    setActiveTriggerIndex(null);
  };

  // Store the position of the trigger button for positioning the menu
  const [triggerButtonRect, setTriggerButtonRect] = useState<DOMRect | null>(null);

  // Function to handle the trigger button click and store its position
  const handleTriggerButtonClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setTriggerButtonRect(buttonRect);
    handleAddTrigger(index);
  };

  return (
    <>
      <div className="Logic-Rules">
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
                    <button
                      className="Logic-Rules-add-trigger"
                      onClick={(e) => handleTriggerButtonClick(index, e)}
                    >
                      <Plus size={16} /> Add trigger
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          <div className="Logic-Rules-checkbox-group">
            <div className="Logic-Rules-checkbox">
              <input
                type="checkbox"
                id="required-checkbox"
                checked={required}
                onChange={() => setRequired(!required)}
              />
              <label htmlFor="required-checkbox">Required</label>
            </div>
            <div className="Logic-Rules-checkbox">
              <input
                type="checkbox"
                id="flag-checkbox"
                checked={flag}
                onChange={() => setFlag(!flag)}
              />
              <label htmlFor="flag-checkbox">Flag</label>
            </div>
          </div>
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

      {/* Render the trigger menu outside the main container */}
      {activeTriggerIndex !== null && triggerButtonRect && (
        <div
          className="Logic-Rules-trigger-menu-external"
          ref={triggerMenuRef}
          style={{
            position: 'fixed',
            top: `${triggerButtonRect.top}px`,
            left: `${triggerButtonRect.left + triggerButtonRect.width + 5}px`,
            zIndex: 1100
          }}
        >
          <div
            className="Logic-Rules-trigger-option"
            onClick={() => handleSelectTrigger(activeTriggerIndex, "require_action")}
          >
            <FileText size={16} className="trigger-icon" />
            <div className="trigger-option-content">
              <div className="trigger-option-title">Require action</div>
              <div className="trigger-option-description">Require the user to take an action</div>
            </div>
          </div>

          <div
            className="Logic-Rules-trigger-option"
            onClick={() => handleSelectTrigger(activeTriggerIndex, "require_evidence")}
          >
            <Upload size={16} className="trigger-icon" />
            <div className="trigger-option-content">
              <div className="trigger-option-title">Require evidence</div>
              <div className="trigger-option-description">Require the user to upload evidence</div>
            </div>
          </div>

          <div
            className="Logic-Rules-trigger-option"
            onClick={() => handleSelectTrigger(activeTriggerIndex, "notify")}
          >
            <Bell size={16} className="trigger-icon" />
            <div className="trigger-option-content">
              <div className="trigger-option-title">Notify</div>
              <div className="trigger-option-description">Send a notification</div>
            </div>
          </div>

          <div
            className="Logic-Rules-trigger-option"
            onClick={() => handleSelectTrigger(activeTriggerIndex, "ask_questions")}
          >
            <MessageSquare size={16} className="trigger-icon" />
            <div className="trigger-option-content">
              <div className="trigger-option-title">Ask questions</div>
              <div className="trigger-option-description">Ask follow-up questions</div>
            </div>
          </div>

          <div
            className="Logic-Rules-trigger-option"
            onClick={() => handleSelectTrigger(activeTriggerIndex, "display_message")}
          >
            <MessageSquare size={16} className="trigger-icon" />
            <div className="trigger-option-content">
              <div className="trigger-option-title">Display message</div>
              <div className="trigger-option-description">Show a message to the user</div>
            </div>
          </div>
        </div>
      )}
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
