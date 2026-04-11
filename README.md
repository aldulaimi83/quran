# Quran Reader

Quran Reader is a static Quran reading website built to make reading, listening, translation, and tafsir accessible in one place.

## Features

- Arabic Quran text in a clean reading layout
- Page-by-page reading with surah jump
- Word-by-word hover translation
- Selectable translation language
- Verse translation and tafsir side panel
- Default recitation from a Makkah imam when available, with fallback reciters
- Sunni tafsir preference with Ibn Kathir-style source selection when available

## Notes

- The app loads Quran content at runtime from the public Quran.com content API.
- Hovering over a word shows its word-by-word translation and transliteration.
- Clicking a verse updates the translation, tafsir, and audio player.
- Sunni tafsir is preferred by choosing Ibn Kathir-style resources first when available, then falling back to other mainstream Sunni tafsir resources.

## Run

Open `index.html` in a browser.
