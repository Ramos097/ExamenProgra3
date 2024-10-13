const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

var config = {
    server: '127.0.0.1',
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: 'ramos.123'
        }
    },
    options: {
        port: 1433,
        database: 'Gestion2',
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true,
    }
};

function connectAndExecute(query) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(config);

        connection.on('connect', (err) => {
            if (err) {
                return reject(err);
            }
            executeStatement(connection, query, resolve, reject);
        });

        connection.connect();
    });
}

function executeStatement(connection, query, resolve, reject) {
    const request = new Request(query, (err, rowCount) => {
        if (err) {
            connection.close();
            return reject(err);
        }
        connection.close();
    });

    const rows = [];
    request.on('row', (columns) => {
        const row = {};
        columns.forEach(column => {
            row[column.metadata.colName] = column.value;
        });
        rows.push(row);
    });

    request.on('requestCompleted', () => {
        resolve(rows);  // Retorna las filas cuando la consulta finaliza
    });

    connection.execSql(request);
}



// Función para obtener todos los usuarios
async function getAllUsuarios() {
    const query = "SELECT * FROM Usuarios";
    return await connectAndExecute(query);
}

// Función para obtener un usuario por su ID
async function getUsuarioById(id) {
    const query = `SELECT * FROM Usuarios WHERE Id = ${id}`;
    return await connectAndExecute(query);
}

// Función para obtener los correos de los usuarios
async function getEmailsUsuarios() {
    const query = "SELECT Email FROM Usuarios";
    return await connectAndExecute(query);
}

// Función para insertar un nuevo usuario
async function insertUsuario(nombre, email, password) {
    const query = `INSERT INTO Usuarios (Nombre, Email, Password) VALUES ('${nombre}', '${email}', '${password}')`;
    return await connectAndExecute(query).then(() => ({ message: "Usuario insertado correctamente" }));
}

async function insertregistroReciclaje(fecha, material, cantidad,usuarioid,centroreciclaje) {
    const query = `INSERT INTO RegistrosReciclaje (Fecha, Material, Cantidad, UsuarioId,CentroReciclaje) VALUES ('${fecha}', '${material}', '${cantidad}', '${usuarioid}', '${centroreciclaje}')`;
    return await connectAndExecute(query).then(() => ({ message: "Usuario insertado correctamente" }));
}

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    getEmailsUsuarios,
    insertUsuario,
    insertregistroReciclaje
};
