import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Search = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteList, setAutocompleteList] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [editionData, setEditionData] = useState([]);
  const [showEditionSection, setShowEditionSection] = useState(false);
  const [showPreviewSection, setShowPreviewSection] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skillList, setSkillList] = useState([]);
  const [manualIsbn, setManualIsbn] = useState('');
  const [pagesInput, setPagesInput] = useState('');
  const [previewInfo, setPreviewInfo] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/skills');
      if (response.ok) {
        const skills = await response.json();
        setSkillList(skills);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) return;
    
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      const books = data.docs.slice(0, 5).map(book => ({
        ...book,
        displayText: book.title + (book.author_name ? ' by ' + book.author_name.join(', ') : '')
      }));
      setAutocompleteList(books);
    } catch (error) {
      console.error('Error searching books:', error);
    }
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setAutocompleteList([]);
    
    if (query.length >= 2) {
      const timeoutId = setTimeout(() => handleSearch(query), 400);
      return () => clearTimeout(timeoutId);
    }
  };

  const selectBook = async (book) => {
    setSelectedWork(book);
    setAutocompleteList([]);
    setShowEditionSection(true);
    
    try {
      const response = await fetch(`https://openlibrary.org/works/${book.key.split('/').pop()}/editions.json?limit=50`);
      const data = await response.json();
      const filteredEditions = data.entries.filter(ed =>
        ed.languages && ed.languages.some(lang => lang.key === "/languages/eng")
      );
      
      filteredEditions.sort((a, b) => {
        if ((b.covers ? 1 : 0) !== (a.covers ? 1 : 0)) {
          return (b.covers ? 1 : 0) - (a.covers ? 1 : 0);
        }
        const dateA = new Date(a.publish_date || "1900");
        const dateB = new Date(b.publish_date || "1900");
        return dateB - dateA;
      });
      
      setEditionData(filteredEditions);
      if (filteredEditions.length > 0) {
        showPreview(filteredEditions[0]);
      }
    } catch (error) {
      console.error('Error fetching editions:', error);
    }
  };

  const handleIsbnSearch = async () => {
    if (!manualIsbn.trim()) return;
    
    try {
      const response = await fetch(`https://openlibrary.org/isbn/${manualIsbn}.json`);
      if (response.ok) {
        const edition = await response.json();
        showPreview(edition);
      } else {
        alert("Edition not found for that ISBN.");
      }
    } catch (error) {
      alert("Edition not found for that ISBN.");
    }
  };

  const showPreview = (edition) => {
    setSelectedEdition(edition);
    setShowPreviewSection(true);
    
    const coverUrl = edition.covers && edition.covers[0] 
      ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg`
      : '/no-cover.svg';
    
    const pages = edition.number_of_pages || '';
    setPagesInput(pages);
    
    setPreviewInfo({
      title: edition.title || selectedWork?.title,
      author: (edition.authors && edition.authors[0]?.name) || 
              (selectedWork?.author_name ? selectedWork.author_name.join(", ") : "Unknown"),
      publisher: edition.publishers ? edition.publishers.join(", ") : "Unknown",
      year: edition.publish_date || "Unknown",
      isbn: (edition.isbn_13 && edition.isbn_13[0]) || 
            (edition.isbn_10 && edition.isbn_10[0]) || "Unknown",
      coverUrl
    });

    // Fetch subject for skill autofill
    if (edition.key) {
      fetch(`https://openlibrary.org${edition.key}/subjects.json`)
        .then(async (res) => {
          if (res.ok) {
            const subjData = await res.json();
            if (subjData.subjects && subjData.subjects.length > 0) {
              setSkillInput(subjData.subjects[0].name);
            } else {
              setSkillInput((edition.subjects && edition.subjects[0]) || 
                           (selectedWork?.subject ? selectedWork.subject[0] : ""));
            }
          } else {
            setSkillInput((edition.subjects && edition.subjects[0]) || 
                         (selectedWork?.subject ? selectedWork.subject[0] : ""));
          }
        });
    } else {
      setSkillInput((edition.subjects && edition.subjects[0]) || 
                   (selectedWork?.subject ? selectedWork.subject[0] : ""));
    }
  };

  const handleAddToLibrary = async () => {
    if (!skillInput.trim()) {
      alert("Please enter a skill.");
      return;
    }
    
    const pages = parseInt(pagesInput, 10) || 0;
    if (!pages || pages < 1) {
      alert("Please enter the number of pages.");
      return;
    }

    const payload = {
      title: previewInfo.title,
      author: previewInfo.author,
      coverurl: previewInfo.coverUrl,
      pages: pages,
      subject: skillInput.trim(),
      isbn: previewInfo.isbn,
    };

    try {
      const response = await fetch("/library/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        alert("Book added to your library!");
        navigate('/library');
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to add book.");
      }
    } catch (error) {
      alert("Failed to add book.");
    }
  };

  return (
    <main>
      <input
        type="text"
        id="book-search-bar"
        placeholder="Search for a book..."
        value={searchQuery}
        onChange={handleSearchInput}
      />
      
      {autocompleteList.length > 0 && (
        <ul id="autocomplete-list">
          {autocompleteList.map((book, index) => (
            <li key={index} onClick={() => selectBook(book)}>
              {book.displayText}
            </li>
          ))}
        </ul>
      )}

      {showEditionSection && (
        <div id="edition-section">
          <label htmlFor="edition-dropdown">Select Edition:</label>
          <select 
            id="edition-dropdown" 
            onChange={(e) => showPreview(editionData[e.target.value])}
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
            onChange={(e) => setManualIsbn(e.target.value)}
          />
          <button id="isbn-search-btn" onClick={handleIsbnSearch}>
            Find Edition
          </button>
        </div>
      )}

      {showPreviewSection && (
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
                onChange={(e) => setPagesInput(e.target.value)}
              />
            )}<br />
            Publisher: {previewInfo.publisher}<br />
            Year: {previewInfo.year}<br />
            ISBN: {previewInfo.isbn}
          </div>
          <label htmlFor="skill-input">Skill:</label>
          <select
            id="skill-dropdown"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
          >
            <option value="">--Select a skill--</option>
            {skillList.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
            <option value="__manual__">Other (enter manually)</option>
          </select>
          {skillInput === '__manual__' && (
            <input
              type="text"
              id="skill-input"
              value={skillInput === '__manual__' ? '' : skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Enter skill name"
              style={{ marginLeft: '8px' }}
            />
          )}
          <button id="add-to-library-btn" onClick={handleAddToLibrary}>
            Add to Library
          </button>
        </div>
      )}
    </main>
  );
};

export default Search;
