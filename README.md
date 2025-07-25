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


## Para ver documentacion con swagger
Acceder a la documentación Swagger en:
API Gateway: http://localhost:3000/api/docs
Auth Service: http://localhost:3002/api/docs
Users Service: http://localhost:3001/api/docs


# VIDEO DEMOSTRATIVO
[Video del funcionamiento del sistema](https://epnecuador-my.sharepoint.com/:v:/g/personal/anabelen_campoverde_epn_edu_ec/EQYw3j44HwVLkOQ6FlO_1DEBGQsFYrRe0yI67TRo38D94g?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=XtXHp1)
