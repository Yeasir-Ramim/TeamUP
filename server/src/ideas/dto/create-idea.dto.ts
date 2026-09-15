import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateIdeaDto {
  @IsNotEmpty({ message: 'Idea title is required' })
  @IsString({ message: 'Idea title must be a string' })
  @MinLength(3, { message: 'Idea title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Idea title cannot exceed 100 characters' })
  title: string;

  @IsNotEmpty({ message: 'Idea description is required' })
  @IsString({ message: 'Idea description must be a string' })
  @MinLength(10, {
    message: 'Idea description must be at least 10 characters long',
  })
  @MaxLength(3000, {
    message: 'Idea description cannot exceed 3000 characters',
  })
  description: string;

  @IsNotEmpty({ message: 'Idea domain is required' })
  @IsString({ message: 'Idea domain must be a string' })
  @MinLength(2, { message: 'Idea domain must be at least 2 characters long' })
  @MaxLength(50, { message: 'Idea domain cannot exceed 50 characters' })
  domain: string;

  @IsOptional()
  @IsArray({ message: 'suggestedStack must be an array of strings' })
  @IsString({
    each: true,
    message: 'Each technology stack item must be a string',
  })
  suggestedStack?: string[];
}
