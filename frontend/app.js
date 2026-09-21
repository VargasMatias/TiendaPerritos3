/**
 * TiendaPerritos - Frontend
 * OAuth 2.0 / OpenID Connect
 * Authorization Code + PKCE
 */

const COGNITO_DOMAIN =
  "https://tiendaperritos-auth.auth.us-east-1.amazoncognito.com";

const CLIENT_ID = "60eknr7re3q27nlj181vdmi0cg";

const REDIRECT_URI = window.location.origin;

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://api.tiendaperritos.com/mascotas.read",
  "https://api.tiendaperritos.com/mascotas.write",
].join(" ");


const API_BASE = "https://uutkg86tzd.execute-api.us-east-1.amazonaws.com/api/productos";

const STORAGE = {
  accessToken: "tienda_access_token",
  idToken: "tienda_id_token",
  refreshToken: "tienda_refresh_token",
  state: "tienda_oauth_state",
  nonce: "tienda_oauth_nonce",
  codeVerifier: "tienda_pkce_verifier",
};

let editandoId = null;

const tbody = document.getElementById("tbodyProductos");
const btnCargar = document.getElementById("btnCargar");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");

const formTitle = document.getElementById("formTitle");
const statusDiv = document.getElementById("status");

const inputNombre = document.getElementById("nombre");
const inputDescripcion = document.getElementById("descripcion");
const inputPrecio = document.getElementById("precio");
const inputStock = document.getElementById("stock");

const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const authStatus = document.getElementById("authStatus");

/* =========================================================
   UTILIDADES PKCE
   ========================================================= */

function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);

  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomString(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const randomValues = new Uint32Array(length);

  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => chars[value % chars.length])
    .join("");
}

async function sha256(value) {
  const encoder = new TextEncoder();

  const data = encoder.encode(value);

  return await crypto.subtle.digest("SHA-256", data);
}

async function createCodeChallenge(codeVerifier) {
  const hash = await sha256(codeVerifier);

  return base64UrlEncode(hash);
}

/* =========================================================
   JWT
   ========================================================= */

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];

    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map(
          (character) =>
            "%" + ("00" + character.charCodeAt(0).toString(16)).slice(-2)
        )
        .join("")
    );

    return JSON.parse(json);
  } catch (error) {
    console.error("No se pudo decodificar JWT:", error);
    return null;
  }
}

/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

function isAuthenticated() {
  return Boolean(sessionStorage.getItem(STORAGE.accessToken));
}

function getAccessToken() {
  return sessionStorage.getItem(STORAGE.accessToken);
}

function getIdToken() {
  return sessionStorage.getItem(STORAGE.idToken);
}

function getUserInfo() {
  const token = getIdToken();

  if (!token) {
    return null;
  }

  return decodeJwt(token);
}

function getUserGroups() {
  const user = getUserInfo();

  if (!user) {
    return [];
  }

  const groups = user["cognito:groups"];

  if (Array.isArray(groups)) {
    return groups;
  }

  return [];
}

function isAdmin() {
  return getUserGroups().includes("Admin");
}

function updateAuthUI() {
  if (isAuthenticated()) {
    const user = getUserInfo();

    const username =
      user?.preferred_username ||
      user?.email ||
      user?.username ||
      "Usuario";

    const groups = getUserGroups();

    authStatus.textContent =
      `Sesión: ${username} | Grupos: ${groups.length > 0 ? groups.join(", ") : "ninguno"
      }`;

    btnLogin.style.display = "none";
    btnLogout.style.display = "inline-block";

    btnGuardar.style.display = isAdmin() ? "inline-block" : "none";
    btnCancelar.style.display = isAdmin() ? "inline-block" : "none";

    document.querySelectorAll(".btn-editar").forEach((button) => {
      button.style.display = isAdmin() ? "inline-block" : "none";
    });

    document.querySelectorAll(".btn-eliminar").forEach((button) => {
      button.style.display = isAdmin() ? "inline-block" : "none";
    });
  } else {
    authStatus.textContent = "No autenticado";

    btnLogin.style.display = "inline-block";
    btnLogout.style.display = "none";

    btnGuardar.style.display = "none";
    btnCancelar.style.display = "none";

    document.querySelectorAll(".btn-editar").forEach((button) => {
      button.style.display = "none";
    });

    document.querySelectorAll(".btn-eliminar").forEach((button) => {
      button.style.display = "none";
    });
  }
}

async function iniciarSesion() {
  const state = randomString(32);
  const nonce = randomString(32);
  const codeVerifier = randomString(64);

  const codeChallenge = await createCodeChallenge(codeVerifier);

  sessionStorage.setItem(STORAGE.state, state);
  sessionStorage.setItem(STORAGE.nonce, nonce);
  sessionStorage.setItem(STORAGE.codeVerifier, codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    nonce,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href =
    `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

async function intercambiarCodigoPorTokens(code) {
  const codeVerifier = sessionStorage.getItem(STORAGE.codeVerifier);

  if (!codeVerifier) {
    throw new Error("No existe code_verifier para completar PKCE.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Respuesta de Cognito:", data);

    throw new Error(
      data.error_description ||
      data.error ||
      "No se pudieron obtener los tokens."
    );
  }

  sessionStorage.setItem(STORAGE.accessToken, data.access_token);
  sessionStorage.setItem(STORAGE.idToken, data.id_token);

  if (data.refresh_token) {
    sessionStorage.setItem(STORAGE.refreshToken, data.refresh_token);
  }

  return data;
}

async function procesarCallback() {
  const params = new URLSearchParams(window.location.search);

  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    throw new Error(
      params.get("error_description") || `Error OAuth: ${error}`
    );
  }

  if (!code) {
    return false;
  }

  const savedState = sessionStorage.getItem(STORAGE.state);

  if (!savedState || state !== savedState) {
    throw new Error("Validación state fallida.");
  }

  const tokens = await intercambiarCodigoPorTokens(code);

  const idTokenPayload = decodeJwt(tokens.id_token);

  const savedNonce = sessionStorage.getItem(STORAGE.nonce);

  if (!idTokenPayload || idTokenPayload.nonce !== savedNonce) {
    limpiarSesion();

    throw new Error("Validación nonce fallida.");
  }

  sessionStorage.removeItem(STORAGE.state);
  sessionStorage.removeItem(STORAGE.nonce);
  sessionStorage.removeItem(STORAGE.codeVerifier);

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );

  return true;
}

async function renovarAccessToken() {
  const refreshToken = sessionStorage.getItem(STORAGE.refreshToken);

  if (!refreshToken) {
    return false;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    limpiarSesion();
    return false;
  }

  sessionStorage.setItem(STORAGE.accessToken, data.access_token);

  if (data.id_token) {
    sessionStorage.setItem(STORAGE.idToken, data.id_token);
  }

  return true;
}

function limpiarSesion() {
  Object.values(STORAGE).forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

function cerrarSesion() {
  limpiarSesion();

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: REDIRECT_URI,
  });

  window.location.href =
    `${COGNITO_DOMAIN}/logout?${params.toString()}`;
}

/* =========================================================
   API
   ========================================================= */

function getAuthHeaders(includeJson = false) {
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  const accessToken = getAccessToken();

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

async function fetchWithAuth(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(options.body !== undefined),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    const renewed = await renovarAccessToken();

    if (renewed) {
      return fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(options.body !== undefined),
          ...(options.headers || {}),
        },
      });
    }

    limpiarSesion();
    updateAuthUI();

    throw new Error("Sesión expirada. Debes iniciar sesión nuevamente.");
  }

  return response;
}

/* =========================================================
   CRUD
   ========================================================= */

function setStatus(mensaje, tipo = "ok") {
  statusDiv.textContent = mensaje;
  statusDiv.className = "status " + tipo;
}

async function cargarProductos() {
  try {
    if (!isAuthenticated()) {
      setStatus("Debes iniciar sesión para consultar productos.", "error");
      return;
    }

    const res = await fetchWithAuth(API_BASE);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Error al cargar productos");
    }

    const data = await res.json();

    renderProductos(data);

    setStatus("Productos cargados correctamente.", "ok");
  } catch (err) {
    console.error(err);
    setStatus(err.message, "error");
  }
}

function renderProductos(productos) {
  tbody.innerHTML = "";

  productos.forEach((p) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nombre}</td>
      <td>${p.descripcion || ""}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <button data-id="${p.id}" class="btn-editar">Editar</button>
        <button data-id="${p.id}" class="btn-eliminar danger">Eliminar</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", () => {
      editarProducto(btn.getAttribute("data-id"));
    });
  });

  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");

      if (confirm("¿Seguro que deseas eliminar este producto?")) {
        eliminarProducto(id);
      }
    });
  });

  updateAuthUI();
}

function limpiarFormulario() {
  editandoId = null;

  formTitle.textContent = "Nuevo producto";

  inputNombre.value = "";
  inputDescripcion.value = "";
  inputPrecio.value = "";
  inputStock.value = "";
}

function obtenerDatosFormulario() {
  return {
    nombre: inputNombre.value.trim(),
    descripcion: inputDescripcion.value.trim(),
    precio: parseFloat(inputPrecio.value),
    stock: parseInt(inputStock.value, 10),
  };
}

function validarProducto(prod) {
  if (!prod.nombre) {
    return "El nombre es obligatorio.";
  }

  if (isNaN(prod.precio) || prod.precio < 0) {
    return "El precio debe ser un número mayor o igual a 0.";
  }

  if (isNaN(prod.stock) || prod.stock < 0) {
    return "El stock debe ser un número mayor o igual a 0.";
  }

  return null;
}

async function guardarProducto() {
  if (!isAuthenticated()) {
    setStatus("Debes iniciar sesión.", "error");
    return;
  }

  if (!isAdmin()) {
    setStatus("Solo un usuario Admin puede modificar productos.", "error");
    return;
  }

  const producto = obtenerDatosFormulario();

  const error = validarProducto(producto);

  if (error) {
    setStatus(error, "error");
    return;
  }

  try {
    let res;

    if (editandoId) {
      res = await fetchWithAuth(`${API_BASE}/${editandoId}`, {
        method: "PUT",
        body: JSON.stringify(producto),
      });
    } else {
      res = await fetchWithAuth(API_BASE, {
        method: "POST",
        body: JSON.stringify(producto),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));

      throw new Error(
        data.message || "Error al guardar el producto"
      );
    }

    const mensaje = editandoId
      ? "Producto actualizado correctamente."
      : "Producto creado correctamente.";

    limpiarFormulario();

    await cargarProductos();

    setStatus(mensaje, "ok");
  } catch (err) {
    console.error(err);
    setStatus(err.message, "error");
  }
}

async function editarProducto(id) {
  if (!isAdmin()) {
    setStatus("Solo un usuario Admin puede editar productos.", "error");
    return;
  }

  try {
    const res = await fetchWithAuth(`${API_BASE}/${id}`);

    if (!res.ok) {
      throw new Error("No se pudo obtener el producto");
    }

    const p = await res.json();

    editandoId = p.id;

    formTitle.textContent = `Editar producto #${p.id}`;

    inputNombre.value = p.nombre;
    inputDescripcion.value = p.descripcion || "";
    inputPrecio.value = p.precio;
    inputStock.value = p.stock;

    setStatus("Editando producto.", "ok");
  } catch (err) {
    console.error(err);
    setStatus(err.message, "error");
  }
}

async function eliminarProducto(id) {
  if (!isAdmin()) {
    setStatus("Solo un usuario Admin puede eliminar productos.", "error");
    return;
  }

  try {
    const res = await fetchWithAuth(`${API_BASE}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));

      throw new Error(
        data.message || "Error al eliminar producto"
      );
    }

    await cargarProductos();

    setStatus("Producto eliminado correctamente.", "ok");
  } catch (err) {
    console.error(err);
    setStatus(err.message, "error");
  }
}

/* =========================================================
   EVENTOS
   ========================================================= */

btnLogin.addEventListener("click", iniciarSesion);

btnLogout.addEventListener("click", cerrarSesion);

btnCargar.addEventListener("click", cargarProductos);

btnGuardar.addEventListener("click", guardarProducto);

btnCancelar.addEventListener("click", () => {
  limpiarFormulario();
  setStatus("Edición cancelada.", "ok");
});

/* =========================================================
   INICIO
   ========================================================= */

(async function iniciarAplicacion() {
  try {
    const callbackProcesado = await procesarCallback();

    updateAuthUI();

    if (callbackProcesado) {
      setStatus("Inicio de sesión correcto.", "ok");
      await cargarProductos();
    } else if (isAuthenticated()) {
      await cargarProductos();
    }
  } catch (error) {
    console.error(error);

    limpiarSesion();

    updateAuthUI();

    setStatus(
      `Error de autenticación: ${error.message}`,
      "error"
    );
  }
})();