import React, { useState, useEffect } from 'react';
import BookCard from './BookCard';

const Home = () => {
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
                <BookCard key={i} book={book} type="home" />
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
