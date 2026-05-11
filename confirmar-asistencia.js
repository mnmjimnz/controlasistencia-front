const API = 'https://controlasistenciaapi.onrender.com';

// ─── PARAMS DEL QR ────────────────────────────────────────────────────────────
const params   = new URLSearchParams(window.location.search);
const claseId  = params.get('clase_id');
const fecha    = params.get('fecha');
const detalle  = params.get('detalle') ? decodeURIComponent(params.get('detalle')) : null;

// ─── ESTADO ───────────────────────────────────────────────────────────────────
let alumnos         = [];
let alumnoSel       = null;
let searchTimeout   = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Mostrar info de la clase en el subtítulo
  document.getElementById('info-clase').textContent =
    `Clase ID: ${claseId || '—'} · Fecha: ${fecha || '—'}`;

  // Cargar lista de alumnos
  cargarAlumnos();

  // Buscar al escribir
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => filtrar(e.target.value), 220);
  });

  // Volver a buscar
  document.getElementById('btn-volver').addEventListener('click', volverABuscar);
});

// ─── FETCH ALUMNOS ────────────────────────────────────────────────────────────
async function cargarAlumnos() {
  try {
    const res = await fetch(`${API}/api/HorarioD/ObtenerHorarioPorIdH?id=${claseId}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    alumnos = await res.json();
  } catch (err) {
    mostrarToast('No se pudo cargar la lista de alumnos.', 'error');
    console.error(err);
  }
}

// ─── BÚSQUEDA / FILTRO ────────────────────────────────────────────────────────
function filtrar(val) {
  const q      = val.trim().toLowerCase();
  const lista  = document.getElementById('results-list');
  const hint   = document.getElementById('hint-text');

  alumnoSel = null;

  if (q.length < 2) {
    lista.innerHTML = '';
    hint.textContent = q.length === 1 ? 'Escribe al menos 2 caracteres…' : '';
    return;
  }

  const encontrados = alumnos.filter(a => {
    return getNombre(a).toLowerCase().includes(q);
  });

  if (encontrados.length === 0) {
    lista.innerHTML = `<div class="no-results">No se encontró ningún alumno con ese nombre.</div>`;
    hint.textContent = '';
    return;
  }

  hint.textContent = `${encontrados.length} resultado${encontrados.length !== 1 ? 's' : ''}`;

  lista.innerHTML = encontrados.slice(0, 10).map((a) => {
    const nombre = getNombre(a);
    const id     = campo(a, 'id_alumno', 'Id_alumno', 'id', 'Id');
    // Serializar para pasar al onclick sin perder tildes
    const encoded = encodeURIComponent(JSON.stringify(a));
    return `
      <div class="alumno-row">
        <span class="alumno-nombre">${nombre}</span>
        <button class="btn-confirmar" onclick="confirmarAsistencia('${encoded}')">
          Confirmar
        </button>
      </div>`;
  }).join('');
}

// ─── CONFIRMAR ────────────────────────────────────────────────────────────────
async function confirmarAsistencia(encoded) {
  const alumno = JSON.parse(decodeURIComponent(encoded));
  const idAlumno = campo(alumno, 'id_alumno', 'Id_alumno', 'id', 'Id');
  const nombre   = getNombre(alumno);

  // Deshabilitar todos los botones mientras procesa
  document.querySelectorAll('.btn-confirmar').forEach(b => {
    b.classList.add('loading');
    b.textContent = '...';
  });

  const payload = {
    id_horario_h: claseId ? parseInt(claseId) : null,
    id_alumno: idAlumno,
    fecha: fecha || new Date().toISOString().split('T')[0],
    estado: 'Presente'
  };

  try {
    const res = await fetch(`${API}/api/Registro_asistencia/GuardarRegistro_asistencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    // Mostrar éxito
    document.getElementById('success-name').textContent   = nombre;
    document.getElementById('success-detail').textContent = `Clase #${claseId} · ${fecha || 'Hoy'}`;
    document.getElementById('form-card').style.display    = 'none';
    document.getElementById('success-card').style.display = '';
    mostrarToast('¡Asistencia confirmada!', 'success');

  } catch (err) {
    mostrarToast('Error al registrar. Intenta de nuevo.', 'error');
    document.querySelectorAll('.btn-confirmar').forEach(b => {
      b.classList.remove('loading');
      b.textContent = 'Confirmar';
    });
    console.error(err);
  }
}

// ─── VOLVER ───────────────────────────────────────────────────────────────────
function volverABuscar() {
  document.getElementById('search-input').value = '';
  document.getElementById('results-list').innerHTML = '';
  document.getElementById('hint-text').textContent = '';
  document.getElementById('form-card').style.display   = '';
  document.getElementById('success-card').style.display = 'none';
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function campo(obj, ...claves) {
  for (const c of claves) {
    if (obj[c] !== undefined && obj[c] !== null && obj[c] !== '') return obj[c];
  }
  return '—';
}

function getNombre(a) {
  const completo = campo(a, 'nombre_completo', 'NombreCompleto');
  if (completo !== '—') return completo;
  const nombre   = campo(a, 'nombre',   'Nombre',   'firstName',  'first_name');
  const apellido = campo(a, 'apellido', 'Apellido', 'lastName',   'last_name');
  const n = nombre   !== '—' ? nombre   : '';
  const ap= apellido !== '—' ? apellido : '';
  return `${n} ${ap}`.trim() || 'Alumno';
}

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${tipo}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
