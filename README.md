# Gotcha! – An AI-Driven Cold Case Investigation Game that turns cold-case storytelling into an intelligent detective experience — where AI doesn’t just tell the story, it becomes the story.

## How to Play

1. **Host the Website**
   - Run this command from your terminal: python3 -m http.server 8000
   - Open `localhost:8000` in your web browser
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
