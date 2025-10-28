import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Length } from 'class-validator';

// ===== REGISTER =====
export class RegisterRequest {
  @ApiProperty({ example: 'dang123', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @ApiProperty({ example: 'Hải Đăng', description: 'Tên người dùng' })
  @IsString()
  @IsNotEmpty({ message: 'Tên người dùng không được để trống' })
  realname: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu đăng ký' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
  
  @ApiProperty({ example: 'phamhaidang28092006@gmail.com', description: 'Email đăng ký' })
  @IsEmail()
  email: string;
}

export class RegisterResponse {
  @ApiProperty({ example: true })
  success: boolean;
}

// ===== LOGIN =====
export class LoginRequest {
  @ApiProperty({ example: 'dang123', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu đăng nhập' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}

export class LoginResponse {
  @ApiProperty({
    example: 'c2FtcGxlVXNlcg==',
    description: 'sessionId trả về từ bước LoginStep1 (Base64 hoặc UUID)',
  })
  sessionId: string;
}

// ===== REFRESH TOKEN =====
export class RefreshRequest {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
    description: 'Refresh Token hợp lệ'
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refreshToken: string;
}

export class RefreshResponse {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5c...',
    description: 'Access Token mới'
  })
  access_token: string;
}

// ===== VERIFY OTP =====
export class VerifyOtpRequestDto {
  @ApiProperty({
    example: 'c2FtcGxlVXNlcg==',
    description: 'Mã sessionId trả về từ bước LoginStep1',
  })
  @IsString()
  @IsNotEmpty({ message: 'sessionId không được để trống' })
  sessionId: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP gồm 6 chữ số gửi đến email',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP phải gồm đúng 6 ký tự số' })
  otp: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
    description: 'Access Token cấp sau khi OTP hợp lệ'
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
    description: 'Refresh Token dài hạn'
  })
  refresh_token: string;
}
