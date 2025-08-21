import React from 'react';

const SkillSelector = ({ skillInput, onSkillChange, skillList }) => {
  const isManualMode = skillInput === '__manual__';
  
  return (
    <div>
      <label htmlFor="skill-dropdown">Skill:</label>
      <select
        id="skill-dropdown"
        value={isManualMode ? '__manual__' : skillInput}
        onChange={onSkillChange}
      >
        <option value="">--Select a skill--</option>
        {skillList.map(skill => (
          <option key={skill} value={skill}>{skill}</option>
        ))}
        <option value="__manual__">Other (enter manually)</option>
      </select>
      {isManualMode && (
        <input
          type="text"
          id="skill-input"
          value=""
          onChange={onSkillChange}
          placeholder="Enter skill name"
          style={{ marginLeft: '8px' }}
        />
      )}
    </div>
  );
};

export default SkillSelector;