# Backend Changes for Barge-In Fix

## Problem
Currently, when TTS finishes generating audio, the backend immediately sets `ttsPlaying = false`. However, the browser may still be playing buffered audio chunks, causing barge-in detection to fail.

Additionally, when the browser sends `audio_stopped_playing` but new TTS is already generating (rapid responses), we shouldn't set it to false because audio will start playing soon.

## Solution: Dual-State Tracking

**Key Principle:** Track TTS generation and browser playback separately:
- `ttsPlaying` - TTS is currently generating audio (existing field, keep as-is)
- `browserPlaying` - Browser is currently playing audio (NEW field, tracked via `audio_started_playing` and `audio_stopped_playing`)
- **Barge-in check:** `ttsPlaying || browserPlaying` - Use both fields in combination

This ensures barge-in works correctly even when:
1. TTS finishes (`ttsPlaying = false`) but browser still playing (`browserPlaying = true`)
2. Browser stops (`browserPlaying = false`) but new TTS is generating (`ttsPlaying = true`)

---

## Changes Required

### 0. `ConversationState.java` - Add Browser Playing Field

#### ADD: New field for browser playback tracking
**Add after line ~37 (keep existing ttsPlaying field):**
```java
// NEW: Barge-in state
private final AtomicBoolean ttsPlaying = new AtomicBoolean(false);  // ✅ KEEP - TTS is generating
private final AtomicBoolean browserPlaying = new AtomicBoolean(false);  // ✅ ADD - Browser is playing audio
private final AtomicLong lastBargeInTime = new AtomicLong(0);
```

**Add accessor after line ~71 (keep existing ttsPlaying() method):**
```java
// NEW: Browser playing accessor
public AtomicBoolean browserPlaying() { return browserPlaying; }
```

**Update resetAll() method around line ~177:**
```java
public void resetAll() {
    silenceTask.set(null);
    ongoingLlm.set(null);
    ongoingTts.set(null);
    lastUserSpeech.set(0);
    lastInterimFired.set("");
    lastInterimTimestamp.set(0);
    lastCommittedText.set("");
    // Reset barge-in state (both fields)
    ttsPlaying.set(false);
    browserPlaying.set(false);
    lastBargeInTime.set(0);
    conversationId.set(null);
    conversationStartTime.set(0);
    temperature.set(null);
    maxTokens.set(null);
    conversationHistory.clear();
}
```

---

### 1. `ContinuousAudioService.java`

#### CHANGE 1: When TTS starts generating (Browser) - Line ~951
**Current Code:**
```java
// Browser: Send as binary WebSocket message
if (state != null) {
    boolean wasPlaying = state.ttsPlaying().get();
    state.ttsPlaying().set(true);
    System.out.println(">>> [BARGE-IN] Browser TTS playback started - ttsPlaying: " + wasPlaying + " -> true");
}
```

**NEW Code:**
```java
// Browser: Send as binary WebSocket message
if (state != null) {
    // TTS is generating
    state.ttsPlaying().set(true);
    // Optimistically set browserPlaying - browser will start playing soon
    state.browserPlaying().set(true);
    boolean shouldBargeIn = state.ttsPlaying().get() || state.browserPlaying().get();
    logger.info(">>> [TTS] Browser TTS generation started - ttsPlaying: true, browserPlaying: true (optimistic), shouldBargeIn: " + shouldBargeIn);
}
```

---

#### CHANGE 2: When TTS finishes generating (Browser) - Line ~751
**Current Code:**
```java
.doOnComplete(() -> {
    System.out.println(">>> [PIPELINE] TTS completed for: " + newInterimOrFinal);
    if (state != null) {
        boolean wasPlaying = state.ttsPlaying().get();
        state.ttsPlaying().set(false);  // ❌ REMOVE THIS LINE
        System.out.println(">>> [BARGE-IN] Browser TTS playback ended - ttsPlaying: " + wasPlaying + " -> false");
    } else {
        System.out.println(">>> [BARGE-IN] ERROR: No conversation state found for TTS completion");
    }
})
```

**NEW Code:**
```java
.doOnComplete(() -> {
    logger.info(">>> [PIPELINE] TTS completed for: " + newInterimOrFinal);
    if (state != null) {
        // TTS generation is done, but browser may still be playing
        // ✅ Set ttsPlaying to false (TTS is no longer generating)
        // ✅ Keep browserPlaying as-is (browser may still be playing buffered chunks)
        state.ttsPlaying().set(false);
        boolean shouldBargeIn = state.ttsPlaying().get() || state.browserPlaying().get();  // true if browserPlaying is still true
        logger.info(">>> [TTS] TTS generation completed - ttsPlaying: false, browserPlaying: " + state.browserPlaying().get() + ", shouldBargeIn: " + shouldBargeIn);
    } else {
        logger.error(">>> [TTS] ERROR: No conversation state found for TTS completion");
    }
})
```

---

#### CHANGE 3: When WAV queue processor finishes (Phone) - Line ~1030
**✅ NO CHANGE NEEDED** - `ttsPlaying` should reflect the actual TTS generation state. The WAV queue processor handles phone sessions which have different logic. Keep current behavior.

---

### 2. `ConversationWsHandler.java`

#### CHANGE 4: Handle `audio_stopped_playing` - Line ~262
**Current Code:**
```java
if (c.is("audio_stopped_playing")) {
    // Browser reports that audio stopped playing (sync with backend state)
    ConversationState conversationState = (ConversationState) session.getAttributes().get("conversationState");
    if (conversationState != null) {
        boolean wasPlaying = conversationState.ttsPlaying().get();
        conversationState.ttsPlaying().set(false);
        System.out.println(">>> [BROWSER AUDIO] Audio stopped playing confirmation - ttsPlaying: " + wasPlaying + " -> false");
    } else {
        System.out.println(">>> [BROWSER AUDIO] ERROR: No conversation state found for audio_stopped_playing");
    }
    return Mono.empty();
}
```

**NEW Code:**
```java
if (c.is("audio_stopped_playing")) {
    // Browser reports that audio stopped playing
    ConversationState conversationState = (ConversationState) session.getAttributes().get("conversationState");
    if (conversationState != null) {
        boolean wasPlaying = conversationState.browserPlaying().get();
        // Set browserPlaying to match ttsPlaying state
        // If ttsPlaying is false, browserPlaying should be false
        // If ttsPlaying is true, browserPlaying should be true (new audio will start)
        boolean ttsPlayingValue = conversationState.ttsPlaying().get();
        conversationState.browserPlaying().set(ttsPlayingValue);
        
        boolean shouldBargeIn = conversationState.ttsPlaying().get() || conversationState.browserPlaying().get();
        System.out.println(">>> [BROWSER AUDIO] Audio stopped playing - browserPlaying: " + wasPlaying + " -> " + ttsPlayingValue + " (matches ttsPlaying: " + ttsPlayingValue + "), shouldBargeIn: " + shouldBargeIn);
    } else {
        System.out.println(">>> [BROWSER AUDIO] ERROR: No conversation state found for audio_stopped_playing");
    }
    return Mono.empty();
}
```

---

#### CHANGE 5: Handle `audio_started_playing` - Line ~249
**Current Code:**
```java
if (c.is("audio_started_playing")) {
    // Browser confirms that audio started playing (sync with backend state)
    ConversationState conversationState = (ConversationState) session.getAttributes().get("conversationState");
    if (conversationState != null) {
        boolean wasAlreadyPlaying = conversationState.ttsPlaying().get();
        conversationState.ttsPlaying().set(true);
        System.out.println(">>> [BROWSER AUDIO] Audio started playing confirmation - ttsPlaying: " + wasAlreadyPlaying + " -> true");
    } else {
        System.out.println(">>> [BROWSER AUDIO] ERROR: No conversation state found for audio_started_playing");
    }
    return Mono.empty();
}
```

**NEW Code:**
```java
if (c.is("audio_started_playing")) {
    // Browser confirms that audio started playing
    ConversationState conversationState = (ConversationState) session.getAttributes().get("conversationState");
    if (conversationState != null) {
        boolean wasPlaying = conversationState.browserPlaying().get();
        // Only set browserPlaying to true - do not touch ttsPlaying
        conversationState.browserPlaying().set(true);
        boolean shouldBargeIn = conversationState.ttsPlaying().get() || conversationState.browserPlaying().get();
        System.out.println(">>> [BROWSER AUDIO] Audio started playing confirmation - browserPlaying: " + wasPlaying + " -> true, shouldBargeIn: " + shouldBargeIn);
    } else {
        System.out.println(">>> [BROWSER AUDIO] ERROR: No conversation state found for audio_started_playing");
    }
    return Mono.empty();
}
```

---

### 3. `SttPipelineHandler.java`

#### CHANGE 6: Barge-in detection on interim speech - Line ~61
**Current Code:**
```java
if (state.ttsPlaying().get() || continuousAudioService.isWavPlaying()) {
    System.out.println(">>> [BARGE-IN] User spoke during TTS - interrupting!");
    state.cancelAll(); // Cancel LLM + TTS
    System.out.println(">>> [BARGE-IN] Clearing wav from queue !");
    continuousAudioService.clearSessionFromQueue(state.providerStreamId());
    state.ttsPlaying().set(false);  // ✅ This is correct - barge-in means stop
    // Send stop signal
    continuousAudioService.sendStopAudioSignal(state, session);
```

**NEW Code:**
```java
if (state.ttsPlaying().get() || state.browserPlaying().get() || continuousAudioService.isWavPlaying()) {  // Add browserPlaying check
    System.out.println(">>> [BARGE-IN] User spoke during TTS - interrupting!");
    state.cancelAll(); // Cancel LLM + TTS
    System.out.println(">>> [BARGE-IN] Clearing wav from queue !");
    continuousAudioService.clearSessionFromQueue(state.providerStreamId());
    // Stop both: cancel TTS generation and mark browser as stopped
    state.ttsPlaying().set(false);
    state.browserPlaying().set(false);
    System.out.println(">>> [BARGE-IN] Barge-in - ttsPlaying: false, browserPlaying: false");
    // Send stop signal
    continuousAudioService.sendStopAudioSignal(state, session);
```

---

## Summary of Changes

| File | Line | Change |
|------|------|--------|
| `ConversationState.java` | ~37 | **ADD** `browserPlaying` field (keep existing `ttsPlaying` field) |
| `ConversationState.java` | ~71 | **ADD** `browserPlaying()` accessor |
| `ConversationState.java` | ~177 | **UPDATE** `resetAll()` to reset `browserPlaying` |
| `ContinuousAudioService.java` | ~951 | Set `ttsPlaying = true` and `browserPlaying = true` (optimistic) when TTS starts |
| `ContinuousAudioService.java` | ~751 | Set `ttsPlaying = false` when TTS finishes (keep `browserPlaying` as-is) |
| `ConversationWsHandler.java` | ~262 | Set `browserPlaying` to match `ttsPlaying` value (do not change `ttsPlaying`) |
| `ConversationWsHandler.java` | ~249 | Set `browserPlaying = true` when `audio_started_playing` received (do not touch `ttsPlaying`) |
| `SttPipelineHandler.java` | ~56 | Add `|| state.browserPlaying().get()` to barge-in check |
| `SttPipelineHandler.java` | ~61 | Set both `ttsPlaying = false` and `browserPlaying = false` on barge-in |

---

## State Flow After Changes

### Scenario 1: Normal Flow
1. **TTS starts generating:**
   - `ttsPlaying = true`, `browserPlaying = true` (optimistic)
   - `ttsActive = true` ✅ (barge-in enabled)

2. **Browser starts playing:**
   - Browser sends `audio_started_playing`
   - `browserPlaying = true` ✅ (confirmation)
   - `ttsActive = true` ✅

3. **TTS finishes generating:**
   - `ttsPlaying = false`, `browserPlaying = true` (still playing)
   - `ttsActive = true` ✅ (barge-in still works!)

4. **Browser finishes playing:**
   - Browser sends `audio_stopped_playing`
   - Check: `ttsPlaying = false` → Set `browserPlaying = false`
   - `ttsActive = false` ✅ (barge-in disabled)

### Scenario 2: Rapid Responses (Your Concern!)
1. **TTS1 finishes generating:**
   - `ttsPlaying = false`, `browserPlaying = true` (playing TTS1)
   - `ttsActive = true` ✅

2. **New LLM response starts → TTS2 starts generating:**
   - `ttsPlaying = true`, `browserPlaying = true` (still playing TTS1)
   - `ttsActive = true` ✅

3. **Browser finishes TTS1, sends `audio_stopped_playing`:**
   - Check: `ttsPlaying = true` (TTS2 is generating!)
   - Keep `browserPlaying = true` ✅ (new audio will start soon)
   - `ttsActive = true` ✅ (barge-in still enabled - correct!)

4. **Browser starts TTS2, sends `audio_started_playing`:**
   - `browserPlaying = true` (confirmation)
   - `ttsActive = true` ✅

---

## Edge Cases to Consider

1. **Browser never starts playing** (network/decode error):
   - `ttsPlaying` stays `true` forever
   - **Future enhancement:** Add timeout - if no `audio_started_playing` received within 10 seconds of TTS start, set `ttsPlaying = false`

2. **Browser never sends `audio_stopped_playing`** (crash/disconnect):
   - `ttsPlaying` stays `true` forever
   - **Future enhancement:** Add timeout - if TTS finished >30 seconds ago and no `audio_stopped_playing`, set `ttsPlaying = false`

3. **Phone sessions:**
   - Phone sessions don't send `audio_stopped_playing`
   - Keep current behavior for phone (set to false when queue finishes)

---

## Testing Checklist

- [ ] Start TTS → `ttsPlaying = true`
- [ ] TTS finishes → `ttsPlaying` still `true` (not false!)
- [ ] Browser sends `audio_started_playing` → `ttsPlaying = true` (no change)
- [ ] Browser sends `audio_stopped_playing` → `ttsPlaying = false`
- [ ] User speaks during TTS generation → Barge-in works
- [ ] User speaks after TTS finishes but browser still playing → Barge-in works
- [ ] Phone sessions still work correctly
