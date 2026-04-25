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
const uiLanguageSelect = document.querySelector("#ui-language-select");
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

const UI_TRANSLATIONS = {
  english: {
    networkLink: "More from YouOOO",
    heroEyebrow: "Quran Reading Experience",
    heroTitle: "Read Quran Online with Translation, Tafsir, Audio & Word-by-Word Learning",
    heroText:
      "Free Quran reader for non-Arabic speakers. Read, listen, and understand the Quran with multiple languages, tafsir, audio recitation, and word-by-word translation.",
    heroChipReadingTitle: "Reading Mode",
    heroChipReadingText: "Mushaf page flow with chapter jump",
    heroChipWordTitle: "Word Help",
    heroChipWordText: "Tap or hover Arabic words to see translation",
    heroChipTafsirTitle: "Tafsir",
    heroChipTafsirText: "English or Arabic Sunni tafsir panel",
    introEyebrow: "Understand The Quran",
    introTitle: "Read Quran online with translation, tafsir, audio, and word-by-word help.",
    introBody1:
      "Quran YouOOO is built for people who want to read the Quran online with Arabic text, translation, word-by-word meaning, recitation, and Sunni tafsir in one simple place.",
    introBody2:
      "It is especially helpful for non-Arabic speakers, new Muslims, reverts, children growing up abroad, and anyone who wants to learn Quranic Arabic while reading the Quran.",
    introBody3:
      "Use this Quran reader to listen to recitation, move through Mushaf pages, choose translation languages, and study selected verses with tafsir notes. The goal is to make Quran study easier for people who want to read, listen, understand, and reflect without switching between many different tools.",
    introTag1: "Read Quran online",
    introTag2: "Word-by-word Quran",
    introTag3: "Quran translation and tafsir",
    introTag4: "Listen to Quran recitation",
    controlsEyebrow: "Controls",
    readerSetup: "Reader Setup",
    interfaceLanguage: "Interface Language",
    surahLabel: "Surah",
    pageField: "Page",
    prev: "Prev",
    next: "Next",
    translationLanguage: "Translation Language",
    reciterLabel: "Reciter",
    tafsirLanguage: "Tafsir Language",
    englishTafsir: "English tafsir",
    arabicTafsir: "Arabic tafsir",
    juzLabel: "Juz",
    searchLabel: "Search Surah / Ayah",
    searchPlaceholder: "Al-Fatiha, 2:255, page 10",
    go: "Go",
    readingOptions: "Reading Options",
    memorization: "Memorization",
    repeatAyahOn: "Repeat ayah: on",
    repeatAyahOff: "Repeat ayah: off",
    shareLabel: "Share",
    copySelectedVerseLink: "Copy selected verse link",
    copied: "Copied",
    linkReady: "Link ready in address bar",
    readingSurface: "Reading Surface",
    arabicText: "Arabic Text",
    playSelectedAyah: "Play selected ayah",
    playPageAyahByAyah: "Play page ayah by ayah",
    playFullSurah: "Play full surah",
    loadingQuranContent: "Loading Quran content...",
    loadingChapterData: "Loading chapter data...",
    sunniTafsir: "Sunni tafsir",
    lookingForIbnKathir: "Looking for Ibn Kathir...",
    recitationEyebrow: "Recitation",
    makkahImamDefault: "Makkah Imam Default",
    audioPanelCopy:
      "Click an ayah once to start recitation immediately, play the page ayah by ayah, or switch to full surah playback.",
    audioCaptionStart: "Click any ayah once to start playback.",
    selectedVerseEyebrow: "Selected Verse",
    translationHeading: "Translation",
    selectedVerseEmpty: "Click any verse to load its translation and tafsir.",
    tafsirEyebrow: "Tafsir",
    sunniCommentary: "Sunni Commentary",
    tafsirEmpty: "English or Arabic tafsir will appear here after you select a verse.",
    footerBuiltBy: "Built with care by Ahmed Aldulaimi.",
    footerLinkedIn: "Connect on LinkedIn",
    footerNetwork: "YouOOO Network",
    day: "Day",
    night: "Night",
    pageLabel: "Page {page}",
    pageMeta: "Page {page}",
    loadingPage: "Loading page {page}...",
    noVersesReturned: "No verses were returned for this page.",
    mixedPage: "Mixed page",
    selectedTafsir: "Selected tafsir",
    unknownReciter: "Unknown reciter",
    juzzOption: "Juz {juz} - pages {start}-{end}",
    translationUnavailable: "Translation unavailable for this verse in the selected language.",
    tafsirUnavailable: "Tafsir unavailable for this verse from the selected Sunni source.",
    loadingTafsir: "Loading tafsir...",
    noWordTranslation: "No word translation",
    followingFullSurah: "Following full surah: {verseKey} on page {page}",
    fullSurahFollowFailed: "Still playing full surah. The next page could not load automatically.",
    pressPlayToContinue: "Press play in the audio player to continue playback.",
    audioUnavailable: "Audio is not available for {verseKey}.",
    audioUnavailableThisAyah: "Audio is not available for this ayah.",
    playingAyah: "Playing {verseKey}",
    readyToPlayAyah: "Ready to play {verseKey}",
    tafsirLoadFailed: "Tafsir could not be loaded right now. Please try another ayah or reload the page.",
    contentLoadFailed:
      "I could not load Quran content right now. The public API may be unavailable or rate-limiting this request.",
    verseDetailsUnavailable: "Verse details unavailable.",
    selectSurahFirst: "Select a surah or ayah first to play the full surah.",
    playingFullSurah: "Playing full surah: {surah}",
    fullSurahUnavailable: "Full surah playback is unavailable for this reciter right now.",
    couldNotFindAyah: "Could not find ayah {verseKey}.",
    searchHelp: "Search by surah name, page number, or ayah like 2:255.",
    loadingQuranResources: "Loading Quran resources...",
    defaultReciter: "Default reciter: {reciter}",
    readerInitFailed:
      "This reader could not initialize. The Quran data service may require access that is unavailable in this environment.",
    finishedPagePlayback: "Finished page playback.",
    english: "English",
    arabic: "العربية",
  },
  arabic: {
    networkLink: "المزيد من YouOOO",
    heroEyebrow: "تجربة قراءة القرآن",
    heroTitle: "اقرأ القرآن أونلاين مع الترجمة والتفسير والصوت ومعاني الكلمات",
    heroText:
      "قارئ قرآن مجاني لغير الناطقين بالعربية. اقرأ واستمع وافهم القرآن بلغات متعددة مع التفسير والتلاوة ومعاني الكلمات.",
    heroChipReadingTitle: "وضع القراءة",
    heroChipReadingText: "تدفق صفحات المصحف مع الانتقال بين السور",
    heroChipWordTitle: "مساعدة الكلمات",
    heroChipWordText: "اضغط أو مرر على الكلمات العربية لرؤية المعنى",
    heroChipTafsirTitle: "التفسير",
    heroChipTafsirText: "لوحة تفسير سني بالإنجليزية أو العربية",
    introEyebrow: "افهم القرآن",
    introTitle: "اقرأ القرآن أونلاين مع الترجمة والتفسير والصوت ومعاني الكلمات.",
    introBody1:
      "تم بناء Quran YouOOO لمن يريد قراءة القرآن أونلاين بالنص العربي والترجمة ومعاني الكلمات والتلاوة والتفسير السني في مكان واحد بسيط.",
    introBody2:
      "وهو مفيد خصوصًا لغير الناطقين بالعربية، والمسلمين الجدد، والعائدين للإسلام، والأطفال الذين يكبرون في الخارج، ولكل من يريد تعلم العربية القرآنية أثناء القراءة.",
    introBody3:
      "استخدم هذا القارئ للاستماع إلى التلاوة، والتنقل بين صفحات المصحف، واختيار لغة الترجمة، ودراسة الآيات المختارة مع ملاحظات التفسير. الهدف هو جعل دراسة القرآن أسهل دون الحاجة إلى التنقل بين أدوات كثيرة.",
    introTag1: "قراءة القرآن أونلاين",
    introTag2: "القرآن كلمة بكلمة",
    introTag3: "ترجمة القرآن وتفسيره",
    introTag4: "الاستماع إلى التلاوة",
    controlsEyebrow: "التحكم",
    readerSetup: "إعداد القارئ",
    interfaceLanguage: "لغة الواجهة",
    surahLabel: "السورة",
    pageField: "الصفحة",
    prev: "السابق",
    next: "التالي",
    translationLanguage: "لغة الترجمة",
    reciterLabel: "القارئ",
    tafsirLanguage: "لغة التفسير",
    englishTafsir: "تفسير إنجليزي",
    arabicTafsir: "تفسير عربي",
    juzLabel: "الجزء",
    searchLabel: "ابحث عن سورة / آية",
    searchPlaceholder: "الفاتحة، 2:255، الصفحة 10",
    go: "اذهب",
    readingOptions: "خيارات القراءة",
    memorization: "الحفظ",
    repeatAyahOn: "تكرار الآية: تشغيل",
    repeatAyahOff: "تكرار الآية: إيقاف",
    shareLabel: "مشاركة",
    copySelectedVerseLink: "نسخ رابط الآية المختارة",
    copied: "تم النسخ",
    linkReady: "الرابط جاهز في شريط العنوان",
    readingSurface: "مساحة القراءة",
    arabicText: "النص العربي",
    playSelectedAyah: "تشغيل الآية المختارة",
    playPageAyahByAyah: "تشغيل الصفحة آية بآية",
    playFullSurah: "تشغيل السورة كاملة",
    loadingQuranContent: "جارٍ تحميل محتوى القرآن...",
    loadingChapterData: "جارٍ تحميل بيانات السورة...",
    sunniTafsir: "تفسير سني",
    lookingForIbnKathir: "جارٍ البحث عن ابن كثير...",
    recitationEyebrow: "التلاوة",
    makkahImamDefault: "إمام مكة الافتراضي",
    audioPanelCopy:
      "اضغط على أي آية مرة واحدة لبدء التلاوة فورًا، أو شغّل الصفحة آية بآية، أو انتقل إلى تشغيل السورة كاملة.",
    audioCaptionStart: "اضغط على أي آية مرة واحدة لبدء التشغيل.",
    selectedVerseEyebrow: "الآية المختارة",
    translationHeading: "الترجمة",
    selectedVerseEmpty: "اضغط على أي آية لتحميل ترجمتها وتفسيرها.",
    tafsirEyebrow: "التفسير",
    sunniCommentary: "شرح سني",
    tafsirEmpty: "سيظهر التفسير الإنجليزي أو العربي هنا بعد اختيار آية.",
    footerBuiltBy: "تم البناء بعناية بواسطة أحمد الدليمي.",
    footerLinkedIn: "تواصل على لينكدإن",
    footerNetwork: "شبكة YouOOO",
    day: "نهاري",
    night: "ليلي",
    pageLabel: "الصفحة {page}",
    pageMeta: "الصفحة {page}",
    loadingPage: "جارٍ تحميل الصفحة {page}...",
    noVersesReturned: "لم يتم إرجاع آيات لهذه الصفحة.",
    mixedPage: "صفحة مختلطة",
    selectedTafsir: "التفسير المختار",
    unknownReciter: "قارئ غير معروف",
    juzzOption: "الجزء {juz} - الصفحات {start}-{end}",
    translationUnavailable: "الترجمة غير متاحة لهذه الآية باللغة المختارة.",
    tafsirUnavailable: "التفسير غير متاح لهذه الآية من المصدر السني المختار.",
    loadingTafsir: "جارٍ تحميل التفسير...",
    noWordTranslation: "لا توجد ترجمة للكلمة",
    followingFullSurah: "متابعة السورة الكاملة: {verseKey} في الصفحة {page}",
    fullSurahFollowFailed: "ما زالت السورة الكاملة تعمل. تعذر تحميل الصفحة التالية تلقائيًا.",
    pressPlayToContinue: "اضغط تشغيل في مشغل الصوت لمتابعة التشغيل.",
    audioUnavailable: "الصوت غير متاح لـ {verseKey}.",
    audioUnavailableThisAyah: "الصوت غير متاح لهذه الآية.",
    playingAyah: "جارٍ تشغيل {verseKey}",
    readyToPlayAyah: "جاهز لتشغيل {verseKey}",
    tafsirLoadFailed: "تعذر تحميل التفسير الآن. جرّب آية أخرى أو أعد تحميل الصفحة.",
    contentLoadFailed:
      "تعذر تحميل محتوى القرآن الآن. قد تكون الواجهة العامة للخدمة غير متاحة أو تفرض قيودًا على الطلبات.",
    verseDetailsUnavailable: "تفاصيل الآية غير متاحة.",
    selectSurahFirst: "اختر سورة أو آية أولًا لتشغيل السورة كاملة.",
    playingFullSurah: "جارٍ تشغيل السورة كاملة: {surah}",
    fullSurahUnavailable: "تشغيل السورة كاملة غير متاح مع هذا القارئ الآن.",
    couldNotFindAyah: "تعذر العثور على الآية {verseKey}.",
    searchHelp: "ابحث باسم السورة أو رقم الصفحة أو آية مثل 2:255.",
    loadingQuranResources: "جارٍ تحميل موارد القرآن...",
    defaultReciter: "القارئ الافتراضي: {reciter}",
    readerInitFailed:
      "تعذر تهيئة هذا القارئ. قد تحتاج خدمة بيانات القرآن إلى وصول غير متاح في هذه البيئة.",
    finishedPagePlayback: "اكتمل تشغيل الصفحة.",
    english: "English",
    arabic: "العربية",
  },
};

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
    uiLanguage: "english",
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
      uiLanguage: saved.settings.uiLanguage === "arabic" ? "arabic" : "english",
    };
  }
}

function t(key, vars = {}) {
  const uiLanguage = state.settings.uiLanguage === "arabic" ? "arabic" : "english";
  const template = UI_TRANSLATIONS[uiLanguage]?.[key] || UI_TRANSLATIONS.english[key] || key;
  return Object.entries(vars).reduce(
    (value, [name, replacement]) => value.replaceAll(`{${name}}`, String(replacement)),
    template
  );
}

function applyUiTranslations() {
  document.body.dataset.uiLanguage = state.settings.uiLanguage;
  document.documentElement.lang = state.settings.uiLanguage === "arabic" ? "ar" : "en";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  if (uiLanguageSelect) {
    uiLanguageSelect.value = state.settings.uiLanguage;
    const englishOption = uiLanguageSelect.querySelector('option[value="english"]');
    const arabicOption = uiLanguageSelect.querySelector('option[value="arabic"]');
    if (englishOption) englishOption.textContent = t("english");
    if (arabicOption) arabicOption.textContent = t("arabic");
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

function setLoading(isLoading, message = t("loadingQuranContent")) {
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
  applyUiTranslations();
  themeToggleButton.textContent = state.settings.theme === "dark" ? t("day") : t("night");
  repeatToggleButton.textContent = state.settings.repeatVerse ? t("repeatAyahOn") : t("repeatAyahOff");
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
  const languageLabel = state.selectedTafsirLanguage === "arabic" ? t("arabicTafsir") : t("englishTafsir");
  tafsirLabel.textContent = languageLabel;
  tafsirSourceLabel.textContent = tafsir?.name || tafsir?.translated_name?.name || t("selectedTafsir");
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
        `<option value="${reciter.id}">${escapeHtml(reciter.reciter_name || t("unknownReciter"))}</option>`
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
    return `<option value="${juzNumber}">${escapeHtml(t("juzzOption", { juz: juzNumber, start: startPage, end: endPage }))}</option>`;
  }).join("");
  updateJuzSelect();
}

function fillTafsirLanguageSelect() {
  const availableLanguages = new Set(state.tafsirs.map((tafsir) => tafsir.language_name?.toLowerCase()).filter(Boolean));
  const options = [
    { value: "english", label: t("englishTafsir") },
    { value: "arabic", label: t("arabicTafsir") },
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
    verse?.translations?.[0]?.text || t("translationUnavailable");

  selectedVerseEl.innerHTML = `
    <div class="selected-verse-arabic">${escapeHtml(verse?.text_uthmani || "")}</div>
    <div><strong>${escapeHtml(verse?.verse_key || "")}</strong></div>
    <div>${translationText}</div>
  `;

  tafsirContentEl.innerHTML =
    tafsirHtml || t("tafsirUnavailable");
  tafsirContentEl.classList.toggle("is-arabic", state.selectedTafsirLanguage === "arabic");
}

function renderTafsirLoading(verse) {
  renderVerseDetails(verse, t("loadingTafsir"));
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
  renderVerseDetails(verse, state.tafsirByVerseKey[verseKey] || t("loadingTafsir"));
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
      audioCaption.textContent = t("followingFullSurah", { verseKey, page: verse.page_number });
    }
  } catch (error) {
    if (state.playback.mode === "surah") {
      audioCaption.textContent = t("fullSurahFollowFailed");
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
    audioCaption.textContent = t("pressPlayToContinue");
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
    audioCaption.textContent = verse?.verse_key
      ? t("audioUnavailable", { verseKey: verse.verse_key })
      : t("audioUnavailableThisAyah");
    return;
  }

  audioCaption.textContent = autoplay
    ? t("playingAyah", { verseKey: verse.verse_key })
    : t("readyToPlayAyah", { verseKey: verse.verse_key });
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
    const tafsirHtml = result.tafsir?.text || t("tafsirUnavailable");
    state.tafsirByVerseKey[verseKey] = tafsirHtml;
    if (state.selectedVerseKey === verseKey) {
      renderVerseDetails(verse, tafsirHtml);
    }
  } catch (error) {
    const fallback = t("tafsirLoadFailed");
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
  renderVerseDetails(verse, state.tafsirByVerseKey[verseKey] || t("loadingTafsir"));
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
          const translation = word.translation?.text || t("noWordTranslation");
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
            <span>${escapeHtml(t("pageMeta", { page: verse.page_number || state.currentPage }))}</span>
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
  pageLabel.textContent = t("pageLabel", { page: state.currentPage });
  setError("");
  setLoading(true, t("loadingPage", { page: state.currentPage }));
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
      throw new Error(t("noVersesReturned"));
    }

    const chapter = getChapterForPage(state.currentPage);
    if (chapter) {
      chapterLabel.textContent = `${chapter.id}. ${chapter.name_simple} (${chapter.name_arabic})`;
      chapterSelect.value = String(chapter.id);
    } else {
      chapterLabel.textContent = t("mixedPage");
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
      t("contentLoadFailed")
    );
    versesContainer.innerHTML = "";
    selectedVerseEl.textContent = t("verseDetailsUnavailable");
    tafsirContentEl.textContent = t("tafsirUnavailable");
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
    audioCaption.textContent = t("selectSurahFirst");
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
    audioCaption.textContent = t("playingFullSurah", { surah: chapter.name_simple });
    if (state.playback.surahTimestamps[0]?.verse_key) {
      highlightSelectedVerse(state.playback.surahTimestamps[0].verse_key);
    }
    await playAudioFromSource(audioUrl, { startAt: 0 });
  } catch (error) {
    state.playback.mode = "idle";
    audioCaption.textContent = t("fullSurahUnavailable");
  }
}

async function goToVerseKey(verseKey) {
  const verse = await fetchVerseByKey(verseKey);
  if (!verse?.page_number) {
    audioCaption.textContent = t("couldNotFindAyah", { verseKey });
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

  audioCaption.textContent = t("searchHelp");
}

async function bootstrap() {
  setLoading(true, t("loadingQuranResources"));

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
      audioCaption.textContent = t("defaultReciter", { reciter: chosenReciter.reciter_name });
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
      t("readerInitFailed")
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

uiLanguageSelect?.addEventListener("change", () => {
  state.settings.uiLanguage = uiLanguageSelect.value === "arabic" ? "arabic" : "english";
  applyReaderSettings();
  fillJuzSelect();
  fillTafsirLanguageSelect();
  updateTafsirLabels(chooseSunniTafsir());
  pageLabel.textContent = t("pageLabel", { page: state.currentPage });
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
    renderVerseDetails(verse, t("loadingTafsir"));
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
    copyVerseLinkButton.textContent = t("copied");
  } catch (error) {
    copyVerseLinkButton.textContent = t("linkReady");
  }
  setTimeout(() => {
    copyVerseLinkButton.textContent = t("copySelectedVerseLink");
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
    audioCaption.textContent = t("finishedPagePlayback");
    return;
  }

  state.playback.mode = "page";
  selectVerse(nextVerseKey, { autoplay: true, keepPlaybackMode: true });
});

bootstrap();
