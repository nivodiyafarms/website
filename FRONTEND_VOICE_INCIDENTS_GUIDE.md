# 🎙️ Frontend Voice Recording Incidents - Complete Guide

## ✅ What's Been Implemented

The complete voice recording incident feature is now fully integrated into your React frontend!

### New Components & Pages:

1. **`VoiceRecorder.jsx`** - Voice recording component with:
   - Start/Stop/Pause recording
   - Audio playback preview
   - Upload to backend with AI processing
   - Real-time recording timer
   - Beautiful UI with Tailwind CSS

2. **`IncidentsNew.jsx`** - Complete incidents management page with:
   - Two-tab modal: Manual Entry & Voice Recording
   - AI-extracted data preview
   - Edit before saving capability
   - Full CRUD operations
   - List all incidents with filters

3. **Updated `api.js`** - New incident API endpoints

4. **Updated `App.jsx`** - New routing

---

## 🚀 How It Works

### User Flow:

```
1. User clicks "Report Incident"
   ↓
2. Modal opens with two tabs:
   - Manual Entry (traditional form)
   - Voice Recording (NEW! 🎙️)
   ↓
3a. Manual Entry Path:
   - Fill form
   - Submit
   - Done!

3b. Voice Recording Path:
   - Click "Start Recording"
   - Speak about incident (30-60 seconds)
   - Click "Stop"
   - Preview & Play audio
   - Click "Upload & Extract Data"
   ↓
4. AI Processing (GROQ):
   - Transcribes audio
   - Extracts structured data
   - Pre-fills the form
   ↓
5. Review & Edit:
   - User reviews AI-extracted data
   - Edits any fields if needed
   - Fills missing information
   ↓
6. Save:
   - Click "Confirm & Save"
   - Incident created!
   - Audio and transcript saved
```

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── VoiceRecorder.jsx        ← NEW! Voice recording component
│   ├── pages/
│   │   ├── IncidentsNew.jsx         ← NEW! Incidents management page
│   │   └── Incident.jsx             ← Old (now shows crop cycles)
│   ├── services/
│   │   └── api.js                   ← Updated with incident APIs
│   └── App.jsx                      ← Updated routing
```

---

## 🎯 Starting the Application

### 1. Start Backend (from project root):

```bash
cd backend
uvicorn app.main:app --reload
```

**Backend will run on:** http://localhost:8000

### 2. Start Frontend (from project root):

```bash
cd frontend
npm run dev
```

**Frontend will run on:** http://localhost:5173

---

## 🔑 Adding GROQ API Key

**IMPORTANT:** Voice recording needs GROQ API key to work!

### Step 1: Get API Key (FREE)
1. Go to: https://console.groq.com
2. Sign up (takes 30 seconds)
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with `gsk_...`)

### Step 2: Add to Backend
Open `backend/.env` and add:
```env
GROQ_API_KEY=gsk_your_actual_key_here
```

### Step 3: Restart Backend
```bash
# Stop the running server (Ctrl+C)
# Start again
cd backend
uvicorn app.main:app --reload
```

---

## 🎨 Features Overview

### Manual Incident Creation
- Traditional form with all fields
- Field validation
- Dropdown selections for incident types and severity
- Date pickers
- Text areas for descriptions

### Voice Recording 🎙️
- **Real-time recording** with timer
- **Pause/Resume** functionality
- **Audio preview** before upload
- **AI transcription** (Whisper)
- **AI data extraction** (LLM)
- **Auto-filled form** with extracted data

### Incident Management
- **List all incidents** with sorting
- **Edit incidents** (update details)
- **Delete incidents** (with confirmation)
- **Visual indicators** for voice-recorded incidents (mic icon)
- **Status badges** (color-coded by severity)
- **Responsive design** (works on all screen sizes)

---

## 📊 Incident Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Title | ✅ Yes | Text | Brief incident title |
| Description | ✅ Yes | Text | Detailed description |
| Incident Type | ✅ Yes | Dropdown | Type of incident |
| Severity | ✅ Yes | Dropdown | LOW, MEDIUM, HIGH, CRITICAL |
| Field | ⬜ No | Dropdown | Which field affected |
| Location | ⬜ No | Text | Specific location description |
| Affected Area | ⬜ No | Number | Area in acres |
| Estimated Loss | ⬜ No | Number | Loss in rupees |
| Crop Affected | ⬜ No | Text | Which crop |
| Incident Date | ⬜ No | Date | When it occurred |
| Action Taken | ⬜ No | Text | Immediate action |

---

## 🎤 Voice Recording Best Practices

### What to Say:

**Good Example:**
> "This is a high severity pest attack incident in Field F_001. I found a large number of aphids on the wheat crop in the northwest corner. Approximately 2.5 acres are affected. I estimate the loss around 15,000 rupees. I have already applied neem oil spray as immediate action."

**What AI Extracts:**
```json
{
  "title": "Pest Attack in Field F_001",
  "incident_type": "PEST_ATTACK",
  "severity": "HIGH",
  "field_id": "F_001",
  "crop_affected": "Wheat",
  "location_description": "Northwest corner",
  "affected_area_acre": 2.5,
  "estimated_loss": 15000,
  "action_taken": "Applied neem oil spray"
}
```

### Tips:
- 🎯 Speak clearly at moderate pace
- 📍 Mention specific location/field IDs
- 📊 Include numbers (area, loss)
- 🌾 Mention crop type
- ⚡ Describe immediate action taken
- ⏱️ Keep it under 60 seconds

---

## 🎨 UI Components

### Voice Recorder Component

```jsx
<VoiceRecorder 
  onRecordingComplete={handleRecordingComplete}
  userId={currentUser.user_id}
/>
```

**Features:**
- Beautiful animated recording indicator
- Real-time timer display
- Pause/Resume buttons
- Audio preview player
- Upload button with loading state
- Instructions banner

### Incidents Page

**Two-Tab Modal:**
1. **Manual Entry Tab**
   - Complete form with all fields
   - Field validation
   - Dropdown selections
   - Date pickers

2. **Voice Recording Tab**
   - Voice recorder component
   - After upload: switches to Manual tab
   - Shows AI-extracted data alert
   - Pre-filled form for review

---

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
GROQ_API_KEY=gsk_your_key_here  ← Add this!
```

**Frontend** (`frontend/.env` - optional):
```env
VITE_API_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "No module named 'app'"**
- **Solution:** Make sure you're in the `backend` directory when running uvicorn
```bash
cd backend
uvicorn app.main:app --reload
```

**Error: "GROQ_API_KEY not found"** (old issue - now fixed!)
- **Solution:** API key is now optional. Voice feature won't work without it, but server will start.

**Error: "Port 8000 is already in use"**
- **Solution:** Stop other processes using port 8000, or use different port:
```bash
uvicorn app.main:app --reload --port 8001
```

### Frontend Issues

**Error: "Could not access microphone"**
- **Solution:** Grant microphone permission in browser
- Check browser settings → Site permissions → Microphone

**Error: "Failed to process voice recording"**
- **Solution:** 
  1. Check GROQ_API_KEY is set in backend `.env`
  2. Restart backend server
  3. Check backend terminal for errors

**Voice feature not uploading**
- **Solution:**
  1. Check network tab in browser DevTools
  2. Verify API endpoint is reachable
  3. Check CORS settings if using different port

### Audio Format Issues

**Supported formats:**
- WAV (recommended)
- MP3
- M4A
- OGG
- WEBM

**If recording fails:**
- Try different browser (Chrome/Edge recommended)
- Check microphone hardware
- Check OS permissions

---

## 📱 Browser Compatibility

| Browser | Voice Recording | Notes |
|---------|----------------|-------|
| Chrome | ✅ Full support | Recommended |
| Edge | ✅ Full support | Recommended |
| Firefox | ✅ Full support | Good |
| Safari | ⚠️ Limited | May need user interaction first |
| Mobile Chrome | ✅ Full support | Works well |
| Mobile Safari | ⚠️ Limited | iOS restrictions |

---

## 🚀 Deployment

### Production Checklist

**Backend:**
- [ ] Set production `DATABASE_URL`
- [ ] Change `SECRET_KEY` to secure random string
- [ ] Add production `GROQ_API_KEY`
- [ ] Configure CORS for production domain
- [ ] Use HTTPS

**Frontend:**
- [ ] Build for production: `npm run build`
- [ ] Set `VITE_API_URL` to production API URL
- [ ] Configure proper API base URL
- [ ] Enable HTTPS
- [ ] Test microphone permissions on live domain

---

## 📊 API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/incidents/` | List all incidents |
| GET | `/incidents/{id}` | Get single incident |
| POST | `/incidents/manual` | Create manually |
| POST | `/incidents/voice/upload` | Upload voice & extract |
| POST | `/incidents/voice/confirm` | Confirm voice incident |
| PUT | `/incidents/{id}` | Update incident |
| DELETE | `/incidents/{id}` | Delete incident |

---

## 🎓 How to Use (Step by Step)

### As a User:

1. **Login** to the application
2. Click **"Incidents"** in the sidebar
3. Click **"Report Incident"** button
4. **Choose your method:**

#### Method A: Manual Entry
1. Fill out the form
2. Click "Create"
3. Done! ✅

#### Method B: Voice Recording
1. Click **"Voice Recording"** tab
2. Click **"Start Recording"**
3. **Speak clearly:**
   - What happened
   - Where (field/location)
   - How much area affected
   - Estimated loss
   - Action taken
4. Click **"Stop"**
5. **Preview** your recording (play button)
6. Click **"Upload & Extract Data"**
7. Wait ~5 seconds for AI processing
8. **Review** the pre-filled form
9. **Edit** any incorrect or missing fields
10. Click **"Confirm & Save"**
11. Done! ✅

---

## 💡 Pro Tips

### For Best Voice Recognition:

1. **Start with severity:** "This is a HIGH severity incident..."
2. **Mention field ID:** "...in Field F_001..."
3. **Use numbers clearly:** "Two point five acres" or "2.5 acres"
4. **Mention crop:** "...affecting the wheat crop..."
5. **State location:** "...in the northwest area..."
6. **End with action:** "...I have applied neem spray."

### For Accurate Data Extraction:

- Use field IDs that exist in your system (F_001, F_002, etc.)
- Mention severity explicitly (LOW, MEDIUM, HIGH, CRITICAL)
- Use clear numbers for area and loss
- Speak incident type clearly (pest attack, disease, etc.)

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Backend starts without errors
2. ✅ Frontend loads and shows login page
3. ✅ Can login with test credentials
4. ✅ "Report Incident" button appears
5. ✅ Modal opens with two tabs
6. ✅ Can switch between Manual and Voice tabs
7. ✅ Can record voice (timer counts)
8. ✅ Can play recorded audio
9. ✅ Upload shows "Processing with AI..."
10. ✅ Form gets pre-filled with extracted data
11. ✅ Can save incident successfully
12. ✅ Incident appears in list with mic icon 🎙️

---

## 📞 Need Help?

### Check These First:

1. **Backend running?** → http://localhost:8000/docs
2. **Frontend running?** → http://localhost:5173
3. **GROQ_API_KEY set?** → Check `backend/.env`
4. **Microphone permission granted?** → Check browser settings
5. **Console errors?** → Check browser DevTools console

### Common Solutions:

- **Restart both servers** (frontend & backend)
- **Clear browser cache** and reload
- **Check terminal** for error messages
- **Verify file paths** are correct

---

## 🎯 Next Steps

1. ✅ **Test manually creating incidents**
2. ✅ **Test voice recording**
3. ✅ **Add your GROQ API key** (if not done)
4. ✅ **Test with real farm data**
5. ⬜ **Deploy to production**
6. ⬜ **Train users on voice recording**

---

**Ready to go! Start both servers and try creating an incident with voice recording! 🚀🎙️**

---

**Created:** October 12, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

