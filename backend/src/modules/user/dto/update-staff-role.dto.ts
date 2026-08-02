import { IsEnum } from 'class-validator';
import { UserRole } from 'src/shared';

export class UpdateStaffRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
