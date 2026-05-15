// ============================================
// CONFIGURACIÓN DE LA API
// ============================================
const API_AULA = `https://controlasistenciaapi.onrender.com/api/Aula`;
// ============================================
// ELEMENTOS DEL DOM
// ============================================
let tableBody = document.getElementById('aulasTableBody');
let btnNuevoAula = document.getElementById('btnNuevoAula');
let modalAula = document.getElementById('modalAula');
let modalDelete = document.getElementById('modalDelete');
let btnGuardarAula = document.getElementById('btnGuardarAula');
let btnCancelarModal = document.getElementById('btnCancelarModal');
let btnConfirmarDelete = document.getElementById('btnConfirmarDelete');
let btnCancelarDelete = document.getElementById('btnCancelarDelete');
let aulaIdInput = document.getElementById('aulaId');
let codigoAulaInput = document.getElementById('codigoAula');
let modalTitle = document.getElementById('modalTitle');
let deleteInfo = document.getElementById('deleteInfo');
let _aulas = [];
// Estado
let isEditing = false;
let pendingDeleteId = null;
let pendingDeleteCodigo = null;
// ============================================
// FUNCIONES PRINCIPALES
// ============================================

// Cargar aulas
// async function loadAulas() {
//     let tableBody = document.getElementById('aulasTableBody');
//     try {
//         tableBody.innerHTML = `<tr class="loading-row"><td colspan="3"><div class="spinner"></div> Cargando aulas...</td></tr>`;

//         const controller = new AbortController();
//         const timeoutId = setTimeout(() => controller.abort(), 8000);

//         const response = await fetch(`${API_AULA}/ObtenerAulas`, {
//             signal: controller.signal
//         });

//         clearTimeout(timeoutId);

//         if (!response.ok) throw new Error(`HTTP ${response.status}`);

//         const data = await response.json();
//         const aulas = Array.isArray(data) ? data : (data.data || []);

//         renderAulasTable(aulas);

//     } catch (error) {
//         console.error('Error:', error);
//         tableBody.innerHTML = `<tr class="loading-row"><td colspan="3">❌ Error al cargar: ${error.message}</td></tr>`;
//     }
// }
async function loadAulas() {
    try {
        const res = await fetch(`${API_AULA}/ObtenerAulas`);
        if (!res.ok) throw new Error('Error al cargar');
        const data = await res.json();
        _aulas = Array.isArray(data) ? data : (data.result ?? data.data ?? []);
        renderAulasTable(_aulas);
    } catch (e) {
        document.getElementById('aulasTableBody').innerHTML =
            `<tr><td colspan="3" class="empty-cell">⚠️ No se pudo conectar con la API.</td></tr>`;
        mostrarToast('Error al cargar materias', 'error');
    }
}

// Renderizar tabla
function renderAulasTable(aulas) {
    let tableBody = document.getElementById('aulasTableBody');
    if (!aulas || aulas.length === 0) {
        tableBody.innerHTML = `<tr class="loading-row"><td colspan="3">📭 No hay aulas registradas</td></tr>`;
        return;
    }
    tableBody.innerHTML = aulas.map(m => `
        <tr>
          <td class="id-cell">${m.id}</td>
          <td>${m.codigo}</td>
          <td>
            <button class="btn-small" onclick="window.editAula(${m.id}, '${escapeHtml(m.codigo)}')">✏️ Editar</button>
          </td>
        </tr>
      `).join('');
}

// Guardar aula
async function saveAula() {
    const codigo = codigoAulaInput.value.trim();
    if (!codigo) {
        mostrarToast('El código del aula es obligatorio', 'error');
        return;
    }

    try {
        let response;
        if (isEditing) {
            const id = parseInt(aulaIdInput.value);
            response = await fetch(`${API_AULA}/EditarAula`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, codigo })
            });
        } else {
            response = await fetch(`${API_AULA}/GuardarAula`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo })
            });
        }

        if (!response.ok) throw new Error('Error al guardar');

        mostrarToast(isEditing ? 'Aula actualizada' : 'Aula creada', 'success');
        closeModalAula();
        loadAulas();

    } catch (error) {
        mostrarToast(`Error: ${error.message}`, 'error');
    }
}

// Eliminar aula
async function deleteAula() {
    if (!pendingDeleteId) return;

    try {
        const response = await fetch(`${API_AULA}/EliminarAula`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pendingDeleteId })
        });

        if (!response.ok) throw new Error('Error al eliminar');

        mostrarToast('Aula eliminada', 'success');
        closeModalDelete();
        loadAulas();

    } catch (error) {
        mostrarToast(`Error: ${error.message}`, 'error');
    }
}

// ============================================
// MODALES
// ============================================

function openModalAula() {
    modalAula.classList.add('open');
}

function closeModalAula() {
    modalAula.classList.remove('open');
    resetForm();
}

function openDeleteModal(id, codigo) {
    pendingDeleteId = id;
    pendingDeleteCodigo = codigo;
    deleteInfo.innerHTML = `📌 Aula: <strong>${escapeHtml(codigo)}</strong>`;
    modalDelete.classList.add('open');
}

function closeModalDelete() {
    modalDelete.classList.remove('open');
    pendingDeleteId = null;
    pendingDeleteCodigo = null;
}

function resetForm() {
    isEditing = false;
    aulaIdInput.value = '';
    codigoAulaInput.value = '';
    modalTitle.textContent = '➕ Nueva Aula';
}
// Editar aula (global para onclick)
window.editAula = function (id, codigo) {
    isEditing = true;
    aulaIdInput.value = id;
    codigoAulaInput.value = codigo;
    modalTitle.textContent = '✏️ Editar Aula';
    openModalAula();
};

window.openDeleteModal = openDeleteModal;

// ============================================
// UTILS
// ============================================

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function mostrarToast(msg, tipo = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${tipo}`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
// ============================================
// EVENTOS
// ============================================
document.getElementById("btnNuevoAula").addEventListener('click', function () {
    openModalAula();
    resetForm();
});

document.getElementById("btnCancelarModal").addEventListener('click', closeModalAula);
document.getElementById("btnConfirmarDelete").addEventListener('click', deleteAula);
document.getElementById("btnCancelarDelete").addEventListener('click', closeModalDelete);

// Cerrar modal al hacer clic fuera
document.getElementById("modalAula").addEventListener('click', function () {
    //if (e.target === document.getElementById("modalAula")) 
    closeModalAula();
});
document.getElementById("modalDelete").addEventListener('click', function () {
    //if (e.target === document.getElementById("modalDelete")) 
    closeModalDelete();
});

// Inicializar
loadAulas();


