import React from 'react';

const BookSearchBar = ({ searchQuery, onSearchChange, autocompleteList, onBookSelect }) => {
  return (
    <>
      <input
        type="text"
        id="book-search-bar"
        placeholder="Search for a book..."
        value={searchQuery}
        onChange={onSearchChange}
      />
      
      {autocompleteList.length > 0 && (
        <ul id="autocomplete-list">
          {autocompleteList.map((book, index) => (
            <li key={index} onClick={() => onBookSelect(book)}>
              {book.displayText}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default BookSearchBar;