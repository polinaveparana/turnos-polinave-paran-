// script.js - VERSIÓN CON VISOR Y DESCARGA
const firebaseConfig = {
    apiKey: "AIzaSyBTLZI20dEdAbcnxlZ1YnvMz3twmhyvH_A",
    authDomain: "turnos-pna-parana-nuevo.firebaseapp.com",
    projectId: "turnos-pna-parana-nuevo",
    storageBucket: "turnos-pna-parana-nuevo.firebasestorage.app",
    messagingSenderId: "1026768851982",
    appId: "1:1026768851982:web:6f6bfdd3bb3dc3d2b4585f"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const coleccionTurnos = db.collection('turnosPNA');

const HORA_INICIO = 7, HORA_FIN = 13, INTERVALO = 15;
const feriados = ["2026-01-01", "2026-02-16", "2026-02-17", "2026-03-24", "2026-04-02", "2026-04-03", "2026-05-01", "2026-05-25", "2026-06-15", "2026-06-20", "2026-07-09", "2026-08-17", "2026-10-12", "2026-11-20", "2026-12-08", "2026-12-25"];

let turnosTomados = [];
const ruta = window.location.pathname;

// --- LÓGICA DE DESCARGA (CSV para Excel) ---
function descargarCSV(fecha) {
    const lista = turnosTomados.filter(t => t.fecha === fecha).sort((a,b) => a.horario.localeCompare(b.horario));
    if (lista.length === 0) return alert("No hay turnos para descargar en esta fecha.");

    let csvContent = "data:text/csv;charset=utf-8,HORA,NOMBRE,DNI,TRAMITE\n";
    lista.forEach(t => {
        csvContent += `${t.horario},${t.nombre},${t.dni},${t.tramite}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `turnos_pna_${fecha}.csv`);
    document.body.appendChild(link);
    link.click();
}

// --- INICIALIZACIÓN SEGÚN PÁGINA ---
if (ruta.includes('admin.html')) {
    const PIN = "PNA2025parana";
    const initAdmin = () => {
        document.getElementById('area-login').style.display = 'none';
        document.getElementById('dashboard-contenido').style.display = 'block';
        coleccionTurnos.onSnapshot(snap => {
            turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
            dibujarTabla(document.getElementById('filtro-fecha').value, true);
        });
    };
    if (localStorage.getItem('admin_pna_auth') === 'true') initAdmin();
    document.getElementById('btn-login').onclick = () => {
        if (document.getElementById('admin-pin').value === PIN) { localStorage.setItem('admin_pna_auth', 'true'); initAdmin(); }
        else alert("PIN Incorrecto");
    };
    document.getElementById('btn-logout').onclick = () => { localStorage.removeItem('admin_pna_auth'); location.reload(); };
    document.getElementById('filtro-fecha').onchange = (e) => dibujarTabla(e.target.value, true);
    document.getElementById('btn-descargar').onclick = () => descargarCSV(document.getElementById('filtro-fecha').value || new Date().toISOString().split('T')[0]);

} else if (ruta.includes('visor.html')) {
    const fVisor = document.getElementById('filtro-fecha-visor');
    fVisor.value = new Date().toISOString().split('T')[0];
    coleccionTurnos.onSnapshot(snap => {
        turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
        dibujarTabla(fVisor.value, false);
    });
    fVisor.onchange = (e) => dibujarTabla(e.target.value, false);

} else {
    // Lógica del index.html (Solicitud de turnos) - Igual que antes
    const fInput = document.getElementById('fecha-turno');
    const mañana = new Date(); mañana.setDate(mañana.getDate() + 1);
    fInput.setAttribute('min', mañana.toISOString().split('T')[0]);
    fInput.onchange = (e) => { generarHorarios(e.target.value); };
    coleccionTurnos.onSnapshot(snap => {
        turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
        if (fInput.value) generarHorarios(fInput.value);
    });
    // ... (resto de funciones validarBoton, generarHorarios y solicitar que ya tenías)
}

function dibujarTabla(f, conAcciones) {
    const idCont = conAcciones ? 'contenedor-tabla' : 'contenedor-tabla-visor';
    const idTotal = conAcciones ? 'total-turnos' : 'total-turnos-visor';
    const cont = document.getElementById(idCont);
    const hoy = new Date().toISOString().split('T')[0];
    const fecha = f || hoy;
    const lista = turnosTomados.filter(t => t.fecha === fecha).sort((a,b) => a.horario.localeCompare(b.horario));
    
    document.getElementById(idTotal).textContent = `Turnos (${fecha}): ${lista.length}`;
    
    let html = '<table class="tabla-turnos"><thead><tr><th>Hora</th><th>Nombre</th>' + (conAcciones ? '<th>Acción</th>' : '') + '</tr></thead><tbody>';
    lista.forEach(t => {
        html += `<tr><td>${t.horario}</td><td>${t.nombre}</td>`;
        if (conAcciones) html += `<td><button class="btn-eliminar-admin" onclick="borrarT('${t.id}')">Eliminar</button></td>`;
        html += `</tr>`;
    });
    cont.innerHTML = html + '</tbody></table>';
}

window.borrarT = async (id) => { if (confirm("¿Eliminar turno?")) await coleccionTurnos.doc(id).delete(); };

// --- FUNCIÓN GENERAR HORARIOS (Pegar aquí la que ya tenías corregida) ---
function generarHorarios(fechaSeleccionada) {
    const select = document.getElementById('horario-turno');
    const err = document.getElementById('mensaje-error');
    if (!select) return;
    select.innerHTML = '<option value="">-- Seleccione un Horario --</option>';
    select.disabled = true;
    if (err) err.style.display = 'none';
    if (!fechaSeleccionada) return;
    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');
    const diaSemana = fechaObj.getDay(); 
    if (feriados.includes(fechaSeleccionada) || diaSemana === 0 || diaSemana === 6) {
        if (err) { err.textContent = "Día no hábil."; err.style.display = 'block'; }
        return;
    }
    for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
        for (let m = 0; m < 60; m += INTERVALO) {
            if (h === HORA_FIN && m > 0) break;
            const hhmm = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            if (!turnosTomados.some(t => t.fecha === fechaSeleccionada && t.horario === hhmm)) {
                const opt = document.createElement('option');
                opt.value = hhmm; opt.textContent = hhmm;
                select.appendChild(opt);
            }
        }
    }
    select.disabled = false;
}
