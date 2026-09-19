import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ExperienceLevel } from '@prisma/client';

export class GenerateIdeaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  domain: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];

  @IsOptional()
  @IsString()
  techInterest?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  difficulty?: ExperienceLevel;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;

  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}
