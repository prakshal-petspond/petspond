import { Type } from 'class-transformer';
import { IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';

export class WeeklyAvailabilityBlockDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute!: number;

  @IsInt()
  @Min(1)
  @Max(1440)
  endMinute!: number;
}

export class UpdateWeeklyScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyAvailabilityBlockDto)
  weeklyAvailability!: WeeklyAvailabilityBlockDto[];
}
