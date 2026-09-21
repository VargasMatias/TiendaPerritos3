/**
 * ============================================================
 * TiendaPerritos - Frontend Cloud
 * ============================================================
 *
 * Autenticación:
 * AWS Cognito
 *
 * Flujo:
 * OAuth 2.0 / OpenID Connect
 * Authorization Code + PKCE
 *
 * API:
 * AWS API Gateway
 *
 * Roles:
 * Admin   -> CRUD completo
 * Cliente -> solo lectura
 * ============================================================
 */


/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const COGNITO_DOMAIN =
  "https://tiendaperritos-auth.auth.us-east-1.amazoncognito.com";

const CLIENT_ID =
  "60eknr7re3q27nlj181vdmi0cg";


/*
 * Permite utilizar el mismo código tanto:
 *
 * LOCAL:
 * http://localhost:4200
 *
 * AWS S3:
 * https://tiendaperritos-frontend-clymastian...
 */

const REDIRECT_URI =
  window.location.hostname === "localhost"
    ? "http://localhost:4200"
    : window.location.origin + "/index.html";


/*
 * Scopes solicitados a Cognito
 */

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://api.tiendaperritos.com/mascotas.read",
  "https://api.tiendaperritos.com/mascotas.write",
].join(" ");


/*
 * API Gateway
 */

const API_BASE =
  "https://uutkg86tzd.execute-api.us-east-1.amazonaws.com/api/productos";


/*
 * Nombres utilizados en sessionStorage
 */

const STORAGE = {

  accessToken: "tienda_access_token",

  idToken: "tienda_id_token",

  refreshToken: "tienda_refresh_token",

  state: "tienda_oauth_state",

  nonce: "tienda_oauth_nonce",

  codeVerifier: "tienda_pkce_verifier",

};


/* ============================================================
   ELEMENTOS HTML
   ============================================================ */

let editandoId = null;


const tbody =
  document.getElementById("tbodyProductos");


const btnCargar =
  document.getElementById("btnCargar");


const btnGuardar =
  document.getElementById("btnGuardar");


const btnCancelar =
  document.getElementById("btnCancelar");


const btnLogin =
  document.getElementById("btnLogin");


const btnLogout =
  document.getElementById("btnLogout");


const authStatus =
  document.getElementById("authStatus");


const statusDiv =
  document.getElementById("status");


const adminForm =
  document.getElementById("adminForm");


const formTitle =
  document.getElementById("formTitle");


const inputNombre =
  document.getElementById("nombre");


const inputDescripcion =
  document.getElementById("descripcion");


const inputPrecio =
  document.getElementById("precio");


const inputStock =
  document.getElementById("stock");


/* ============================================================
   PKCE
   ============================================================ */


/*
 * Convierte bytes a Base64 URL Safe.
 */

function base64UrlEncode(arrayBuffer) {

  const bytes =
    new Uint8Array(arrayBuffer);

  let binary = "";

  bytes.forEach((byte) => {

    binary +=
      String.fromCharCode(byte);

  });

  return btoa(binary)

    .replace(/\+/g, "-")

    .replace(/\//g, "_")

    .replace(/=+$/, "");

}


/*
 * Genera texto aleatorio seguro.
 */

function randomString(length = 64) {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const randomValues =
    new Uint32Array(length);

  crypto.getRandomValues(
    randomValues
  );

  return Array
    .from(randomValues)

    .map(
      (value) =>
        chars[value % chars.length]
    )

    .join("");

}


/*
 * SHA-256
 */

async function sha256(value) {

  const encoder =
    new TextEncoder();

  const data =
    encoder.encode(value);

  return crypto.subtle.digest(
    "SHA-256",
    data
  );

}


/*
 * Crea code_challenge de PKCE.
 */

async function createCodeChallenge(
  codeVerifier
) {

  const hash =
    await sha256(
      codeVerifier
    );

  return base64UrlEncode(
    hash
  );

}


/* ============================================================
   JWT
   ============================================================ */


/*
 * Decodifica el payload de un JWT.
 *
 * Esto se usa solamente para leer claims en frontend.
 *
 * La validación real del JWT se realiza en:
 * API Gateway + backend.
 */

function decodeJwt(token) {

  try {

    const payload =
      token.split(".")[1];

    const normalized =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");


    const decoded =
      atob(normalized);


    const json =
      decodeURIComponent(

        decoded
          .split("")

          .map(
            (character) =>
              "%" +
              (
                "00" +
                character
                  .charCodeAt(0)
                  .toString(16)
              ).slice(-2)
          )

          .join("")

      );


    return JSON.parse(json);

  }

  catch (error) {

    console.error(
      "No se pudo decodificar JWT:",
      error
    );

    return null;

  }

}


/* ============================================================
   DATOS DEL USUARIO
   ============================================================ */


function isAuthenticated() {

  return Boolean(
    sessionStorage.getItem(
      STORAGE.accessToken
    )
  );

}


function getAccessToken() {

  return sessionStorage.getItem(
    STORAGE.accessToken
  );

}


function getIdToken() {

  return sessionStorage.getItem(
    STORAGE.idToken
  );

}


function getUserInfo() {

  const token =
    getIdToken();

  if (!token) {

    return null;

  }

  return decodeJwt(token);

}


/*
 * Obtiene cognito:groups del JWT.
 */

function getUserGroups() {

  const user =
    getUserInfo();

  if (!user) {

    return [];

  }

  const groups =
    user["cognito:groups"];

  if (
    Array.isArray(groups)
  ) {

    return groups;

  }

  return [];

}


/*
 * Devuelve true solamente si
 * Cognito indica que pertenece a Admin.
 */

function isAdmin() {

  return getUserGroups()
    .includes("Admin");

}


/* ============================================================
   INTERFAZ SEGÚN ROL
   ============================================================ */


function updateAuthUI() {

  /*
   * ========================
   * USUARIO AUTENTICADO
   * ========================
   */

  if (isAuthenticated()) {

    const user =
      getUserInfo();


    const username =

      user?.preferred_username ||

      user?.email ||

      user?.username ||

      "Usuario";


    const groups =
      getUserGroups();


    authStatus.textContent =

      `Sesión: ${username} | Grupos: ${groups.length > 0
        ? groups.join(", ")
        : "ninguno"
      }`;


    btnLogin.style.display =
      "none";


    btnLogout.style.display =
      "inline-block";


    /*
     * ======================
     * FORMULARIO ADMIN
     * ======================
     */

    if (isAdmin()) {

      adminForm.style.display =
        "block";

    }

    else {

      adminForm.style.display =
        "none";

    }


    /*
     * Actualizar también botones que
     * ya estén renderizados en tabla.
     */

    document
      .querySelectorAll(
        ".btn-editar"
      )
      .forEach((button) => {

        button.style.display =
          isAdmin()
            ? "inline-block"
            : "none";

      });


    document
      .querySelectorAll(
        ".btn-eliminar"
      )
      .forEach((button) => {

        button.style.display =
          isAdmin()
            ? "inline-block"
            : "none";

      });

  }

  /*
   * ========================
   * NO AUTENTICADO
   * ========================
   */

  else {

    authStatus.textContent =
      "No autenticado";


    btnLogin.style.display =
      "inline-block";


    btnLogout.style.display =
      "none";


    /*
     * Ocultamos formulario completo.
     */

    adminForm.style.display =
      "none";


    document
      .querySelectorAll(
        ".btn-editar"
      )
      .forEach((button) => {

        button.style.display =
          "none";

      });


    document
      .querySelectorAll(
        ".btn-eliminar"
      )
      .forEach((button) => {

        button.style.display =
          "none";

      });

  }

}


/* ============================================================
   LOGIN COGNITO
   ============================================================ */


async function iniciarSesion() {

  /*
   * State:
   * protege contra CSRF.
   */

  const state =
    randomString(32);


  /*
   * Nonce:
   * protege el flujo OIDC.
   */

  const nonce =
    randomString(32);


  /*
   * PKCE code_verifier.
   */

  const codeVerifier =
    randomString(64);


  /*
   * PKCE code_challenge.
   */

  const codeChallenge =
    await createCodeChallenge(
      codeVerifier
    );


  /*
   * Guardamos datos temporalmente.
   */

  sessionStorage.setItem(
    STORAGE.state,
    state
  );


  sessionStorage.setItem(
    STORAGE.nonce,
    nonce
  );


  sessionStorage.setItem(
    STORAGE.codeVerifier,
    codeVerifier
  );


  /*
   * Parámetros OAuth.
   */

  const params =
    new URLSearchParams({

      response_type:
        "code",

      client_id:
        CLIENT_ID,

      redirect_uri:
        REDIRECT_URI,

      scope:
        SCOPES,

      state,

      nonce,

      code_challenge_method:
        "S256",

      code_challenge:
        codeChallenge,

    });


  /*
   * Redirigir a Cognito.
   */

  window.location.href =

    `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;

}


/* ============================================================
   INTERCAMBIAR CODE POR TOKENS
   ============================================================ */


async function intercambiarCodigoPorTokens(
  code
) {

  const codeVerifier =
    sessionStorage.getItem(
      STORAGE.codeVerifier
    );


  if (!codeVerifier) {

    throw new Error(
      "No existe code_verifier para completar PKCE."
    );

  }


  const body =
    new URLSearchParams({

      grant_type:
        "authorization_code",

      client_id:
        CLIENT_ID,

      code,

      redirect_uri:
        REDIRECT_URI,

      code_verifier:
        codeVerifier,

    });


  const response =
    await fetch(

      `${COGNITO_DOMAIN}/oauth2/token`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded",

        },

        body,

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "Respuesta Cognito:",
      data
    );


    throw new Error(

      data.error_description ||

      data.error ||

      "No se pudieron obtener los tokens."

    );

  }


  sessionStorage.setItem(
    STORAGE.accessToken,
    data.access_token
  );


  sessionStorage.setItem(
    STORAGE.idToken,
    data.id_token
  );


  if (data.refresh_token) {

    sessionStorage.setItem(
      STORAGE.refreshToken,
      data.refresh_token
    );

  }


  return data;

}


/* ============================================================
   CALLBACK OAUTH
   ============================================================ */


async function procesarCallback() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const code =
    params.get("code");


  const state =
    params.get("state");


  const error =
    params.get("error");


  /*
   * Cognito devolvió error.
   */

  if (error) {

    throw new Error(

      params.get(
        "error_description"
      ) ||

      `Error OAuth: ${error}`

    );

  }


  /*
   * No estamos procesando callback.
   */

  if (!code) {

    return false;

  }


  /*
   * Validar STATE.
   */

  const savedState =
    sessionStorage.getItem(
      STORAGE.state
    );


  if (
    !savedState ||
    state !== savedState
  ) {

    throw new Error(
      "Validación state fallida."
    );

  }


  /*
   * Obtener tokens.
   */

  const tokens =
    await intercambiarCodigoPorTokens(
      code
    );


  /*
   * Validar NONCE.
   */

  const idTokenPayload =
    decodeJwt(
      tokens.id_token
    );


  const savedNonce =
    sessionStorage.getItem(
      STORAGE.nonce
    );


  if (
    !idTokenPayload ||
    idTokenPayload.nonce !==
    savedNonce
  ) {

    limpiarSesion();


    throw new Error(
      "Validación nonce fallida."
    );

  }


  /*
   * Limpiar datos temporales PKCE.
   */

  sessionStorage.removeItem(
    STORAGE.state
  );


  sessionStorage.removeItem(
    STORAGE.nonce
  );


  sessionStorage.removeItem(
    STORAGE.codeVerifier
  );


  /*
   * Quitar:
   *
   * ?code=...
   * &state=...
   *
   * de la URL.
   */

  window.history.replaceState(

    {},

    document.title,

    window.location.pathname

  );


  return true;

}


/* ============================================================
   REFRESH TOKEN
   ============================================================ */


async function renovarAccessToken() {

  const refreshToken =
    sessionStorage.getItem(
      STORAGE.refreshToken
    );


  if (!refreshToken) {

    return false;

  }


  const body =
    new URLSearchParams({

      grant_type:
        "refresh_token",

      client_id:
        CLIENT_ID,

      refresh_token:
        refreshToken,

    });


  const response =
    await fetch(

      `${COGNITO_DOMAIN}/oauth2/token`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded",

        },

        body,

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    limpiarSesion();

    return false;

  }


  sessionStorage.setItem(
    STORAGE.accessToken,
    data.access_token
  );


  if (data.id_token) {

    sessionStorage.setItem(
      STORAGE.idToken,
      data.id_token
    );

  }


  return true;

}


/* ============================================================
   LOGOUT
   ============================================================ */


function limpiarSesion() {

  Object
    .values(STORAGE)

    .forEach((key) => {

      sessionStorage.removeItem(
        key
      );

    });

}


function cerrarSesion() {

  limpiarSesion();


  const params =
    new URLSearchParams({

      client_id:
        CLIENT_ID,

      logout_uri:
        REDIRECT_URI,

    });


  window.location.href =

    `${COGNITO_DOMAIN}/logout?${params.toString()}`;

}


/* ============================================================
   HEADERS DE AUTORIZACIÓN
   ============================================================ */


function getAuthHeaders(
  includeJson = false
) {

  const headers = {};


  if (includeJson) {

    headers[
      "Content-Type"
    ] =
      "application/json";

  }


  const accessToken =
    getAccessToken();


  if (accessToken) {

    headers[
      "Authorization"
    ] =
      `Bearer ${accessToken}`;

  }


  return headers;

}


/* ============================================================
   FETCH CON JWT
   ============================================================ */


async function fetchWithAuth(
  url,
  options = {}
) {

  /*
   * Primera petición.
   */

  const response =
    await fetch(

      url,

      {

        ...options,

        headers: {

          ...getAuthHeaders(
            options.body !== undefined
          ),

          ...(options.headers || {}),

        },

      }

    );


  /*
   * Si API Gateway devuelve 401,
   * intentamos renovar access token.
   */

  if (
    response.status === 401
  ) {

    const renewed =
      await renovarAccessToken();


    /*
     * Token renovado:
     * repetir petición.
     */

    if (renewed) {

      return fetch(

        url,

        {

          ...options,

          headers: {

            ...getAuthHeaders(
              options.body !== undefined
            ),

            ...(options.headers || {}),

          },

        }

      );

    }


    /*
     * No fue posible renovar sesión.
     */

    limpiarSesion();

    updateAuthUI();


    throw new Error(
      "Sesión expirada. Debes iniciar sesión nuevamente."
    );

  }


  return response;

}


/* ============================================================
   MENSAJES
   ============================================================ */


function setStatus(
  mensaje,
  tipo = "ok"
) {

  statusDiv.textContent =
    mensaje;


  statusDiv.className =
    "status " + tipo;

}


/* ============================================================
   RENDER PRODUCTOS
   ============================================================ */


function crearCelda(
  contenido
) {

  const td =
    document.createElement("td");


  td.textContent =
    contenido;


  return td;

}


function renderProductos(
  productos
) {

  tbody.innerHTML = "";


  productos.forEach(
    (producto) => {

      const tr =
        document.createElement("tr");


      /*
       * ID
       */

      tr.appendChild(
        crearCelda(
          producto.id
        )
      );


      /*
       * Nombre
       */

      tr.appendChild(
        crearCelda(
          producto.nombre
        )
      );


      /*
       * Descripción
       */

      tr.appendChild(
        crearCelda(
          producto.descripcion || ""
        )
      );


      /*
       * Precio
       */

      tr.appendChild(
        crearCelda(
          `$${Number(
            producto.precio
          ).toFixed(2)}`
        )
      );


      /*
       * Stock
       */

      tr.appendChild(
        crearCelda(
          producto.stock
        )
      );


      /*
       * Acciones
       */

      const tdAcciones =
        document.createElement("td");


      /*
       * Solamente Admin obtiene
       * botones Editar / Eliminar.
       */

      if (isAdmin()) {

        const btnEditar =
          document.createElement(
            "button"
          );


        btnEditar.textContent =
          "Editar";


        btnEditar.className =
          "btn-editar";


        btnEditar.addEventListener(
          "click",
          () => {

            editarProducto(
              producto.id
            );

          }
        );


        const btnEliminar =
          document.createElement(
            "button"
          );


        btnEliminar.textContent =
          "Eliminar";


        btnEliminar.className =
          "btn-eliminar danger";


        btnEliminar.addEventListener(
          "click",
          () => {

            const confirmar =
              confirm(
                "¿Seguro que deseas eliminar este producto?"
              );


            if (confirmar) {

              eliminarProducto(
                producto.id
              );

            }

          }
        );


        tdAcciones.appendChild(
          btnEditar
        );


        tdAcciones.appendChild(
          btnEliminar
        );

      }


      tr.appendChild(
        tdAcciones
      );


      tbody.appendChild(
        tr
      );

    }

  );


  /*
   * Reaplicar permisos de interfaz.
   */

  updateAuthUI();

}


/* ============================================================
   GET TODOS LOS PRODUCTOS
   ============================================================ */


async function cargarProductos() {

  try {

    if (!isAuthenticated()) {

      setStatus(
        "Debes iniciar sesión para consultar productos.",
        "error"
      );

      return;

    }


    const res =
      await fetchWithAuth(
        API_BASE
      );


    if (!res.ok) {

      const data =
        await res
          .json()
          .catch(
            () => ({})
          );


      throw new Error(

        data.message ||

        "Error al cargar productos"

      );

    }


    const productos =
      await res.json();


    renderProductos(
      productos
    );


    setStatus(
      "Productos cargados correctamente.",
      "ok"
    );

  }

  catch (error) {

    console.error(
      error
    );


    setStatus(
      error.message,
      "error"
    );

  }

}


/* ============================================================
   FORMULARIO
   ============================================================ */


function limpiarFormulario() {

  editandoId = null;


  formTitle.textContent =
    "Nuevo producto";


  inputNombre.value =
    "";


  inputDescripcion.value =
    "";


  inputPrecio.value =
    "";


  inputStock.value =
    "";

}


function obtenerDatosFormulario() {

  return {

    nombre:
      inputNombre
        .value
        .trim(),

    descripcion:
      inputDescripcion
        .value
        .trim(),

    precio:
      parseFloat(
        inputPrecio.value
      ),

    stock:
      parseInt(
        inputStock.value,
        10
      ),

  };

}


function validarProducto(
  producto
) {

  if (!producto.nombre) {

    return (
      "El nombre es obligatorio."
    );

  }


  if (
    Number.isNaN(
      producto.precio
    ) ||
    producto.precio < 0
  ) {

    return (
      "El precio debe ser un número mayor o igual a 0."
    );

  }


  if (
    Number.isNaN(
      producto.stock
    ) ||
    producto.stock < 0
  ) {

    return (
      "El stock debe ser un número mayor o igual a 0."
    );

  }


  return null;

}


/* ============================================================
   POST / PUT
   ============================================================ */


async function guardarProducto() {

  /*
   * Seguridad adicional en frontend.
   *
   * El backend también valida rol Admin,
   * por lo que ocultar el formulario NO
   * reemplaza la seguridad del servidor.
   */

  if (!isAuthenticated()) {

    setStatus(
      "Debes iniciar sesión.",
      "error"
    );

    return;

  }


  if (!isAdmin()) {

    setStatus(
      "Solo un usuario Admin puede modificar productos.",
      "error"
    );

    return;

  }


  const producto =
    obtenerDatosFormulario();


  const error =
    validarProducto(
      producto
    );


  if (error) {

    setStatus(
      error,
      "error"
    );

    return;

  }


  try {

    let res;


    /*
     * PUT
     */

    if (editandoId) {

      res =
        await fetchWithAuth(

          `${API_BASE}/${editandoId}`,

          {

            method:
              "PUT",

            body:
              JSON.stringify(
                producto
              ),

          }

        );

    }


    /*
     * POST
     */

    else {

      res =
        await fetchWithAuth(

          API_BASE,

          {

            method:
              "POST",

            body:
              JSON.stringify(
                producto
              ),

          }

        );

    }


    if (!res.ok) {

      const data =
        await res
          .json()
          .catch(
            () => ({})
          );


      throw new Error(

        data.message ||

        "Error al guardar producto"

      );

    }


    const mensaje =
      editandoId

        ? "Producto actualizado correctamente."

        : "Producto creado correctamente.";


    limpiarFormulario();


    await cargarProductos();


    setStatus(
      mensaje,
      "ok"
    );

  }

  catch (error) {

    console.error(
      error
    );


    setStatus(
      error.message,
      "error"
    );

  }

}


/* ============================================================
   GET PRODUCTO POR ID PARA EDITAR
   ============================================================ */


async function editarProducto(
  id
) {

  if (!isAdmin()) {

    setStatus(
      "Solo un usuario Admin puede editar productos.",
      "error"
    );

    return;

  }


  try {

    const res =
      await fetchWithAuth(

        `${API_BASE}/${id}`

      );


    if (!res.ok) {

      throw new Error(
        "No se pudo obtener el producto."
      );

    }


    const producto =
      await res.json();


    editandoId =
      producto.id;


    formTitle.textContent =
      `Editar producto #${producto.id}`;


    inputNombre.value =
      producto.nombre;


    inputDescripcion.value =
      producto.descripcion || "";


    inputPrecio.value =
      producto.precio;


    inputStock.value =
      producto.stock;


    setStatus(
      "Editando producto.",
      "ok"
    );


    /*
     * Llevar al usuario al formulario.
     */

    adminForm.scrollIntoView({

      behavior:
        "smooth",

      block:
        "start",

    });

  }

  catch (error) {

    console.error(
      error
    );


    setStatus(
      error.message,
      "error"
    );

  }

}


/* ============================================================
   DELETE
   ============================================================ */


async function eliminarProducto(
  id
) {

  if (!isAdmin()) {

    setStatus(
      "Solo un usuario Admin puede eliminar productos.",
      "error"
    );

    return;

  }


  try {

    const res =
      await fetchWithAuth(

        `${API_BASE}/${id}`,

        {

          method:
            "DELETE",

        }

      );


    if (!res.ok) {

      const data =
        await res
          .json()
          .catch(
            () => ({})
          );


      throw new Error(

        data.message ||

        "Error al eliminar producto"

      );

    }


    await cargarProductos();


    setStatus(
      "Producto eliminado correctamente.",
      "ok"
    );

  }

  catch (error) {

    console.error(
      error
    );


    setStatus(
      error.message,
      "error"
    );

  }

}


/* ============================================================
   EVENTOS
   ============================================================ */


btnLogin.addEventListener(
  "click",
  iniciarSesion
);


btnLogout.addEventListener(
  "click",
  cerrarSesion
);


btnCargar.addEventListener(
  "click",
  cargarProductos
);


btnGuardar.addEventListener(
  "click",
  guardarProducto
);


btnCancelar.addEventListener(
  "click",
  () => {

    limpiarFormulario();


    setStatus(
      "Edición cancelada.",
      "ok"
    );

  }
);


/* ============================================================
   INICIO DE LA APLICACIÓN
   ============================================================ */


(async function iniciarAplicacion() {

  try {

    /*
     * Revisar si Cognito nos devolvió
     * authorization code.
     */

    const callbackProcesado =
      await procesarCallback();


    /*
     * Actualizar interfaz según usuario.
     */

    updateAuthUI();


    /*
     * Acabamos de iniciar sesión.
     */

    if (callbackProcesado) {

      setStatus(
        "Inicio de sesión correcto.",
        "ok"
      );


      await cargarProductos();

    }


    /*
     * Ya existía una sesión.
     */

    else if (
      isAuthenticated()
    ) {

      await cargarProductos();

    }

  }

  catch (error) {

    console.error(
      error
    );


    limpiarSesion();


    updateAuthUI();


    setStatus(

      `Error de autenticación: ${error.message}`,

      "error"

    );

  }

})();