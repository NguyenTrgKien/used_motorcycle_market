import {
  IsNotEmpty,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

export function IsEmailOrPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEmailOrPhone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          const phoneRegex = /^\+?[0-9]{9,15}$/;
          return emailRegex.test(value) || phoneRegex.test(value);
        },
      },
    });
  };
}

export class ChangeContactDto {
  @IsNotEmpty({ message: 'Vui lòng truyền email mới!' })
  @IsEmailOrPhone({
    message: 'Liên hệ phải là email hoặc số điện thoại hợp lệ!',
  })
  contact!: string;
}
