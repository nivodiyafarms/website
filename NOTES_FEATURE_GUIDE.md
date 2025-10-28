# Crop Cycle Notes Feature - Complete Guide

## Overview
The Notes feature provides a chat-like interface for adding notes and images to crop cycles. This feature is designed to support cross-platform synchronization between the web application and mobile applications.

## Features

### ✅ Implemented Features
1. **Chat-Like Interface**: Clean, modern messaging interface for notes
2. **Image Upload**: Attach images to notes with preview
3. **User Attribution**: Each note shows who created it and when
4. **Real-Time Updates**: Notes refresh automatically
5. **Delete Functionality**: Users can delete their own notes
6. **Source Tracking**: Notes track whether they came from web or mobile app
7. **Responsive Design**: Works seamlessly on desktop and mobile browsers

## Database Schema

### Table: `crop_cycle_notes`
```sql
CREATE TABLE crop_cycle_notes (
    note_id UUID PRIMARY KEY,
    crop_cycle_id UUID REFERENCES crop_cycle_incidents(incident_id),
    user_id UUID REFERENCES users(user_id),
    content TEXT NOT NULL,
    image_path VARCHAR(500),
    source VARCHAR(50) DEFAULT 'web',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Base URL: `/crop-cycle-notes/{crop_cycle_id}/notes`

#### 1. Create Note
**POST** `/crop-cycle-notes/{crop_cycle_id}/notes`

**Request (multipart/form-data):**
- `content` (string, required): Note text content
- `source` (string, optional): 'web' or 'app' (default: 'web')
- `image` (file, optional): Image file (jpg, jpeg, png, gif, webp)

**Response:**
```json
{
  "note_id": "uuid",
  "crop_cycle_id": "uuid",
  "user_id": "uuid",
  "content": "Note content here",
  "image_path": "uploads/notes/abc123.jpg",
  "source": "web",
  "created_at": "2024-10-21T10:30:00",
  "updated_at": "2024-10-21T10:30:00",
  "user_name": "John Doe",
  "user_email": "john@example.com"
}
```

#### 2. Get All Notes
**GET** `/crop-cycle-notes/{crop_cycle_id}/notes`

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Max records to return (default: 100)

**Response:** Array of note objects (sorted oldest first)

#### 3. Get Single Note
**GET** `/crop-cycle-notes/{crop_cycle_id}/notes/{note_id}`

**Response:** Single note object

#### 4. Update Note
**PUT** `/crop-cycle-notes/{crop_cycle_id}/notes/{note_id}`

**Request (multipart/form-data):**
- `content` (string, optional): Updated note text
- `image` (file, optional): New image file

**Authorization:** Only the note creator can update

**Response:** Updated note object

#### 5. Delete Note
**DELETE** `/crop-cycle-notes/{crop_cycle_id}/notes/{note_id}`

**Authorization:** Only the note creator can delete

**Response:** 204 No Content

## Frontend Implementation

### Component Location
`frontend/src/components/NotesInterface.jsx`

### Integration
The Notes component is integrated into the Crop Cycle Management page, appearing below the Tasks section:

```jsx
import NotesInterface from '../components/NotesInterface';

<NotesInterface cropCycleId={selectedCycle.incident_id} />
```

### Features
- **Message Bubbles**: Different colors for current user (blue) vs others (gray)
- **Image Attachments**: Click to view full size in new tab
- **User Avatars**: First letter of name in colored circle
- **Timestamp Formatting**: Smart date formatting (Today, Yesterday, or date)
- **Delete Button**: Only visible on user's own messages
- **Source Badge**: Shows "From mobile app" for app-sourced notes
- **Auto-scroll**: Automatically scrolls to newest message

## File Storage

### Directory Structure
```
backend/
  uploads/
    notes/
      {uuid}.jpg
      {uuid}.png
      ...
```

### Image Access
Images are served as static files:
- URL Pattern: `http://localhost:8000/uploads/notes/{filename}`
- Accessible via browser and API

## Cross-Platform Synchronization

### Design for Future App Integration

1. **Source Tracking**: The `source` field tracks where notes originate
2. **API-First**: All operations go through REST API
3. **Real-time Ready**: Frontend polls for updates (can be upgraded to WebSocket)
4. **User Attribution**: All notes linked to user accounts

### Mobile App Implementation Guide

To integrate with a mobile app:

1. **Authentication**: Use the same JWT token system
2. **API Calls**: Use the same endpoints with `source: "app"`
3. **Image Upload**: Send multipart/form-data with image file
4. **Polling**: Fetch notes periodically or implement push notifications

Example mobile app code (conceptual):
```javascript
// Create note from mobile app
const formData = new FormData();
formData.append('content', 'Note from mobile app');
formData.append('source', 'app');
formData.append('image', imageFile);

fetch(`${API_URL}/crop-cycle-notes/${cycleId}/notes`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## Usage Guide

### For Users

1. **Navigate to Crop Cycle**: Go to Crop Cycle Management and select a crop cycle
2. **Scroll to Notes Section**: Below tasks, you'll find the Notes interface
3. **Add a Note**:
   - Type your message in the text area
   - (Optional) Click the image icon to attach a photo
   - Click send button or press Enter
4. **View Notes**: All notes appear in chronological order
5. **Delete Note**: Click the trash icon on your own notes to delete

### For Developers

#### Backend Setup
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run migration
python migrate_notes.py

# Start server
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

## Testing

### Manual Testing Checklist
- [ ] Create a note with text only
- [ ] Create a note with image only
- [ ] Create a note with both text and image
- [ ] View all notes in correct order
- [ ] Delete your own note
- [ ] Verify you cannot delete others' notes
- [ ] Upload different image formats (jpg, png, gif, webp)
- [ ] Test with long text content
- [ ] Test with multiple users

### API Testing with curl
```bash
# Get all notes
curl -X GET "http://localhost:8000/crop-cycle-notes/{cycle-id}/notes" \
  -H "Authorization: Bearer {token}"

# Create note
curl -X POST "http://localhost:8000/crop-cycle-notes/{cycle-id}/notes" \
  -H "Authorization: Bearer {token}" \
  -F "content=Test note" \
  -F "source=web"

# Create note with image
curl -X POST "http://localhost:8000/crop-cycle-notes/{cycle-id}/notes" \
  -H "Authorization: Bearer {token}" \
  -F "content=Note with image" \
  -F "image=@/path/to/image.jpg" \
  -F "source=web"
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token
2. **Authorization**: Users can only delete/edit their own notes
3. **File Validation**: Only allowed image formats accepted
4. **File Storage**: Images stored with UUID filenames to prevent conflicts
5. **CORS**: Configured for local development ports

## Future Enhancements

### Potential Improvements
1. **WebSocket Support**: Real-time updates without polling
2. **Rich Text Formatting**: Markdown or HTML support
3. **Mentions**: Tag other users with @username
4. **Reactions**: Like/react to notes
5. **Search**: Full-text search across notes
6. **File Attachments**: Support PDFs, videos, etc.
7. **Voice Notes**: Audio recording and playback
8. **Notifications**: Push notifications for new notes
9. **Edit History**: Track note edits
10. **Reply Threading**: Thread conversations

## Troubleshooting

### Images Not Loading
- Check that `uploads/notes` directory exists
- Verify static files are mounted in main.py
- Check file permissions
- Ensure backend URL is correct in frontend

### Cannot Create Notes
- Verify authentication token is valid
- Check crop cycle ID is correct
- Verify database migration ran successfully

### Notes Not Updating
- Check network requests in browser DevTools
- Verify API endpoint is accessible
- Check CORS configuration

## Support

For issues or questions:
1. Check backend logs: `uvicorn app.main:app --reload --log-level debug`
2. Check browser console for frontend errors
3. Verify database schema with SQLite browser
4. Review API response in Network tab

## Summary

The Notes feature provides a robust, scalable solution for adding contextual information to crop cycles. With its chat-like interface and image support, it enhances collaboration and record-keeping. The API-first design ensures seamless integration with future mobile applications while maintaining data consistency across platforms.



