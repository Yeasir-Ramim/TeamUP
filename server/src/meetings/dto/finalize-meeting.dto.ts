import { IsOptional, IsUUID } from 'class-validator';

export class FinalizeMeetingDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'slotId must be a valid UUID' })
  slotId?: string;
}
