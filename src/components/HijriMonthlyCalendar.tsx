import { useEffect, useMemo, useState } from 'react';
import { Calendar, Heart } from 'lucide-react';

type HijriMonthlyCalendarProps = {
  locale: 'en' | 'ar';
  mainHabits: string[];
  optionalHabits: string[];
  getHabitsForDate: (date: Date) => Record<string, boolean> | null;
};

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

const getDateInHijriYear = (targetYear: number, anchor: Date) => {
  const anchorYear = getHijriParts(anchor).year;
  const shiftDays = (targetYear - anchorYear) * 354;
  const guess = new Date(anchor);
  guess.setDate(guess.getDate() + shiftDays);

  let currentYear = getHijriParts(guess).year;
  if (currentYear === targetYear) {
    return guess;
  }

  const direction = currentYear < targetYear ? 1 : -1;
  while (currentYear !== targetYear) {
    guess.setDate(guess.getDate() + direction);
    currentYear = getHijriParts(guess).year;
  }

  return guess;
};

const getHijriYearStart = (targetYear: number, anchor: Date) => {
  const dateInYear = getDateInHijriYear(targetYear, anchor);
  const start = new Date(dateInYear);
  while (getHijriParts(start).year === targetYear) {
    start.setDate(start.getDate() - 1);
  }
  start.setDate(start.getDate() + 1);
  return start;
};

const HijriMonthlyCalendar = ({
  locale,
  mainHabits,
  optionalHabits,
  getHabitsForDate,
}: HijriMonthlyCalendarProps) => {
  const [now, setNow] = useState(() => new Date());
  const hijriLocale = useMemo(
    () =>
      locale === 'ar'
        ? 'ar-SA-u-ca-islamic-umalqura'
        : 'en-u-ca-islamic-umalqura',
    [locale]
  );
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const current = new Date();
      if (
        current.getFullYear() !== now.getFullYear() ||
        current.getMonth() !== now.getMonth() ||
        current.getDate() !== now.getDate()
      ) {
        setNow(current);
      }
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [now]);

  const today = now;
  const todayParts = useMemo(() => getHijriParts(today), [today]);
  const minYear = todayParts.year;
  const [selectedYear, setSelectedYear] = useState(todayParts.year);
  const [selectedMonth, setSelectedMonth] = useState(todayParts.month - 1);
  const [pickerOpen, setPickerOpen] = useState(false);

  const hijriYearData = useMemo(() => {
    const yearStart = getHijriYearStart(selectedYear, today);
    const monthStarts = Array.from({ length: 12 }) as Date[];
    const cursor = new Date(yearStart);

    while (getHijriParts(cursor).year === selectedYear) {
      const parts = getHijriParts(cursor);
      if (parts.day === 1 && !monthStarts[parts.month - 1]) {
        monthStarts[parts.month - 1] = new Date(cursor);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const monthLabels = monthStarts.map((date) => {
      const formatter = new Intl.DateTimeFormat(hijriLocale, {
        month: 'short',
      });
      return date ? formatter.format(date) : '';
    });

    return { yearStart, monthStarts, monthLabels };
  }, [hijriLocale, selectedYear, today]);

  const selectedMonthStart =
    hijriYearData.monthStarts[selectedMonth] || hijriYearData.yearStart;

  const monthlyHijriData = useMemo(() => {
    const rangeStart = new Date(selectedMonthStart);

    const nextMonthStart = hijriYearData.monthStarts[selectedMonth + 1];
    let rangeEnd = new Date(rangeStart);
    if (nextMonthStart) {
      rangeEnd = new Date(nextMonthStart);
      rangeEnd.setDate(rangeEnd.getDate() - 1);
    } else {
      const nextYearStart = getHijriYearStart(selectedYear + 1, rangeStart);
      rangeEnd = new Date(nextYearStart);
      rangeEnd.setDate(rangeEnd.getDate() - 1);
    }

    const days = [] as {
      date: Date;
      hijriDay: number;
      hijriMonth: number;
      requiredProgress: number | null;
      optionalProgress: number | null;
    }[];

    for (
      let current = new Date(rangeStart);
      current <= rangeEnd;
      current.setDate(current.getDate() + 1)
    ) {
      const { day: hijriDay, month: hijriMonth } = getHijriParts(current);
      const habitsForDay = getHabitsForDate(current);
      let requiredProgressValue: number | null = null;
      let optionalProgressValue: number | null = null;

      if (habitsForDay) {
        const completed = mainHabits.filter(
          (habit) => habitsForDay[habit]
        ).length;
        requiredProgressValue = Math.round(
          (completed / mainHabits.length) * 100
        );

        if (optionalHabits.length > 0) {
          const optionalCompleted = optionalHabits.filter(
            (habit) => habitsForDay[habit]
          ).length;
          optionalProgressValue = Math.round(
            (optionalCompleted / optionalHabits.length) * 100
          );
        }
      }

      days.push({
        date: new Date(current),
        hijriDay,
        hijriMonth,
        requiredProgress: requiredProgressValue,
        optionalProgress: optionalProgressValue,
      });
    }

    return {
      startWeekday: rangeStart.getDay(),
      days,
    };
  }, [
    getHabitsForDate,
    hijriYearData.monthStarts,
    optionalHabits,
    mainHabits,
    selectedMonth,
    selectedMonthStart,
    selectedYear,
  ]);

  const hijriMonthLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(hijriLocale, {
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(selectedMonthStart);
  }, [hijriLocale, selectedMonthStart]);

  const selectedMonthNumber = useMemo(
    () => getHijriParts(selectedMonthStart).month,
    [selectedMonthStart]
  );

  const isSameLocalDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const specialDayLabel = (hijriMonth: number, hijriDay: number) => {
    if (hijriMonth === 12 && hijriDay === 9) {
      return 'Day of Arafah';
    }
    if (hijriMonth === 12 && hijriDay === 10) {
      return 'Eid al-Adha';
    }
    if (hijriMonth === 10 && hijriDay === 1) {
      return 'Eid al-Fitr';
    }
    if (hijriMonth === 1 && hijriDay === 10) {
      return 'Day of Ashura';
    }

    return null;
  };

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900/70">
      <div className="mb-5 flex justify-center">
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className="rounded-full border border-emerald-200 bg-white px-5 py-2 text-lg font-semibold text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-emerald-500/40 dark:bg-slate-900/70 dark:text-emerald-100"
            aria-expanded={pickerOpen}
          >
            <span className="inline-flex items-center gap-2">
              {hijriMonthLabel}
              <Calendar className="h-4 w-4 text-emerald-600/80 dark:text-emerald-200/80" />
            </span>
          </button>
          {pickerOpen && (
            <div className="absolute left-1/2 z-10 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedYear((year) => Math.max(minYear, year - 1))
                  }
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                    selectedYear === minYear
                      ? 'cursor-not-allowed border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600'
                      : 'border-emerald-100 text-emerald-700 hover:border-emerald-300 dark:border-slate-700 dark:text-emerald-200'
                  }`}
                  aria-label="Previous hijri year"
                  disabled={selectedYear === minYear}
                >
                  &#8592;
                </button>
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedYear((year) => year + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-100 text-emerald-700 transition hover:border-emerald-300 dark:border-slate-700 dark:text-emerald-200"
                  aria-label="Next hijri year"
                >
                  &#8594;
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {hijriYearData.monthLabels.map((label, index) => (
                  <button
                    key={`${selectedYear}-${label}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(index);
                      setPickerOpen(false);
                    }}
                    className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                      index === selectedMonth
                        ? 'bg-emerald-600 text-white'
                        : 'border border-emerald-100 text-emerald-700 hover:border-emerald-300 dark:border-slate-700 dark:text-emerald-200'
                    }`}
                  >
                    {label || `M${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mb-3 hidden grid-cols-7 gap-2 text-center text-xs text-slate-500 sm:grid dark:text-slate-400">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 sm:grid-cols-7 sm:gap-3">
        {Array.from({ length: monthlyHijriData.startWeekday }).map(
          (_, index) => (
            <div
              key={`spacer-${index}`}
              className="aspect-square rounded-md bg-transparent"
            />
          )
        )}
        {monthlyHijriData.days.map((day) => {
          const requiredWidth = day.requiredProgress ?? 0;
          const optionalWidth = day.optionalProgress ?? 0;
          const isToday = isSameLocalDate(day.date, today);
          const isWhiteDay =
            day.hijriMonth !== 9 &&
            (day.hijriDay === 13 || day.hijriDay === 14 || day.hijriDay === 15);
          const specialLabel = specialDayLabel(day.hijriMonth, day.hijriDay);
          const isDhulHijjahFirstTen =
            day.hijriMonth === 12 && day.hijriDay >= 1 && day.hijriDay <= 10;
          const isRamadanLastTen = day.hijriMonth === 9 && day.hijriDay >= 21;
          const dhulHijjahDayCount = isDhulHijjahFirstTen ? day.hijriDay : null;
          const ramadanDayCount = isRamadanLastTen ? day.hijriDay - 20 : null;

          return (
            <div
              key={day.date.toISOString()}
              title={
                specialLabel
                  ? `Hijri day ${day.hijriDay} - ${specialLabel}`
                  : `Hijri day ${day.hijriDay}`
              }
              className={`flex aspect-square flex-col justify-between rounded-md border p-1.5 text-[11px] font-semibold shadow-sm sm:p-2.5 sm:text-xs ${
                isToday
                  ? 'border-transparent bg-emerald-100 text-emerald-900 ring-2 ring-emerald-300/60 dark:border-transparent dark:bg-emerald-900/40 dark:text-emerald-100 dark:ring-emerald-400/40'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[12px] font-semibold sm:text-base ${
                    isToday
                      ? 'text-emerald-900 dark:text-emerald-100'
                      : 'text-slate-700 dark:text-slate-100'
                  }`}
                >
                  {day.hijriDay}
                </span>
                <div className="flex items-center gap-1">
                  {isDhulHijjahFirstTen && (
                    <span className="flex h-3 w-4 items-center justify-center rounded-full bg-indigo-500/90 text-[7px] font-bold uppercase tracking-wide text-white shadow-sm sm:h-4 sm:w-6 sm:text-[9px] dark:bg-indigo-400">
                      {dhulHijjahDayCount}
                    </span>
                  )}
                  {isRamadanLastTen && (
                    <span className="flex h-3 w-4 items-center justify-center rounded-full bg-sky-500/90 text-[7px] font-bold uppercase tracking-wide text-white shadow-sm sm:h-4 sm:w-6 sm:text-[9px] dark:bg-sky-400">
                      {ramadanDayCount}
                    </span>
                  )}
                  {isWhiteDay && (
                    <span className="flex h-3 w-4 items-center justify-center rounded-full bg-amber-500/90 text-[8px] font-bold text-white shadow-sm sm:h-4 sm:w-6 sm:text-[10px] dark:bg-amber-400">
                      Wh
                    </span>
                  )}
                  {specialLabel && (
                    <Heart
                      className="h-2.5 w-2.5 fill-rose-500 text-rose-500 sm:h-3.5 sm:w-3.5 dark:fill-rose-400 dark:text-rose-400"
                      aria-label={specialLabel}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 sm:h-1.5 dark:bg-slate-800">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 sm:h-1.5"
                    style={{ width: `${requiredWidth}%` }}
                  />
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 sm:h-1.5 dark:bg-slate-800">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400/90 sm:h-1.5"
                    style={{ width: `${optionalWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <span>Main habits</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-gradient-to-r from-amber-400 to-rose-400/90" />
          <span>Taqarrub habits</span>
        </div>
        {selectedMonthNumber !== 9 && (
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-6 items-center justify-center rounded-full bg-amber-500/90 text-[10px] font-bold text-white shadow-sm dark:bg-amber-400">
              Wh
            </span>
            <span>13th-15th (White Days for fasting)</span>
          </div>
        )}
        {selectedMonthNumber === 12 && (
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-8 items-center justify-center rounded-full bg-indigo-500/90 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-indigo-400">
              1-10
            </span>
            <span>First 10 days of Dhu al-Hijjah: The best days of the year</span>
          </div>
        )}
        {selectedMonthNumber === 9 && (
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-8 items-center justify-center rounded-full bg-sky-500/90 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-sky-400">
              1-10
            </span>
            <span>Last 10 days of Ramadan: The time to seek Laylat al-Qadr</span>
          </div>
        )}
        {selectedMonthNumber === 1 && (
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400" />
            <span>Day of Ashura: 10th of Muharram</span>
          </div>
        )}
        {selectedMonthNumber === 10 && (
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400" />
            <span>Eid al-Fitr: 1st of Shawwal (after Ramadan)</span>
          </div>
        )}
        {selectedMonthNumber === 12 && (
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400" />
            <span>Day of Arafah: 9th of Dhu al-Hijjah</span>
          </div>
        )}
        {selectedMonthNumber === 12 && (
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400" />
            <span>Eid al-Adha: 10th of Dhu al-Hijjah</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HijriMonthlyCalendar;
