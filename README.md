# Instrucciones de uso

## ORDEN PARA EJECUTAR LOS MICROSERVICIOS
1. Microservicio de usuarios
2. Microservicio de auth



## PROBLEMAS COMUNES
## 1. Si se tiene que hacer una instalación tomar en cuenta que se desvincula el modulo de: shared-models
### Para el ms de usuarios y el de auth
La solución es: 
```
npm link shared-models
npm run build
npm run start
```

