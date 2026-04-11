const API_BASE = "https://api.quran.com/api/v4";

const chapterSelect = document.querySelector("#chapter-select");
const languageSelect = document.querySelector("#language-select");
const reciterSelect = document.querySelector("#reciter-select");
const pageInput = document.querySelector("#page-input");
const prevPageButton = document.querySelector("#prev-page");
const nextPageButton = document.querySelector("#next-page");
const playSelectedButton = document.querySelector("#play-selected");
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
  selectedLanguageCode: "en",
  selectedTranslationId: null,
  selectedReciterId: null,
  selectedTafsirId: null,
  verses: [],
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

function getChapterForPage(page) {
  return state.chapters.find((chapter) => {
    const [from, to] = chapter.pages || [];
    return page >= from && page <= to;
  });
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

function updateSelection(verseKey) {
  state.selectedVerseKey = verseKey;
  document.querySelectorAll(".verse-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.verseKey === verseKey);
  });

  const verse = state.verses.find((item) => item.verse_key === verseKey);
  if (!verse) {
    return;
  }

  renderVerseDetails(verse);

  if (verse.audio?.url) {
    audioPlayer.src = verse.audio.url.startsWith("http")
      ? verse.audio.url
      : `https://audio.qurancdn.com/${verse.audio.url}`;
    audioCaption.textContent = `Ready to play ${verse.verse_key}`;
  } else {
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    audioCaption.textContent = `Audio is not available for ${verse.verse_key}`;
  }
}

function renderVerses() {
  versesContainer.innerHTML = state.verses
    .map((verse) => {
      const words = (verse.words || [])
        .filter((word) => word.char_type_name !== "end")
        .map((word) => {
          const translation = word.translation?.text || "No word translation";
          return `
            <span
              class="word"
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
    card.addEventListener("click", () => updateSelection(card.dataset.verseKey));
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
  pageInput.value = String(state.currentPage);
  pageLabel.textContent = `Page ${state.currentPage}`;
  setError("");
  setLoading(true, `Loading page ${state.currentPage}...`);

  try {
    const translationId = state.selectedTranslationId;
    const reciterId = state.selectedReciterId;
    const tafsirId = state.selectedTafsirId;

    const params = new URLSearchParams({
      words: "true",
      language: state.selectedLanguageCode,
      translations: String(translationId),
      tafsirs: String(tafsirId),
      audio: String(reciterId),
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
  if (!audioPlayer.src) {
    return;
  }
  audioPlayer.play().catch(() => {
    audioCaption.textContent = "Your browser blocked autoplay. Press the audio controls directly.";
  });
});

bootstrap();
