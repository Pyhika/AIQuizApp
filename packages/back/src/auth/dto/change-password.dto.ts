import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: '現在のパスワードは必須です' })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: '新しいパスワードは必須です' })
  @IsString()
  @MinLength(8, { message: 'パスワードは8文字以上である必要があります' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'パスワードは大文字、小文字、数字、特殊文字を含む必要があります',
    },
  )
  newPassword: string;

  @IsNotEmpty({ message: 'パスワード確認は必須です' })
  @IsString()
  confirmPassword: string;
}