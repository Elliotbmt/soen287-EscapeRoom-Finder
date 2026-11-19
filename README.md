# Escape Room Finder

Shows a list of sample escape rooms that anyone can browse, search, and filter.
Visitors can also create an account, log in, and see a private dashboard.

Built with HTML, CSS, and JavaScript, plus Node.js, Express, and JSON
files for storage.

## What you need

- Node.js 18 or newer
- npm (comes with Node.js)

## How to run it

1. Open a terminal in the project folder.
2. Install the packages:

   npm install

3. Copy `.env.example` to `.env`. On PowerShell:

   Copy-Item .env.example .env

4. Open `.env` and change `SESSION_SECRET` to any long random string.
   Keep this file private. It is already in `.gitignore`.
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
5. Start the server:

   node server.js

6. Open http://localhost:3000 in your browser.
   Press Ctrl+C in the terminal to stop the server.

## How to test it

- On the home page, type in the search box or change the filters. The list
  updates as you type.
- Register a new account. Username must be 3–20 letters, numbers, or
  underscores. Password must be 8–128 characters.
- Log in. You will be taken to your dashboard.
- Log out using the button on the dashboard.
- Try opening /dashboard in a private browser window while logged out. You
  should be sent back to the login page.

## Where things are

- `server.js` — starts the server, handles account and room-list routes, and protects the dashboard page.
- `public/js/rooms.js` — searches, filters, and displays the rooms in the browser.
- `public/js/auth.js` — submits account forms and handles dashboard login details.
- `public/` — the HTML pages, the CSS file, and the browser JavaScript.
- `data/rooms.json` — the sample escape rooms.
- `data/users.json` — the registered users. It starts empty. Passwords are
  stored as salted hashes, never as plain text.