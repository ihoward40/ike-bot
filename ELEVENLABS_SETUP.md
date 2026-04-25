# ElevenLabs Voice Setup for SintraPrime

SintraPrime now uses **ElevenLabs** as the primary voice engine, providing professional, natural-sounding text-to-speech with emotional intelligence.

## Quick Setup (5 Minutes)

### 1. Get Your ElevenLabs API Key

1. Go to [https://elevenlabs.io/](https://elevenlabs.io/)
2. Sign up for a free account (10,000 characters/month free tier)
3. Navigate to your profile → API Keys
4. Copy your API key

### 2. Choose Your Voice

1. Go to ElevenLabs Dashboard → Voices
2. Click on a voice you like (e.g., "Adam", "Bella", "Antoni")
3. Look at the URL: `https://elevenlabs.io/app/voice-lab?voiceId=XXXXXXXX`
4. Copy the `voiceId` value

**Recommended Voices for SintraPrime:**
- **Adam** - Deep, authoritative, perfect for legal/enforcement
- **Bella** - Clear, professional, excellent for narration
- **Antoni** - Warm, confident, good for general use
- **Josh** - Strong, commanding, ideal for Sentinel role

### 3. Configure SintraPrime

Create or edit `.env` file in the `sintraprime-agent` directory:

```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=sk_your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
ELEVENLABS_MONTHLY_LIMIT=10000

# Voice System
VOICE_ENABLED=true
```

### 4. Test Your Configuration

```bash
cd sintraprime-agent
npm install
npm start
```

You should hear SintraPrime speak with your selected ElevenLabs voice on startup.

## How It Works

### Intelligent Fallback System

SintraPrime uses a **three-tier voice system** to ensure you always hear output:

1. **Tier 1: ElevenLabs (Primary)** - High-quality, natural speech
   - Used for ALL speech when configured
   - Tracks character usage against monthly limit
   - Automatic fallback if limit reached

2. **Tier 2: Edge Neural TTS (Fallback)** - Microsoft's neural voices
   - Free, local Windows TTS
   - Used when ElevenLabs unavailable or limit exceeded
   - Good quality, always reliable

3. **Tier 3: SAPI (Emergency)** - Windows Speech API
   - Basic TTS, but NEVER fails
   - Last resort to ensure speech happens
   - Platform fallbacks for macOS (`say`) and Linux (`espeak`)

### Cost Management

The system automatically:
- Tracks character usage
- Respects your monthly limit
- Falls back to free voices when limit reached
- Logs usage statistics

**Free Tier:** 10,000 characters/month
- ~100-150 sentences
- Perfect for critical announcements
- Can upgrade for unlimited usage

## Advanced Configuration

### Multiple Voice Personalities

You can configure different voices for different personas:

```javascript
// In voice-system-v2.js, modify selectVoiceTier()
const PERSONA_VOICES = {
  SENTINEL: 'voice_id_for_sentinel',      // Authoritative, commanding
  VAULT_GUARDIAN: 'voice_id_for_vault',   // Deep, judicial
  ADVISOR: 'voice_id_for_advisor',        // Clear, analytical
  SINTRAPRIME: 'voice_id_for_narrator'    // Professional, trustworthy
};
```

### Voice Settings

Adjust voice characteristics in the ElevenLabs API call:

```javascript
voice_settings: {
  stability: 0.5,        // 0-1: Lower = more expressive
  similarity_boost: 0.75 // 0-1: Higher = closer to sample
}
```

## Troubleshooting

### "ElevenLabs not configured" Warning

**Cause:** Missing or invalid API key

**Fix:**
```bash
# Check your .env file
cat sintraprime-agent/.env | grep ELEVENLABS_API_KEY

# Make sure the key starts with 'sk_'
```

### "Monthly limit reached"

**Cause:** You've used your free 10,000 characters

**Fix:**
- Wait until next month for free tier reset
- Or upgrade to paid plan
- System automatically falls back to Edge TTS

### No Sound At All

**Cause:** Windows audio permissions or missing voice engines

**Fix:**
```powershell
# Test audio service
Get-Service Audiosrv | Select-Object Status

# Test basic speech
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.Speak('Test')
```

### Voice Sounds Robotic

**Cause:** Using SAPI fallback instead of ElevenLabs

**Fix:**
- Verify API key is correct
- Check usage hasn't exceeded limit
- Review logs for ElevenLabs errors

## Verification Commands

```bash
# Check configuration
cd sintraprime-agent
node -e "require('dotenv').config(); console.log('API Key:', process.env.ELEVENLABS_API_KEY ? 'Configured' : 'Missing')"

# Test voice directly
npm start
# Should announce: "SintraPrime online. Time is [date]. All systems standing by."
```

## Security Notes

⚠️ **Never commit your API key to git**
- Keep `.env` in `.gitignore`
- Use environment variables in production
- Rotate keys if exposed

✅ **API Key is already exposed in PR comments**
- If you used the example key `sk_9e4f063dd3a18afa769a0329c3445049d27b7ab96808c824`
- Go to ElevenLabs → Profile → API Keys → Regenerate

## Monitoring Usage

The system logs character usage:

```
[INFO] ElevenLabs speech completed {
  charCount: 42,
  totalUsed: 1234,
  remaining: 8766
}
```

Monitor your dashboard: [https://elevenlabs.io/](https://elevenlabs.io/)

## Support

- ElevenLabs Docs: https://docs.elevenlabs.io/
- Voice Library: https://elevenlabs.io/voice-library
- API Reference: https://docs.elevenlabs.io/api-reference

---

**Result:** SintraPrime now speaks with institutional authority using professional-grade voice synthesis. 🔊
