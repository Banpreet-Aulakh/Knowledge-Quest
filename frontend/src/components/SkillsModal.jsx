import React, { useState, useEffect } from 'react';
import './SkillsModal.css';

const SkillsModal = ({ isOpen, onClose }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen]);

  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/skills');
      if (!res.ok) throw new Error('Failed to fetch skills');
      const skillsData = await res.json();
      setSkills(skillsData);
    } catch (err) {
      setError('Error loading skills');
      console.error('Error fetching skills:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div id="skills-modal" onClick={onClose}>
        <div id="skills-modal-content" onClick={(e) => e.stopPropagation()}>
          <button id="close-skills-modal" onClick={onClose}>&times;</button>
          <h2>Your Skills</h2>
          <ul id="skills-list">
            {loading && <li>Loading skills...</li>}
            {error && <li>{error}</li>}
            {!loading && !error && skills.length === 0 && (
              <li>No skills yet.</li>
            )}
            {!loading && !error && skills.length > 0 && skills.map((skill, index) => (
              <li key={index}>
                <strong>{skill.skillname}</strong>: Level {skill.skilllevel} / 99<br />
                EXP: {skill.expgained} / {skill.exptonext}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default SkillsModal;
