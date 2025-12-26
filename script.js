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

const feriados = [
    "2026-01-01", "2026-02-16", "2026-02-17", "2026-03-24", "2026-04-02", "2026-04-03", 
    "2026-05-01", "2026-05-25", "2026-06-15", "2026-06-20", "2026-07-09", "2026-08-17", 
    "2026-10-12", "2026-11-20", "2026-12-08", "2026-12-25"
];

let turnosTomados = [];
const esAdmin = window.location.pathname.includes('admin.html');

function validarBoton() {
    const btn = document.getElementById('boton-solicitar');
    if (!btn) return;
    const campos = ['tipo-tramite', 'fecha-turno', 'horario-turno', 'nombre-solicitante', 'dni-solicitante', 'correo-solicitante'];
    const incompleto = campos.some(id => !document.getElementById(id)?.value.trim());
    btn.disabled = incompleto;
}

function generarHorarios(fechaSeleccionada) {
    const select = document.getElementById('horario-turno');
    const err = document.getElementById('mensaje-error');
    if (!select) return;

    select.innerHTML = '<option value="">-- Seleccione un Horario --</option>';
    select.disabled = true;
    if (err) { err.style.display = 'none'; err.textContent = ""; }

    if (!fechaSeleccionada) return;

    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');
    const diaSemana = fechaObj.getDay(); 

    const esFeriado = feriados.includes(fechaSeleccionada);
    const esFinDeSemana = (diaSemana === 0 || diaSemana === 6);

    if (esFeriado || esFinDeSemana) {
        if (err) {
            err.textContent = esFeriado ? "La fecha elegida es FERIADO NACIONAL." : "Sábados y Domingos la oficina permanece cerrada.";
            err.style.display = 'block';
            err.style.color = "red";
            err.style.fontWeight = "bold";
        }
        validarBoton();
        return; 
    }

    for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
        for (let m = 0; m < 60; m += INTERVALO) {
            if (h === HORA_FIN && m > 0) break;
            const hhmm = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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

if (esAdmin) {
    const PIN = "PNA2025parana";
    const initAdmin = () => {
        document.getElementById('area-login').style.display = 'none';
        document.getElementById('dashboard-contenido').style.display = 'block';
        coleccionTurnos.onSnapshot(snap => {
            turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
            dibujarTabla(document.getElementById('filtro-fecha').value);
        });
    };
    if (localStorage.getItem('admin_pna_auth') === 'true') initAdmin();
    document.getElementById('btn-login').onclick = () => {
        if (document.getElementById('admin-pin').value === PIN) {
            localStorage.setItem('admin_pna_auth', 'true'); initAdmin();
        } else alert("PIN Incorrecto");
    };
    document.getElementById('btn-logout').onclick = () => {
        localStorage.removeItem('admin_pna_auth'); location.reload();
    };
    document.getElementById('filtro-fecha').onchange = (e) => dibujarTabla(e.target.value);
} else {
    const fInput = document.getElementById('fecha-turno');
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    fInput.setAttribute('min', mañana.toISOString().split('T')[0]);

    fInput.addEventListener('change', (e) => {
        generarHorarios(e.target.value);
        validarBoton();
    });

    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', validarBoton);
    });

    coleccionTurnos.onSnapshot(snap => {
        turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
        if (fInput.value) generarHorarios(fInput.value);
    });

    document.getElementById('boton-solicitar').onclick = async () => {
        const btn = document.getElementById('boton-solicitar');
        btn.disabled = true;
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
            alert("✅ Turno Confirmado exitosamente.");
            location.reload();
        } catch (e) { alert("Error al guardar"); btn.disabled = false; }
    };
}

function dibujarTabla(f) {
    const cont = document.getElementById('contenedor-tabla');
    const hoy = new Date().toISOString().split('T')[0];
    const fecha = f || hoy;
    const lista = turnosTomados.filter(t => t.fecha === fecha).sort((a,b) => a.horario.localeCompare(b.horario));
    document.getElementById('total-turnos').textContent = `Total (${fecha}): ${lista.length}`;
    let html = '<table class="tabla-turnos"><thead><tr><th>Hora</th><th>Nombre</th><th>Acción</th></tr></thead><tbody>';
    lista.forEach(t => {
        html += `<tr><td>${t.horario}</td><td>${t.nombre}</td><td><button class="btn-eliminar-admin" onclick="borrarT('${t.id}')">Atendido/Eliminar</button></td></tr>`;
    });
    cont.innerHTML = html + '</tbody></table>';
}
window.borrarT = async (id) => { if (confirm("¿Eliminar turno?")) await coleccionTurnos.doc(id).delete(); };
