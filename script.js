const API_BASE = "https://api.quran.com/api/v4";
const AUDIO_CDN_BASE = "https://audio.qurancdn.com/";
const STORAGE_KEY = "quran-youooo-reader-state";
const MIN_FONT_SCALE = 0.82;
const MAX_FONT_SCALE = 1.45;
const JUZ_PAGE_STARTS = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];
const LANGUAGE_CODES = {
  arabic: "ar",
  bengali: "bn",
  bosnian: "bs",
  chinese: "zh",
  dutch: "nl",
  english: "en",
  french: "fr",
  german: "de",
  hindi: "hi",
  indonesian: "id",
  italian: "it",
  malay: "ms",
  persian: "fa",
  portuguese: "pt",
  russian: "ru",
  spanish: "es",
  swahili: "sw",
  tamil: "ta",
  turkish: "tr",
  urdu: "ur",
};

const chapterSelect = document.querySelector("#chapter-select");
const languageSelect = document.querySelector("#language-select");
const reciterSelect = document.querySelector("#reciter-select");
const tafsirLanguageSelect = document.querySelector("#tafsir-language-select");
const juzSelect = document.querySelector("#juz-select");
const readerSearch = document.querySelector("#reader-search");
const readerSearchButton = document.querySelector("#reader-search-button");
const pageInput = document.querySelector("#page-input");
const prevPageButton = document.querySelector("#prev-page");
const nextPageButton = document.querySelector("#next-page");
const fontSmallerButton = document.querySelector("#font-smaller");
const fontLargerButton = document.querySelector("#font-larger");
const themeToggleButton = document.querySelector("#theme-toggle");
const repeatToggleButton = document.querySelector("#repeat-toggle");
const copyVerseLinkButton = document.querySelector("#copy-verse-link");
const playSelectedButton = document.querySelector("#play-selected");
const playPageButton = document.querySelector("#play-page");
const playSurahButton = document.querySelector("#play-surah");
const versesContainer = document.querySelector("#verses");
const loadingEl = document.querySelector("#loading");
const errorEl = document.querySelector("#error");
const audioPlayer = document.querySelector("#audio-player");
const audioCaption = document.querySelector("#audio-caption");
const selectedVerseEl = document.querySelector("#selected-verse");
const tafsirContentEl = document.querySelector("#tafsir-content");
const tooltip = document.querySelector("#word-tooltip");
const pageLabel = document.querySelector("#page-label");
const chapterLabel = document.querySelector("#chapter-label");
const tafsirLabel = document.querySelector("#tafsir-label");
const tafsirSourceLabel = document.querySelector("#tafsir-source-label");

const state = {
  chapters: [],
  translations: [],
  recitations: [],
  tafsirs: [],
  currentPage: 1,
  selectedVerseKey: null,
  selectedLanguageCode: "english",
  selectedTranslationId: null,
  selectedReciterId: null,
  selectedTafsirId: null,
  selectedTafsirLanguage: "english",
  verses: [],
  tafsirByVerseKey: {},
  surahAudioByKey: {},
  settings: {
    fontScale: 1,
    theme: "light",
    repeatVerse: false,
  },
  playback: {
    mode: "idle",
    queue: [],
    queueIndex: -1,
    activeVerseKey: null,
    activeWordIndex: -1,
    wordTimings: [],
    surahTimestamps: [],
    followRequestId: 0,
    requestedVerseKey: null,
    focusedSurahVerseKey: null,
  },
};

function loadSavedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function saveReaderState() {
  const payload = {
    page: state.currentPage,
    selectedVerseKey: state.selectedVerseKey,
    language: state.selectedLanguageCode,
    reciterId: state.selectedReciterId,
    tafsirLanguage: state.selectedTafsirLanguage,
    settings: state.settings,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function getInitialTarget() {
  const params = new URLSearchParams(window.location.search);
  const saved = loadSavedState();
  const surah = Number(params.get("surah") || params.get("chapter"));
  const ayah = Number(params.get("ayah") || params.get("verse"));
  const page = Number(params.get("page"));

  if (surah && ayah) {
    return { verseKey: `${surah}:${ayah}` };
  }

  if (page) {
    return { page: Math.max(1, Math.min(604, page)) };
  }

  if (saved.selectedVerseKey) {
    return { verseKey: saved.selectedVerseKey };
  }

  if (saved.page) {
    return { page: Math.max(1, Math.min(604, Number(saved.page) || 1)) };
  }

  return { page: 1 };
}

function applySavedPreferences() {
  const saved = loadSavedState();
  if (saved.language) {
    state.selectedLanguageCode = saved.language;
  }
  if (saved.reciterId) {
    state.selectedReciterId = Number(saved.reciterId);
  }
  if (saved.tafsirLanguage) {
    state.selectedTafsirLanguage = saved.tafsirLanguage;
  }
  if (saved.settings) {
    state.settings = {
      ...state.settings,
      ...saved.settings,
      fontScale: Number(saved.settings.fontScale) || 1,
      theme: saved.settings.theme === "dark" ? "dark" : "light",
      repeatVerse: Boolean(saved.settings.repeatVerse),
    };
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function setLoading(isLoading, message = "Loading Quran content...") {
  loadingEl.hidden = !isLoading;
  loadingEl.textContent = message;
}

function setError(message = "") {
  errorEl.hidden = !message;
  errorEl.textContent = message;
}

function getApiLanguageCode(languageName) {
  const normalized = String(languageName || "").trim().toLowerCase();
  if (!normalized) {
    return "en";
  }
  if (LANGUAGE_CODES[normalized]) {
    return LANGUAGE_CODES[normalized];
  }
  return normalized.slice(0, 2);
}

function getAudioUrl(audio) {
  const candidate = typeof audio === "string" ? audio : audio?.url || audio?.audio_url;
  if (!candidate) {
    return "";
  }
  return candidate.startsWith("http") ? candidate : `${AUDIO_CDN_BASE}${candidate}`;
}

function getChapterForPage(page) {
  return state.chapters.find((chapter) => {
    const [from, to] = chapter.pages || [];
    return page >= from && page <= to;
  });
}

function getSelectedChapter() {
  if (state.selectedVerseKey) {
    const chapterId = Number(String(state.selectedVerseKey).split(":")[0]);
    return state.chapters.find((chapter) => chapter.id === chapterId);
  }
  return state.chapters.find((chapter) => chapter.id === Number(chapterSelect.value)) || getChapterForPage(state.currentPage);
}

function getPlayableWords(verse) {
  return (verse?.words || []).filter((word) => word.char_type_name !== "end");
}

function getVerseByKey(verseKey) {
  return state.verses.find((verse) => verse.verse_key === verseKey) || null;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9: ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getJuzForPage(page) {
  const pageNumber = Number(page) || 1;
  let activeJuz = 1;
  JUZ_PAGE_STARTS.forEach((startPage, index) => {
    if (pageNumber >= startPage) {
      activeJuz = index + 1;
    }
  });
  return activeJuz;
}

function updateJuzSelect() {
  if (juzSelect.value !== String(getJuzForPage(state.currentPage))) {
    juzSelect.value = String(getJuzForPage(state.currentPage));
  }
}

function applyReaderSettings(options = {}) {
  const { persist = true } = options;
  const fontScale = Math.max(MIN_FONT_SCALE, Math.min(MAX_FONT_SCALE, Number(state.settings.fontScale) || 1));
  state.settings.fontScale = fontScale;
  document.documentElement.style.setProperty("--arabic-scale", fontScale.toFixed(2));
  document.body.dataset.theme = state.settings.theme === "dark" ? "dark" : "light";
  themeToggleButton.textContent = state.settings.theme === "dark" ? "Day" : "Night";
  repeatToggleButton.textContent = `Repeat ayah: ${state.settings.repeatVerse ? "on" : "off"}`;
  repeatToggleButton.setAttribute("aria-pressed", String(state.settings.repeatVerse));
  if (persist) {
    saveReaderState();
  }
}

function updateVerseUrl(verseKey = state.selectedVerseKey) {
  if (!verseKey) {
    return;
  }
  const [surah, ayah] = String(verseKey).split(":");
  if (!surah || !ayah) {
    return;
  }
  const nextUrl = `${window.location.pathname}?surah=${encodeURIComponent(surah)}&ayah=${encodeURIComponent(ayah)}`;
  window.history.replaceState({}, "", nextUrl);
}

function hideTooltip() {
  tooltip.hidden = true;
}

function showWordTooltip(word, clientX, clientY) {
  const translation = word.dataset.tooltip;
  const transliteration = word.dataset.transliteration;
  tooltip.innerHTML = `<strong>${translation}</strong>${transliteration ? `<br>${transliteration}` : ""}`;
  tooltip.hidden = false;

  const x = Math.min(window.innerWidth - 280, Math.max(12, clientX + 14));
  const y = Math.min(window.innerHeight - 110, Math.max(12, clientY + 14));
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

async function fetchVerseByKey(verseKey) {
  const params = new URLSearchParams({
    words: "true",
    language: getApiLanguageCode(state.selectedLanguageCode),
    translations: String(state.selectedTranslationId),
    audio: String(state.selectedReciterId),
    fields: "text_uthmani,verse_key,page_number",
    word_fields: "text_uthmani",
  });

  const result = await fetchJson(`/verses/by_key/${verseKey}?${params.toString()}`);
  return result.verse || null;
}

function chooseTranslation(languageCode) {
  const normalized = languageCode.toLowerCase();
  const exact = state.translations.find((resource) => resource.language_name?.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }
  return state.translations.find((resource) => resource.language_name?.toLowerCase().startsWith(normalized));
}

function chooseReciter() {
  const blockedPatterns = [/mahmoud khalil al-husary/i, /mohamed al-tablawi/i];
  const preferredPatterns = [/muaiq/i, /muaiql/i, /maher/i, /sudais/i, /haram/i, /makk/i];
  return (
    state.recitations.find((reciter) => {
      const label = `${reciter.reciter_name || ""} ${reciter.style || ""}`;
      return !blockedPatterns.some((pattern) => pattern.test(label)) &&
        preferredPatterns.some((pattern) => pattern.test(label));
    }) || state.recitations[0]
  );
}

function chooseSunniTafsir(language = state.selectedTafsirLanguage) {
  const normalizedLanguage = language.toLowerCase();
  const tafsirs = state.tafsirs.filter((tafsir) => tafsir.language_name?.toLowerCase() === normalizedLanguage);
  const preferredPatterns =
    normalizedLanguage === "arabic"
      ? [/muyassar/i, /ميسر/i, /ibn kathir/i, /katheer/i, /ابن كثير/i, /sa'?di/i, /السعدي/i, /tabari/i, /طبري/i]
      : [/ibn kathir/i, /katheer/i, /saadi/i, /tabari/i];

  return (
    tafsirs.find((tafsir) =>
      preferredPatterns.some((pattern) => pattern.test(tafsir.name || tafsir.translated_name?.name || ""))
    ) || tafsirs[0] || state.tafsirs[0]
  );
}

function updateTafsirLabels(tafsir) {
  const languageLabel = state.selectedTafsirLanguage === "arabic" ? "Arabic tafsir" : "English tafsir";
  tafsirLabel.textContent = languageLabel;
  tafsirSourceLabel.textContent = tafsir?.name || tafsir?.translated_name?.name || "Selected tafsir";
  tafsirContentEl.classList.toggle("is-arabic", state.selectedTafsirLanguage === "arabic");
}

function fillChapterSelect() {
  chapterSelect.innerHTML = state.chapters
    .map(
      (chapter) =>
        `<option value="${chapter.id}">${chapter.id}. ${escapeHtml(chapter.name_simple)} - ${escapeHtml(
          chapter.name_arabic
        )}</option>`
    )
    .join("");
}

function fillLanguageSelect() {
  const seen = new Set();
  const languages = state.translations
    .map((resource) => ({
      code: resource.language_name?.toLowerCase() || "",
      label: resource.language_name || "Unknown",
    }))
    .filter((language) => {
      if (!language.code || seen.has(language.code)) {
        return false;
      }
      seen.add(language.code);
      return true;
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  languageSelect.innerHTML = languages
    .map((language) => `<option value="${escapeHtml(language.code)}">${escapeHtml(language.label)}</option>`)
    .join("");

  if (languages.some((language) => language.code === state.selectedLanguageCode)) {
    languageSelect.value = state.selectedLanguageCode;
  } else if (languages.some((language) => language.code === "english")) {
    languageSelect.value = "english";
    state.selectedLanguageCode = "english";
  }
}

function fillReciterSelect() {
  const availableRecitations = state.recitations.filter((reciter) => {
    const label = `${reciter.reciter_name || ""} ${reciter.style || ""}`;
    return !/mahmoud khalil al-husary/i.test(label) && !/mohamed al-tablawi/i.test(label);
  });

  if (!availableRecitations.some((reciter) => reciter.id === state.selectedReciterId)) {
    state.selectedReciterId = availableRecitations[0]?.id || null;
  }

  reciterSelect.innerHTML = availableRecitations
    .map(
      (reciter) =>
        `<option value="${reciter.id}">${escapeHtml(reciter.reciter_name || "Unknown reciter")}</option>`
    )
    .join("");

  if (state.selectedReciterId) {
    reciterSelect.value = String(state.selectedReciterId);
  }
}

function fillJuzSelect() {
  juzSelect.innerHTML = JUZ_PAGE_STARTS.map((startPage, index) => {
    const juzNumber = index + 1;
    const endPage = JUZ_PAGE_STARTS[index + 1] ? JUZ_PAGE_STARTS[index + 1] - 1 : 604;
    return `<option value="${juzNumber}">Juz ${juzNumber} - pages ${startPage}-${endPage}</option>`;
  }).join("");
  updateJuzSelect();
}

function fillTafsirLanguageSelect() {
  const availableLanguages = new Set(state.tafsirs.map((tafsir) => tafsir.language_name?.toLowerCase()).filter(Boolean));
  const options = [
    { value: "english", label: "English tafsir" },
    { value: "arabic", label: "Arabic tafsir" },
  ].filter((option) => availableLanguages.has(option.value));

  tafsirLanguageSelect.innerHTML = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");

  if (!options.some((option) => option.value === state.selectedTafsirLanguage)) {
    state.selectedTafsirLanguage = options[0]?.value || "english";
  }
  tafsirLanguageSelect.value = state.selectedTafsirLanguage;
}

function renderVerseDetails(verse, tafsirHtml) {
  const translationText =
    verse?.translations?.[0]?.text || "Translation unavailable for this verse in the selected language.";

  selectedVerseEl.innerHTML = `
    <div class="selected-verse-arabic">${escapeHtml(verse?.text_uthmani || "")}</div>
    <div><strong>${escapeHtml(verse?.verse_key || "")}</strong></div>
    <div>${translationText}</div>
  `;

  tafsirContentEl.innerHTML =
    tafsirHtml || "Tafsir unavailable for this verse from the selected Sunni source.";
  tafsirContentEl.classList.toggle("is-arabic", state.selectedTafsirLanguage === "arabic");
}

function renderTafsirLoading(verse) {
  renderVerseDetails(verse, "Loading tafsir...");
}

function highlightSelectedVerse(verseKey) {
  state.selectedVerseKey = verseKey;
  document.querySelectorAll(".verse-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.verseKey === verseKey);
  });
}

function clearActiveWordHighlight() {
  state.playback.activeWordIndex = -1;
  document.querySelectorAll(".word.is-playing").forEach((word) => {
    word.classList.remove("is-playing");
  });
}

function setActiveWord(verseKey, wordIndex) {
  document.querySelectorAll(".word.is-playing").forEach((word) => {
    if (word.dataset.verseKey !== verseKey || Number(word.dataset.wordIndex) !== wordIndex) {
      word.classList.remove("is-playing");
    }
  });

  state.playback.activeVerseKey = verseKey;
  state.playback.activeWordIndex = wordIndex;

  const activeWord = document.querySelector(`.word[data-verse-key="${verseKey}"][data-word-index="${wordIndex}"]`);
  if (activeWord) {
    activeWord.classList.add("is-playing");
  }
}

function buildWordTimingsFromSegments(words, rawSegments) {
  if (!Array.isArray(rawSegments) || !rawSegments.length || !words.length) {
    return [];
  }

  const timings = [];

  rawSegments.forEach((segment) => {
    if (!Array.isArray(segment)) {
      return;
    }

    const numbers = segment.map(Number);
    if (numbers.length >= 4) {
      const fromWord = Math.max(0, numbers[0] - 1);
      const toWord = Math.min(words.length - 1, numbers[1] - 1);
      const startMs = numbers[2];
      const endMs = numbers[3];
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || toWord < fromWord) {
        return;
      }

      const coveredWords = toWord - fromWord + 1;
      const slice = coveredWords > 0 ? (endMs - startMs) / coveredWords : 0;
      for (let offset = 0; offset < coveredWords; offset += 1) {
        const wordIndex = fromWord + offset;
        timings.push({
          verseKey: null,
          wordIndex,
          start: (startMs + slice * offset) / 1000,
          end: (offset === coveredWords - 1 ? endMs : startMs + slice * (offset + 1)) / 1000,
        });
      }
      return;
    }

    if (numbers.length >= 3) {
      const wordIndex = numbers[0] - 1;
      const startMs = numbers[1];
      const endMs = numbers[2];
      if (!Number.isFinite(wordIndex) || !Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        return;
      }
      timings.push({
        verseKey: null,
        wordIndex,
        start: startMs / 1000,
        end: endMs / 1000,
      });
    }
  });

  return timings.filter((segment) => segment.wordIndex >= 0 && segment.wordIndex < words.length);
}

function buildVerseWordTimings(verse) {
  return buildWordTimingsFromSegments(getPlayableWords(verse), verse?.audio?.segments || []);
}

function buildFallbackWordTimings(verse, durationSeconds) {
  const words = getPlayableWords(verse);
  if (!words.length || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return [];
  }

  const slice = durationSeconds / words.length;
  return words.map((word, index) => ({
    verseKey: verse.verse_key,
    wordIndex: index,
    start: index * slice,
    end: (index + 1) * slice,
  }));
}

function syncVerseWordTracking() {
  const verse = getVerseByKey(state.playback.activeVerseKey);
  if (!verse || !audioPlayer.src || audioPlayer.paused) {
    return;
  }

  let timings = state.playback.wordTimings;
  if (!timings.length && Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
    timings = buildFallbackWordTimings(verse, audioPlayer.duration);
    state.playback.wordTimings = timings;
  }

  const currentTime = audioPlayer.currentTime;
  const activeSegment = timings.find((segment) => currentTime >= segment.start && currentTime <= segment.end);
  if (activeSegment) {
    setActiveWord(verse.verse_key, activeSegment.wordIndex);
  }
}

function focusSurahVerse(verseKey) {
  const verse = getVerseByKey(verseKey);
  if (!verse) {
    return null;
  }

  if (state.selectedVerseKey === verseKey && state.playback.focusedSurahVerseKey === verseKey) {
    return verse;
  }

  state.playback.focusedSurahVerseKey = verseKey;
  if (state.selectedVerseKey !== verseKey) {
    highlightSelectedVerse(verseKey);
  }
  renderVerseDetails(verse, state.tafsirByVerseKey[verseKey] || "Loading tafsir...");
  loadTafsirForVerse(verseKey, verse);
  return verse;
}

async function followSurahVersePage(verseKey) {
  if (state.playback.requestedVerseKey === verseKey) {
    return;
  }

  const requestId = state.playback.followRequestId + 1;
  state.playback.followRequestId = requestId;
  state.playback.requestedVerseKey = verseKey;

  try {
    const verse = await fetchVerseByKey(verseKey);
    if (state.playback.mode !== "surah" || state.playback.followRequestId !== requestId || !verse?.page_number) {
      return;
    }

    await loadPage(verse.page_number, {
      preservePlayback: true,
      preferredVerseKey: verseKey,
    });

    if (state.playback.mode === "surah" && state.playback.followRequestId === requestId) {
      audioCaption.textContent = `Following full surah: ${verseKey} on page ${verse.page_number}`;
    }
  } catch (error) {
    if (state.playback.mode === "surah") {
      audioCaption.textContent = "Still playing full surah. The next page could not load automatically.";
    }
  } finally {
    if (state.playback.requestedVerseKey === verseKey) {
      state.playback.requestedVerseKey = null;
    }
  }
}

function syncSurahWordTracking() {
  const currentTimeMs = audioPlayer.currentTime * 1000;
  const verseTimestamp = state.playback.surahTimestamps.find(
    (item) => currentTimeMs >= item.timestamp_from && currentTimeMs <= item.timestamp_to
  );

  if (!verseTimestamp) {
    return;
  }

  const verse = focusSurahVerse(verseTimestamp.verse_key);
  if (!verse) {
    followSurahVersePage(verseTimestamp.verse_key);
    return;
  }

  const words = getPlayableWords(verse);
  const absoluteTimings = buildWordTimingsFromSegments(words, verseTimestamp.segments || []).map((segment) => ({
    ...segment,
    verseKey: verseTimestamp.verse_key,
  }));
  const activeSegment = absoluteTimings.find(
    (segment) => audioPlayer.currentTime >= segment.start && audioPlayer.currentTime <= segment.end
  );

  if (activeSegment) {
    setActiveWord(verseTimestamp.verse_key, activeSegment.wordIndex);
  }
}

function syncWordTracking() {
  if (state.playback.mode === "surah") {
    syncSurahWordTracking();
    return;
  }
  syncVerseWordTracking();
}

function clearPlaybackState() {
  state.playback.mode = "idle";
  state.playback.queue = [];
  state.playback.queueIndex = -1;
  state.playback.activeVerseKey = null;
  state.playback.wordTimings = [];
  state.playback.surahTimestamps = [];
  state.playback.followRequestId += 1;
  state.playback.requestedVerseKey = null;
  state.playback.focusedSurahVerseKey = null;
  clearActiveWordHighlight();
}

async function playAudioFromSource(sourceUrl, options = {}) {
  const { startAt = 0 } = options;

  if (!sourceUrl) {
    return false;
  }

  const shouldReload = audioPlayer.src !== sourceUrl;
  if (shouldReload) {
    audioPlayer.src = sourceUrl;
    audioPlayer.load();
  }

  if (Number.isFinite(startAt) && startAt >= 0) {
    audioPlayer.currentTime = startAt;
  }

  try {
    await audioPlayer.play();
    return true;
  } catch (error) {
    audioCaption.textContent = "Press play in the audio player to continue playback.";
    return false;
  }
}

function prepareVersePlayback(verse, options = {}) {
  const { autoplay = false } = options;
  const audioUrl = getAudioUrl(verse?.audio);

  state.playback.activeVerseKey = verse?.verse_key || null;
  state.playback.wordTimings = buildVerseWordTimings(verse).map((segment) => ({
    ...segment,
    verseKey: verse.verse_key,
  }));
  state.playback.surahTimestamps = [];
  clearActiveWordHighlight();

  if (!audioUrl) {
    audioCaption.textContent = `Audio is not available for ${verse?.verse_key || "this ayah"}.`;
    return;
  }

  audioCaption.textContent = autoplay ? `Playing ${verse.verse_key}` : `Ready to play ${verse.verse_key}`;
  if (autoplay) {
    playAudioFromSource(audioUrl, { startAt: 0 });
  } else if (audioPlayer.src !== audioUrl) {
    audioPlayer.src = audioUrl;
    audioPlayer.load();
  }
}

async function loadTafsirForVerse(verseKey, verse) {
  if (state.tafsirByVerseKey[verseKey]) {
    renderVerseDetails(verse, state.tafsirByVerseKey[verseKey]);
    return;
  }

  renderTafsirLoading(verse);

  try {
    const result = await fetchJson(`/tafsirs/${state.selectedTafsirId}/by_ayah/${verseKey}`);
    const tafsirHtml = result.tafsir?.text || "Tafsir unavailable for this verse from the selected Sunni source.";
    state.tafsirByVerseKey[verseKey] = tafsirHtml;
    if (state.selectedVerseKey === verseKey) {
      renderVerseDetails(verse, tafsirHtml);
    }
  } catch (error) {
    const fallback = "Tafsir could not be loaded right now. Please try another ayah or reload the page.";
    state.tafsirByVerseKey[verseKey] = fallback;
    if (state.selectedVerseKey === verseKey) {
      renderVerseDetails(verse, fallback);
    }
  }
}

function selectVerse(verseKey, options = {}) {
  const { autoplay = false, keepPlaybackMode = false, preserveAudioSource = false } = options;
  const verse = getVerseByKey(verseKey);
  if (!verse) {
    return;
  }

  highlightSelectedVerse(verseKey);
  renderVerseDetails(verse, state.tafsirByVerseKey[verseKey] || "Loading tafsir...");
  loadTafsirForVerse(verseKey, verse);

  if (!keepPlaybackMode) {
    clearPlaybackState();
  }

  if (!preserveAudioSource) {
    prepareVersePlayback(verse, { autoplay });
  }

  updateVerseUrl(verseKey);
  saveReaderState();
}

function renderVerses(options = {}) {
  const { keepPlaybackMode = false, preserveAudioSource = false, preferredVerseKey = null } = options;

  versesContainer.innerHTML = state.verses
    .map((verse) => {
      const words = getPlayableWords(verse)
        .map((word, index) => {
          const translation = word.translation?.text || "No word translation";
          return `
            <span
              class="word"
              data-verse-key="${escapeHtml(verse.verse_key)}"
              data-word-index="${index}"
              data-tooltip="${escapeHtml(translation)}"
              data-transliteration="${escapeHtml(word.transliteration?.text || "")}"
            >${escapeHtml(word.text_uthmani || word.text || "")}</span>
          `;
        })
        .join(" ");

      const translationText = verse.translations?.[0]?.text || "";

      return `
        <article class="verse-card" data-verse-key="${verse.verse_key}">
          <div class="verse-meta">
            <span>${escapeHtml(verse.verse_key)}</span>
            <span>Page ${escapeHtml(verse.page_number || state.currentPage)}</span>
          </div>
          <div class="verse-arabic">${words}</div>
          <div class="verse-translation">${translationText}</div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".verse-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.playback.mode = "verse";
      selectVerse(card.dataset.verseKey, { autoplay: true });
    });
  });

  document.querySelectorAll(".word").forEach((word) => {
    word.addEventListener("click", (event) => {
      event.stopPropagation();
      const verseKey = word.dataset.verseKey;
      if (verseKey) {
        selectVerse(verseKey, { keepPlaybackMode: true, preserveAudioSource: true });
      }
      showWordTooltip(word, event.clientX, event.clientY);
    });

    word.addEventListener("touchstart", (event) => {
      event.stopPropagation();
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const verseKey = word.dataset.verseKey;
      if (verseKey) {
        selectVerse(verseKey, { keepPlaybackMode: true, preserveAudioSource: true });
      }
      showWordTooltip(word, touch.clientX, touch.clientY);
    }, { passive: true });

    word.addEventListener("mouseenter", (event) => {
      showWordTooltip(word, event.clientX, event.clientY);
    });

    word.addEventListener("mousemove", (event) => {
      showWordTooltip(word, event.clientX, event.clientY);
    });

    word.addEventListener("mouseleave", hideTooltip);
  });

  if (state.verses[0]) {
    const preferredVerse = preferredVerseKey ? getVerseByKey(preferredVerseKey) : null;
    const selectedVerse = state.selectedVerseKey ? getVerseByKey(state.selectedVerseKey) : null;
    const verseKey = preferredVerse?.verse_key || selectedVerse?.verse_key || state.verses[0].verse_key;
    selectVerse(verseKey, { keepPlaybackMode, preserveAudioSource });
  }
}

async function loadPage(page, options = {}) {
  const { preservePlayback = false, preferredVerseKey = null } = options;
  state.currentPage = Math.max(1, Math.min(604, Number(page) || 1));
  state.tafsirByVerseKey = {};
  pageInput.value = String(state.currentPage);
  pageLabel.textContent = `Page ${state.currentPage}`;
  setError("");
  setLoading(true, `Loading page ${state.currentPage}...`);
  if (!preservePlayback) {
    clearPlaybackState();
  }

  try {
    const params = new URLSearchParams({
      words: "true",
      language: getApiLanguageCode(state.selectedLanguageCode),
      translations: String(state.selectedTranslationId),
      audio: String(state.selectedReciterId),
      per_page: "50",
      fields: "text_uthmani,verse_key,page_number",
      word_fields: "text_uthmani",
    });

    const result = await fetchJson(`/verses/by_page/${state.currentPage}?${params.toString()}`);
    state.verses = result.verses || [];

    if (!state.verses.length) {
      throw new Error("No verses were returned for this page.");
    }

    const chapter = getChapterForPage(state.currentPage);
    if (chapter) {
      chapterLabel.textContent = `${chapter.id}. ${chapter.name_simple} (${chapter.name_arabic})`;
      chapterSelect.value = String(chapter.id);
    } else {
      chapterLabel.textContent = "Mixed page";
    }
    updateJuzSelect();

    renderVerses({
      keepPlaybackMode: preservePlayback,
      preserveAudioSource: preservePlayback,
      preferredVerseKey,
    });
    if (!preservePlayback) {
      primeSelectedChapterAudio();
    }
    saveReaderState();
  } catch (error) {
    setError(
      "I could not load Quran content right now. The public API may be unavailable or rate-limiting this request."
    );
    versesContainer.innerHTML = "";
    selectedVerseEl.textContent = "Verse details unavailable.";
    tafsirContentEl.textContent = "Tafsir unavailable.";
  } finally {
    setLoading(false);
  }
}

function playSelectedVerse() {
  const verse = getVerseByKey(state.selectedVerseKey) || state.verses[0];
  if (!verse) {
    return;
  }

  state.playback.mode = "verse";
  selectVerse(verse.verse_key, { autoplay: true });
}

function playCurrentPageVerseByVerse() {
  if (!state.verses.length) {
    return;
  }

  const startIndex = Math.max(
    state.verses.findIndex((verse) => verse.verse_key === state.selectedVerseKey),
    0
  );

  state.playback.mode = "page";
  state.playback.queue = state.verses.slice(startIndex).map((verse) => verse.verse_key);
  state.playback.queueIndex = 0;

  const firstVerseKey = state.playback.queue[0];
  if (firstVerseKey) {
    selectVerse(firstVerseKey, { autoplay: true, keepPlaybackMode: true });
  }
}

async function primeSelectedChapterAudio() {
  const chapter = getSelectedChapter();
  if (!chapter || !state.selectedReciterId) {
    return;
  }

  const cacheKey = `${state.selectedReciterId}:${chapter.id}`;
  if (cacheKey in state.surahAudioByKey) {
    return;
  }

  try {
    const result = await fetchJson(`/chapter_recitations/${state.selectedReciterId}/${chapter.id}?segments=true`);
    state.surahAudioByKey[cacheKey] = result.audio_file || null;
  } catch (error) {
    state.surahAudioByKey[cacheKey] = null;
  }
}
async function playFullSurah() {
  const chapter = getSelectedChapter();
  if (!chapter || !state.selectedReciterId) {
    audioCaption.textContent = "Select a surah or ayah first to play the full surah.";
    return;
  }

  clearPlaybackState();
  state.playback.mode = "surah";

  const cacheKey = `${state.selectedReciterId}:${chapter.id}`;
  try {
    let chapterAudio = state.surahAudioByKey[cacheKey];
    if (!chapterAudio) {
      const result = await fetchJson(`/chapter_recitations/${state.selectedReciterId}/${chapter.id}?segments=true`);
      chapterAudio = result.audio_file || null;
      state.surahAudioByKey[cacheKey] = chapterAudio;
    }

    const audioUrl = getAudioUrl(chapterAudio);
    if (!audioUrl) {
      throw new Error("No chapter audio returned.");
    }

    state.playback.surahTimestamps = chapterAudio.timestamps || [];
    audioCaption.textContent = `Playing full surah: ${chapter.name_simple}`;
    if (state.playback.surahTimestamps[0]?.verse_key) {
      highlightSelectedVerse(state.playback.surahTimestamps[0].verse_key);
    }
    await playAudioFromSource(audioUrl, { startAt: 0 });
  } catch (error) {
    state.playback.mode = "idle";
    audioCaption.textContent = "Full surah playback is unavailable for this reciter right now.";
  }
}

async function goToVerseKey(verseKey) {
  const verse = await fetchVerseByKey(verseKey);
  if (!verse?.page_number) {
    audioCaption.textContent = `Could not find ayah ${verseKey}.`;
    return;
  }
  await loadPage(verse.page_number, { preferredVerseKey: verseKey });
}

async function runReaderSearch() {
  const query = normalizeText(readerSearch.value);
  if (!query) {
    return;
  }

  const pageMatch = query.match(/^page\s+(\d+)$/);
  if (pageMatch) {
    await loadPage(pageMatch[1]);
    return;
  }

  const verseMatch = query.match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
  if (verseMatch) {
    await goToVerseKey(`${Number(verseMatch[1])}:${Number(verseMatch[2])}`);
    return;
  }

  const numericPage = Number(query);
  if (Number.isInteger(numericPage) && numericPage >= 1 && numericPage <= 604) {
    await loadPage(numericPage);
    return;
  }

  const chapter = state.chapters.find((item) => {
    const names = [
      item.id,
      item.name_simple,
      item.name_complex,
      item.translated_name?.name,
      item.name_arabic,
    ].map(normalizeText);
    return names.some((name) => name === query || name.includes(query));
  });

  if (chapter?.pages?.[0]) {
    chapterSelect.value = String(chapter.id);
    await loadPage(chapter.pages[0]);
    return;
  }

  audioCaption.textContent = "Search by surah name, page number, or ayah like 2:255.";
}

async function bootstrap() {
  setLoading(true, "Loading Quran resources...");

  try {
    const [chaptersResult, translationsResult, recitationsResult, tafsirsResult] = await Promise.all([
      fetchJson("/chapters?language=en"),
      fetchJson("/resources/translations"),
      fetchJson("/resources/recitations"),
      fetchJson("/resources/tafsirs"),
    ]);

    state.chapters = chaptersResult.chapters || [];
    state.translations = translationsResult.translations || [];
    state.recitations = recitationsResult.recitations || [];
    state.tafsirs = tafsirsResult.tafsirs || [];

    applySavedPreferences();

    const chosenTranslation = chooseTranslation(state.selectedLanguageCode) || state.translations[0];
    const savedReciter = state.recitations.find((reciter) => reciter.id === state.selectedReciterId);
    const chosenReciter = savedReciter || chooseReciter();
    const chosenTafsir = chooseSunniTafsir();

    state.selectedTranslationId = chosenTranslation?.id;
    state.selectedLanguageCode = chosenTranslation?.language_name?.toLowerCase() || "english";
    state.selectedReciterId = chosenReciter?.id;
    state.selectedTafsirId = chosenTafsir?.id;

    fillChapterSelect();
    fillLanguageSelect();
    fillReciterSelect();
    fillTafsirLanguageSelect();
    fillJuzSelect();
    updateTafsirLabels(chosenTafsir);
    applyReaderSettings({ persist: false });

    if (chosenReciter) {
      audioCaption.textContent = `Default reciter: ${chosenReciter.reciter_name}`;
    }

    const initialTarget = getInitialTarget();
    if (initialTarget.verseKey) {
      const verse = await fetchVerseByKey(initialTarget.verseKey);
      await loadPage(verse?.page_number || 1, { preferredVerseKey: initialTarget.verseKey });
    } else {
      await loadPage(initialTarget.page || 1);
    }
  } catch (error) {
    setError(
      "This reader could not initialize. The Quran data service may require access that is unavailable in this environment."
    );
    setLoading(false);
  }
}

chapterSelect.addEventListener("change", () => {
  const chapter = state.chapters.find((item) => item.id === Number(chapterSelect.value));
  if (chapter?.pages?.[0]) {
    loadPage(chapter.pages[0]);
  }
});

juzSelect.addEventListener("change", () => {
  const juzNumber = Number(juzSelect.value);
  const startPage = JUZ_PAGE_STARTS[juzNumber - 1];
  if (startPage) {
    loadPage(startPage);
  }
});

readerSearchButton.addEventListener("click", runReaderSearch);
readerSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runReaderSearch();
  }
});

languageSelect.addEventListener("change", () => {
  state.selectedLanguageCode = languageSelect.value;
  const translation = chooseTranslation(state.selectedLanguageCode);
  if (translation) {
    state.selectedTranslationId = translation.id;
    loadPage(state.currentPage);
  }
});

reciterSelect.addEventListener("change", () => {
  state.selectedReciterId = Number(reciterSelect.value);
  state.surahAudioByKey = {};
  loadPage(state.currentPage);
});

tafsirLanguageSelect.addEventListener("change", () => {
  state.selectedTafsirLanguage = tafsirLanguageSelect.value;
  const tafsir = chooseSunniTafsir();
  state.selectedTafsirId = tafsir?.id;
  state.tafsirByVerseKey = {};
  updateTafsirLabels(tafsir);

  const verse = getVerseByKey(state.selectedVerseKey);
  if (verse) {
    renderVerseDetails(verse, "Loading tafsir...");
    loadTafsirForVerse(verse.verse_key, verse);
  }
});

prevPageButton.addEventListener("click", () => loadPage(state.currentPage - 1));
nextPageButton.addEventListener("click", () => loadPage(state.currentPage + 1));
pageInput.addEventListener("change", () => loadPage(pageInput.value));
fontSmallerButton.addEventListener("click", () => {
  state.settings.fontScale -= 0.08;
  applyReaderSettings();
});
fontLargerButton.addEventListener("click", () => {
  state.settings.fontScale += 0.08;
  applyReaderSettings();
});
themeToggleButton.addEventListener("click", () => {
  state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
  applyReaderSettings();
});
repeatToggleButton.addEventListener("click", () => {
  state.settings.repeatVerse = !state.settings.repeatVerse;
  applyReaderSettings();
});
copyVerseLinkButton.addEventListener("click", async () => {
  updateVerseUrl();
  const link = window.location.href;
  try {
    await navigator.clipboard.writeText(link);
    copyVerseLinkButton.textContent = "Copied";
  } catch (error) {
    copyVerseLinkButton.textContent = "Link ready in address bar";
  }
  setTimeout(() => {
    copyVerseLinkButton.textContent = "Copy selected verse link";
  }, 1800);
});
playSelectedButton.addEventListener("click", playSelectedVerse);
playPageButton.addEventListener("click", playCurrentPageVerseByVerse);
playSurahButton.addEventListener("click", playFullSurah);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".word")) {
    hideTooltip();
  }
});

audioPlayer.addEventListener("timeupdate", syncWordTracking);
audioPlayer.addEventListener("pause", () => {
  if (audioPlayer.ended || state.playback.mode === "page" || state.playback.mode === "surah") {
    return;
  }
  clearActiveWordHighlight();
});
audioPlayer.addEventListener("ended", () => {
  clearActiveWordHighlight();

  if (state.settings.repeatVerse && state.playback.mode === "verse" && state.playback.activeVerseKey) {
    const verseKey = state.playback.activeVerseKey;
    state.playback.mode = "verse";
    selectVerse(verseKey, { autoplay: true, keepPlaybackMode: true });
    return;
  }

  if (state.playback.mode !== "page") {
    return;
  }

  state.playback.queueIndex += 1;
  const nextVerseKey = state.playback.queue[state.playback.queueIndex];
  if (!nextVerseKey) {
    clearPlaybackState();
    audioCaption.textContent = "Finished page playback.";
    return;
  }

  state.playback.mode = "page";
  selectVerse(nextVerseKey, { autoplay: true, keepPlaybackMode: true });
});

bootstrap();
