import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsValidName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Verificar que es un string
          if (typeof value !== 'string') return false;

          // Expresión regular que permite solo letras, espacios, guiones bajos y guiones medios
          // Incluye soporte para caracteres acentuados y caracteres Unicode para nombres internacionales
          const regex = /^[\p{L}\s_\-]+$/u;

          return regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `El campo ${args.property} solo puede contener letras, espacios, guiones bajos (_) y guiones medios (-)`;
        },
      },
    });
  };
}
