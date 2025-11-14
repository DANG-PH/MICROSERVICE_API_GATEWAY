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
  
  @ApiProperty({
    example: '1',
    description: 'Auth ID trả về để người dùng truy cập được API bên user'
  })
  auth_id: number;
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
    example: 'ZGFuZzEyMw==',
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

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5c...',
    description: 'Refresh Token mới'
  })
  refresh_token: string;
}

// ===== VERIFY OTP =====
export class VerifyOtpRequestDto {
  @ApiProperty({
    example: 'ZGFuZzEyMw==',
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

  @ApiProperty({
    example: '1',
    description: 'Auth ID trả về để người dùng truy cập được API bên user'
  })
  auth_id: number;
}

// ===== USER METHODS =====

// Change Password
export class ChangePasswordRequestDto {
  // @ApiProperty({ example: 'c2FtcGxlVXNlcg==', description: 'SessionId của user (Base64)' })
  // @IsString()
  // @IsNotEmpty()
  // sessionId: string;

  @ApiProperty({ example: 'oldPass123', description: 'Mật khẩu cũ' })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty({ example: 'newPass456', description: 'Mật khẩu mới' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

// Reset Password (quên mật khẩu)
export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'dang123', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '123456', description: 'OTP gửi về email' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ example: 'newPass456', description: 'Mật khẩu mới' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

// Change Email
export class ChangeEmailRequestDto {
  // @ApiProperty({ example: 'c2FtcGxlVXNlcg==', description: 'SessionId của user (Base64)' })
  // @IsString()
  // @IsNotEmpty()
  // sessionId: string;

  @ApiProperty({ example: 'newemail@gmail.com', description: 'Email mới' })
  @IsEmail()
  newEmail: string;
}

export class ChangeEmailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

// ===== ADMIN METHODS =====

// Change Role
export class ChangeRoleRequestDto {
  @ApiProperty({ example: 'dang123', description: 'Tên user cần thay đổi role' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'ADMIN', description: 'Role mới' })
  @IsString()
  @IsNotEmpty()
  newRole: string;
}

export class ChangeRoleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

// Ban User
export class BanUserRequestDto {
  @ApiProperty({ example: 'dang123', description: 'Tên user cần ban' })
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class BanUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

// Unban User
export class UnbanUserRequestDto {
  @ApiProperty({ example: 'dang123', description: 'Tên user cần unban' })
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class UnbanUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

// ===== REQUEST RESET PASSWORD OTP =====
export class RequestResetPasswordRequestDto {
  @ApiProperty({ example: 'dang123', description: 'Tên đăng nhập cần reset password' })
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;
}

export class RequestResetPasswordResponseDto {
  @ApiProperty({ example: true, description: 'Trạng thái gửi OTP thành công' })
  success: boolean;
}

export class ChangeRolePartnerRequestDto {
  // @ApiProperty({ example: 'dang123', description: 'Tên đăng nhập cần reset password' })
  // @IsString()
  // @IsNotEmpty({ message: 'Username không được để trống' })
  // username: string;
}

export class ChangeRolePartnerResponseDto {
  @ApiProperty({ example: true, description: 'Trạng thái đổi role' })
  success: boolean;
}