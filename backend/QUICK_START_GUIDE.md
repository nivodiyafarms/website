# 🚀 Quick Start Guide - Voice Recording Incidents

## ✅ What's Been Done

The voice recording incident feature is **fully implemented** and ready to use!

## 🔧 What You Need to Do (5 minutes)

### Step 1: Get GROQ API Key (FREE)

1. Go to: **https://console.groq.com**
2. Sign up with Google/GitHub (takes 30 seconds)
3. Click "API Keys" in left sidebar
4. Click "Create API Key"
5. Give it a name (e.g., "Nivodiya Farms")
6. **Copy the key** (starts with `gsk_...`)

### Step 2: Add API Key to .env

Open `backend/.env` and find this line:
```
GROQ_API_KEY=your_groq_api_key_here
```

Replace it with:
```
GROQ_API_KEY=gsk_your_actual_key_here
```

### Step 3: Start the Server

```bash
cd backend
uvicorn app.main:app --reload
```

### Step 4: Test It!

Open browser: **http://localhost:8000/docs**

Try the `POST /incidents/voice/upload` endpoint!

## 📱 How It Works

### Option 1: Manual Entry (Traditional)
1. User fills out form
2. Submits incident
3. Done! ✅

### Option 2: Voice Recording (NEW! 🎙️)
1. User clicks "Record Incident"
2. Speaks about the incident (30-60 seconds)
3. System transcribes audio → extracts data → fills form
4. User reviews/edits the pre-filled form
5. User saves incident
6. Done! ✅

## 🎯 Example Voice Recording

**What to say:**
> "This is a high severity pest attack in Field F_001. Large number of aphids found on wheat crop in the northwest area. About 2.5 acres affected. Estimated loss is 15,000 rupees. I've applied neem oil spray immediately."

**What you get:**
```json
{
  "title": "Pest Attack in Field F_001",
  "incident_type": "PEST_ATTACK",
  "severity": "HIGH",
  "field_id": "F_001",
  "crop_affected": "Wheat",
  "location_description": "Northwest area",
  "affected_area_acre": 2.5,
  "estimated_loss": 15000,
  "action_taken": "Applied neem oil spray"
}
```

## 📊 Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/incidents/manual` | Create incident manually |
| POST | `/incidents/voice/upload` | Upload voice & get AI preview |
| POST | `/incidents/voice/confirm` | Save after review |
| GET | `/incidents/` | List all incidents |
| GET | `/incidents/{id}` | Get one incident |
| PUT | `/incidents/{id}` | Update incident |
| DELETE | `/incidents/{id}` | Delete incident |

## 🎨 Frontend Integration

### Voice Recording Component

```javascript
// 1. Record audio
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
  mediaRecorder.onstop = () => uploadAudio();
  
  mediaRecorder.start();
};

// 2. Upload to API
const uploadAudio = async () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  formData.append('reported_by_user_id', currentUserId);
  
  const response = await fetch('/incidents/voice/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const preview = await response.json();
  showPreview(preview); // Show form with pre-filled data
};

// 3. User reviews and confirms
const confirmIncident = async (previewData) => {
  await fetch('/incidents/voice/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audio_file_path: previewData.audio_file_path,
      transcript: previewData.transcript,
      extracted_data: previewData.extracted_data,
      reported_by_user_id: currentUserId
    })
  });
  
  showSuccess('Incident created!');
};
```

## 🐛 Common Issues & Solutions

### "GROQ_API_KEY not found"
→ Add key to `.env` file and restart server

### "Error transcribing audio"  
→ Use WAV format, check file isn't corrupted

### "Cannot connect to server"
→ Ensure server is running on port 8000

### "Unauthorized"
→ Login first to get JWT token

## 📚 Full Documentation

- **Detailed Guide**: `VOICE_INCIDENT_FEATURE.md`
- **Setup Summary**: `INCIDENT_SETUP_COMPLETE.md`
- **API Docs**: http://localhost:8000/docs

## 🎯 Test Credentials

```
Admin:
  Phone: 9876543210
  Password: admin123
  
Supervisor:
  Phone: 9876543211
  Password: supervisor123
```

## ✨ Features

- ✅ Voice recording with AI transcription
- ✅ Automatic data extraction
- ✅ Manual form entry
- ✅ Edit before saving
- ✅ Full CRUD operations
- ✅ Filter by status, severity, field
- ✅ Audio file storage
- ✅ Multi-language support (configurable)

## 🔐 Security

- JWT authentication required
- User-based access control
- Secure audio file storage
- Automatic cleanup on delete

## 📈 Next Steps

1. ✅ **Add GROQ API key** ← Do this now!
2. Start the server
3. Test voice upload in API docs
4. Build frontend interface
5. Deploy to production

---

**Ready to go! Just add your GROQ API key and you're all set! 🎉**

Questions? Check `VOICE_INCIDENT_FEATURE.md` for detailed documentation.

