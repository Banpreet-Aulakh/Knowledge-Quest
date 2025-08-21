import React from 'react';

const SkillsButton = ({ onClick }) => {
  return (
    <button id="open-skills-modal" onClick={onClick}>
      Skills
    </button>
  );
};

export default SkillsButton;
