const API = 'https://controlasistenciaapi.onrender.com';

let horarios = [];
let horarioSeleccionado = null;

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cargarHorarios();

  document.getElementById('btn-cerrar').addEventListener('click', cerrarModal);
  document.getElementById('btn-generar-qr').addEventListener('click', () => {
    if (horarioSeleccionado !== null) abrirQR(horarioSeleccionado);
  });

  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModal();
  });
});

// ─── FETCH HORARIOS ──────────────────────────────────────────────────────────
async function cargarHorarios() {
  try {
    const res = await fetch(`${API}/api/HorarioH/ObtenerHorario_hs`);
    if (!res.ok) throw new Error('Error HTTP ' + res.status);
    horarios = await res.json();
    renderTabla(horarios);
  } catch (err) {
    document.getElementById('tabla-body').innerHTML = `
      <tr><td colspan="7" class="empty-cell">
        ⚠️ No se pudo conectar con la API. Verifica la conexión.
      </td></tr>`;
    console.error(err);
  }
}

// ─── RENDER TABLE ────────────────────────────────────────────────────────────
function renderTabla(data) {
  const tbody = document.getElementById('tabla-body');

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">No hay horarios registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((h, i) => {
    const id         = campo(h, 'id_horario_h', 'Id_horario_h', 'id', 'Id');
    const detalle    = campo(h, 'id_horario_d', 'Id_horario_d', 'detalle', 'Detalle');
    const horaInicio = fmtHora(campo(h, 'hora_inicio', 'Hora_inicio', 'horaInicio'));
    const horaFin    = fmtHora(campo(h, 'hora_fin',    'Hora_fin',    'horaFin'));
    const fecha      = fmtFecha(campo(h, 'fecha', 'Fecha'));
    const estado     = campo(h, 'estado', 'Estado', 'activo', 'Activo');

    return `
      <tr>
        <td>#${id}</td>
        <td>${detalle}</td>
        <td>${horaInicio}</td>
        <td>${horaFin}</td>
        <td>${fecha}</td>
        <td>${chipEstado(estado)}</td>
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
        </td>
      </tr>`;
  }).join('');
}

// ─── QR MODAL ────────────────────────────────────────────────────────────────
function abrirQR(idx) {
  const h = horarios[idx];
  horarioSeleccionado = idx;

  const id         = campo(h, 'id_horario_h', 'Id_horario_h', 'id', 'Id');
  const detalle    = campo(h, 'id_horario_d', 'Id_horario_d', 'detalle', 'Detalle');
  const fecha      = campo(h, 'fecha', 'Fecha');
  const catedratico = campo(h, 'catedratico', 'Catedratico', 'nombre_catedratico', 'docente');

  // Mostrar nombre del catedrático
  document.getElementById('modal-catedratico').textContent =
    catedratico && catedratico !== '—' ? catedratico : 'No especificado';

  // Construir URL de confirmación
  const base = window.location.href.replace('asistencia.html', '');
  const url  = `${base}confirmar-asistencia.html?clase_id=${id}&fecha=${encodeURIComponent(fecha)}&detalle=${encodeURIComponent(detalle)}`;

  // Limpiar y generar QR
  document.getElementById('qrcode').innerHTML = '';
  new QRCode(document.getElementById('qrcode'), {
    text: url,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('modal-overlay').classList.add('open');
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.remove('open');
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
