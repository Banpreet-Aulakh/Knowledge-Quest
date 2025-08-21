import React, { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import ExpFloater from '../components/ExpFloater';

const Library = () => {
  const [data, setData] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expFloaters, setExpFloaters] = useState([]);

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
    } catch {
      alert('Error updating progress.');
    }
  };

  const showExpFloat = (text, levelUp = false) => {
    const id = Date.now() + Math.random();
    const floater = { id, text, levelUp };
    setExpFloaters(prev => [...prev, floater]);
    
    setTimeout(() => {
      setExpFloaters(prev => prev.filter(f => f.id !== id));
    }, 1200);
  };

  const removeExpFloater = (id) => {
    setExpFloaters(prev => prev.filter(f => f.id !== id));
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
              <BookCard 
                key={index} 
                book={book} 
                type="library" 
                onUpdatePages={handleUpdatePages}
              />
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
              <BookCard 
                key={index} 
                book={book} 
                type="completed"
              />
            ))}
          </ul>
        </section>
      )}
      
      {/* Experience floaters */}
      {expFloaters.map(floater => (
        <ExpFloater
          key={floater.id}
          text={floater.text}
          levelUp={floater.levelUp}
          onRemove={() => removeExpFloater(floater.id)}
        />
      ))}
    </main>
  );
};

export default Library;
