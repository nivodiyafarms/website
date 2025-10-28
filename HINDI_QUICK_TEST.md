# 🎤 Hindi Voice Test - Quick Reference

## ✅ Hindi Support is Ready!

Your voice recording system now supports:
- ✅ **Hindi** (हिंदी)
- ✅ **English** (अंग्रेजी)
- ✅ **Hinglish** (मिश्रित)
- ✅ **Auto-detect** (स्वचालित)

---

## 🚀 Quick Test Samples

### Sample 1: Pest Attack (Copy & Read This)

**Hindi:**
```
यह एक बहुत गंभीर कीट प्रकोप की घटना है। खेत F_001 में गेहूं की 
फसल पर बहुत ज्यादा माहू कीट का हमला हुआ है। खेत के उत्तर-पश्चिम 
कोने में लगभग ढाई एकड़ जमीन प्रभावित है। अनुमानित नुकसान पंद्रह 
हजार रुपये है। मैंने तुरंत नीम का तेल का छिड़काव किया है।
```

**What AI Will Extract:**
- Title: "Pest Attack in Field F_001"
- Type: PEST_ATTACK
- Severity: CRITICAL
- Field: F_001
- Crop: Wheat
- Area: 2.5 acres
- Loss: ₹15,000
- Action: "Applied neem oil spray"

---

### Sample 2: Irrigation Problem (Copy & Read This)

**Hindi:**
```
यह गंभीर सिंचाई की समस्या है। फील्ड F_003 में पानी की पाइप लाइन 
टूट गई है। पूर्वी हिस्से में पानी नहीं पहुंच रहा है। लगभग चार एकड़ 
मोरिंगा की फसल सूख रही है। अनुमानित नुकसान बीस हजार रुपये हो 
सकता है। मैंने प्लंबर को बुलाया है।
```

**What AI Will Extract:**
- Title: "Irrigation Issue in Field F_003"
- Type: IRRIGATION_ISSUE
- Severity: HIGH
- Field: F_003
- Crop: Moringa
- Area: 4 acres
- Loss: ₹20,000
- Action: "Called plumber"

---

### Sample 3: Simple Hinglish (Copy & Read This)

**Hinglish:**
```
यह एक HIGH severity pest attack है। Field F_001 में wheat crop पर 
aphids हैं। Northwest corner में ढाई acre affected है। Loss fifteen 
thousand rupees है। मैंने neem spray किया है।
```

**What AI Will Extract:**
- Title: "High Severity Pest Attack"
- Type: PEST_ATTACK
- Severity: HIGH
- Field: F_001
- Crop: Wheat
- Area: 2.5 acres
- Loss: ₹15,000
- Action: "Applied neem spray"

---

## 📝 Key Hindi Words to Use

### Severity | गंभीरता:
- **"बहुत गंभीर"** or **"खतरनाक"** = CRITICAL
- **"गंभीर"** or **"ज्यादा"** = HIGH
- **"मध्यम"** = MEDIUM
- **"कम"** or **"थोड़ा"** = LOW

### Incident Types | घटना प्रकार:
- **"कीट प्रकोप"** = Pest Attack
- **"बीमारी"** = Disease
- **"सिंचाई समस्या"** = Irrigation Issue
- **"मशीन खराब"** = Equipment Failure
- **"तूफ़ान"** = Weather Damage

### Crops | फसलें:
- **"गेहूं"** = Wheat
- **"सोयाबीन"** = Soybean
- **"मक्का"** = Corn
- **"मोरिंगा"** = Moringa

### Area | क्षेत्र:
- **"आधा एकड़"** = 0.5 acre
- **"डेढ़ एकड़"** = 1.5 acres
- **"ढाई एकड़"** = 2.5 acres
- **"तीन एकड़"** = 3 acres

### Money | पैसे:
- **"पांच हजार रुपये"** = ₹5,000
- **"दस हजार रुपये"** = ₹10,000
- **"पंद्रह हजार रुपये"** = ₹15,000
- **"बीस हजार रुपये"** = ₹20,000

---

## 🎯 How to Test

### Step 1: Open Your App
- Go to http://localhost:5173
- Login with: `9876543210` / `admin123`

### Step 2: Navigate to Incidents
- Click "Incidents" in sidebar
- Click "Report Incident"
- Click "Voice Recording" tab

### Step 3: Record
- Click "Start Recording"
- Read one of the samples above in Hindi
- Click "Stop"
- Click "Upload & Extract Data"

### Step 4: Verify
- Check transcript (should show Hindi text)
- Check form (should be pre-filled in English)
- Review and save!

---

## 📱 Test with Your Phone

### Option 1: Direct Recording
1. Open app on phone
2. Use voice recorder
3. Speak in Hindi

### Option 2: Text-to-Speech Test
1. Go to: https://ttstool.com/hindi
2. Paste Hindi sample text
3. Generate audio
4. Download and upload

---

## ✅ What to Expect

### Input (Hindi):
```
खेत F_001 में गेहूं पर कीट प्रकोप। 
ढाई एकड़ प्रभावित। 
पंद्रह हजार नुकसान।
```

### Output (English Form):
```
Title: "Pest Attack in Field F_001"
Description: "Pest attack on wheat crop"
Type: PEST_ATTACK
Field: F_001
Crop: Wheat
Area: 2.5 acres
Loss: ₹15,000
```

---

## 🔧 Troubleshooting

### If Hindi Not Working:

1. **Check GROQ_API_KEY** is set in `backend/.env`
2. **Restart backend** server
3. **Clear browser** cache and reload
4. **Check console** for errors

### If Numbers Not Extracted:

- Speak numbers clearly
- Use Hindi number words: "पांच", "दस", "पंद्रह"
- Or use digits: "5", "10", "15"

### If Field ID Not Recognized:

- Say clearly: "फील्ड F_001" or "खेत F_001"
- Or just: "F_001"

---

## 💡 Pro Tips

1. **Speak Naturally**: Don't need to speak slowly, normal pace is fine
2. **Mix Languages**: Hinglish works great! "Field F_001 में pest attack"
3. **Use Numbers**: Both Hindi and English numbers work
4. **Field IDs**: Always mention field IDs clearly (F_001, F_002, etc.)
5. **Be Specific**: Mention severity, area, and loss

---

## 🎉 You're Ready!

Everything is set up for Hindi voice recording:
- ✅ Backend supports Hindi transcription
- ✅ LLM understands Hindi and translates
- ✅ Frontend ready to receive and display
- ✅ No additional configuration needed

**Just add your GROQ API key and start testing!**

---

**For detailed Hindi samples and vocabulary, see: `HINDI_VOICE_SAMPLES.md`**

**Happy Testing! शुभकामनाएं! 🎤🇮🇳**

