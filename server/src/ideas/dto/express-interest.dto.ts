import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ExpressInterestDto {
  @IsOptional()
  @IsString({ message: 'message must be a string' })
  @MaxLength(500, { message: 'message cannot exceed 500 characters' })
  message?: string;
}
