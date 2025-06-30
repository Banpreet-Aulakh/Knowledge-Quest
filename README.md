# Knowledge Quest: A Web App Concept to Track How You Grow 

## The Idea
Let's admit it. Learning is hard. And for people whose hobby is learning new things, we can often get side-tracked and forget the last things we were learning. This concept aims to solve part that problem, (mostly my problem) hoarding books I... I mean you'll never read.

## Features
- Search and add books using the OpenLibrary API
- Track your completed books and reading progress
- Automatically fetch book covers, page numbers, and subjects
- Assign EXP to books based on pages read and subject complexity
- Visualize your knowledge growth by subject area
- Store your progress in a relational database for persistence

## Tech Stack
- PostgreSQL 
- ExpressJS 
- EJS (Because React is hard... for now)
- NodeJS 

## APIs 
- [OpenLibrary](https://openlibrary.org/developers/api) (Covers, Subjects, and Books endpoints)

## How It Works
1. **Search for Books:** Use the app to search for books by title, author, or ISBN.
2. **Add to Your List:** Select books you've completed or are currently reading.
3. **Track Progress:** Mark books as completed and log how many pages you've read.
4. **Gain EXP:** Each book gives you EXP based on its length and subject complexity.
5. **Visualize Growth:** See charts or stats of your knowledge skills by subject.

## Future Ideas
- User accounts and authentication
- Social features (share your progress)
- Recommendations based on your reading history
- More advanced EXP algorithms

## Getting Started
1. Clone the repo
2. Install dependencies:  
   ```bash
   npm install
   (npm audit fix) -- if needed
   ```
3. Set up your PostgreSQL database and configure environment variables
4. Start the server:  
   ```bash
   node index.js
   ```

---

## License

This project is licensed under the [MIT License](LICENSE).

*This project is a work in progress! Contributions and feedback are welcome.*