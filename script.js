const btnRegistrarse = document.getElementById('btn-registrarse');
const btnIniciarSesion = document.getElementById('btn-iniciar-sesion');
const registroUsuario = document.getElementById('registro-usuario');
const inicioSesion = document.getElementById('inicio-sesion');
const opcionesUsuario = document.getElementById('opciones-usuario');

// Mostrar el formulario de registro y ocultar las opciones iniciales
btnRegistrarse.addEventListener('click', function() {
    registroUsuario.classList.add('mostrar');
    registroUsuario.classList.remove('oculto');
    inicioSesion.classList.add('oculto');
    opcionesUsuario.classList.add('oculto');
});

// Mostrar el formulario de inicio de sesión y ocultar las opciones iniciales
btnIniciarSesion.addEventListener('click', function() {
    inicioSesion.classList.add('mostrar');
    inicioSesion.classList.remove('oculto');
    registroUsuario.classList.add('oculto');
    opcionesUsuario.classList.add('oculto');
});

// Función para registrar el reciclaje en la base de datos
async function registrarReciclaje(event) {
    event.preventDefault();

    // Obtener los valores del formulario
    const fecha = document.getElementById('fecha').value;
    const material = document.getElementById('material').value;
    const cantidad = document.getElementById('cantidad').value;

    // Crear un objeto con los datos del reciclaje
    const nuevoRegistro = {
        fecha,
        material,
        cantidad: parseFloat(cantidad)
    };

    // Insertar el nuevo registro en la base de datos
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('fecha', sql.DateTime, nuevoRegistro.fecha)
            .input('material', sql.VarChar, nuevoRegistro.material)
            .input('cantidad', sql.Float, nuevoRegistro.cantidad)
            .query('INSERT INTO RegistrosReciclaje (fecha, material, cantidad) VALUES (@fecha, @material, @cantidad)');

        console.log('Registro guardado en la base de datos');

        // Actualizar la visualización de las estadísticas y puntos
        mostrarEstadisticasYPuntos();
        actualizarPuntosAcumulados(); // Actualizamos los puntos totales

        // Resetear el formulario
        document.getElementById('form-reciclaje').reset();
    } catch (err) {
        console.error('Error al registrar reciclaje: ', err);
    } finally {
        await sql.close(); 
    }
}

// Función para mostrar estadísticas y puntos acumulados
async function mostrarEstadisticasYPuntos() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT material, SUM(cantidad) AS totalCantidad FROM RegistrosReciclaje GROUP BY material');

        // Inicializar contadores para cada tipo de material y puntos
        let totalPlastico = 0, puntosPlastico = 0;
        let totalPapel = 0, puntosPapel = 0;
        let totalVidrio = 0, puntosVidrio = 0;

        // Recorrer los resultados y sumar las cantidades y puntos según el tipo de material
        result.recordset.forEach(registro => {
            const cantidad = registro.totalCantidad;
            if (registro.material === 'plastico') {
                totalPlastico += cantidad;
                puntosPlastico += cantidad * 1; // 1 punto por kg de plástico
            } else if (registro.material === 'papel') {
                totalPapel += cantidad;
                puntosPapel += cantidad * 2; // 2 puntos por kg de papel
            } else if (registro.material === 'vidrio') {
                totalVidrio += cantidad;
                puntosVidrio += cantidad * 3; // 3 puntos por kg de vidrio
            }
        });

        // Calcular el total de puntos acumulados
        const totalPuntos = puntosPlastico + puntosPapel + puntosVidrio;

        // Guardar los puntos en la base de datos
        try {
            let pool = await sql.connect(config);
            await pool.request()
                .input('puntos', sql.Int, totalPuntos)
                .query('UPDATE Estadisticas SET puntosAcumulados = @puntos'); 
        } catch (err) {
            console.error('Error al actualizar puntos: ', err);
        }

        // Mostrar las estadísticas y puntos en la página
        const estadisticasDiv = document.getElementById('estadisticas');
        estadisticasDiv.innerHTML = `
            <h2>Estadísticas</h2>
            <p><strong>Total reciclado:</strong></p>
            <ul>
                <li>Plástico: ${totalPlastico.toFixed(2)} kg (Puntos: ${puntosPlastico})</li>
                <li>Papel: ${totalPapel.toFixed(2)} kg (Puntos: ${puntosPapel})</li>
                <li>Vidrio: ${totalVidrio.toFixed(2)} kg (Puntos: ${puntosVidrio})</li>
            </ul>
            <p><strong>Total de puntos acumulados:</strong> ${totalPuntos}</p>
        `;
    } catch (err) {
        console.error('Error al mostrar estadísticas y puntos: ', err);
    } finally {
        await sql.close(); // Cerrar la conexión siempre que se complete
    }
}

// Función para actualizar los puntos acumulados en la página
async function actualizarPuntosAcumulados() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT puntosAcumulados FROM Estadisticas'); 
        const puntosRestantes = result.recordset[0].puntosAcumulados || 0; // Obtiene los puntos restantes
        document.getElementById('puntos-acumulados').innerText = puntosRestantes; // Actualiza la visualización
    } catch (err) {
        console.error('Error al actualizar puntos acumulados: ', err);
    } finally {
        await sql.close(); // Cerrar la conexión siempre que se complete
    }
}

// Función para canjear recompensas
async function canjearRecompensa(event) {
    const recompensa = event.target.dataset.recompensa;
    const puntosNecesarios = {
        descuento: 250,
        producto: 500,
        entrada: 1000
    };

    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT puntosAcumulados FROM Estadisticas'); 
        const puntosRestantes = result.recordset[0].puntosAcumulados || 0; // Obtiene los puntos restantes
        const mensajeCanje = document.getElementById('mensaje-canje'); 

        if (puntosRestantes >= puntosNecesarios[recompensa]) {
            // Resta los puntos necesarios
            const nuevosPuntos = puntosRestantes - puntosNecesarios[recompensa];
            await pool.request()
                .input('puntos', sql.Int, nuevosPuntos)
                .query('UPDATE Estadisticas SET puntosAcumulados = @puntos'); 

            mensajeCanje.classList.remove('oculto');
            mensajeCanje.innerText = `¡Has canjeado con éxito tu recompensa de ${recompensa}!`;
            mensajeCanje.style.color = 'green'; 

            // Actualiza la visualización de los puntos acumulados
            actualizarPuntosAcumulados();
        } else {
            mensajeCanje.classList.remove('oculto');
            mensajeCanje.innerText = 'No tienes suficientes puntos para canjear esta recompensa.';
            mensajeCanje.style.color = 'red'; 
        }
    } catch (err) {
        console.error('Error al canjear recompensa: ', err);
    } finally {
        await sql.close(); // Cerrar la conexión siempre que se complete
    }
}

// Al cargar la página, inicializa los puntos acumulados
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa los puntos acumulados desde la base de datos
    actualizarPuntosAcumulados(); // Muestra los puntos acumulados al cargar

    // Añade el evento a los botones de canjeo
    document.querySelectorAll('.btn-canjear').forEach(button => {
        button.addEventListener('click', canjearRecompensa);
    });
});

// Probar conexión al cargar la página
async function probarConexion() {
    try {
        let pool = await sql.connect(config);
        console.log('Conexión exitosa a la base de datos!');

        // Hacer una consulta sencilla para verificar la conexión
        let result = await pool.request().query('SELECT 1 AS test');
        console.log('Consulta de prueba ejecutada:', result.recordset);

        // Cerrar la conexión
        sql.close();
    } catch (err) {
        console.error('Error en la conexión: ', err);
    }
}

// Llama a la función para probar la conexión
probarConexion();
