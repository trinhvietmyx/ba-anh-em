import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotContains,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { UnprocessableEntityException } from '@nestjs/common';

export const DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$';
export const TIME_PATTERN = '^([01]\\d|2[0-3]):[0-5]\\d$';
export const MAX_BOOKING_GUESTS = 10;
export const PHONE_PATTERN = '^\\+?[0-9 ().-]+$';
const datePattern = new RegExp(DATE_PATTERN);
const timePattern = new RegExp(TIME_PATTERN);

export function bookingDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !datePattern.test(value) ||
    value.startsWith('0000') ||
    !Number.isFinite(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new UnprocessableEntityException();
  }
  return value;
}

export function availabilityQuery(query: Record<string, unknown>) {
  const { date, guests, time } = query;
  if (
    Object.keys(query).some(
      (key) => !['date', 'guests', 'time'].includes(key),
    ) ||
    typeof date !== 'string' ||
    typeof guests !== 'string' ||
    !/^\d{1,2}$/.test(guests) ||
    (time !== undefined &&
      (typeof time !== 'string' || !timePattern.test(time)))
  )
    throw new UnprocessableEntityException();
  const count = Number(guests);
  if (count < 1 || count > MAX_BOOKING_GUESTS)
    throw new UnprocessableEntityException();
  return { date: bookingDate(date), guests: count, time };
}

class ContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @NotContains('\0')
  name!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(24)
  @Matches(new RegExp(PHONE_PATTERN))
  phone!: string;
}

export class CreateReservationDto {
  @IsString()
  @Matches(datePattern)
  date!: string;

  @IsString()
  @Matches(timePattern)
  time!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_BOOKING_GUESTS)
  guests!: number;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactDto)
  contact!: ContactDto;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(200)
  @NotContains('\0')
  note?: string;
}
