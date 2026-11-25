import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ApiException } from './api-error.filter';

function validationFields(
  errors: ValidationError[],
  prefix = '',
): Array<[string, string[]]> {
  return errors.flatMap((error) => {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    const children = validationFields(error.children ?? [], path);
    return error.constraints && path
      ? [[path, ['Giá trị không hợp lệ.']], ...children]
      : children;
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors: ValidationError[]) =>
      new ApiException(
        {
          code: 'VALIDATION_FAILED',
          message: 'Dữ liệu yêu cầu không hợp lệ.',
          fields: Object.fromEntries(validationFields(errors)),
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
  });
}
