async function cargarAsistencia() {
    try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        //const res = await fetch(`https://localhost:7159/api/Registro_asistencia/ObtenerRegistro_asistenciaPorIdHorarioH?id=${id}`);
        const res = await fetch(`https://controlasistenciaapi.onrender.com/api/Registro_asistencia/ObtenerRegistro_asistenciaPorIdHorarioH?id=${id}`);
        if (res.ok) {
            const data = await res.json();
            let asistencia = Array.isArray(data) ? data : (data.result ?? data.data ?? []);
            renderTabla(asistencia);
        }
        //throw new Error('Error al cargar');

    } catch (error) {
        console.log("error en consumo de asistencias");
        console.log(error);
    }
}
function renderTabla(data) {

    const tbody = document.getElementById('tabla-body');

    if (!data || data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No hay asistencias registradas.
                </td>
            </tr>`;

        return;
    }

    tbody.innerHTML = data.map((a, i) => {

        return `
            <tr>

                <td>#${a.id_horariod}</td>

                <td>
                    ${a.nombre} ${a.apellido}
                </td>

                <td>
                    ${a.carrera}
                </td>

                <td>
                    ${a.fecha}
                </td>

                <td>
                    ${a.estado
                ? '<span class="badge-success">Presente</span>'
                : '<span class="badge-danger">Ausente</span>'
            }
                </td>

                <!---<td>

                    <button
                        class="btn-small"
                        onclick="verDetalle(${i})">

                        Ver

                    </button>

                </td>--->

            </tr>
        `;
    }).join('');
}

async function iniciarSignalR() {
    try {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7159/asistenciaHub")
            //.withUrl("https://controlasistenciaapi.onrender.com/asistenciaHub")
            .withAutomaticReconnect()
            .build();

        connection.on(
            "AsistenciaActualizada",
            () => {

                console.log("Cambios detectados");

                cargarAsistencia();

            }
        );
        connection.onreconnecting(() => {

            console.log("Reconectando...");

        });

        connection.onreconnected(() => {

            console.log("Reconectado");

        });

        await connection.start();
    } catch (error) {
        console.log("error en consumo de hub");
        console.log(error);
    }
}

iniciarSignalR();

cargarAsistencia();