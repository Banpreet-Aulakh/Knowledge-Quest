import React from 'react';
import SkillSelector from './SkillSelector';

const BookPreview = ({ 
  previewInfo, 
  pagesInput, 
  onPagesChange, 
  skillInput, 
  onSkillChange, 
  skillList, 
  onAddToLibrary 
}) => {
  return (
    <div id="preview-section">
      <h3>Book Preview</h3>
      <img 
        id="preview-cover" 
        src={previewInfo.coverUrl} 
        alt="Book cover" 
        style={{ maxHeight: '100px' }}
      />
      <div id="preview-info">
        <strong>{previewInfo.title}</strong><br />
        Author: {previewInfo.author}<br />
        Pages: {previewInfo.pages ? (
          <span id="pages-span">{previewInfo.pages}</span>
        ) : (
          <input
            type="number"
            id="pages-input"
            min="1"
            placeholder="Enter pages"
            value={pagesInput}
            onChange={onPagesChange}
          />
        )}<br />
        Publisher: {previewInfo.publisher}<br />
        Year: {previewInfo.year}<br />
        ISBN: {previewInfo.isbn}
      </div>
      
      <SkillSelector 
        skillInput={skillInput}
        onSkillChange={onSkillChange}
        skillList={skillList}
      />
      
      <button id="add-to-library-btn" onClick={onAddToLibrary}>
        Add to Library
      </button>
    </div>
  );
};

export default BookPreview;