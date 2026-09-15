import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EventType } from '@prisma/client';

export class CalendarFeedQueryDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'startDate must be a valid ISO 8601 date string' },
  )
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  endDate?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'projectId must be a valid UUID' })
  projectId?: string;

  @IsOptional()
  @IsEnum(EventType, {
    message: 'eventType must be one of MEETING, DEADLINE, MILESTONE',
  })
  eventType?: EventType;
}
