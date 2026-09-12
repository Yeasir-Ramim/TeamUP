import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BookmarkType } from '@prisma/client';

export class CreateBookmarkDto {
  @IsEnum(BookmarkType)
  targetType: BookmarkType;

  @IsString()
  @IsNotEmpty()
  targetId: string;
}

export class BookmarkFilterDto {
  @IsOptional()
  @IsEnum(BookmarkType)
  type?: BookmarkType;
}
