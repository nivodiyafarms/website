# Quick Start Guide - Crop Cycle Notes Feature

## 🚀 Getting Started in 5 Minutes

### Step 1: Database Setup
```bash
cd backend
python migrate_notes.py
```
Expected output:
```
Starting migration for crop cycle notes...
[SUCCESS] Migration completed successfully!
[SUCCESS] crop_cycle_notes table created/verified
```

### Step 2: Start Backend Server
```bash
# Make sure you're in the backend directory
cd backend

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

Server should start at: `http://localhost:8000`

### Step 3: Start Frontend Server
```bash
# In a new terminal
cd frontend

# Start the Vite development server
npm run dev
```

Frontend should start at: `http://localhost:5173`

### Step 4: Test the Feature

1. **Login to the application**
   - Navigate to `http://localhost:5173`
   - Login with your credentials

2. **Navigate to Crop Cycle Management**
   - Click on "Crop Cycle Management" in the navigation
   - Select any existing crop cycle (or create a new one)

3. **Scroll down to the Notes section**
   - You'll see the Notes interface below the Tasks section
   - It has a clean chat-like design

4. **Create your first note**
   - Type a message in the text area at the bottom
   - Click the Send button (paper plane icon)
   - Your note appears instantly

5. **Add a note with an image**
   - Click the image icon (next to Send button)
   - Select an image file (jpg, png, gif, webp)
   - See the preview thumbnail
   - Type a message (optional)
   - Click Send

6. **View your notes**
   - Your notes appear on the right side (blue)
   - Other users' notes appear on the left (gray)
   - Click on images to view full size

7. **Delete a note**
   - Hover over your own note
   - Click the trash icon at the bottom
   - Confirm deletion

## 🎯 Key Features to Test

### ✅ Text Notes
- Create notes with just text
- Notes support multiple lines
- Long text wraps correctly

### ✅ Image Upload
- Supported formats: JPG, PNG, GIF, WEBP
- Preview before sending
- Click image to view full size
- Remove image before sending

### ✅ User Interface
- Messages color-coded by user
- User avatars with initials
- Timestamps (Today, Yesterday, or date)
- Auto-scroll to latest message
- Responsive design

### ✅ Permissions
- Can delete own notes
- Cannot delete others' notes
- Can view all notes in the cycle

## 📝 API Testing (Optional)

### Using Browser DevTools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Create a note and watch the API call
4. Should see POST to `/crop-cycle-notes/{id}/notes`
5. Response should be 201 Created

### Using Postman or curl
```bash
# Get your auth token from localStorage in browser DevTools
# localStorage.getItem('token')

# Replace {TOKEN} and {CYCLE_ID} with actual values

# Get all notes
curl -X GET "http://localhost:8000/crop-cycle-notes/{CYCLE_ID}/notes" \
  -H "Authorization: Bearer {TOKEN}"

# Create a simple text note
curl -X POST "http://localhost:8000/crop-cycle-notes/{CYCLE_ID}/notes" \
  -H "Authorization: Bearer {TOKEN}" \
  -F "content=Hello from API!" \
  -F "source=web"
```

## 🔍 Verification Checklist

- [ ] Backend server running without errors
- [ ] Frontend server running without errors
- [ ] Can see Notes section in crop cycle detail view
- [ ] Can create text-only notes
- [ ] Can upload and attach images
- [ ] Images display correctly
- [ ] Can delete own notes
- [ ] Cannot see delete button on others' notes
- [ ] Notes appear in correct chronological order
- [ ] Timestamps display correctly
- [ ] User names appear correctly

## ⚠️ Troubleshooting

### Backend Issues

**Problem:** Import errors
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

**Problem:** Database errors
```bash
# Solution: Run migration again
python migrate_notes.py
```

**Problem:** Port 8000 already in use
```bash
# Solution: Use different port
uvicorn app.main:app --reload --port 8001
# Update frontend API URL accordingly
```

### Frontend Issues

**Problem:** Component not found
```bash
# Solution: Check file exists
ls frontend/src/components/NotesInterface.jsx
```

**Problem:** API requests fail
```javascript
// Solution: Check API base URL in frontend/src/services/api.js
// Should point to your backend (http://localhost:8000)
```

**Problem:** Images not loading
```bash
# Solution: Check uploads directory exists
ls backend/uploads/notes

# Check static files mounted in main.py
```

### Common Issues

**Problem:** "Crop cycle not found" error
- Make sure you're selecting a valid crop cycle
- Check the crop cycle ID in the URL

**Problem:** "Unauthorized" error
- Make sure you're logged in
- Check token in localStorage
- Token might have expired - try logging in again

**Problem:** Notes not appearing
- Check browser console for errors
- Check Network tab for failed requests
- Verify backend is running and accessible

## 🎓 What's Next?

### For Users
- Start adding notes to your crop cycles
- Upload photos of crop conditions
- Document important events and decisions
- Collaborate with team members

### For Developers
- Review the complete guide: `NOTES_FEATURE_GUIDE.md`
- Explore API endpoints in backend/app/api/crop_cycle_notes.py
- Customize the UI in frontend/src/components/NotesInterface.jsx
- Add more features (see Future Enhancements in guide)

## 📱 Mobile App Integration

The Notes API is ready for mobile app integration:

1. Use the same authentication system
2. Call the same REST endpoints
3. Set `source: "app"` when creating notes
4. Notes from mobile will show "From mobile app" badge

Example integration:
```javascript
// Mobile app code (React Native example)
const createNote = async (cycleId, content, imageUri) => {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('source', 'app');
  
  if (imageUri) {
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg'
    });
  }
  
  const response = await fetch(
    `${API_URL}/crop-cycle-notes/${cycleId}/notes`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );
  
  return response.json();
};
```

## 💡 Tips

1. **Image Size**: Compress large images before upload for better performance
2. **Content**: Be descriptive in notes for better searchability later
3. **Organization**: Use notes to document daily observations, issues, and resolutions
4. **Collaboration**: Tag important information for team visibility
5. **Backup**: Notes are stored in database - ensure regular backups

## 🎉 Success!

If you can create, view, and delete notes with images, congratulations! The Notes feature is working perfectly. 

For detailed information, see `NOTES_FEATURE_GUIDE.md`.
For API details, check the backend code in `backend/app/api/crop_cycle_notes.py`.

Happy farming! 🌾



