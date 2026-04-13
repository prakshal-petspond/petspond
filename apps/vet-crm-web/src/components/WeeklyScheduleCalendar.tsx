'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { VetWeeklyAvailabilityBlock } from '@petspond/types';

/** Grid range (half-hour cells). Wider than default booking slots so doctors can narrow availability. */
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 21;
const SLOT_MINUTES = 30;
const DAY_START_MINUTE = DAY_START_HOUR * 60;
const DAY_END_MINUTE = DAY_END_HOUR * 60;
const NUM_ROWS = (DAY_END_MINUTE - DAY_START_MINUTE) / SLOT_MINUTES;

/** Column order Mon → Sun; values are `Date.getDay()` (0 = Sun … 6 = Sat). */
const COL_DOW = [1, 2, 3, 4, 5, 6, 0] as const;
const COL_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WEEKDAY_DOW = new Set<number>([1, 2, 3, 4, 5]);
const WEEKEND_DOW = new Set<number>([0, 6]);
const ALL_DOW = new Set<number>([0, 1, 2, 3, 4, 5, 6]);

function blocksToGrid(blocks: VetWeeklyAvailabilityBlock[]): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  for (const dow of COL_DOW) {
    map.set(dow, new Set());
  }
  for (const b of blocks) {
    if (b.dayOfWeek < 0 || b.dayOfWeek > 6) continue;
    const set = map.get(b.dayOfWeek) ?? new Set();
    for (let i = 0; i < NUM_ROWS; i++) {
      const sm = DAY_START_MINUTE + i * SLOT_MINUTES;
      if (sm >= b.startMinute && sm + SLOT_MINUTES <= b.endMinute) {
        set.add(i);
      }
    }
    map.set(b.dayOfWeek, set);
  }
  return map;
}

export function gridToWeeklyBlocks(grid: Map<number, Set<number>>): VetWeeklyAvailabilityBlock[] {
  const out: VetWeeklyAvailabilityBlock[] = [];
  for (const dow of COL_DOW) {
    const set = grid.get(dow);
    if (!set?.size) continue;
    const sorted = [...set].sort((a, b) => a - b);
    let runStart = sorted[0]!;
    let prev = sorted[0]!;
    for (let k = 1; k < sorted.length; k++) {
      const cur = sorted[k]!;
      if (cur !== prev + 1) {
        out.push({
          dayOfWeek: dow,
          startMinute: DAY_START_MINUTE + runStart * SLOT_MINUTES,
          endMinute: DAY_START_MINUTE + (prev + 1) * SLOT_MINUTES,
        });
        runStart = cur;
      }
      prev = cur;
    }
    out.push({
      dayOfWeek: dow,
      startMinute: DAY_START_MINUTE + runStart * SLOT_MINUTES,
      endMinute: DAY_START_MINUTE + (prev + 1) * SLOT_MINUTES,
    });
  }
  return out;
}

function cloneGrid(g: Map<number, Set<number>>): Map<number, Set<number>> {
  const m = new Map<number, Set<number>>();
  for (const d of COL_DOW) {
    m.set(d, new Set(g.get(d) ?? []));
  }
  return m;
}

function formatRowLabel(rowIndex: number): string {
  const m = DAY_START_MINUTE + rowIndex * SLOT_MINUTES;
  const d = new Date(2000, 0, 1, Math.floor(m / 60), m % 60, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatMinuteLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const mm = minute % 60;
  const d = new Date(2000, 0, 1, h, mm, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Half-hour tick indices covered by [startMinute, endMinuteExclusive) within grid. */
function rowRangeForInterval(startMinute: number, endMinuteExclusive: number): number[] {
  const rows: number[] = [];
  for (let i = 0; i < NUM_ROWS; i++) {
    const sm = DAY_START_MINUTE + i * SLOT_MINUTES;
    if (sm >= startMinute && sm + SLOT_MINUTES <= endMinuteExclusive) {
      rows.push(i);
    }
  }
  return rows;
}

/** Slot start times (first half-hour starts at DAY_START_HOUR). */
const START_TIME_OPTIONS: { minute: number; label: string }[] = (() => {
  const out: { minute: number; label: string }[] = [];
  for (let m = DAY_START_MINUTE; m <= DAY_END_MINUTE - SLOT_MINUTES; m += SLOT_MINUTES) {
    out.push({ minute: m, label: formatMinuteLabel(m) });
  }
  return out;
})();

/** Exclusive end boundaries (e.g. 5:00 PM = 17:00 means last bookable slot starts 16:30). */
const END_TIME_OPTIONS: { minute: number; label: string }[] = (() => {
  const out: { minute: number; label: string }[] = [];
  for (let m = DAY_START_MINUTE + SLOT_MINUTES; m <= DAY_END_MINUTE; m += SLOT_MINUTES) {
    out.push({ minute: m, label: formatMinuteLabel(m) });
  }
  return out;
})();

type Props = {
  blocks: VetWeeklyAvailabilityBlock[];
  onChange?: (blocks: VetWeeklyAvailabilityBlock[]) => void;
  readOnly?: boolean;
};

export function WeeklyScheduleCalendar({ blocks, onChange, readOnly }: Props) {
  const grid = useMemo(() => blocksToGrid(blocks), [blocks]);
  const formId = useId();

  const [recurringDays, setRecurringDays] = useState<Set<number>>(() => new Set(WEEKDAY_DOW));
  const [recurStart, setRecurStart] = useState(9 * 60);
  const [recurEnd, setRecurEnd] = useState(17 * 60);

  const dragRef = useRef<{
    working: Map<number, Set<number>>;
    mode: 'add' | 'remove';
  } | null>(null);

  const flushDrag = useCallback(() => {
    const s = dragRef.current;
    dragRef.current = null;
    if (s && onChange) {
      onChange(gridToWeeklyBlocks(s.working));
    }
  }, [onChange]);

  useEffect(() => {
    return () => {
      dragRef.current = null;
    };
  }, []);

  const paintCellInDrag = useCallback((dow: number, row: number) => {
    const s = dragRef.current;
    if (!s || dow < 0 || dow > 6 || row < 0 || row >= NUM_ROWS) return;
    const set = s.working.get(dow);
    if (!set) return;
    if (s.mode === 'add') set.add(row);
    else set.delete(row);
  }, []);

  const onPointerDownCell = useCallback(
    (dow: number, row: number, e: React.PointerEvent) => {
      if (readOnly || !onChange || e.button !== 0) return;
      e.preventDefault();
      const working = cloneGrid(blocksToGrid(blocks));
      const set = working.get(dow)!;
      const wasOn = set.has(row);
      const mode: 'add' | 'remove' = wasOn ? 'remove' : 'add';
      if (mode === 'add') set.add(row);
      else set.delete(row);
      dragRef.current = { working, mode };

      const move = (ev: PointerEvent) => {
        if (!dragRef.current || (ev.buttons & 1) === 0) return;
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        if (!el) return;
        const cell = el.closest('[data-slot-dow]');
        if (!cell) return;
        const d = Number(cell.getAttribute('data-slot-dow'));
        const r = Number(cell.getAttribute('data-slot-row'));
        if (!Number.isFinite(d) || !Number.isFinite(r)) return;
        paintCellInDrag(d, r);
      };

      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        flushDrag();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },
    [blocks, readOnly, onChange, flushDrag, paintCellInDrag],
  );

  const onPointerEnterCell = useCallback(
    (dow: number, row: number) => {
      paintCellInDrag(dow, row);
    },
    [paintCellInDrag],
  );

  const toggleRecurringDay = (dow: number) => {
    setRecurringDays((prev) => {
      const next = new Set(prev);
      if (next.has(dow)) next.delete(dow);
      else next.add(dow);
      return next;
    });
  };

  const applyRecurring = useCallback(
    (mode: 'replace' | 'merge') => {
      if (readOnly || !onChange || recurringDays.size === 0) return;
      if (recurEnd <= recurStart) return;
      const base = cloneGrid(blocksToGrid(blocks));
      const rows = rowRangeForInterval(recurStart, recurEnd);
      if (rows.length === 0) return;

      for (const dow of recurringDays) {
        const set = base.get(dow);
        if (!set) continue;
        if (mode === 'replace') set.clear();
        for (const r of rows) set.add(r);
      }
      onChange(gridToWeeklyBlocks(base));
    },
    [blocks, onChange, readOnly, recurringDays, recurStart, recurEnd],
  );

  const applyPreset = useCallback(
    (days: Set<number>, startM: number, endM: number, replace: boolean) => {
      if (readOnly || !onChange) return;
      if (endM <= startM) return;
      const base = cloneGrid(blocksToGrid(blocks));
      const rows = rowRangeForInterval(startM, endM);
      if (rows.length === 0) return;
      for (const dow of days) {
        const set = base.get(dow);
        if (!set) continue;
        if (replace) set.clear();
        for (const r of rows) set.add(r);
      }
      onChange(gridToWeeklyBlocks(base));
    },
    [blocks, onChange, readOnly],
  );

  const dowForColIndex = (colIdx: number) => COL_DOW[colIdx]!;

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
      <div className="p-4 border-b border-border bg-muted/20 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Weekly hours (recurring every week)</p>
          <p className="text-xs text-muted mt-1">
            Drag across cells to paint availability, or set a time range once and apply it to several weekdays (like a
            recurring calendar block). Pet parents only see bookable slots inside these windows. Leave everything empty
            to keep all default slots.
          </p>
        </div>

        {!readOnly && onChange && (
          <div className="rounded-lg border border-border bg-background p-4 space-y-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Recurring timetable</p>
            <p className="text-xs text-muted">
              Choose days and a time band once — no need to click each cell. &quot;Replace&quot; clears prior hours on
              those days, then applies this band. &quot;Add&quot; keeps existing slots and adds these.
            </p>

            <div className="flex flex-wrap gap-4 items-end">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted">From</span>
                <select
                  form={formId}
                  className="border border-border rounded-lg px-2 py-2 bg-background text-foreground text-sm min-w-[8rem]"
                  value={recurStart}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setRecurStart(v);
                    setRecurEnd((end) => (end <= v + SLOT_MINUTES ? v + SLOT_MINUTES : end));
                  }}
                >
                  {START_TIME_OPTIONS.filter((o) => o.minute + SLOT_MINUTES <= recurEnd).map((o) => (
                    <option key={o.minute} value={o.minute}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted">Until (end of last slot)</span>
                <select
                  form={formId}
                  className="border border-border rounded-lg px-2 py-2 bg-background text-foreground text-sm min-w-[8rem]"
                  value={recurEnd}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setRecurEnd(v);
                    setRecurStart((s) => (s >= v - SLOT_MINUTES ? v - SLOT_MINUTES : s));
                  }}
                >
                  {END_TIME_OPTIONS.filter((o) => o.minute > recurStart).map((o) => (
                    <option key={o.minute} value={o.minute}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {COL_LABELS.map((label, i) => {
                const dow = dowForColIndex(i);
                const on = recurringDays.has(dow);
                return (
                  <button
                    key={dow}
                    type="button"
                    onClick={() => toggleRecurringDay(dow)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      on
                        ? 'border-primary bg-primary-muted text-primary'
                        : 'border-border text-muted hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyRecurring('replace')}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Set checked days to this hours
              </button>
              <button
                type="button"
                onClick={() => applyRecurring('merge')}
                className="px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50"
              >
                Add this hours on checked days
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <span className="text-xs text-muted w-full sm:w-auto sm:mr-2 py-1">Presets</span>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted/40"
                onClick={() => {
                  setRecurringDays(new Set(WEEKDAY_DOW));
                  setRecurStart(9 * 60);
                  setRecurEnd(17 * 60);
                  applyPreset(WEEKDAY_DOW, 9 * 60, 17 * 60, true);
                }}
              >
                Mon–Fri 9–5
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted/40"
                onClick={() => {
                  setRecurringDays(new Set(WEEKEND_DOW));
                  setRecurStart(10 * 60);
                  setRecurEnd(16 * 60);
                  applyPreset(WEEKEND_DOW, 10 * 60, 16 * 60, true);
                }}
              >
                Sat–Sun 10–4
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted/40"
                onClick={() => {
                  setRecurringDays(new Set(ALL_DOW));
                  setRecurStart(9 * 60);
                  setRecurEnd(18 * 60);
                  applyPreset(ALL_DOW, 9 * 60, 18 * 60, true);
                }}
              >
                Every day 9–6
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-border text-xs font-medium text-error hover:bg-error/10"
                onClick={() => {
                  if (!onChange) return;
                  const empty = new Map<number, Set<number>>();
                  for (const d of COL_DOW) empty.set(d, new Set());
                  onChange([]);
                }}
              >
                Clear whole week
              </button>
            </div>
          </div>
        )}
      </div>

      <form id={formId} className="inline-block min-w-full" onSubmit={(e) => e.preventDefault()}>
        <div
          role="grid"
          aria-label="Weekly availability"
          className="inline-grid min-w-[720px] gap-px bg-border p-px touch-none select-none"
          style={{
            gridTemplateColumns: `5.5rem repeat(${COL_DOW.length}, minmax(0, 1fr))`,
            gridTemplateRows: `auto repeat(${NUM_ROWS}, minmax(1.75rem, auto))`,
          }}
        >
          <div className="bg-card" />
          {COL_LABELS.map((label) => (
            <div
              key={label}
              className="bg-muted/30 text-center text-xs font-semibold text-foreground py-2 px-1 border-b border-border"
            >
              {label}
            </div>
          ))}
          {Array.from({ length: NUM_ROWS }, (_, row) => (
            <React.Fragment key={row}>
              <div className="bg-muted/10 text-[10px] sm:text-xs text-muted text-right pr-2 py-0.5 flex items-center justify-end border-r border-border/60">
                {formatRowLabel(row)}
              </div>
              {COL_DOW.map((dow) => {
                const on = grid.get(dow)?.has(row);
                return (
                  <div
                    key={`${dow}-${row}`}
                    role="gridcell"
                    data-slot-dow={dow}
                    data-slot-row={row}
                    tabIndex={readOnly ? -1 : 0}
                    onPointerDown={(e) => onPointerDownCell(dow, row, e)}
                    onPointerEnter={() => onPointerEnterCell(dow, row)}
                    onKeyDown={(e) => {
                      if (readOnly || !onChange) return;
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        const next = cloneGrid(blocksToGrid(blocks));
                        const set = next.get(dow)!;
                        if (set.has(row)) set.delete(row);
                        else set.add(row);
                        onChange(gridToWeeklyBlocks(next));
                      }
                    }}
                    className={`min-h-[1.75rem] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                      on
                        ? 'bg-primary text-primary-foreground'
                        : readOnly
                          ? 'bg-background'
                          : 'bg-background hover:bg-primary/15 cursor-crosshair'
                    } ${readOnly ? 'cursor-default' : ''}`}
                    aria-selected={on}
                    aria-label={`${COL_LABELS[COL_DOW.indexOf(dow as (typeof COL_DOW)[number])]} ${formatRowLabel(row)} ${on ? 'available' : 'off'}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </form>
    </div>
  );
}
