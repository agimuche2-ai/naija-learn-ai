# AI Tutor Setup Guide

## Overview
The improved AI tutor now uses **multiple AI providers** for maximum reliability:
1. **Primary:** OpenAI API (GPT-4o-mini) - Best for accurate chemistry answers
2. **Fallback:** Lovable API (if OpenAI unavailable)
3. **Final Fallback:** Study library search + helpful suggestions

## Getting Free OpenAI API Access

### Option 1: OpenAI Free Trial (Recommended)
**The easiest way to get started with $5 in free credits:**

1. **Sign Up:**
   - Go to https://platform.openai.com/signup
   - Create account with email, Google, or GitHub
   - Complete email verification

2. **Get Your API Key:**
   - Navigate to https://platform.openai.com/api/keys
   - Click "Create new secret key"
   - Copy the key (you'll need it in the next step)
   - ⚠️ **SAVE IT SECURELY** - you won't see it again

3. **Check Free Trial Credit:**
   - Go to https://platform.openai.com/account/billing/overview
   - Should show $5 free trial credit (valid for 3 months)
   - This covers ~500,000 tokens of gpt-4o-mini usage

### Option 2: Pay-As-You-Go
If you want persistent API access after free trial:
1. Add a payment method in https://platform.openai.com/account/billing/overview
2. Set usage limits to control costs
3. GPT-4o-mini is extremely affordable (~$0.15 per 1M input tokens)

---

## Environment Setup

### 1. Add Environment Variables
Create or update your `.env.local` file in the project root:

```bash
# Existing variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key

# NEW: OpenAI API
OPENAI_API_KEY=sk-proj-your-actual-key-here

# OPTIONAL: Keep Lovable as fallback
LOVABLE_API_KEY=your_lovable_key_if_available
```

### 2. Environment Variable Locations
The app looks for these vars in this order:

**OpenAI:**
```
process.env.OPENAI_API_KEY        # Primary
```

**Lovable (fallback):**
```
process.env.LOVABLE_API_KEY       # Fallback
```

**Supabase (library context):**
```
process.env.VITE_SUPABASE_URL
process.env.VITE_SUPABASE_PUBLISHABLE_KEY
process.env.SUPABASE_URL           # Alternative name
process.env.SUPABASE_PUBLISHABLE_KEY # Alternative name
```

### 3. For Cloudflare Deployment
If deploying to Cloudflare Workers:

Add secrets via Wrangler:
```bash
wrangler secret put OPENAI_API_KEY
# Paste your key when prompted

wrangler secret put LOVABLE_API_KEY
# Paste your key when prompted (if using)
```

Then deploy:
```bash
npm run build
wrangler deploy
```

---

## How the AI Tutor Works Now

### Request Flow
```
User Question
    ↓
[1] Search Study Library for context
    ↓
[2] Call OpenAI API with enhanced system prompt + library context
    ↓
If OpenAI fails → [3] Call Lovable API
    ↓
If both fail → [4] Return library context or helpful suggestions
```

### Enhanced System Prompt
The AI tutor now has:
- ✅ Detailed chemistry expertise guidelines
- ✅ Instructions for simple, SSS-appropriate explanations
- ✅ WAEC/NECO syllabus alignment
- ✅ Step-by-step calculation guidance
- ✅ Real-world Nigerian context examples
- ✅ Library context integration

### Better Error Handling
- Graceful fallbacks if APIs are unavailable
- Informative user messages
- No silent failures - always returns something helpful
- Logs errors to console for debugging

---

## Testing the Setup

### Local Testing
1. Add your API key to `.env.local`
2. Start dev server: `npm run dev`
3. Navigate to http://localhost:5173/tutor
4. Ask a chemistry question: "Explain the mole concept"
5. Should get a detailed AI response

### Troubleshooting

**"I could not find a specific match..." message?**
- ✅ Normal if no API key is configured
- Check `.env.local` has `OPENAI_API_KEY=sk-...`
- Restart dev server after adding env var

**"I am temporarily unavailable..."?**
- ❌ Likely API error
- Check API key validity at https://platform.openai.com/api/keys
- Check free trial credits haven't expired
- Check internet connection

**Rate limiting errors?**
- You've hit OpenAI rate limits (unlikely on free tier)
- Wait a moment and try again
- Consider upgrading to paid tier if needed

---

## Cost Estimation

### OpenAI Free Trial ($5 credit)
- **Chemistry questions:** ~1,000-2,000 typical Q&A exchanges
- **Cost per question:** ~$0.002-0.005
- **Free tier lasts:** ~3 months with normal usage

### Paid Usage (if you continue after free trial)
- **GPT-4o-mini:** ~$0.15 per 1M input tokens
- **Typical chemistry question:** 500-1000 tokens = ~$0.00008-$0.00015
- **1,000 questions:** ~$0.08-$0.15

---

## Alternative Free AI Options

If you prefer not to use OpenAI, here are free alternatives:

| Service | Free Tier | Setup | Quality |
|---------|-----------|-------|---------|
| **OpenAI GPT-4o-mini** | $5 trial + pay-as-you-go | Easy | Excellent |
| **Hugging Face Inference API** | Free with limits | Requires account | Good |
| **Replicate** | $5 trial | Free API key | Good |
| **Google Gemini API** | Free tier | Easy signup | Good |

---

## Implementation Details

### Modified Files
- `src/functions/tutor.ts` - Enhanced with multi-provider support

### New Features
1. **Separate AI provider functions** - Easy to add more providers
2. **Better system prompt** - 20+ lines of chemistry-specific instructions
3. **Library context injection** - Seamless integration
4. **Multiple fallbacks** - Never leaves user hanging
5. **Better error messages** - Helpful suggestions included

### Backward Compatibility
- Still works if only Lovable key is provided
- Library fallback works without any API keys
- No breaking changes to UI/UX

---

## Next Steps

1. **Get OpenAI API Key** → https://platform.openai.com/signup
2. **Add to `.env.local`** → `OPENAI_API_KEY=sk-...`
3. **Restart dev server** → `npm run dev`
4. **Test at** → http://localhost:5173/tutor
5. **Deploy to production** → `npm run build && wrangler deploy`

---

## Questions & Support

**How do I know if my API key works?**
- Check browser DevTools → Network tab
- Should see successful requests to `api.openai.com`

**Can I use multiple accounts?**
- Yes, just rotate the `OPENAI_API_KEY` env variable

**Will this work offline?**
- No, requires internet for both OpenAI and library context
- Library fallback only works if materials are cached

**Can I modify the system prompt?**
- Yes, edit the `CHEMISTRY_TUTOR_SYSTEM` constant in `src/functions/tutor.ts`
- Make it more specific to your needs
