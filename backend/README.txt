TiendaPerritos2 — Cloud Native Application

Aplicación web para la gestión de productos de una tienda de mascotas, evolucionada hacia una arquitectura Cloud Native mediante servicios administrados de AWS, autenticación centralizada, autorización basada en roles, validación de JWT y persistencia en MySQL sobre Amazon RDS.

Alcance de esta entrega: este documento registra únicamente los cambios y configuraciones incorporados para la entrega actual.

1. Arquitectura

                         INTERNET
                            |
                            v
                 +----------------------+
                 |      FRONTEND        |
                 | HTML + JavaScript    |
                 |       + Nginx        |
                 +----------+-----------+
                            |
                            | OAuth 2.0
                            | Authorization Code
                            | + PKCE
                            v
                 +----------------------+
                 |    AMAZON COGNITO    |
                 | Autenticación        |
                 | Grupos / Roles       |
                 | JWT / OAuth 2.0      |
                 +----------+-----------+
                            |
                            | Access Token
                            | Bearer JWT
                            v
                 +----------------------+
                 |       BACKEND        |
                 |   Node.js + Express  |
                 | JWT Verification     |
                 | Autorización por rol |
                 | API REST CRUD        |
                 +----------+-----------+
                            |
                            | MySQL / TCP 3306
                            v
                 +----------------------+
                 |      AMAZON RDS      |
                 |        MySQL         |
                 |   tienda_perritos    |
                 +----------------------+

Principios aplicados

Separación de responsabilidades entre frontend, backend y persistencia.

Autenticación centralizada mediante un servicio administrado.

Autorización basada en roles.

Validación de tokens en el backend.

Persistencia mediante una base de datos administrada en la nube.

Configuración mediante variables de entorno.

Restricción de acceso a la base de datos mediante Security Groups.

2. Frontend

Ubicación

frontend/
├── index.html
└── app.js

Para esta entrega se modificaron principalmente index.html y app.js.

Autenticación con Amazon Cognito

El frontend fue integrado con Amazon Cognito mediante OAuth 2.0 Authorization Code Grant con PKCE.

El flujo implementado es:

Usuario
   |
   v
Frontend
   |
   | Authorization Code + PKCE
   v
Amazon Cognito
   |
   | Código de autorización
   v
Frontend
   |
   | Intercambio del código
   v
Access Token + ID Token + Refresh Token

PKCE

El frontend genera y utiliza:

code_verifier

code_challenge

state

nonce

Tokens

Durante la sesión se manejan:

access_token
id_token
refresh_token

El access_token se utiliza para acceder a la API mediante:

Authorization: Bearer <access_token>

Renovación

Cuando una solicitud al backend devuelve 401 Unauthorized, el frontend intenta renovar el token mediante el refresh_token y repetir la solicitud.

Logout

Se incorporó cierre de sesión mediante Amazon Cognito y limpieza de la información de sesión.

Interfaz

Se agregaron:

Estado de autenticación.

Botón Iniciar sesión.

Botón Cerrar sesión.

Lógica de interfaz para diferenciar usuarios Admin y Cliente.

3. Backend

Ubicación

backend/
├── server.js
└── package.json

Dependencia agregada

aws-jwt-verify

Instalación realizada:

npm install aws-jwt-verify

Variables de entorno

COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID

Configuración utilizada:

COGNITO_USER_POOL_ID=us-east-1_vgwOYFFfM
COGNITO_CLIENT_ID=60eknr7re3q27nlj181vdmi0cg

4. Validación JWT

El backend valida los tokens de acceso enviados mediante:

Authorization: Bearer <access_token>

El middleware:

Obtiene el encabezado Authorization.

Comprueba el esquema Bearer.

Extrae el JWT.

Valida el token contra Amazon Cognito.

Verifica que corresponde a un access token.

Guarda la información validada en req.user.

Permite continuar con la solicitud.

Sin token:

401 Unauthorized

Token inválido o expirado:

401 Unauthorized

5. Autorización basada en roles

Se configuraron los grupos:

Admin
Cliente

El backend utiliza el claim:

cognito:groups

para determinar los permisos.

Las operaciones de escritura requieren pertenecer al grupo Admin.

Si un usuario autenticado no posee el rol requerido:

403 Forbidden

Respuesta:

{
  "message": "Acceso reservado para Admin."
}

La autorización principal se realiza en el backend.

6. API protegida

Método

Endpoint

Autenticación

Autorización

GET

/api/productos

Requerida

Usuario autenticado

GET

/api/productos/:id

Requerida

Usuario autenticado

POST

/api/productos

Requerida

Admin

PUT

/api/productos/:id

Requerida

Admin

DELETE

/api/productos/:id

Requerida

Admin

Endpoint de salud:

GET /api/health

Permanece público para comprobar disponibilidad del servicio.

7. Amazon Cognito

Región:

us-east-1

User Pool

User Pool ID:
us-east-1_vgwOYFFfM

App Client

Nombre:
tiendaperritos-frontend-client

Client ID:
60eknr7re3q27nlj181vdmi0cg

El App Client no utiliza Client Secret porque corresponde al cliente público del frontend.

Dominio

https://tiendaperritos-auth.auth.us-east-1.amazoncognito.com

Callback

http://localhost:4200

Sign-out

http://localhost:4200

8. OAuth 2.0 y scopes

Flujo habilitado:

Authorization Code Grant

con:

PKCE

Scopes estándar:

openid
email
profile

Scopes personalizados:

https://api.tiendaperritos.com/mascotas.read
https://api.tiendaperritos.com/mascotas.write

9. Resource Server

Se creó un Resource Server para representar la API.

Identificador:

https://api.tiendaperritos.com

Scopes:

mascotas.read
mascotas.write

10. Usuarios y grupos

Grupos:

Admin
Cliente

Usuarios de prueba:

admin
cliente

Asignación:

admin   -> Admin
cliente -> Cliente

11. Amazon RDS

Se creó una instancia de Amazon RDS para MySQL.

Configuración:

Región:
us-east-1

DB identifier:
tienda-perritos-db

Motor:
MySQL

Base de datos:
tienda_perritos

Usuario:
admin

Puerto:
3306

Estado actual:

Available

Endpoint

tienda-perritos-db.chjstbo2swlc.us-east-1.rds.amazonaws.com

12. Security Group de RDS

Security Group:

shop-puppies-rds-sg

ID:

sg-099b330fa41e326ac

Regla de entrada:

Tipo: MySQL/Aurora
Protocolo: TCP
Puerto: 3306
Origen: 152.230.174.75/32

El acceso de entrada está restringido a una IP específica mediante CIDR /32.

No se utiliza 0.0.0.0/0 como origen de entrada para MySQL.

Regla de salida:

0.0.0.0/0

13. Base de datos del proyecto

La base de datos cloud conserva el nombre utilizado por el proyecto:

tienda_perritos

Los scripts SQL existentes se mantienen en:

db/

La estrategia consiste en reutilizar la base de datos existente y cargar su estructura y datos en Amazon RDS.

No se crea una estructura de datos diferente para esta entrega.

14. Conectividad con RDS

AWS proporciona el siguiente comando:

mysql -h tienda-perritos-db.chjstbo2swlc.us-east-1.rds.amazonaws.com -P 3306 -u admin -p --ssl-mode=VERIFY_IDENTITY --ssl-ca=./global-bundle.pem

La conexión utiliza el endpoint de RDS, el puerto MySQL 3306 y validación mediante SSL.

15. Configuración objetivo del backend

El backend utiliza:

DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
DB_PORT

Configuración objetivo:

DB_HOST=tienda-perritos-db.chjstbo2swlc.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=<secreto>
DB_NAME=tienda_perritos
DB_PORT=3306

La contraseña debe mantenerse fuera del repositorio y proporcionarse mediante variables de entorno o mecanismos seguros del entorno de despliegue.

16. Seguridad implementada

Identidad

Amazon Cognito.

OAuth 2.0 Authorization Code Grant.

PKCE.

Access Tokens.

Refresh Tokens.

API

Validación JWT en backend.

Esquema Bearer.

Protección de endpoints.

Autorización basada en grupos.

Roles

Admin
Cliente

Las operaciones de escritura requieren Admin.

Base de datos

Amazon RDS MySQL.

Security Group dedicado.

Puerto 3306.

Acceso restringido por IP.

Conexión SSL disponible.

Configuración

Las credenciales y secretos no deben almacenarse en el código fuente.

17. Estructura relevante

TiendaPerritos2/
│
├── .github/
│   └── workflows/
│
├── backend/
│   ├── package.json
│   └── server.js
│
├── db/
│   └── Scripts SQL existentes
│
├── frontend/
│   ├── app.js
│   ├── default.conf
│   └── index.html
│
└── k8s/
    └── Manifiestos Kubernetes