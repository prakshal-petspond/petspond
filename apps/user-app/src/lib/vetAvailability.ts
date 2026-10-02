import type { VetWeeklyAvailabilityBlock } from '@petspond/types';
import { TIME_SLOT_DEFS } from '@/lib/bookingTime';

const SLOT_MINUTES = 30;
type SlotList = typeof TIME_SLOT_DEFS;

function slotStartMinutes(slot: { hour: number; minute: number }): number {
  return slot.hour * 60 + slot.minute;
}

function slotAllowedByBlocks(
  slotStartMin: number,
  blocks: VetWeeklyAvailabilityBlock[],
  dayOfWeek: number,
): boolean {
  const dayBlocks = blocks.filter((b) => b.dayOfWeek === dayOfWeek);
  if (!dayBlocks.length) return false;
  return dayBlocks.some(
    (b) => slotStartMin >= b.startMinute && slotStartMin + SLOT_MINUTES <= b.endMinute,
  );
}

/** Bookable slots for one doctor on a calendar day. Empty availability = all standard slots. */
export function slotsForDoctorOnDate(
  date: Date,
  weeklyAvailability: VetWeeklyAvailabilityBlock[] | undefined,
  allSlots: SlotList = TIME_SLOT_DEFS,
): SlotList {
  if (!weeklyAvailability?.length) return allSlots;
  const dow = date.getDay();
  return allSlots.filter((s) => slotAllowedByBlocks(slotStartMinutes(s), weeklyAvailability, dow));
}
