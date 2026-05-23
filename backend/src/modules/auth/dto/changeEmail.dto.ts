import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền email mới!' })
  newEmail!: string;
}
