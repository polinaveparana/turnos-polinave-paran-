// script.js - VERSIÓN CORREGIDA PARA GITHUB PAGES
const firebaseConfig = {
    apiKey: "AIzaSyDKTwF1m_kejyna5sN6wyBOO32A31hCl8o",
    authDomain: "turnos-pna-oficial-2.firebaseapp.com",
    projectId: "turnos-pna-oficial-2",
    storageBucket: "turnos-pna-oficial-2.firebasestorage.app",
    messagingSenderId: "353332868164",
    appId: "1:353332868164:web:147479d2108e27753bb811"
};

// Inicialización de Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); 
const coleccionTurnos = db.collection('turnosPNA');

const HORA_INICIO = 7, HORA_FIN = 13, INTERVALO = 15;
const feriados = ["2026-01-01", "2026-02-16", "2026-02-17", "2026-03-24", "2026-04-02", "2026-04-03", "2026-05-01", "2026-05-25", "2026-06-15", "2026-06-20", "2026-07-09", "2026-08-17", "2026-10-12", "2026-11-20", "2026-12-08", "2026-12-25"];

let turnosTomados = [];
// Corregido: Detección más robusta para GitHub
const esAdmin = window.location.href.includes('admin.html');
const esVisor = window.location.href.includes('visor.html');

// --- FUNCIÓN DIBUJAR TABLA ---
function dibujarTabla(f, conAcciones) {
    const idCont = conAcciones ? 'contenedor-tabla' : 'contenedor-tabla-visor';
    const idTotal = conAcciones ? 'total-turnos' : 'total-turnos-visor';
    const cont = document.getElementById(idCont);
    if (!cont) return;

    const hoy = new Date().toISOString().split('T')[0];
    const fecha = f || hoy;
    const lista = turnosTomados.filter(t => t.fecha === fecha).sort((a,b) => a.horario.localeCompare(b.horario));
    
    document.getElementById(idTotal).textContent = `Turnos (${fecha}): ${lista.length}`;
    
    let html = `<table class="tabla-turnos"><thead><tr><th>Hora</th><th>Nombre</th><th>DNI</th><th>Trámite</th>${conAcciones ? '<th>Acción</th>' : ''}</tr></thead><tbody>`;
    lista.forEach(t => {
        html += `<tr><td><strong>${t.horario}</strong></td><td>${t.nombre}</td><td>${t.dni}</td><td style="font-size: 12px;">${t.tramite}</td>${conAcciones ? `<td><button class="btn-eliminar-admin" onclick="borrarT('${t.id}')">Eliminar</button></td>` : ''}</tr>`;
    });
    cont.innerHTML = html + '</tbody></table>';
}

// --- LÓGICA DE RUTAS ---
if (esAdmin) {
    const initAdmin = () => {
        const areaLogin = document.getElementById('area-login');
        const dashboard = document.getElementById('dashboard-contenido');
        if(areaLogin) areaLogin.style.display = 'none';
        if(dashboard) dashboard.style.display = 'block';
        
        coleccionTurnos.onSnapshot(snap => {
            turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
            const filtro = document.getElementById('filtro-fecha');
            dibujarTabla(filtro ? filtro.value : null, true);
        }, err => console.error("Error Firestore Admin:", err));
    };

    auth.onAuthStateChanged(user => { if (user) initAdmin(); });

    const btnLogin = document.getElementById('btn-login');
    if(btnLogin) btnLogin.onclick = async () => {
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, pass);
            initAdmin();
        } catch (e) { alert("Acceso denegado."); }
    };

    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) btnLogout.onclick = () => { auth.signOut().then(() => location.reload()); };
    
    const filtroF = document.getElementById('filtro-fecha');
    if(filtroF) filtroF.onchange = (e) => dibujarTabla(e.target.value, true);

} else if (esVisor) {
    const fVisor = document.getElementById('filtro-fecha-visor');
    if(fVisor) {
        fVisor.value = new Date().toISOString().split('T')[0];
        coleccionTurnos.onSnapshot(snap => {
            turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
            dibujarTabla(fVisor.value, false);
        });
        fVisor.onchange = (e) => dibujarTabla(e.target.value, false);
    }
} else {
    // LÓGICA PÚBLICA (index.html)
    const fInput = document.getElementById('fecha-turno');
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);
    
    if(fInput) {
        fInput.setAttribute('min', mañana.toISOString().split('T')[0]);
        fInput.onchange = (e) => { 
            generarHorarios(e.target.value); 
            validarBoton(); 
        };
    }

    const validarBoton = () => {
        const btn = document.getElementById('boton-solicitar');
        if (!btn) return;
        const campos = ['tipo-tramite', 'fecha-turno', 'horario-turno', 'nombre-solicitante', 'dni-solicitante', 'correo-solicitante'];
        btn.disabled = campos.some(id => !document.getElementById(id)?.value.trim());
    };

    document.querySelectorAll('input, select').forEach(el => el.oninput = validarBoton);

    // Escuchar cambios en tiempo real
    coleccionTurnos.onSnapshot(snap => {
        turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
        if (fInput && fInput.value) generarHorarios(fInput.value);
    }, err => console.error("Error Firestore Público:", err));

    const btnSolicitar = document.getElementById('boton-solicitar');
    if(btnSolicitar) btnSolicitar.onclick = async () => {
        btnSolicitar.disabled = true;
        const data = {
            tramite: document.getElementById('tipo-tramite').value,
            fecha: fInput.value,
            horario: document.getElementById('horario-turno').value,
            nombre: document.getElementById('nombre-solicitante').value.trim(),
            dni: document.getElementById('dni-solicitante').value.trim(),
            correo: document.getElementById('correo-solicitante').value.trim(),
            creado: new Date().toLocaleString('es-AR')
        };
        try { 
            await coleccionTurnos.add(data); 
            fetch("https://script.google.com/macros/s/AKfycbyjMXTqTetcLfD0a9URH9zQr-h0O6QcadSYDxQFaILG3ec2hYAZGmxHrqRLXXVSOzPn/exec", {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify(data)
            });
            alert("✅ Turno Confirmado."); 
            location.reload(); 
        } catch (e) { 
            alert("Error al guardar."); 
            btnSolicitar.disabled = false; 
        }
    };
}

function generarHorarios(fechaSeleccionada) {
    const select = document.getElementById('horario-turno');
    const err = document.getElementById('mensaje-error');
    if (!select) return;

    select.innerHTML = '<option value="">-- Seleccione --</option>';
    select.disabled = true;
    if (err) err.style.display = 'none';

    if (!fechaSeleccionada) return;

    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');
    // Bloqueo Fines de Semana (0=Dom, 6=Sab)
    if (feriados.includes(fechaSeleccionada) || fechaObj.getDay() === 0 || fechaObj.getDay() === 6) {
        if (err) { 
            err.textContent = "Día no hábil (Sábado, Domingo o Feriado)."; 
            err.style.display = 'block'; 
        }
        return;
    }

    for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
        for (let m = 0; m < 60; m += INTERVALO) {
            if (h === HORA_FIN && m > 0) break;
            const hhmm = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            // Verificar disponibilidad
            const ocupado = turnosTomados.some(t => t.fecha === fechaSeleccionada && t.horario === hhmm);
            if (!ocupado) {
                const opt = document.createElement('option');
                opt.value = hhmm; opt.textContent = hhmm;
                select.appendChild(opt);
            }
        }
    }
    select.disabled = false;
}

window.borrarT = async (id) => { if (confirm("¿Eliminar turno?")) await coleccionTurnos.doc(id).delete(); };
