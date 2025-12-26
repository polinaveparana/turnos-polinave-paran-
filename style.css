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
let turnosTomados = [];
const esAdmin = window.location.pathname.includes('admin.html');

// --- FUNCIONES CLIENTE ---
function configurarFechaMinima() {
    const inputF = document.getElementById('fecha-turno');
    if (inputF) {
        const hoy = new Date();
        inputF.setAttribute('min', hoy.toISOString().split('T')[0]);
    }
}

function generarHorariosDisponibles(fechaSeleccionada) {
    const selectH = document.getElementById('horario-turno');
    if (!selectH) return;
    selectH.innerHTML = '<option value="">-- Seleccione un Horario --</option>';
    
    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');
    if (fechaObj.getDay() === 0 || fechaObj.getDay() === 6) {
        alert("Los fines de semana no hay atención al público.");
        return;
    }

    for (let h = HORA_INICIO; h < HORA_FIN; h++) {
        for (let m = 0; m < 60; m += INTERVALO) {
            const hhmm = ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')};
            const ocupado = turnosTomados.some(t => t.fecha === fechaSeleccionada && t.horario === hhmm);
            if (!ocupado) {
                selectH.add(new Option(hhmm, hhmm));
            }
        }
    }
    selectH.disabled = false;
}

// --- FUNCIONES ADMIN ---
function dibujarTablaAdmin(fechaFiltro) {
    const contenedor = document.getElementById('contenedor-tabla');
    if (!contenedor) return;
    const hoy = new Date().toISOString().split('T')[0];
    const fechaVer = fechaFiltro || hoy;
    const filtrados = turnosTomados.filter(t => t.fecha === fechaVer).sort((a,b) => a.horario.localeCompare(b.horario));
    
    document.getElementById('total-turnos').textContent = Turnos del día (${fechaVer}): ${filtrados.length};
    
    let html = <table class="tabla-turnos"><thead><tr><th>Hora</th><th>Nombre</th><th>DNI</th><th>Acción</th></tr></thead><tbody>;
    filtrados.forEach(t => {
        html += <tr><td>${t.horario}</td><td>${t.nombre}</td><td>${t.dni}</td><td><button class="btn-eliminar-admin" onclick="eliminarTurno('${t.id}')">Eliminar</button></td></tr>;
    });
    contenedor.innerHTML = html + "</tbody></table>";
}

async function eliminarTurno(id) {
    if (confirm("¿Desea eliminar o marcar como atendido este turno?")) {
        await coleccionTurnos.doc(id).delete();
    }
}

function exportarExcel() {
    const fecha = document.getElementById('filtro-fecha').value || new Date().toISOString().split('T')[0];
    const filtrados = turnosTomados.filter(t => t.fecha === fecha).map(t => ({
        Horario: t.horario, Nombre: t.nombre, DNI: t.dni, Tramite: t.tramite, Correo: t.correo
    }));
    if (filtrados.length === 0) return alert("No hay turnos para exportar en esta fecha.");
    
    const hoja = XLSX.utils.json_to_sheet(filtrados);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Turnos");
    XLSX.writeFile(libro, Turnos_PNA_${fecha}.xlsx);
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    coleccionTurnos.onSnapshot(snap => {
        turnosTomados = snap.docs.map(d => ({id: d.id, ...d.data()}));
        if (esAdmin) dibujarTablaAdmin(document.getElementById('filtro-fecha')?.value);
    });

    if (esAdmin) {
        const PIN = "PNA2025parana";
        const panelLogin = () => {
            document.getElementById('area-login').style.display = 'none';
            document.getElementById('dashboard-contenido').style.display = 'block';
        };
        if(localStorage.getItem('admin_pna') === 'true') panelLogin();
        
        document.getElementById('btn-login').onclick = () => {
            if(document.getElementById('admin-pin').value === PIN) {
                localStorage.setItem('admin_pna', 'true'); panelLogin();
            } else alert("PIN incorrecto");
        };
        document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };
        document.getElementById('btn-excel').onclick = exportarExcel;
        document.getElementById('filtro-fecha').onchange = (e) => dibujarTablaAdmin(e.target.value);
    } else {
        configurarFechaMinima();
        document.getElementById('fecha-turno').onchange = (e) => generarHorariosDisponibles(e.target.value);
        document.getElementById('formulario-turnos').oninput = () => {
            document.getElementById('boton-solicitar').disabled = !document.getElementById('formulario-turnos').checkValidity();
        };
        document.getElementById('boton-solicitar').onclick = async () => {
            const data = {
                tramite: document.getElementById('tipo-tramite').value,
                fecha: document.getElementById('fecha-turno').value,
                horario: document.getElementById('horario-turno').value,
                nombre: document.getElementById('nombre-solicitante').value.trim(),
                dni: document.getElementById('dni-solicitante').value.trim(),
                correo: document.getElementById('correo-solicitante').value.trim(),
                registradoEn: new Date().toLocaleString('es-AR')
            };
            try {
                await coleccionTurnos.add(data);
                alert("✅ Turno solicitado con éxito.");
                location.reload();
            } catch (e) { alert("Error al conectar con la base de datos."); }
        };
    }
});
