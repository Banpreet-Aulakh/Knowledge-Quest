import React, { useState, useEffect } from 'react';

const Home = ({ user }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const response = await fetch('/api/home');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <div className="home-main">
        <h1>Welcome to Knowledge Quest!</h1>
        <p>Track your reading, visualize your knowledge growth, and level up! Start by searching for a book and viewing your library.</p>
        <section className="recent-skills">
          <h2>Recent Skills Gained</h2>
          {data && data.length !== 0 ? (
            <ul className="library-list">
              {data.map((book, i) => (
                <li key={i} className="library-book">
                  <img 
                    src={book.coverurl} 
                    alt={`Book cover for ${book.title}`} 
                    className="book-cover"
                  />
                  <div className="library-book-info">
                    <strong>{book.subject}</strong> (from <em>{book.title}</em>) <br />
                    <span className="text-muted">EXP:</span> {book.expgained}/{book.exptonext} <br />
                    <span className="text-muted">Pages:</span> {book.pagesread}/{book.pages}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <strong>You haven't added any books to your library!</strong>
          )}
        </section>
      </div>
    </main>
  );
};

export default Home;
