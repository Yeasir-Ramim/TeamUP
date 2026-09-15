import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class VoteSlotsDto {
  @IsOptional()
  @IsArray({ message: 'slotIds must be an array of slot UUIDs' })
  @IsUUID(undefined, {
    each: true,
    message: 'Each slotId in slotIds must be a valid UUID',
  })
  slotIds?: string[];

  @IsOptional()
  @IsUUID(undefined, { message: 'slotId must be a valid UUID' })
  slotId?: string;
}
