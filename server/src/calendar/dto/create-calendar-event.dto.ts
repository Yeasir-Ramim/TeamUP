import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EventType } from '@prisma/client';

export class CreateCalendarEventDto {
  @IsNotEmpty({ message: 'Event title is required' })
  @IsString({ message: 'Event title must be a string' })
  @MinLength(3, { message: 'Event title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Event title cannot exceed 100 characters' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Event description must be a string' })
  @MaxLength(1000, {
    message: 'Event description cannot exceed 1000 characters',
  })
  description?: string;

  @IsOptional()
  @IsEnum(EventType, {
    message: 'eventType must be one of MEETING, DEADLINE, MILESTONE',
  })
  eventType?: EventType;

  @IsNotEmpty({ message: 'Event startDate is required' })
  @IsDateString(
    {},
    { message: 'startDate must be a valid ISO 8601 date string' },
  )
  startDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  endDate?: string;
}
