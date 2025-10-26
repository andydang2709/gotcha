# Forensic Case Chat - Web Application

This is a web-based version of the original Streamlit forensic case chat application. It provides an interactive interface to chat with different characters involved in a forensic case.

## Files Created

- `index.html` - Main HTML structure
- `styles.css` - Modern, responsive CSS styling
- `script.js` - JavaScript functionality for chat and API integration
- `README.md` - This documentation file

## Features

### Character Selection
- **Dr. Morgan (Forensic Pathologist)** - Medical expert
- **John Ruetten (Husband)** - Case subject
- **Steve Hooks (Detective Partner)** - Investigating officer
- **Nels Rasmussen (Father)** - Family member

### Chat Interface
- Real-time messaging with selected character
- Separate chat histories for each character
- Modern, responsive design
- Loading indicators during API calls
- Error handling and user feedback

### Configuration
- Configuration loaded from `config.js` file
- Easy to update API keys and character IDs
- No manual input required in the interface
- Matches the structure of your original `.env` file

## How to Use

1. **Configure API Settings**
   - Edit the `config.js` file and replace the placeholder values with your actual API keys and character IDs
   - The configuration should match the variables from your original `.env` file:
     - `API_KEY_1` - For Dr. Morgan, John Ruetten, and Steve Hooks
     - `API_KEY_2` - For Nels Rasmussen
     - `DR_MORGAN_ID` - Dr. Morgan's character ID
     - `JOHN_RUETTEN_ID` - John Ruetten's character ID
     - `STEVE_HOOKS_ID` - Steve Hooks' character ID
     - `NELS_RASMUSSEN_ID` - Nels Rasmussen's character ID

2. **Open the Application**
   - Open `index.html` in your web browser
   - The application will load with a modern, professional interface

3. **Start Chatting**
   - Select a character from the dropdown menu
   - Type your message in the input field
   - Press Enter or click Send to send the message
   - Each character maintains their own conversation history

## API Integration

The application integrates with the Neocortex API:
- **Endpoint**: `https://neocortex.link/api/v2/chat`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `x-api-key: [your-api-key]`
- **Body**: 
  ```json
  {
    "sessionId": "string",
    "characterId": "string", 
    "message": "string"
  }
  ```

## Technical Details

### Character-to-API Mapping
- **Dr. Morgan, John Ruetten, Steve Hooks**: Use API Key 1
- **Nels Rasmussen**: Uses API Key 2

### Session Management
- Each character maintains its own session ID
- Sessions persist during the browser session
- New sessions are created automatically when needed

### Error Handling
- Network errors are displayed to the user
- Missing configuration shows helpful error messages
- API failures are gracefully handled

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design works on desktop and mobile
- Uses modern JavaScript features (ES6+)

## Security Notes

- API keys are stored in browser localStorage
- No server-side storage of sensitive data
- All API calls are made directly from the browser
- Consider using environment variables for production deployment

## Customization

The application is easily customizable:
- Modify `styles.css` for visual changes
- Update character names in `script.js`
- Add new characters by updating the `characterNames` object
- Modify the API endpoint or request format as needed
