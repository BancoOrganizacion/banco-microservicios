import { registerDecorator, ValidationOptions, ValidationArguments, isEmail } from 'class-validator';

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
        }
      }
    });
  };
}

export function IsEcuadorianId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEcuadorianId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Verificar que contiene exactamente 10 dígitos numéricos
          if (!/^\d{10}$/.test(value)) {
            return false;
          }

          // Verificar código de provincia (01-24)
          const provinciaCode = parseInt(value.substring(0, 2));
          if (provinciaCode < 1 || provinciaCode > 24) {
            return false;
          }

          // Verificar tercer dígito (0-6)
          const tercerDigito = parseInt(value.charAt(2));
          if (tercerDigito < 0 || tercerDigito > 6) {
            return false;
          }

          // Algoritmo de verificación (módulo 10)
          const cedula = value.split('').map(digit => parseInt(digit));
          const verificador = cedula[9];
          
          // Multiplicar dígitos impares por 2
          let suma = 0;
          for (let i = 0; i < 9; i++) {
            let valorPosicion = cedula[i];
            if (i % 2 === 0) {
              valorPosicion = valorPosicion * 2;
              if (valorPosicion > 9) {
                valorPosicion -= 9;
              }
            }
            suma += valorPosicion;
          }
          
          // Obtener dígito verificador calculado
          const decenaSuperior = Math.ceil(suma / 10) * 10;
          const digitoVerificador = decenaSuperior - suma;
          
          // Si el dígito calculado es 10, se convierte a 0
          const digitoEsperado = digitoVerificador === 10 ? 0 : digitoVerificador;
          
          return verificador === digitoEsperado;
        },
        defaultMessage(args: ValidationArguments) {
          return 'La cédula ecuatoriana no es válida';
        },
      },
    });
  };
}

// Función para crear un decorador personalizado para validación de contraseña segura
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Verificar que es un string
          if (typeof value !== 'string') return false;
          
          // Verificar longitud mínima
          if (value.length < 8) return false;
          
          // Verificar al menos una letra mayúscula
          const hasUpperCase = /[A-Z]/.test(value);
          
          // Verificar al menos una letra minúscula
          const hasLowerCase = /[a-z]/.test(value);
          
          // Verificar al menos un número
          const hasNumber = /\d/.test(value);
          
          // Verificar al menos un carácter especial
          const hasSpecialChar = /[@$!%*?&]/.test(value);
          
          return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
        },
        defaultMessage(args: ValidationArguments) {
          return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)';
        }
      }
    });
  };
}

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Verificar si es un email con el validador base
          if (!isEmail(value)) {
            return false;
          }

          // Verificar que tenga un dominio válido
          const domain = value.split('@')[1];
          
          // Lista de dominios permitidos (puedes personalizarla)
          const validDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'empresa.com'];
          
          // Puedes descomentar esta línea si quieres verificar dominios específicos
          // return validDomains.includes(domain);
          
          // O puedes validar que el dominio tenga un TLD válido
          const validTLDs = ['.com', '.net', '.org', '.edu', '.gob.ec', '.ec'];
          return validTLDs.some(tld => domain.endsWith(tld));
        },
        defaultMessage(args: ValidationArguments) {
          return 'El correo electrónico no es válido o no tiene un dominio permitido';
        },
      },
    });
  };
}



export function IsEcuadorianPhone(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        name: 'isEcuadorianPhone',
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        validator: {
          validate(value: any, args: ValidationArguments) {
            // Si es un campo opcional y viene vacío, es válido
            if (value === undefined || value === null || value === '') {
              return true;
            }
            
            if (typeof value !== 'string') {
              return false;
            }
  
            // Verificar que contiene exactamente 10 dígitos numéricos
            if (!/^\d{10}$/.test(value)) {
              return false;
            }
  
            // Verificar que el primer dígito es 0
            return value.charAt(0) === '0';
          },
          defaultMessage(args: ValidationArguments) {
            return 'El número de teléfono debe tener 10 dígitos y comenzar con 0';
          },
        },
      });
    };
  }