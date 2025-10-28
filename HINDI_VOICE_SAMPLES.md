# 🎤 Hindi Voice Recording Samples - नमूना हिंदी आवाज रिकॉर्डिंग

## भाषा समर्थन | Language Support

✅ **English** (अंग्रेजी)  
✅ **Hindi** (हिंदी)  
✅ **Hinglish** (मिश्रित)  
✅ **Auto-detect** (स्वचालित पहचान)

---

## 📝 Sample Hindi Texts | नमूना हिंदी पाठ

### 1. कीट प्रकोप | Pest Attack (High Severity)

**Hindi:**
```
यह एक बहुत गंभीर कीट प्रकोप की घटना है। खेत F_001 में गेहूं की फसल पर बहुत ज्यादा माहू कीट का हमला हुआ है। खेत के उत्तर-पश्चिम कोने में लगभग ढाई एकड़ जमीन प्रभावित है। अनुमानित नुकसान पंद्रह हजार रुपये है। मैंने तुरंत नीम का तेल का छिड़काव किया है।
```

**Expected Extraction:**
```json
{
  "title": "Pest Attack in Field F_001",
  "description": "Very severe aphid attack on wheat crop in Field F_001. Northwest corner affected.",
  "incident_type": "PEST_ATTACK",
  "severity": "CRITICAL",
  "field_id": "F_001",
  "crop_affected": "Wheat",
  "location_description": "Northwest corner",
  "affected_area_acre": 2.5,
  "estimated_loss": 15000,
  "action_taken": "Applied neem oil spray"
}
```

---

### 2. बीमारी | Disease (Medium Severity)

**Hindi:**
```
खेत नंबर दो में सोयाबीन की फसल में पत्तियों पर धब्बे दिखाई दे रहे हैं। यह मध्यम गंभीरता की बीमारी है। पूरे खेत के दक्षिण भाग में लगभग तीन एकड़ में यह समस्या है। नुकसान दस हजार रुपये तक हो सकता है। अभी तक कोई कार्रवाई नहीं की है।
```

**Expected Extraction:**
```json
{
  "title": "Disease in Field 2 - Soybean",
  "description": "Leaf spot disease visible on soybean crop in Field 2. Southern part affected.",
  "incident_type": "DISEASE",
  "severity": "MEDIUM",
  "field_id": "F_002",
  "crop_affected": "Soybean",
  "location_description": "Southern part",
  "affected_area_acre": 3.0,
  "estimated_loss": 10000,
  "action_taken": null
}
```

---

### 3. सिंचाई समस्या | Irrigation Issue (High Severity)

**Hindi:**
```
यह गंभीर सिंचाई की समस्या है। फील्ड F_003 में पानी की पाइप लाइन टूट गई है। पूर्वी हिस्से में पानी नहीं पहुंच रहा है। लगभग चार एकड़ मोरिंगा की फसल सूख रही है। अनुमानित नुकसान बीस हजार रुपये हो सकता है। मैंने प्लंबर को बुलाया है।
```

**Expected Extraction:**
```json
{
  "title": "Irrigation Issue in Field F_003",
  "description": "Water pipeline broken in Field F_003. Eastern section not receiving water. Moringa crop drying.",
  "incident_type": "IRRIGATION_ISSUE",
  "severity": "HIGH",
  "field_id": "F_003",
  "crop_affected": "Moringa",
  "location_description": "Eastern section",
  "affected_area_acre": 4.0,
  "estimated_loss": 20000,
  "action_taken": "Called plumber"
}
```

---

### 4. मौसम क्षति | Weather Damage (Critical Severity)

**Hindi:**
```
कल रात बहुत तेज तूफान और ओलावृष्टि हुई। यह बहुत गंभीर स्थिति है। खेत एक में पूरी गेहूं की फसल बर्बाद हो गई है। सभी पांच एकड़ प्रभावित हैं। नुकसान पचास हजार रुपये से ज्यादा है। अभी कुछ नहीं किया जा सकता।
```

**Expected Extraction:**
```json
{
  "title": "Weather Damage - Storm and Hail",
  "description": "Severe storm and hail last night destroyed entire wheat crop in Field 1.",
  "incident_type": "WEATHER_DAMAGE",
  "severity": "CRITICAL",
  "field_id": "F_001",
  "crop_affected": "Wheat",
  "location_description": "Entire field",
  "affected_area_acre": 5.0,
  "estimated_loss": 50000,
  "action_taken": null
}
```

---

### 5. मशीन खराब | Equipment Failure (Medium Severity)

**Hindi:**
```
ट्रैक्टर खराब हो गया है। यह मध्यम समस्या है। खेत F_002 में जुताई का काम रुक गया है। लगभग दो एकड़ का काम बाकी है। पांच हजार रुपये का नुकसान हो सकता है। मैंने मैकेनिक को फोन किया है।
```

**Expected Extraction:**
```json
{
  "title": "Equipment Failure - Tractor",
  "description": "Tractor broke down. Plowing work stopped in Field F_002.",
  "incident_type": "EQUIPMENT_FAILURE",
  "severity": "MEDIUM",
  "field_id": "F_002",
  "affected_area_acre": 2.0,
  "estimated_loss": 5000,
  "action_taken": "Called mechanic"
}
```

---

### 6. जानवर का नुकसान | Animal Damage (Low Severity)

**Hindi:**
```
नीलगाय ने फसल को थोड़ा नुकसान पहुंचाया है। यह कम गंभीरता की समस्या है। खेत तीन के पश्चिम कोने में मक्का की फसल को नुकसान हुआ है। आधा एकड़ प्रभावित है। दो हजार रुपये का नुकसान है। मैंने बाड़ लगा दी है।
```

**Expected Extraction:**
```json
{
  "title": "Animal Damage by Nilgai",
  "description": "Nilgai caused minor damage to corn crop in western corner of Field 3.",
  "incident_type": "ANIMAL_DAMAGE",
  "severity": "LOW",
  "field_id": "F_003",
  "crop_affected": "Corn",
  "location_description": "Western corner",
  "affected_area_acre": 0.5,
  "estimated_loss": 2000,
  "action_taken": "Installed fence"
}
```

---

### 7. Hinglish (मिश्रित) Sample

**Hinglish:**
```
यह एक HIGH severity pest attack है। Field F_001 में wheat crop पर बहुत सारे aphids हैं। Northwest corner में approximately ढाई acre affected है। Loss करीब fifteen thousand rupees है। मैंने immediately neem spray किया है।
```

**Expected Extraction:**
```json
{
  "title": "High Severity Pest Attack in Field F_001",
  "description": "Heavy aphid infestation on wheat crop in northwest corner of Field F_001.",
  "incident_type": "PEST_ATTACK",
  "severity": "HIGH",
  "field_id": "F_001",
  "crop_affected": "Wheat",
  "location_description": "Northwest corner",
  "affected_area_acre": 2.5,
  "estimated_loss": 15000,
  "action_taken": "Applied neem spray"
}
```

---

## 📊 Hindi Vocabulary Reference | हिंदी शब्दावली संदर्भ

### Incident Types | घटना के प्रकार

| Hindi | English | Code |
|-------|---------|------|
| कीट प्रकोप / कीड़ा लगना | Pest Attack | PEST_ATTACK |
| बीमारी / रोग | Disease | DISEASE |
| मौसम क्षति / तूफ़ान | Weather Damage | WEATHER_DAMAGE |
| मशीन खराब / यंत्र विफलता | Equipment Failure | EQUIPMENT_FAILURE |
| सिंचाई समस्या / पानी की कमी | Irrigation Issue | IRRIGATION_ISSUE |
| चोरी | Theft | THEFT |
| जानवर का नुकसान | Animal Damage | ANIMAL_DAMAGE |
| मिट्टी की समस्या | Soil Issue | SOIL_ISSUE |
| अन्य | Other | OTHER |

### Severity Levels | गंभीरता स्तर

| Hindi | English | Code |
|-------|---------|------|
| कम / थोड़ा / हल्का | Low | LOW |
| मध्यम / ठीक-ठाक | Medium | MEDIUM |
| ज्यादा / गंभीर | High | HIGH |
| बहुत गंभीर / खतरनाक | Critical | CRITICAL |

### Crops | फसलें

| Hindi | English |
|-------|---------|
| गेहूं | Wheat |
| सोयाबीन | Soybean |
| मक्का | Corn |
| मोरिंगा / सहजन | Moringa |
| धान / चावल | Rice |
| चना | Chickpea |
| सरसों | Mustard |
| कपास | Cotton |

### Measurements | माप

| Hindi | English | Value |
|-------|---------|-------|
| आधा एकड़ | Half acre | 0.5 |
| एक एकड़ | One acre | 1.0 |
| डेढ़ एकड़ | One and half acre | 1.5 |
| ढाई एकड़ | Two and half acre | 2.5 |
| तीन एकड़ | Three acres | 3.0 |
| पांच एकड़ | Five acres | 5.0 |

### Currency | मुद्रा

| Hindi | Value |
|-------|-------|
| दो हजार रुपये | ₹2,000 |
| पांच हजार रुपये | ₹5,000 |
| दस हजार रुपये | ₹10,000 |
| पंद्रह हजार रुपये | ₹15,000 |
| बीस हजार रुपये | ₹20,000 |
| पचास हजार रुपये | ₹50,000 |

### Locations | स्थान

| Hindi | English |
|-------|---------|
| उत्तर | North |
| दक्षिण | South |
| पूर्व | East |
| पश्चिम | West |
| उत्तर-पूर्व | Northeast |
| उत्तर-पश्चिम | Northwest |
| दक्षिण-पूर्व | Southeast |
| दक्षिण-पश्चिम | Southwest |
| बीच में | Center |
| कोना | Corner |

---

## 🎯 Testing Tips | परीक्षण सुझाव

### For Best Results:

1. **Speak Clearly** | साफ़ बोलें
   - Use natural pace | सामान्य गति से बोलें
   - Pronounce numbers clearly | संख्याओं को स्पष्ट बोलें

2. **Include Key Information** | महत्वपूर्ण जानकारी शामिल करें
   - Field ID | खेत संख्या
   - Crop name | फसल का नाम
   - Area affected | प्रभावित क्षेत्र
   - Estimated loss | अनुमानित नुकसान

3. **Mention Severity** | गंभीरता बताएं
   - Use clear words | स्पष्ट शब्द उपयोग करें
   - Example: "बहुत गंभीर" for CRITICAL

4. **State Actions** | कार्रवाई बताएं
   - What you did immediately | तुरंत क्या किया
   - Example: "मैंने स्प्रे किया है"

---

## 🚀 How to Test | कैसे परीक्षण करें

### Method 1: Text to Speech (for testing)

1. Go to: https://ttstool.com/hindi
2. Paste Hindi text
3. Generate audio
4. Download audio file
5. Upload to your app

### Method 2: Record Your Voice

1. Read Hindi text aloud
2. Record using phone/computer
3. Upload to app
4. Check extracted data

### Method 3: Use Voice Recorder in App

1. Click "Voice Recording" tab
2. Read Hindi sample text
3. Stop recording
4. Upload and see results!

---

## 📱 Example Usage in Frontend

When recording, read one of these samples:

**Quick Test (30 seconds):**
```
यह बहुत गंभीर कीट प्रकोप है। खेत F_001 में गेहूं पर माहू का हमला। 
ढाई एकड़ प्रभावित। पंद्रह हजार रुपये नुकसान। नीम स्प्रे किया है।
```

**Detailed Test (60 seconds):**
```
नमस्कार, मैं एक गंभीर घटना की रिपोर्ट कर रहा हूं। 
फील्ड F_001 में गेहूं की फसल पर बहुत ज्यादा माहू कीट का प्रकोप हुआ है। 
यह बहुत गंभीर स्थिति है। खेत के उत्तर-पश्चिम कोने में 
लगभग ढाई एकड़ जमीन प्रभावित है। अनुमानित नुकसान 
पंद्रह हजार रुपये के आसपास है। मैंने तुरंत नीम के तेल का 
छिड़काव करवाया है। कृपया इसे नोट कर लें।
```

---

## ✅ Expected Behavior | अपेक्षित व्यवहार

### What Happens:

1. **Audio Upload** → Whisper transcribes (Hindi/English/Auto)
2. **Transcription** → Shows original text in Hindi
3. **AI Processing** → LLM extracts data in English
4. **Form Pre-fill** → All fields filled in English
5. **Review** → User can edit/add missing info
6. **Save** → Incident saved with both transcript and data

### Language Support:

- ✅ **Pure Hindi** → Works perfectly
- ✅ **Pure English** → Works perfectly
- ✅ **Hinglish Mix** → Works perfectly
- ✅ **Auto-detect** → Automatically detects language

---

## 🔧 Configuration

### Backend already configured for:
- ✅ Multi-language transcription (Whisper)
- ✅ Hindi-aware LLM prompts
- ✅ Auto-language detection
- ✅ Translation to English output

### No additional setup needed!

---

## 📞 Common Hindi Phrases | सामान्य हिंदी वाक्यांश

### Starting Phrases:
- "यह एक घटना की रिपोर्ट है" - This is an incident report
- "मैं रिपोर्ट कर रहा हूं" - I am reporting
- "समस्या है" - There is a problem

### Describing Severity:
- "बहुत गंभीर समस्या है" - Very serious problem
- "यह खतरनाक है" - This is dangerous
- "थोड़ी समस्या है" - Minor problem
- "मध्यम गंभीरता की" - Medium severity

### Action Taken:
- "मैंने स्प्रे किया है" - I have sprayed
- "मैंने फोन किया है" - I have called
- "कुछ नहीं किया" - Nothing done yet
- "तुरंत कार्रवाई की" - Took immediate action

---

## 🎉 Success Indicators | सफलता संकेतक

You'll know it's working when:

1. ✅ Can record in Hindi
2. ✅ Transcript shows Hindi text correctly
3. ✅ Form gets pre-filled in English
4. ✅ Numbers extracted correctly
5. ✅ Field IDs recognized
6. ✅ Severity levels mapped properly
7. ✅ Crop names translated

---

**Ready to test with Hindi! हिंदी में परीक्षण के लिए तैयार! 🎤🇮🇳**

