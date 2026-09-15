import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(ExponentPushToken\[.+\]|[a-zA-Z0-9_-]+)$/, {
    message: 'token must be a valid Expo push token format',
  })
  token: string;

  @IsOptional()
  @IsString()
  device?: string;
}

export class UnregisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
