const API_BASE = 'https://controlasistenciaapi.onrender.com/api/Materia';
let materias = [];
let editandoId = null;


// function showToast(msg, tipo = 'ok') {
//   const t = document.getElementById('toast');
//   t.textContent = msg;
//   t.className = 'toast show' + (tipo === 'error' ? ' error' : '');
//   setTimeout(() => t.className = 'toast', 3000);
// }
function mostrarToast(msg, tipo = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${tipo}`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
function openModal(modo, materia = null) {
    editandoId = materia ? materia.id : null;
    document.getElementById('modal-titulo').textContent = materia ? 'Editar Materia' : 'Nueva Materia';
    document.getElementById('modal-sub').textContent = materia
        ? `Editando ID #${materia.id}`
        : 'Completa los datos para guardar';
    document.getElementById('input-nombre').value = materia ? materia.nombre : '';
    document.getElementById('modal-overlay').classList.add('open');
    setTimeout(() => document.getElementById('input-nombre').focus(), 200);
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    editandoId = null;
}


function renderTabla(lista) {
    const body = document.getElementById('tabla-body');
    if (!lista.length) {
        body.innerHTML = `<tr><td colspan="3" class="empty-cell">No se encontraron materias.</td></tr>`;
        return;
    }
    body.innerHTML = lista.map(m => `
        <tr>
          <td class="id-cell">${m.id}</td>
          <td>${m.nombre}</td>
          <td style="text-align:center">
            <button class="btn-small" onclick="abrirEditar(${m.id})">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
          </td>
        </tr>
      `).join('');
}


async function cargarMaterias() {
    try {
        const res = await fetch(`${API_BASE}/ObtenerMaterias`);
        if (!res.ok) throw new Error('Error al cargar');
        const data = await res.json();
        materias = Array.isArray(data) ? data : (data.result ?? data.data ?? []);
        renderTabla(materias);
    } catch (e) {
        document.getElementById('tabla-body').innerHTML =
            `<tr><td colspan="3" class="empty-cell">⚠️ No se pudo conectar con la API.</td></tr>`;
        mostrarToast('Error al cargar materias', 'error');
    }
}

async function guardarMateria() {
    const nombre = document.getElementById('input-nombre').value.trim();
    if (!nombre) { mostrarToast('El nombre no puede estar vacío', 'error'); return; }

    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
        let res;
        if (editandoId) {
            // EDITAR
            res = await fetch(`${API_BASE}/EditarMateria`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editandoId, nombre })
            });
        } else {
            // CREAR
            res = await fetch(`${API_BASE}/GuardarMateria`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });
        }

        if (!res.ok) throw new Error('Error en la respuesta');
        closeModal();
        mostrarToast(editandoId ? 'Materia actualizada' : 'Materia guardada', 'success');
        await cargarMaterias();
    } catch (e) {
        mostrarToast('Error al guardar la materia', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar`;
    }
}


function buscar() {
    const q = document.getElementById('input-buscar').value.trim().toLowerCase();
    if (!q) { renderTabla(materias); return; }
    renderTabla(materias.filter(m => m.nombre.toLowerCase().includes(q)));
}




// document.getElementById('btn-nueva').addEventListener('click', () => openModal('nuevo'));
// document.getElementById('btn-cancelar').addEventListener('click', closeModal);
// document.getElementById('btn-guardar').addEventListener('click', guardarMateria);
// document.getElementById('btn-buscar').addEventListener('click', buscar);
// document.getElementById('btn-limpiar').addEventListener('click', () => {
//     document.getElementById('input-buscar').value = '';
//     renderTabla(materias);
// });
// document.getElementById('input-buscar').addEventListener('keydown', e => {
//     if (e.key === 'Enter') buscar();
// });
// document.getElementById('modal-overlay').addEventListener('click', e => {
//     if (e.target === e.currentTarget) closeModal();
// });
// document.getElementById('input-nombre').addEventListener('keydown', e => {
//     if (e.key === 'Enter') guardarMateria();
// });


// cargarMaterias();

document.getElementById('btn-nueva')
    .addEventListener('click', () => openModal('nuevo'));

document.getElementById('btn-cancelar')
    .addEventListener('click', closeModal);

document.getElementById('btn-guardar')
    .addEventListener('click', guardarMateria);

document.getElementById('btn-buscar')
    .addEventListener('click', buscar);

document.getElementById('btn-limpiar')
    .addEventListener('click', () => {

        document.getElementById('input-buscar').value = '';
        renderTabla(materias);

    });

document.getElementById('input-buscar')
    .addEventListener('keydown', e => {

        if (e.key === 'Enter') buscar();

    });

document.getElementById('modal-overlay')
    .addEventListener('click', e => {

        if (e.target === e.currentTarget)
            closeModal();

    });

document.getElementById('input-nombre')
    .addEventListener('keydown', e => {

        if (e.key === 'Enter')
            guardarMateria();

    });
window.abrirEditar = (id) => {
    const m = materias.find(x => x.id === id);
    if (m) openModal('editar', m);
};

cargarMaterias();