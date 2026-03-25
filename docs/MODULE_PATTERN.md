# Patrón Estándar de Módulos (WebAstro API)

Para garantizar la escalabilidad y mantenibilidad de la API de WebAstro, cada nuevo módulo **debe** seguir estrictamente la siguiente estructura de carpetas y archivos.

## 📁 Estructura del Módulo

```text
src/
└── mi-modulo/
    ├── dto/
    │   ├── create-mi-modulo.dto.ts
    │   └── update-mi-modulo.dto.ts
    ├── entities/ o interfaces/
    │   └── mi-modulo.entity.ts o mi-modulo.interface.ts
    ├── mi-modulo.module.ts
    ├── mi-modulo.controller.ts
    ├── mi-modulo.service.ts
    └── mi-modulo.service.spec.ts  <-- (Obligatorio) Test Unitario
```

## 📜 Reglas Arquitectónicas

1. **Responsabilidad Única:** 
   - El **Controller** solo debe encargarse de las rutas (endpoints), decoradores Swagger, validación de DTOs y manejo de excepciones (`HttpException`). **No debe haber lógica de negocio aquí.**
   - El **Service** contiene toda la lógica de negocio y se conecta a la base de datos (Ej: Firestore).
   - El **Module** importa los módulos dependientes (como `FirebaseModule`) y exporta el servicio si otros módulos lo requieren.

2. **Inyección de Dependencias:**
   - La API utiliza bases de datos NoSQL (Firestore). Inyecta la instancia usando `@Inject('FIREBASE_FIRESTORE')` o el servicio encapsulado de Firestore que corresponda de acuerdo a la configuración actual del proyecto.

3. **Manejo de Errores Estándar:**
   - En el `service.ts`, los errores debidos a reglas de negocio deben lanzar excepciones como `new BadRequestException('...')` o `new NotFoundException('...')`.
   - Captura y envuelve errores internos o de BD usando `try/catch` con `InternalServerErrorException`.

4. **DTOs Obligatorios:**
   - Toda data de entrada en endpoints `POST`, `PUT`, `PATCH` debe ser validada mediante clases en la carpeta `dto/` que utilicen `class-validator` (Ej: `@IsString()`, `@IsOptional()`).

5. **Pruebas Unitarias (Tests):**
   - Cada servicio **debe incluir pruebas.** Usa `Vitest` o `Jest` (dependiendo del framework base configurado) con el patrón AAA (Arrange, Act, Assert).

## 🚀 Comando NestJS Recomendado

Para generar el andamiaje correcto rápidamente:

```bash
pnpm exec nest generate resource mi-modulo --no-spec
```
*(Se recomienda añadir `--no-spec` para los controladores y módulos, pero crear manualmente el `.spec.ts` para el servicio).*
