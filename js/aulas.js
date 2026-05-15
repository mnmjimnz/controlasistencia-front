// ============================================
// CONFIGURACIÓN DE LA API
// ============================================
const API_BASE_URL = 'https://controlasistenciaapi.onrender.com';
const API_AULA = `${API_BASE_URL}/api/Aula`;

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const tableBody = document.getElementById('aulasTableBody');
const btnNuevoAula = document.getElementById('btnNuevoAula');
const modalAula = document.getElementById('modalAula');
const modalDelete = document.getElementById('modalDelete');
const btnGuardarAula = document.getElementById('btnGuardarAula');
const btnCancelarModal = document.getElementById('btnCancelarModal');
const btnConfirmarDelete = document.getElementById('btnConfirmarDelete');
const btnCancelarDelete = document.getElementById('btnCancelarDelete');
const aulaIdInput = document.getElementById('aulaId');
const codigoAulaInput = document.getElementById('codigoAula');
const modalTitle = document.getElementById('modalTitle');
const deleteInfo = document.getElementById('deleteInfo');

// Estado
let isEditing = false;
let pendingDeleteId = null;
let pendingDeleteCodigo = null;

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

// Cargar aulas
async function loadAulas() {
    try {
        tableBody.innerHTML = `<tr class="loading-row"><td colspan="3"><div class="spinner"></div> Cargando aulas...</td></tr>`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`${API_AULA}/ObtenerAulas`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const aulas = Array.isArray(data) ? data : (data.data || []);
        
        renderAulasTable(aulas);
        
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `<tr class="loading-row"><td colspan="3">❌ Error al cargar: ${error.message}</td></tr>`;
    }
}

// Renderizar tabla
function renderAulasTable(aulas) {
    if (!aulas || aulas.length === 0) {
        tableBody.innerHTML = `<tr class="loading-row"><td colspan="3">📭 No hay aulas registradas</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = '';
    aulas.forEach(aula => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(String(aula.id))}</td>
            <td><strong>${escapeHtml(aula.codigo)}</strong></td>
            <td>
                <button class="btn-small" onclick="window.editAula(${aula.id}, '${escapeHtml(aula.codigo)}')">✏️ Editar</button>
                <!--- <button class="btn-delete" onclick="window.openDeleteModal(${aula.id}, '${escapeHtml(aula.codigo)}')">🗑️ Eliminar</button> --->
            </td>
        `;
        tableBody.appendChild(row);
    });
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
window.editAula = function(id, codigo) {
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

// ============================================
// EVENTOS
// ============================================

btnNuevoAula.addEventListener('click', () => {
    resetForm();
    openModalAula();
});

btnGuardarAula.addEventListener('click', saveAula);
btnCancelarModal.addEventListener('click', closeModalAula);
btnConfirmarDelete.addEventListener('click', deleteAula);
btnCancelarDelete.addEventListener('click', closeModalDelete);

// Cerrar modal al hacer clic fuera
modalAula.addEventListener('click', (e) => {
    if (e.target === modalAula) closeModalAula();
});
modalDelete.addEventListener('click', (e) => {
    if (e.target === modalDelete) closeModalDelete();
});

// Enter en el input
codigoAulaInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveAula();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadAulas();
});

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${tipo}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}