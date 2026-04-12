const API_BASE = "https://api.quran.com/api/v4";
const AUDIO_CDN_BASE = "https://audio.qurancdn.com/";
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
const pageInput = document.querySelector("#page-input");
const prevPageButton = document.querySelector("#prev-page");
const nextPageButton = document.querySelector("#next-page");
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
  verses: [],
  verseDetailsByKey: {},
  chapterAudioByKey: {},
  detailRequestToken: 0,
  playback: {
    mode: "idle",
    queue: [],
    queueIndex: -1,
    activeVerseKey: null,
    activeWordIndex: -1,
    activeWordTimings: [],
  },
};

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
    return state.chapters.find((chapter) => state.selectedVerseKey.startsWith(`${chapter.id}:`));
  }
  return getChapterForPage(state.currentPage);
}

function getPlayableWords(verse) {
  return (verse?.words || []).filter((word) => word.char_type_name !== "end");
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
  const preferredPatterns = [/muaiq/i, /muaiql/i, /maher/i, /sudais/i, /haram/i, /makk/i];
  return (
    state.recitations.find((reciter) =>
      preferredPatterns.some((pattern) => pattern.test(reciter.reciter_name || reciter.style || ""))
    ) || state.recitations[0]
  );
}

function chooseSunniTafsir() {
  const preferredPatterns = [/ibn kathir/i, /katheer/i, /saadi/i, /tabari/i];
  return (
    state.tafsirs.find((tafsir) =>
      preferredPatterns.some((pattern) => pattern.test(tafsir.name || tafsir.translated_name?.name || ""))
    ) || state.tafsirs[0]
  );
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

  if (languages.some((language) => language.code === "english")) {
    languageSelect.value = "english";
    state.selectedLanguageCode = "english";
  }
}

function fillReciterSelect() {
  reciterSelect.innerHTML = state.recitations
    .map(
      (reciter) =>
        `<option value="${reciter.id}">${escapeHtml(reciter.reciter_name || "Unknown reciter")}</option>`
    )
    .join("");

  if (state.selectedReciterId) {
    reciterSelect.value = String(state.selectedReciterId);
  }
}

function renderVerseDetails(verse) {
  const translationText =
    verse.translations?.[0]?.text || "Translation unavailable for this verse in the selected language.";
  const tafsirText =
    verse.tafsirs?.[0]?.text || "Tafsir unavailable for this verse from the selected Sunni source.";

  selectedVerseEl.innerHTML = `
    <div class="selected-verse-arabic">${escapeHtml(verse.text_uthmani || "")}</div>
    <div><strong>${escapeHtml(verse.verse_key)}</strong></div>
    <div>${translationText}</div>
  `;

  tafsirContentEl.innerHTML = tafsirText;
}

function renderDetailsLoading(verse) {
  selectedVerseEl.innerHTML = `
    <div class="selected-verse-arabic">${escapeHtml(verse.text_uthmani || "")}</div>
    <div><strong>${escapeHtml(verse.verse_key)}</strong></div>
    <div>${verse.translations?.[0]?.text || "Loading translation..."}</div>
  `;
  tafsirContentEl.textContent = "Loading tafsir...";
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
    activeWord.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

function normalizeTimingValue(value, useMilliseconds) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return useMilliseconds ? numeric / 1000 : numeric;
}

function buildFallbackWordTimings(verse, durationSeconds) {
  const words = getPlayableWords(verse);
  if (!words.length || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return [];
  }

  const slice = durationSeconds / words.length;
  return words.map((word, index) => ({
    wordIndex: index,
    start: index * slice,
    end: (index + 1) * slice,
  }));
}

function buildWordTimings(verse) {
  const words = getPlayableWords(verse);
  const rawSegments = verse?.audio?.segments || verse?.audio?.timestamps || verse?.segments;

  if (!Array.isArray(rawSegments) || !rawSegments.length || !words.length) {
    return [];
  }

  const numericValues = rawSegments
    .flatMap((segment) => (Array.isArray(segment) ? segment : Object.values(segment || {})))
    .map(Number)
    .filter((value) => Number.isFinite(value));
  const useMilliseconds = numericValues.some((value) => value > 250);

  return rawSegments
    .map((segment, index) => {
      if (Array.isArray(segment)) {
        const start = normalizeTimingValue(segment[0], useMilliseconds);
        const end = normalizeTimingValue(segment[1], useMilliseconds);
        const explicitIndex = Number(segment[2]);
        return {
          wordIndex:
            Number.isFinite(explicitIndex) && explicitIndex > 0 && explicitIndex <= words.length
              ? explicitIndex - 1
              : index,
          start,
          end,
        };
      }

      const start = normalizeTimingValue(
        segment?.start ?? segment?.from ?? segment?.begin ?? segment?.timestamp_from,
        useMilliseconds
      );
      const end = normalizeTimingValue(
        segment?.end ?? segment?.to ?? segment?.timestamp_to ?? segment?.timestamp_until,
        useMilliseconds
      );
      const explicitIndex = Number(segment?.word_index ?? segment?.position ?? segment?.word);
      return {
        wordIndex:
          Number.isFinite(explicitIndex) && explicitIndex > 0 && explicitIndex <= words.length
            ? explicitIndex - 1
            : index,
        start,
        end,
      };
    })
    .filter((segment) => Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.end >= segment.start)
    .slice(0, words.length);
}

function syncWordTracking() {
  const activeVerse =
    state.verseDetailsByKey[state.playback.activeVerseKey] ||
    state.verses.find((verse) => verse.verse_key === state.playback.activeVerseKey);

  if (!activeVerse || !audioPlayer.src || audioPlayer.paused) {
    return;
  }

  let timings = state.playback.activeWordTimings;
  if (!timings.length && Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
    timings = buildFallbackWordTimings(activeVerse, audioPlayer.duration);
    state.playback.activeWordTimings = timings;
  }

  if (!timings.length) {
    return;
  }

  const currentTime = audioPlayer.currentTime;
  const activeSegment = timings.find((segment) => currentTime >= segment.start && currentTime <= segment.end);

  if (activeSegment) {
    setActiveWord(state.playback.activeVerseKey, activeSegment.wordIndex);
  }
}

function clearPlaybackQueue() {
  state.playback.mode = "idle";
  state.playback.queue = [];
  state.playback.queueIndex = -1;
  state.playback.activeVerseKey = state.selectedVerseKey;
  state.playback.activeWordTimings = [];
  clearActiveWordHighlight();
}

async function playAudio() {
  try {
    await audioPlayer.play();
  } catch (error) {
    audioCaption.textContent = "Your browser blocked autoplay. Press the audio controls directly.";
  }
}

function applyVerseAudio(verse, shouldAutoplay = false) {
  const audioUrl = getAudioUrl(verse.audio);
  state.playback.activeVerseKey = verse.verse_key;
  state.playback.activeWordTimings = buildWordTimings(verse);
  clearActiveWordHighlight();

  if (!audioUrl) {
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    audioCaption.textContent = `Audio is not available for ${verse.verse_key}`;
    return;
  }

  if (audioPlayer.src !== audioUrl) {
    audioPlayer.src = audioUrl;
    audioPlayer.load();
  }

  audioCaption.textContent = shouldAutoplay ? `Playing ${verse.verse_key}` : `Ready to play ${verse.verse_key}`;

  if (shouldAutoplay) {
    playAudio();
  }
}

async function loadVerseDetails(verseKey) {
  if (state.verseDetailsByKey[verseKey]?.tafsirs?.length) {
    return state.verseDetailsByKey[verseKey];
  }

  const params = new URLSearchParams({
    words: "true",
    language: getApiLanguageCode(state.selectedLanguageCode),
    translations: String(state.selectedTranslationId),
    tafsirs: String(state.selectedTafsirId),
    audio: String(state.selectedReciterId),
    fields: "text_uthmani,verse_key,page_number",
    word_fields: "text_uthmani",
  });

  const result = await fetchJson(`/verses/by_key/${verseKey}?${params.toString()}`);
  const detailedVerse = result.verse || result;
  const pageVerse = state.verses.find((verse) => verse.verse_key === verseKey) || {};
  const mergedVerse = {
    ...pageVerse,
    ...detailedVerse,
    audio: detailedVerse.audio || pageVerse.audio,
    words: detailedVerse.words || pageVerse.words,
    translations: detailedVerse.translations || pageVerse.translations,
    tafsirs: detailedVerse.tafsirs || pageVerse.tafsirs,
  };

  state.verseDetailsByKey[verseKey] = mergedVerse;
  return mergedVerse;
}

async function updateSelection(verseKey, options = {}) {
  const { autoplay = false, preserveQueue = false } = options;
  state.selectedVerseKey = verseKey;

  if (!preserveQueue) {
    clearPlaybackQueue();
  }

  document.querySelectorAll(".verse-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.verseKey === verseKey);
  });

  const pageVerse = state.verses.find((item) => item.verse_key === verseKey);
  if (!pageVerse) {
    return;
  }

  renderDetailsLoading(pageVerse);
  applyVerseAudio(state.verseDetailsByKey[verseKey] || pageVerse, autoplay);

  const requestToken = ++state.detailRequestToken;
  try {
    const detailedVerse = await loadVerseDetails(verseKey);
    if (requestToken !== state.detailRequestToken || state.selectedVerseKey !== verseKey) {
      return;
    }

    renderVerseDetails(detailedVerse);
    applyVerseAudio(detailedVerse, autoplay);
  } catch (error) {
    if (requestToken !== state.detailRequestToken || state.selectedVerseKey !== verseKey) {
      return;
    }

    renderVerseDetails({
      ...pageVerse,
      tafsirs: [
        {
          text: "Tafsir could not be loaded right now. Please try another ayah or reload the page.",
        },
      ],
    });
    audioCaption.textContent = autoplay ? `Playing ${verseKey}` : `Ready to play ${verseKey}`;
  }
}

function renderVerses() {
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
      updateSelection(card.dataset.verseKey, { autoplay: true });
    });
  });

  document.querySelectorAll(".word").forEach((word) => {
    word.addEventListener("mouseenter", () => {
      const translation = word.dataset.tooltip;
      const transliteration = word.dataset.transliteration;
      tooltip.innerHTML = `<strong>${translation}</strong>${transliteration ? `<br>${transliteration}` : ""}`;
      tooltip.hidden = false;
    });

    word.addEventListener("mousemove", (event) => {
      tooltip.style.left = `${event.clientX + 16}px`;
      tooltip.style.top = `${event.clientY + 16}px`;
    });

    word.addEventListener("mouseleave", () => {
      tooltip.hidden = true;
    });
  });

  if (state.verses[0]) {
    updateSelection(state.selectedVerseKey || state.verses[0].verse_key);
  }
}

async function loadPage(page) {
  state.currentPage = Math.max(1, Math.min(604, Number(page) || 1));
  state.verseDetailsByKey = {};
  state.chapterAudioByKey = {};
  pageInput.value = String(state.currentPage);
  pageLabel.textContent = `Page ${state.currentPage}`;
  setError("");
  setLoading(true, `Loading page ${state.currentPage}...`);
  clearPlaybackQueue();

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

    renderVerses();
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

async function playSelectedVerse() {
  if (!state.selectedVerseKey) {
    return;
  }

  state.playback.mode = "verse";
  state.playback.queue = [state.selectedVerseKey];
  state.playback.queueIndex = 0;
  await updateSelection(state.selectedVerseKey, { autoplay: true, preserveQueue: true });
}

async function playCurrentPageVerseByVerse() {
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

  if (state.playback.queue[0]) {
    await updateSelection(state.playback.queue[0], { autoplay: true, preserveQueue: true });
  }
}

async function playFullSurah() {
  const chapter = getSelectedChapter();
  if (!chapter || !state.selectedReciterId) {
    audioCaption.textContent = "Select a surah or ayah first to play the full surah.";
    return;
  }

  const cacheKey = `${state.selectedReciterId}:${chapter.id}`;
  clearPlaybackQueue();
  state.playback.mode = "surah";

  try {
    let chapterAudio = state.chapterAudioByKey[cacheKey];
    if (!chapterAudio) {
      const result = await fetchJson(`/chapter_recitations/${state.selectedReciterId}/${chapter.id}`);
      chapterAudio = result.audio_file || result.chapter_recitation || result;
      state.chapterAudioByKey[cacheKey] = chapterAudio;
    }

    const audioUrl = getAudioUrl(chapterAudio);
    if (!audioUrl) {
      throw new Error("No chapter audio returned.");
    }

    clearActiveWordHighlight();
    audioPlayer.src = audioUrl;
    audioPlayer.load();
    audioCaption.textContent = `Playing full surah: ${chapter.name_simple}`;
    await playAudio();
  } catch (error) {
    state.playback.mode = "idle";
    audioCaption.textContent = "Full surah playback is unavailable for this reciter right now.";
  }
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

    const chosenTranslation = chooseTranslation(state.selectedLanguageCode) || state.translations[0];
    const chosenReciter = chooseReciter();
    const chosenTafsir = chooseSunniTafsir();

    state.selectedTranslationId = chosenTranslation?.id;
    state.selectedLanguageCode = chosenTranslation?.language_name?.toLowerCase() || "english";
    state.selectedReciterId = chosenReciter?.id;
    state.selectedTafsirId = chosenTafsir?.id;

    tafsirLabel.textContent = chosenTafsir?.translated_name?.name || "Sunni tafsir";
    tafsirSourceLabel.textContent = chosenTafsir?.name || "Selected tafsir";

    fillChapterSelect();
    fillLanguageSelect();
    fillReciterSelect();

    if (chosenReciter) {
      audioCaption.textContent = `Default reciter: ${chosenReciter.reciter_name}`;
    }

    await loadPage(1);
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
  loadPage(state.currentPage);
});

prevPageButton.addEventListener("click", () => loadPage(state.currentPage - 1));
nextPageButton.addEventListener("click", () => loadPage(state.currentPage + 1));

pageInput.addEventListener("change", () => {
  loadPage(pageInput.value);
});

playSelectedButton.addEventListener("click", () => {
  playSelectedVerse();
});

playPageButton.addEventListener("click", () => {
  playCurrentPageVerseByVerse();
});

playSurahButton.addEventListener("click", () => {
  playFullSurah();
});

audioPlayer.addEventListener("timeupdate", syncWordTracking);
audioPlayer.addEventListener("loadedmetadata", syncWordTracking);
audioPlayer.addEventListener("seeking", syncWordTracking);
audioPlayer.addEventListener("pause", () => {
  if (audioPlayer.ended || state.playback.mode === "page") {
    return;
  }
  clearActiveWordHighlight();
});
audioPlayer.addEventListener("ended", async () => {
  clearActiveWordHighlight();

  if (state.playback.mode !== "page") {
    return;
  }

  state.playback.queueIndex += 1;
  const nextVerseKey = state.playback.queue[state.playback.queueIndex];
  if (!nextVerseKey) {
    state.playback.mode = "idle";
    audioCaption.textContent = "Finished page playback.";
    return;
  }

  await updateSelection(nextVerseKey, { autoplay: true, preserveQueue: true });
});

bootstrap();
