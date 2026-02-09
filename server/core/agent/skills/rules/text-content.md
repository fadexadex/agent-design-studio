---
name: text-content
description: Critical rules for text content formatting. NEVER concatenate words or remove spaces.
metadata:
  tags: text, content, spacing, formatting, words
---

## CRITICAL: Text Content Rules

These rules ensure text displays correctly and is readable. Violations will make videos look broken and unprofessional.

### 1. NEVER Concatenate Words

Text content must preserve natural word spacing. Every word should be separated by a space.

```tsx
// ❌ ABSOLUTELY FORBIDDEN - Concatenated words
<AnimatedText text="Gotstuff" />
<AnimatedText text="youdon'tneed?" />
<AnimatedText text="Letusdothehardwork" />

// ✅ CORRECT - Natural word spacing
<AnimatedText text="Got stuff" />
<AnimatedText text="you don't need?" />
<AnimatedText text="Let us do the hard work" />
```

### 2. Preserve Multi-Word Phrases

When splitting text across multiple lines or components, each piece must maintain proper spacing.

```tsx
// ❌ WRONG - Words merged together
<AnimatedText text="Buildamazing" />
<AnimatedText text="videoswithcode" />

// ✅ CORRECT - Words properly spaced
<AnimatedText text="Build amazing" />
<AnimatedText text="videos with code" />
```

### 3. Question Marks and Punctuation

Questions and punctuation must have proper spacing from preceding words.

```tsx
// ❌ WRONG
<AnimatedText text="Readytogrow?" />
<AnimatedText text="Whywait!" />

// ✅ CORRECT
<AnimatedText text="Ready to grow?" />
<AnimatedText text="Why wait!" />
```

### 4. Brand Names with Spaces

If a brand name or tagline contains spaces, preserve them exactly.

```tsx
// ❌ WRONG - Brand name concatenated
<AnimatedText text="AgentDesignStudio" /> // If actual name is "Agent Design Studio"

// ✅ CORRECT - Preserve brand formatting
<AnimatedText text="Agent Design Studio" />
```

### 5. Line Breaks for Long Text

For long phrases, use natural line breaks rather than removing spaces.

```tsx
// ❌ WRONG
<AnimatedText text="Createstunningmotiondesignsinminutes" />

// ✅ CORRECT - Use array or newlines
<AnimatedText text="Create stunning" />
<AnimatedText text="motion designs" />
<AnimatedText text="in minutes" />
```

### 6. Word-by-Word Animation

When using `animationUnit="word"`, the text MUST have spaces for words to animate separately.

```tsx
// ❌ WILL NOT WORK - No spaces means one "word"
<AnimatedText 
  text="Nospacesintext" 
  animationUnit="word" 
  stagger={5}
/>

// ✅ CORRECT - Words will animate one by one
<AnimatedText 
  text="Each word animates separately" 
  animationUnit="word" 
  stagger={5}
/>
```

## Quick Checklist

Before finalizing any text:

1. [ ] Can I read each word clearly?
2. [ ] Are there spaces between all words?
3. [ ] Is punctuation properly spaced?
4. [ ] Does the text match the original user content?
5. [ ] Would a human naturally write it this way?

## Common Causes of Text Concatenation

1. **Camel case confusion** - Don't treat display text like variable names
2. **Removing spaces for "style"** - Never remove spaces from readable text
3. **Copy-paste errors** - Always verify text after generating
4. **Over-optimization** - Don't try to "compact" text content
