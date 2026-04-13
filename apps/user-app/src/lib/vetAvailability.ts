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

/** Bookable slots for one doctor on a calendar day. Empty availability = use all standard slots. */
export function slotsForDoctorOnDate(
  date: Date,
  weeklyAvailability: VetWeeklyAvailabilityBlock[] | undefined,
  allSlots: SlotList,
): SlotList {
  if (!weeklyAvailability?.length) return allSlots;
  const dow = date.getDay();
  return allSlots.filter((s) => slotAllowedByBlocks(slotStartMinutes(s), weeklyAvailability, dow));
}

/** Vaccination flow: slot OK if any doctor at the clinic could take it (union). */
export function slotsUnionForClinicDoctorsOnDate(
  date: Date,
  doctors: { weeklyAvailability?: VetWeeklyAvailabilityBlock[] }[],
  allSlots: SlotList,
): SlotList {
  if (!doctors.length) return allSlots;
  const hasAnyCustom = doctors.some((d) => d.weeklyAvailability?.length);
  if (!hasAnyCustom) return allSlots;
  const dow = date.getDay();
  return allSlots.filter((s) => {
    const sm = slotStartMinutes(s);
    return doctors.some(
      (d) =>
        !d.weeklyAvailability?.length || slotAllowedByBlocks(sm, d.weeklyAvailability, dow),
    );
  });
}
