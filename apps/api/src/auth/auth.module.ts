import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OTP_SENDER } from './auth.tokens';
import { MockOtpSender } from './mock-otp.sender';
import { TwilioOtpSender } from './twilio-otp.sender';
import { Fast2SmsOtpSender } from './fast2sms-otp.sender';
import { Msg91OtpSender } from './msg91-otp.sender';
import type { OtpSender } from './otp-sender.interface';
import { UsersModule } from '@/users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production';
        return {
          secret,
          signOptions: { expiresIn: 30 * 24 * 60 * 60 }, // 30 days in seconds
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: OTP_SENDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): OtpSender => {
        const provider = config.get<string>('OTP_PROVIDER', 'mock');
        if (provider === 'msg91') {
          const authKey = config.getOrThrow<string>('MSG91_AUTH_KEY');
          const defaultCountryCode = config.get<string>('OTP_DEFAULT_COUNTRY_CODE', '91');
          const sender = config.get<string>('MSG91_SENDER');
          return new Msg91OtpSender({ authKey, defaultCountryCode, sender });
        }
        if (provider === 'fast2sms') {
          const apiKey = config.getOrThrow<string>('FAST2SMS_API_KEY');
          const defaultCountryCode = config.get<string>('OTP_DEFAULT_COUNTRY_CODE', '91');
          return new Fast2SmsOtpSender({ apiKey, defaultCountryCode });
        }
        if (provider === 'twilio') {
          const accountSid = config.getOrThrow<string>('TWILIO_ACCOUNT_SID');
          const authToken = config.getOrThrow<string>('TWILIO_AUTH_TOKEN');
          const fromNumber = config.getOrThrow<string>('TWILIO_PHONE_NUMBER');
          const defaultCountryCode = config.get<string>('OTP_DEFAULT_COUNTRY_CODE', '91');
          return new TwilioOtpSender({
            accountSid,
            authToken,
            fromNumber,
            defaultCountryCode,
          });
        }
        return new MockOtpSender();
      },
    },
  ],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
