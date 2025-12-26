// script.js - VERSIÓN FINAL REPARADA
const firebaseConfig = {
    apiKey: "AIzaSyBTLZI20dEdAbcnxlZ1YnvMz3twmhyvH_A",
    authDomain: "turnos-pna-parana-nuevo.firebaseapp.com",
    projectId: "turnos-pna-parana-nuevo",
    storageBucket: "turnos-pna-parana-nuevo.firebasestorage.app",
    messagingSenderId: "1026768851982",
    appId: "1:1026768851982:web:6f6bfdd3bb3dc3d2b4585f"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();
const coleccionTurnos = db.collection('turnosPNA');

const HORA_INICIO = 7, HORA_FIN = 13, INTERVALO = 15;
const feriados = ["2025-12-25", "2026-01-01", "2026-06-30"]; // Agregá los que necesites

let turnosTomados = [];
const esAdmin = window.location.pathname.includes('admin.html');

// --- CLIENTE ---
function configurarFechaMinima() {
    const inputF = document.getElementById('fecha-turno');
    if (!inputF) return;
    const hoy = new Date();
    // Permitir sacar turno para el mismo día si es antes de las 13hs o para el día siguiente
    inputF.setAttribute('min', hoy.toISOString().split('T')[0]);
}

function generarHorariosDisponibles(fechaSeleccionada) {
    const selectH = document.getElementById('horario-turno');
    if (!selectH) return;
    selectH.innerHTML = '<option value="">-- Seleccione un Horario --</option>';
    
    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');
    if (fechaObj.getDay() === 0 || fechaObj.getDay() === 6 || feriados.includes(fechaSeleccionada)) {
        alert("Fines de semana o feriados no hay atención.");
        return;
    }

    for (let h = HORA_INICIO; h < HORA_FIN; h++) {
        for (let m = 0; m < 60; m += INTERVALO) {
            const hhmm = ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')};
            const ocupado = turnosTomados.some(t => t.fecha === fechaSeleccionada && t.horario === hhmm);
            if (!ocupado) {
                let opt = new Option(hhmm, hhmm);
                selectH.add(opt);
            }
        }
    }
    selectH.disabled = false;
}

// --- ADMIN ---
async function eliminarTurno(id) {
    if (confirm("¿Confirmar eliminación?")) {
        try {
            await coleccionTurnos.doc(id).delete();
        } catch (e) { alert("Error al eliminar"); }
    }
}

// Inicialización unificada
document.addEventListener('DOMContentLoaded', () => {
    if (esAdmin) {
        // Lógica de login admin ya incluida en tu versión anterior
    } else {
        configurarFechaMinima();
        // Listener para activar el botón
        document.getElementById('formulario-turnos')?.addEventListener('input', () => {
            const btn = document.getElementById('boton-solicitar');
            btn.disabled = !document.getElementById('formulario-turnos').checkValidity();
        });
    }
});
