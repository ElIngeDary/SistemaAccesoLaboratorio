// ═══════════════════════════════════════════════
//  CONFIGURACIÓN
// ═══════════════════════════════════════════════
const API_BASE  = '/api';
const TIME_SLOTS = [
  '07:00-08:00','08:00-09:00','09:00-10:00',
  '10:00-11:00','11:00-12:00','12:00-13:00',
  '13:00-14:00','14:00-15:00','15:00-16:00',
  '16:00-17:00'
];
const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

let schedules = [];
let editingId = null;

// ═══════════════════════════════════════════════
//  API — funciones que hablan con Flask
// ═══════════════════════════════════════════════
async function apiGet(lab) {
  const res = await fetch(`${API_BASE}/horarios?lab=${encodeURIComponent(lab)}`);
  return res.json();
}

async function apiPost(data) {
  const res = await fetch(`${API_BASE}/horarios`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data)
  });
  return res.json();
}

async function apiPut(id, data) {
  const res = await fetch(`${API_BASE}/horarios/${id}`, {
    method : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data)
  });
  return res.json();
}

async function apiDelete(id) {
  const res = await fetch(`${API_BASE}/horarios/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

// ═══════════════════════════════════════════════
//  UTILIDADES
// ═══════════════════════════════════════════════
function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}


// Funcion Banner de Conflictos
function detectConflicts() {
  // Resetear estado de conflicto en todos
  schedules.forEach(s => s.conflict = false);
  
  if (schedules.length < 2) {
    document.getElementById('conflictAlert').style.display = 'none';
    return;
  }

  let foundConflict = false;
  let conflictInfo = "";

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i], b = schedules[j];
      
      if (a.dia === b.dia) {
        const aS = timeToMin(a.inicio), aE = timeToMin(a.fin);
        const bS = timeToMin(b.inicio), bE = timeToMin(b.fin);
        
        if (aS < bE && bS < aE) {
          a.conflict = true;
          b.conflict = true;
          foundConflict = true;
          conflictInfo = `"${a.nombre}" y "${b.nombre}"`;
        }
      }
    }
  }

  const alertDiv = document.getElementById('conflictAlert');
  if (foundConflict) {
    document.getElementById('conflictMsg').textContent = 
      `CONFLICTO DETECTADO: Los horarios de ${conflictInfo} se cruzan.`;
    alertDiv.style.display = 'flex';
  } else {
    alertDiv.style.display = 'none';
  }
}
// ═══════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════
function render() {
  detectConflicts();
  const body = document.getElementById('schedBody');
  body.innerHTML = '';
  const ocupadas = new Set();

  TIME_SLOTS.forEach((slot, rowIdx) => {
    const tr = document.createElement('tr');
    const tdTime = document.createElement('td');
    tdTime.textContent = slot;
    tr.appendChild(tdTime);

    DAYS.forEach((_, dIdx) => {
      const key = `${rowIdx}-${dIdx}`;
      if (ocupadas.has(key)) return;

      const [slotStart, slotEnd] = slot.split('-');
      const sStartMin = timeToMin(slotStart);
      const sEndMin   = timeToMin(slotEnd);

      
      const ev = schedules.find(s => {
        if (s.dia !== dIdx) return false;
        const evStart = timeToMin(s.inicio);
        return (evStart >= sStartMin && evStart < sEndMin);
      });

      const td = document.createElement('td');

      if (ev) {
        const startMin = timeToMin(ev.inicio);
        const endMin   = timeToMin(ev.fin);
        let span = 0;

        // Calculamos cuántas filas debe ocupar según su duración real
        for (let r = rowIdx; r < TIME_SLOTS.length; r++) {
          const [rowS, rowE] = TIME_SLOTS[r].split('-');
          const rowStartMin = timeToMin(rowS);
          const rowEndMin   = timeToMin(rowE);

          if (startMin < rowEndMin && endMin > rowStartMin) {
            span++;
            ocupadas.add(`${r}-${dIdx}`);
          } else {
            break;
          }
        }

        td.rowSpan = Math.max(span, 1);
        td.style.padding = '0';
        
        // CONTENEDOR-HORARIOS
        const cellInner = document.createElement('div');
        cellInner.className = 'cell-inner';
        cellInner.style.height = '100%'; 
        cellInner.style.width = '100%';
        cellInner.style.position = 'relative';

        const card = document.createElement('div');
        card.className = `event-card ${ev.tipo}${ev.conflict ? ' conflict-ring' : ''}`;
        
        
        card.innerHTML = `
          <div class="ev-time">
            <span>${ev.inicio}–${ev.fin}</span>
            <div class="ev-actions">
              <button title="Editar" onclick="editEvent(${ev.id}); event.stopPropagation();"><i class="fas fa-pen"></i></button>
              <button title="Eliminar" onclick="deleteEvent(${ev.id}); event.stopPropagation();"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="ev-name">${ev.nombre}</div>
          ${ev.docente ? `<div class="ev-sub">(${ev.docente})</div>` : ''}
        `;

        cellInner.appendChild(card);
        td.appendChild(cellInner);
      }

      tr.appendChild(td);
    });

    body.appendChild(tr);
  });
}

// ═══════════════════════════════════════════════
//  CARGAR datos desde Flask
// ═══════════════════════════════════════════════
async function cargarHorarios() {
  const lab = document.getElementById('selLab').value;
  if (!lab) return; // Seguridad por si el select está vacío al inicio

  try {
    // La API solo recibe el lab ahora
    schedules = await apiGet(lab);
    render();
  } catch (e) {
    console.error(e);
    showToast('⚠ Error al conectar con el servidor');
  }
}

// ═══════════════════════════════════════════════
//  CRUD
// ═══════════════════════════════════════════════
let idToDelete = null;


async function deleteEvent(id) {
    const ev = schedules.find(s => s.id === id);
    if (!ev) return;

    idToDelete = id;
    
    // Mostramos info relevante en el modal usando tus constantes DAYS
    document.getElementById('deleteDetails').innerHTML = 
        `<strong>${ev.nombre}</strong><br>${DAYS[ev.dia]} | ${ev.inicio} - ${ev.fin}`;

    document.getElementById('modalConfirmDelete').classList.add('open');
}

function closeDeleteModal() {
    document.getElementById('modalConfirmDelete').classList.remove('open');
    idToDelete = null;
}

// Listeners
document.getElementById('btnCancelDelete').onclick = closeDeleteModal;

document.getElementById('btnConfirmDelete').onclick = async () => {
    if (idToDelete) {
        await apiDelete(idToDelete); //
        showToast('Horario eliminado con éxito ✓');
        closeDeleteModal();
        cargarHorarios();
    }
};


document.getElementById('modalConfirmDelete').onclick = (e) => {
    if (e.target.id === 'modalConfirmDelete') closeDeleteModal();
};

function editEvent(id) {
  const ev = schedules.find(s => s.id === id);
  if (!ev) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Editar Horario';
  document.getElementById('fNombre').value  = ev.nombre;
  document.getElementById('fTipo').value    = ev.tipo;
  document.getElementById('fDia').value     = ev.dia;
  document.getElementById('fInicio').value  = ev.inicio;
  document.getElementById('fFin').value     = ev.fin;
  document.getElementById('fDocente').value = ev.docente || '';
  document.getElementById('fLab').value     = ev.lab;
  openModal();
}

// ═══════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════
function openModal() {
  document.getElementById('modalBackdrop').classList.add('open');
}
function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Horario';
  document.getElementById('fNombre').value  = '';
  document.getElementById('fDocente').value = '';
  document.getElementById('fInicio').value  = '08:00';
  document.getElementById('fFin').value     = '10:00';
  document.getElementById('fTipo').value    = 'ev-curso';
  document.getElementById('fDia').value     = '0';
}

document.getElementById('btnNuevo').addEventListener('click', () => {
  editingId = null;
  document.getElementById('fLab').value = document.getElementById('selLab').value;
  openModal();
});
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
});

document.getElementById('btnSave').addEventListener('click', async () => {
  const nombre  = document.getElementById('fNombre').value.trim();
  const tipo    = document.getElementById('fTipo').value;
  const dia     = parseInt(document.getElementById('fDia').value);
  const inicio  = document.getElementById('fInicio').value;
  const fin     = document.getElementById('fFin').value;
  const docente = document.getElementById('fDocente').value.trim();
  const lab     = document.getElementById('fLab').value;

  if (!nombre) { showToast('⚠ Ingrese un nombre'); return; }
  if (inicio >= fin) { showToast('⚠ La hora fin debe ser mayor'); return; }

  // ─── VALIDACIÓN PREVENTIVA DE CONFLICTOS ─────────────────
  const aS = timeToMin(inicio);
  const aE = timeToMin(fin);

  const conflicto = schedules.find(s => {
    
    if (editingId !== null && s.id === editingId) return false;
    
   
    if (s.dia === dia && s.lab === lab) {
      const bS = timeToMin(s.inicio);
      const bE = timeToMin(s.fin);
      // Lógica de solapamiento: (InicioA < FinB) Y (InicioB < FinA)
      return (aS < bE && bS < aE);
    }
    return false;
  });

  if (conflicto) {
    const msg = `CONFLICTO: "${nombre}" choca con "${conflicto.nombre}" (${conflicto.inicio}-${conflicto.fin})`;
    document.getElementById('conflictMsg').textContent = msg;
    document.getElementById('conflictAlert').style.display = 'flex';
    showToast('⚠ No se puede guardar: Conflicto de horario');
    return; 
  }
  // ─────────────────────────────────────────────────────────

  // Si no hubo conflicto, procedemos a guardar
  try {
    if (editingId !== null) {
      await apiPut(editingId, { nombre, tipo, dia, inicio, fin, docente, lab });
      showToast('Horario actualizado ✓');
    } else {
      await apiPost({ nombre, tipo, dia, inicio, fin, docente, lab });
      showToast('Horario creado ✓');
    }
    
    // Si la operación fue exitosa
    closeModal();
    cargarHorarios();
  } catch (error) {
    showToast('⚠ Error al guardar en el servidor');
  }
});

// ═══════════════════════════════════════════════
//  FILTROS
// ═══════════════════════════════════════════════
document.getElementById('selLab').addEventListener('change', cargarHorarios);


// ═══════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ═══════════════════════════════════════════════
//  CERRAR ALERTA
// ═══════════════════════════════════════════════
document.getElementById('conflictAlert')
  .querySelector('.close-btn')
  .addEventListener('click', () => {
    document.getElementById('conflictAlert').style.display = 'none';
  });

// ═══════════════════════════════════════════════
//  INICIO
// ═══════════════════════════════════════════════
cargarHorarios();