const API = 'https://controlasistenciaapi.onrender.com';
//const API = 'https://localhost:7159';

let horarios = [];
let horarioSeleccionado = null;
const PageSize = 5;
var PageNumber = 1;

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cargarHorarios();

  document.getElementById('btn-cerrar').addEventListener('click', function () {
    cerrarModal('modal-overlay');
  });
  // document.getElementById('btn-generar-qr').addEventListener('click', () => {
  //   if (horarioSeleccionado !== null) abrirQR(horarioSeleccionado);
  // });
  document.getElementById('btn-cerrar-confirmaciones-asistencias').addEventListener('click', function () {
    cerrarModal('modal-asistencias-confirmadas');
  });

  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModal('modal-overlay');
  });
  document.getElementById('modal-asistencias-confirmadas').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModal('modal-asistencias-confirmadas');
  });
});

// ─── FETCH HORARIOS ──────────────────────────────────────────────────────────
async function cargarHorarios() {
  try {
    let params = new URLSearchParams(window.location.search);
    let idaula = params.get('idaula');
    let aula = await cargarAulaPorId(idaula);
    document.getElementById("titulo-pantalla").innerText = `Horarios disponibles para el aula: ${aula.codigo}`;
    const res = await fetch(`${API}/api/HorarioH/ObtenerHorarioPorIdAula?idAula=${idaula}&PageSize=${PageSize}&PageNumber=${PageNumber}`);
    //const res = await fetch(`${API}/api/HorarioH/ObtenerHorario_hs`);
    if (!res.ok) throw new Error('Error HTTP ' + res.status);
    horarios = await res.json();
    await renderTabla(horarios);
  } catch (err) {
    document.getElementById('tabla-body').innerHTML = `
      <tr><td colspan="7" class="empty-cell">
        ⚠️ No se pudo conectar con la API. Verifica la conexión.
      </td></tr>`;
    console.error(err);
  }
}
async function cargarAulaPorId(id) {
  const res = await fetch(`${API}/api/Aula/ObtenerAulasPorId?id=${id}`);
  if (!res.ok) throw new Error('Error HTTP ' + res.status);
  let r = await res.json();
  return r;
}
async function cargarMateriaPorId(id) {
  const res = await fetch(`${API}/api/Materia/ObtenerMateriasPorId?id=${id}`);
  if (!res.ok) throw new Error('Error HTTP ' + res.status);
  let r = await res.json();
  return r;
}
// ─── RENDER TABLE ────────────────────────────────────────────────────────────
async function renderTabla(data) {
  const tbody = document.getElementById('tabla-body');

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">No hay horarios registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((h, i) => {
    const id = campo(h, 'id_horario_h', 'Id_horario_h', 'id', 'Id');
    const catedratico = campo(h, 'catedratico', 'Catedratico', 'maestro', 'Maestro');
    const detalle = campo(h, 'id_horario_d', 'Id_horario_d', 'detalle', 'Detalle');
    const horaInicio = fmtHora(campo(h, 'hora_inicio', 'Hora_inicio', 'horaInicio'));
    const horaFin = fmtHora(campo(h, 'hora_fin', 'Hora_fin', 'horaFin'));
    const fecha = fmtFecha(campo(h, 'fecha', 'Fecha'));
    const estado = campo(h, 'estado', 'Estado', 'activo', 'Activo');
    const grupo = campo(h, 'grupo');
    let idMateria = campo(h, 'idmateria');
    let materia = await cargarMateriaPorId(idMateria);
    return `
      <tr>
        <td>#${id}</td>
        <td>${catedratico}</td>
        <td>${materia.nombre}</td>
        <td>${horaInicio}</td>
        <td>${horaFin}</td>
        <td>${fecha}</td>
        <td>${grupo}</td>
        <!--- <td>${chipEstado(estado)}</td> --->
        <td>
          <button class="btn-small" onclick="abrirQR(${i})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            QR
          </button>
          <button class="btn-primary btn-small" onclick="verAsistenciasConfirmadas(${id})">Ver asistencias</button>
        </td>
      </tr>`;
  }).join('');
  document.getElementById('previousPage').disabled = PageNumber === 1;
  document.getElementById('nextPage').disabled = data.length < PageSize;
}

function changePage(direction) {
  PageNumber += direction;
  cargarHorarios();
}

// ─── QR MODAL ────────────────────────────────────────────────────────────────
async function abrirQR(idx) {
  const h = horarios[idx];
  horarioSeleccionado = idx;

  const id = campo(h, 'id_horario_h', 'Id_horario_h', 'id', 'Id');
  //const detalle    = campo(h, 'id_horario_d', 'Id_horario_d', 'detalle', 'Detalle');
  const fecha = campo(h, 'fecha', 'Fecha');
  const catedratico = campo(h, 'catedratico', 'Catedratico', 'nombre_catedratico', 'docente');

  // Mostrar nombre del catedrático
  document.getElementById('modal-catedratico').textContent =
    catedratico && catedratico !== '—' ? catedratico : 'No especificado';

  // Construir URL de confirmación
  let params = new URLSearchParams(window.location.search);
  let idaula = params.get('idaula');

  let base = window.location.href.replace(`asistencia.html?idaula=${idaula}`, '');
  let _route = `clase_id=${id}&fecha=${encodeURIComponent(fecha)}`;
  //const url  = `${base}confirmar-asistencia.html?clase_id=${id}&fecha=${encodeURIComponent(fecha)}`;
  //const url  = `${base}confirmar-asistencia.html?clase_id=${id}&fecha=${encodeURIComponent(fecha)}&detalle=${encodeURIComponent(detalle)}`;

  // Solicitar token al backend
  let responseToken = await SolicitarToken(id);

  if (!responseToken.ok) {
    throw new Error('Error al generar QR');
  }

  let _token = await responseToken.json();


  // Limpiar y generar QR
  document.getElementById('qrcode').innerHTML = '';
  new QRCode(document.getElementById('qrcode'), {
    text: `${base}confirmar-asistencia.html?t=${_token.token}&${_route}`,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('modal-overlay').classList.add('open');
}

function cerrarModal(id_modal_btn) {
  document.getElementById(id_modal_btn).classList.remove('open');
  //document.getElementById('modal-overlay').classList.remove('open');
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function campo(obj, ...claves) {
  for (const c of claves) {
    if (obj[c] !== undefined && obj[c] !== null && obj[c] !== '') return obj[c];
  }
  return '—';
}

function fmtHora(val) {
  if (!val || val === '—') return '—';
  return String(val).substring(0, 5);
}

function fmtFecha(val) {
  if (!val || val === '—') return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toISOString().split('T')[0];
}

function chipEstado(val) {
  const v = String(val || '').toLowerCase();
  if (v === 'activo' || v === '1' || v === 'true')
    return `<span class="chip chip-activo">Activo</span>`;
  if (v === 'inactivo' || v === '0' || v === 'false')
    return `<span class="chip chip-inactivo">Inactivo</span>`;
  return `<span class="chip chip-pendiente">${val || 'Pendiente'}</span>`;
}
async function SolicitarToken(params) {
  const res = await fetch(`${API}/api/Asistencia/generar-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params
  });
  return res;
}

function verAsistenciasConfirmadas(id) {
  //location.href = `confirmaciones-asistencia.html?id=${id}`;
  cargarAsistencia(id);
  document.getElementById('modal-asistencias-confirmadas').classList.add('open');
}