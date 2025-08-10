import React, { useState, useEffect } from 'react';

const Library = ({ user }) => {
  const [data, setData] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    try {
      const response = await fetch('/api/library');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setCompleted(result.completed);
      }
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePages = async (e, isbn) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const pagesRead = formData.get('pagesRead');
    
    try {
      const response = await fetch('/library/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagesRead, isbn })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.expGained > 0) {
          showExpFloat(`+${result.expGained} ${result.skill} EXP`);
        }
        if (result.levelUp) {
          showExpFloat(`${result.skill} Level Up!`, true);
        }
        // Refresh the library data
        setTimeout(() => fetchLibraryData(), 1200);
      } else {
        alert('Failed to update pages read.');
      }
    } catch (error) {
      alert('Error updating progress.');
    }
  };

  const showExpFloat = (text, levelUp = false) => {
    const el = document.createElement('div');
    el.className = 'exp-float' + (levelUp ? ' levelup' : '');
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = 1;
    }, 10);
    setTimeout(() => {
      el.style.opacity = 0;
      el.remove();
    }, 1200);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <h2>My Library</h2>
      <section className="library-skills">
        {data && data.length > 0 ? (
          <ul className="library-list">
            {data.map((book, index) => (
              <li key={index} className="library-book">
                <img 
                  src={book.coverurl} 
                  alt={`Book cover for ${book.title}`} 
                  className="book-cover"
                />
                <div className="library-book-info">
                  <strong>{book.title}</strong> by {book.author}<br />
                  <em>Subject:</em> {book.subject}<br />
                  <form onSubmit={(e) => handleUpdatePages(e, book.isbn)} className="pages-form">
                    <label>
                      Pages Read:
                      <input 
                        type="number" 
                        name="pagesRead" 
                        defaultValue={book.pagesread} 
                        min={book.pagesread + 1} 
                        max={book.pages}
                      />
                      / {book.pages}
                    </label>
                    <button type="submit">Update</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven't added any books to your library yet.</p>
        )}
      </section>

      {completed && completed.length > 0 && (
        <section className="completed-books">
          <h3>Completed Books</h3>
          <ul className="library-list completed-list">
            {completed.map((book, index) => (
              <li key={index} className="library-book completed">
                <img 
                  src={book.coverurl} 
                  alt={`Book cover for ${book.title}`} 
                  className="book-cover"
                />
                <div className="library-book-info">
                  <strong>{book.title}</strong> by {book.author}<br />
                  <em>Subject:</em> {book.subject}<br />
                  <span className="completed-label">Completed!</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
};

export default Library;
