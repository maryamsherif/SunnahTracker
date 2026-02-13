import { useEffect, useMemo, useState } from 'react';
import {
  Book,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  DollarSign,
  Dumbbell,
  Heart,
  Moon,
  Newspaper,
  Plus,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import { loadLocale } from 'wuchale/load-utils';
import HijriMonthlyCalendar from './components/HijriMonthlyCalendar';
import './locales/main.loader';

type Habits = {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  fajrSunnah: boolean;
  dhuhrSunnahBefore: boolean;
  dhuhrSunnahAfter: boolean;
  maghribSunnahAfter: boolean;
  ishaSunnahAfter: boolean;
  quran: boolean;
  quranReflection: boolean;
  quranMemorization: boolean;
  quranRecitation: boolean;
  morningDhikr: boolean;
  eveningDhikr: boolean;
  sleepDhikr: boolean;
  dailyDuaa: boolean;
  duhaPrayer: boolean;
  witrPrayer: boolean;
  tahajjudPrayer: boolean;
  sadaqah: boolean;
  islamicStudies: boolean;
  exercise: boolean;
  silatRahim: boolean;
  ummahNews: boolean;
  voluntaryFasting: boolean;
};

const defaultHabits: Habits = {
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
  fajrSunnah: false,
  dhuhrSunnahBefore: false,
  dhuhrSunnahAfter: false,
  maghribSunnahAfter: false,
  ishaSunnahAfter: false,
  quran: false,
  quranReflection: false,
  quranMemorization: false,
  quranRecitation: false,
  morningDhikr: false,
  eveningDhikr: false,
  sleepDhikr: false,
  dailyDuaa: false,
  duhaPrayer: false,
  witrPrayer: false,
  tahajjudPrayer: false,
  sadaqah: false,
  islamicStudies: false,
  exercise: false,
  silatRahim: false,
  ummahNews: false,
  voluntaryFasting: false,
};

const requiredHabits: (keyof Habits)[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
  'quran',
  'morningDhikr',
  'eveningDhikr',
  'sleepDhikr',
  'dailyDuaa',
];

const optionalHabits: (keyof Habits)[] = [
  'fajrSunnah',
  'dhuhrSunnahBefore',
  'dhuhrSunnahAfter',
  'maghribSunnahAfter',
  'ishaSunnahAfter',
  'quranReflection',
  'quranMemorization',
  'quranRecitation',
  'duhaPrayer',
  'tahajjudPrayer',
  'witrPrayer',
  'sadaqah',
  'islamicStudies',
  'exercise',
  'silatRahim',
  'ummahNews',
  'voluntaryFasting',
];

type Theme = 'light' | 'dark';
type Locale = 'en' | 'ar';

const hijriNumberFormatter = new Intl.DateTimeFormat(
  'en-u-ca-islamic-umalqura',
  {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }
);

const getHijriParts = (date: Date) => {
  const parts = hijriNumberFormatter.formatToParts(date);
  const dayPart = parts.find((part) => part.type === 'day');
  const monthPart = parts.find((part) => part.type === 'month');
  const yearPart = parts.find((part) => part.type === 'year');

  return {
    day: dayPart ? Number(dayPart.value) : 1,
    month: monthPart ? Number(monthPart.value) : 1,
    year: yearPart ? Number(yearPart.value) : 1,
  };
};

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `habits:${year}-${month}-${day}`;
};

const getLegacyDateKey = (date: Date) => {
  const isoDate = date.toISOString().split('T')[0];
  return `habits:${isoDate}`;
};

const getTodayKey = () => getLocalDateKey(new Date());

const parseHabitsRecord = (stored: string | null): Habits | null => {
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<Habits>;
    return { ...defaultHabits, ...parsed };
  } catch {
    return null;
  }
};

const THEME_STORAGE_KEY = 'sunnah:theme';
const LOCALE_STORAGE_KEY = 'sunnah:locale';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return 'en';
  }
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'ar') {
    return stored;
  }
  return window.navigator.language.startsWith('ar') ? 'ar' : 'en';
};

const IslamicHabitsTracker = () => {
  const [habits, setHabits] = useState<Habits>(defaultHabits);
  const [showKahfReminder, setShowKahfReminder] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [i18nReady, setI18nReady] = useState(false);
  const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);
  const [quranExpanded, setQuranExpanded] = useState(false);
  const [dhikrExpanded, setDhikrExpanded] = useState(false);
  const [activeView, setActiveView] = useState<'habits' | 'calendar'>('habits');
  const [sectionsOpen, setSectionsOpen] = useState({
    prayers: false,
    worship: false,
    extra: false,
    optional: false,
  });
  const today = useMemo(() => new Date(), []);
  const hijriLocale = useMemo(
    () =>
      locale === 'ar'
        ? 'ar-SA-u-ca-islamic-umalqura'
        : 'en-u-ca-islamic-umalqura',
    [locale]
  );
  const hijriTodayLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(hijriLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(today);
  }, [hijriLocale, today]);
  const hijriTodayParts = useMemo(() => getHijriParts(today), [today]);
  const isWhiteDayToday = useMemo(() => {
    if (hijriTodayParts.month === 9) {
      return false;
    }
    return (
      hijriTodayParts.day === 13 ||
      hijriTodayParts.day === 14 ||
      hijriTodayParts.day === 15
    );
  }, [hijriTodayParts]);
  const isMondayOrThursday = useMemo(() => {
    const dow = today.getDay();
    return dow === 1 || dow === 4;
  }, [today]);
  const showFastingSection = isWhiteDayToday || isMondayOrThursday;

  const getHabitsForDate = (date: Date) => {
    const localKey = getLocalDateKey(date);
    const localHabits = parseHabitsRecord(localStorage.getItem(localKey));
    if (localHabits) {
      return localHabits;
    }

    const legacyHabits = parseHabitsRecord(
      localStorage.getItem(getLegacyDateKey(date))
    );
    if (legacyHabits) {
      try {
        localStorage.setItem(localKey, JSON.stringify(legacyHabits));
      } catch {
        // Ignore storage errors (private mode, quota, etc.)
      }
    }

    return legacyHabits;
  };

  useEffect(() => {
    const storedHabits = getHabitsForDate(new Date());
    if (storedHabits) {
      setHabits(storedHabits);
    }

    const today = new Date().getDay();
    if (today === 5) {
      setShowKahfReminder(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    setI18nReady(false);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);

    loadLocale(locale)
      .then(() => {
        if (active) {
          setI18nReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setI18nReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [locale]);

  const saveHabits = (newHabits: Habits) => {
    try {
      localStorage.setItem(getTodayKey(), JSON.stringify(newHabits));
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
  };

  const toggleHabit = (habit: keyof Habits) => {
    const newHabits = { ...habits, [habit]: !habits[habit] };
    setHabits(newHabits);
    saveHabits(newHabits);
  };

  const progress = useMemo(() => {
    const completed = requiredHabits.filter((habit) => habits[habit]).length;
    return Math.round((completed / requiredHabits.length) * 100);
  }, [habits]);

  const optionalProgress = useMemo(() => {
    if (optionalHabits.length === 0) {
      return 0;
    }
    const completed = optionalHabits.filter((habit) => habits[habit]).length;
    return Math.round((completed / optionalHabits.length) * 100);
  }, [habits]);


  const HabitItem = ({
    name,
    label,
    icon: Icon,
    isOptional = false,
    compact = false,
  }: {
    name: keyof Habits;
    label: string;
    icon: typeof Sun;
    isOptional?: boolean;
    compact?: boolean;
  }) => (
    <div
      onClick={() => toggleHabit(name)}
      className={`flex items-center rounded-lg border-2 transition-all ${
        habits[name]
          ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400/70 dark:bg-emerald-950/40'
          : 'border-gray-200 bg-white hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-emerald-500/60'
      } ${
        compact ? 'gap-2 p-3 w-full max-w-[520px] mr-auto' : 'gap-3 p-4 w-full'
      }`}
    >
      <div className="flex-shrink-0">
        {habits[name] ? (
          <div
            className={`flex items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 ${
              compact ? 'h-5 w-5' : 'h-6 w-6'
            }`}
          >
            <Check className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
          </div>
        ) : (
          <Circle
            className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-gray-400 dark:text-slate-500`}
          />
        )}
      </div>
      <div className="flex flex-1 items-center gap-2">
        <Icon
          className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} ${
            habits[name]
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-gray-500 dark:text-slate-400'
          }`}
        />
        <span
          className={`${compact ? 'text-sm' : 'text-base'} ${
            habits[name]
              ? 'font-medium text-emerald-900 dark:text-emerald-100'
              : 'text-gray-700 dark:text-slate-200'
          }`}
        >
          {label}
        </span>
      </div>
      {isOptional && (
        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-slate-800 dark:text-slate-300">
          Optional
        </span>
      )}
    </div>
  );

  const toggleExpandedPrayer = (prayer: string) => {
    setExpandedPrayer((current) => (current === prayer ? null : prayer));
  };

  const toggleQuranExpanded = () => {
    setQuranExpanded((current) => !current);
  };

  const toggleDhikrExpanded = () => {
    setDhikrExpanded((current) => !current);
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  if (!i18nReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        Loading translations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-2xl">
        <div className="relative mb-8 pt-6">
          <div className="absolute right-0 top-0">
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white/90 text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-emerald-200 dark:hover:border-emerald-500"
            >
              <Settings className="h-5 w-5" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 z-50 mt-3 w-64 rounded-xl border border-emerald-100 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                <div className="mb-3 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Settings
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Theme
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        aria-pressed={theme === 'light'}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          theme === 'light'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                            : 'border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/70'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        aria-pressed={theme === 'dark'}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          theme === 'dark'
                            ? 'border-emerald-400/70 bg-slate-900 text-emerald-100'
                            : 'border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/70'
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Language
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLocale('en')}
                        aria-pressed={locale === 'en'}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          locale === 'en'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                            : 'border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/70'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocale('ar')}
                        aria-pressed={locale === 'ar'}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          locale === 'ar'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                            : 'border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/70'
                        }`}
                      >
                        Arabic
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="text-center">
            <h1 className="mb-2 text-4xl font-bold text-emerald-900 dark:text-emerald-100">
              Sunnah Habits Tracker
            </h1>
            <div className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white/90 px-4 py-1 text-sm font-semibold text-emerald-800 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-emerald-200">
              {hijriTodayLabel}
            </div>
            <div className="mt-4 flex justify-center">
              <div className="inline-flex rounded-full border border-emerald-200 bg-white/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                <button
                  type="button"
                  onClick={() => setActiveView('habits')}
                  aria-pressed={activeView === 'habits'}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeView === 'habits'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Habits
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('calendar')}
                  aria-pressed={activeView === 'calendar'}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeView === 'calendar'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Calendar
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeView === 'habits' && showKahfReminder && (
          <div className="mb-6 rounded-lg border-2 border-amber-400 bg-gradient-to-r from-amber-100 to-yellow-100 p-4 shadow-md dark:border-amber-500/60 dark:from-amber-900/50 dark:to-yellow-900/40">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-amber-700 dark:text-amber-300" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Jummah Reminder
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Don&apos;t forget to read Surah Al-Kahf today!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'calendar' && (
          <HijriMonthlyCalendar
            locale={locale}
            requiredHabits={requiredHabits}
            optionalHabits={optionalHabits}
            getHabitsForDate={getHabitsForDate}
          />
        )}

        {activeView === 'habits' && (
          <>
            <div className="mb-6 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900/70">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium text-gray-700 dark:text-slate-200">
                  Daily Progress
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                  {progress}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-slate-800">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    <span>Taqarrub Progress</span>
                  </div>
                  <span>{optionalProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400/90 transition-all duration-500"
                    style={{ width: `${optionalProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {showFastingSection && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-md dark:border-amber-500/50 dark:bg-amber-900/30">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-amber-900 dark:text-amber-100">
                    Voluntary Fasting
                  </h2>
                  <span className="text-xs text-amber-700 dark:text-amber-200">
                    Optional
                  </span>
                </div>
                <div className="mb-3 text-sm text-amber-800 dark:text-amber-200">
                  {isWhiteDayToday && isMondayOrThursday
                    ? 'Reason: White Days (13th-15th, except Ramadan) and Monday/Thursday.'
                    : isWhiteDayToday
                      ? 'Reason: White Days (13th-15th, except Ramadan).'
                      : 'Reason: Monday/Thursday.'}
                </div>
                <HabitItem
                  name="voluntaryFasting"
                  label="Mark if you fasted today"
                  icon={Moon}
                  isOptional
                  compact
                />
              </div>
            )}

        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-slate-100">
              <Moon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              Five Daily Prayers
            </h2>
            <button
              type="button"
              onClick={() => toggleSection('prayers')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              aria-label="Toggle Five Daily Prayers"
            >
              {sectionsOpen.prayers ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          {sectionsOpen.prayers && (
            <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <HabitItem name="fajr" label="Fajr" icon={Sun} />
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleExpandedPrayer('fajr');
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white/80 text-emerald-700 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-emerald-200"
                  aria-label="Toggle Fajr Sunnah"
                >
                  {expandedPrayer === 'fajr' ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
              {expandedPrayer === 'fajr' && (
                <div className="ml-10 space-y-2">
                  <HabitItem
                    name="fajrSunnah"
                    label="Fajr Sunnah (2 Before)"
                    icon={Moon}
                    isOptional
                    compact
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <HabitItem name="dhuhr" label="Dhuhr" icon={Sun} />
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleExpandedPrayer('dhuhr');
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white/80 text-emerald-700 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-emerald-200"
                  aria-label="Toggle Dhuhr Sunnah"
                >
                  {expandedPrayer === 'dhuhr' ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
              {expandedPrayer === 'dhuhr' && (
                <div className="ml-10 space-y-2">
                  <HabitItem
                    name="dhuhrSunnahBefore"
                    label="Dhuhr Sunnah (4 Before)"
                    icon={Moon}
                    isOptional
                    compact
                  />
                  <HabitItem
                    name="dhuhrSunnahAfter"
                    label="Dhuhr Sunnah (2 After)"
                    icon={Moon}
                    isOptional
                    compact
                  />
                </div>
              )}
            </div>

            <HabitItem name="asr" label="Asr" icon={Sun} />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <HabitItem name="maghrib" label="Maghrib" icon={Sun} />
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleExpandedPrayer('maghrib');
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white/80 text-emerald-700 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-emerald-200"
                  aria-label="Toggle Maghrib Sunnah"
                >
                  {expandedPrayer === 'maghrib' ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
              {expandedPrayer === 'maghrib' && (
                <div className="ml-10 space-y-2">
                  <HabitItem
                    name="maghribSunnahAfter"
                    label="Maghrib Sunnah (2 After)"
                    icon={Moon}
                    isOptional
                    compact
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <HabitItem name="isha" label="Isha" icon={Moon} />
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleExpandedPrayer('isha');
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white/80 text-emerald-700 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-emerald-200"
                  aria-label="Toggle Isha Sunnah"
                >
                  {expandedPrayer === 'isha' ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
              {expandedPrayer === 'isha' && (
                <div className="ml-10 space-y-2">
                  <HabitItem
                    name="ishaSunnahAfter"
                    label="Isha Sunnah (2 After)"
                    icon={Moon}
                    isOptional
                    compact
                  />
                </div>
              )}
            </div>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-slate-100">
              <Book className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              Daily Worship
            </h2>
            <button
              type="button"
              onClick={() => toggleSection('worship')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              aria-label="Toggle Daily Worship"
            >
              {sectionsOpen.worship ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          {sectionsOpen.worship && (
            <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <HabitItem name="quran" label="Daily Quran Reading" icon={Book} />
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleQuranExpanded();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white/80 text-emerald-700 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-emerald-200"
                  aria-label="Toggle Quran options"
                >
                  {quranExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
              {quranExpanded && (
                <div className="ml-10 space-y-2">
                  <HabitItem
                    name="quranReflection"
                    label="Quran Reflection"
                    icon={Book}
                    isOptional
                    compact
                  />
                  <HabitItem
                    name="quranMemorization"
                    label="Quran Memorization"
                    icon={Book}
                    isOptional
                    compact
                  />
                  <HabitItem
                    name="quranRecitation"
                    label="Quran Recitation"
                    icon={Book}
                    isOptional
                    compact
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all dark:border-slate-800 dark:bg-slate-900/60">
                    <Sun className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                    <span className="text-base text-gray-700 dark:text-slate-200">
                      Daily Dhikr
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleDhikrExpanded();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white/80 text-emerald-700 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-emerald-200"
                  aria-label="Toggle Dhikr options"
                >
                  {dhikrExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
              {dhikrExpanded && (
                <div className="ml-10 space-y-2">
                  <HabitItem
                    name="morningDhikr"
                    label="Morning Dhikr"
                    icon={Sun}
                    compact
                  />
                  <HabitItem
                    name="eveningDhikr"
                    label="Evening Dhikr"
                    icon={Moon}
                    compact
                  />
                  <HabitItem
                    name="sleepDhikr"
                    label="Before Sleeping Dhikr"
                    icon={Moon}
                    compact
                  />
                </div>
              )}
            </div>
            <HabitItem name="dailyDuaa" label="Daily Du'aa" icon={Heart} />
            </div>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-slate-100">
              <Moon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              Extra Sunnah Prayers
            </h2>
            <button
              type="button"
              onClick={() => toggleSection('extra')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              aria-label="Toggle Extra Sunnah Prayers"
            >
              {sectionsOpen.extra ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          {sectionsOpen.extra && (
            <div className="space-y-3">
              <HabitItem name="duhaPrayer" label="Duha Prayer" icon={Sun} isOptional />
              <HabitItem name="witrPrayer" label="Witr Prayer" icon={Moon} isOptional />
              <HabitItem
                name="tahajjudPrayer"
                label="Tahajjud Prayer"
                icon={Moon}
                isOptional
              />
            </div>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-slate-100">
              <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              Optional Activities
            </h2>
            <button
              type="button"
              onClick={() => toggleSection('optional')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              aria-label="Toggle Optional Activities"
            >
              {sectionsOpen.optional ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          {sectionsOpen.optional && (
            <div className="space-y-3">
              <HabitItem name="sadaqah" label="Sadaqah" icon={DollarSign} isOptional />
              <HabitItem
                name="islamicStudies"
                label="Islamic Studies Time"
                icon={Book}
                isOptional
              />
              <HabitItem
                name="exercise"
                label="Exercise Time"
                icon={Dumbbell}
                isOptional
              />
              <HabitItem
                name="silatRahim"
                label="Silat al-Rahim (Family Ties)"
                icon={Users}
                isOptional
              />
              <HabitItem
                name="ummahNews"
                label="Check Ummah News"
                icon={Newspaper}
                isOptional
              />
            </div>
          )}
        </div>

          </>
        )}

        <div className="pb-6 text-center text-sm text-gray-600 dark:text-slate-300">
          <p className="mb-2">May Allah Accept Our Deeds</p>
        </div>
      </div>
    </div>
  );
};

export default IslamicHabitsTracker;
