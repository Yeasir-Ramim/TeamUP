import { IsNotEmpty, IsString } from 'class-validator';

export class LinkGithubDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
