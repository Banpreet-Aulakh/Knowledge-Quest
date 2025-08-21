import React from 'react';

const EditionSelector = ({ 
  editionData, 
  selectedWork, 
  onEditionSelect, 
  manualIsbn, 
  onIsbnChange, 
  onIsbnSearch 
}) => {
  return (
    <div id="edition-section">
      <label htmlFor="edition-dropdown">Select Edition:</label>
      <select 
        id="edition-dropdown" 
        onChange={(e) => onEditionSelect(editionData[e.target.value])}
      >
        {editionData.map((ed, idx) => (
          <option key={idx} value={idx}>
            {ed.title || selectedWork?.title} ({ed.publish_date || "Unknown"})
            {ed.publishers ? " - " + ed.publishers.join(", ") : ""}
          </option>
        ))}
      </select>
      <span>or enter ISBN:</span>
      <input
        type="text"
        id="manual-isbn"
        placeholder="ISBN"
        value={manualIsbn}
        onChange={onIsbnChange}
      />
      <button id="isbn-search-btn" onClick={onIsbnSearch}>
        Find Edition
      </button>
    </div>
  );
};

export default EditionSelector;