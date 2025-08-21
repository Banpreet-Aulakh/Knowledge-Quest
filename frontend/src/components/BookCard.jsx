import React from 'react';

const BookCard = ({ book, type = 'library', onUpdatePages }) => {
  if (type === 'home') {
    return (
      <li className="library-book">
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
    );
  }

  if (type === 'completed') {
    return (
      <li className="library-book completed">
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
    );
  }

  // Default: library type (in-progress books)
  return (
    <li className="library-book">
      <img 
        src={book.coverurl} 
        alt={`Book cover for ${book.title}`} 
        className="book-cover"
      />
      <div className="library-book-info">
        <strong>{book.title}</strong> by {book.author}<br />
        <em>Subject:</em> {book.subject}<br />
        <form onSubmit={(e) => onUpdatePages(e, book.isbn)} className="pages-form">
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
  );
};

export default BookCard;