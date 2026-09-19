import { IsOptional, IsString, Matches } from 'class-validator';

export class RegisterPushTokenDto {
  @IsOptional()
  @IsString()
  @Matches(/^(ExponentPushToken\[.+\]|[a-zA-Z0-9_-]+)$/, {
    message: 'token must be a valid Expo push token format',
  })
  token?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(ExponentPushToken\[.+\]|[a-zA-Z0-9_-]+)$/, {
    message: 'pushToken must be a valid Expo push token format',
  })
  pushToken?: string;

  @IsOptional()
  @IsString()
  device?: string;
}

export class UnregisterPushTokenDto {
  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  pushToken?: string;
}
