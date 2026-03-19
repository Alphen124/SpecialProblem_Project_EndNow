# README for Notelet Frontend

This folder contains the frontend code for the Notelet application. Below is a brief overview of the structure:

## Structure
- `public/`
  - Contains static assets such as HTML, CSS, JavaScript, and media files.
  - Subfolders:
    - `css/`: Stylesheets.
    - `features/`: HTML files for different features (e.g., authentication, chat, device management).
    - `js/`: JavaScript files for frontend logic.
    - `video/`: Placeholder for video assets.
- `src/`
  - Contains the main application logic, including routes and controllers.
- `test/`
  - Contains test files for the frontend.

## Usage
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Notes
- Ensure the backend service is running before testing the frontend.
- Update the API endpoints in `src/routes.js` if the backend URL changes.
