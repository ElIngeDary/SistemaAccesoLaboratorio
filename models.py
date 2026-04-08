from database import get_db

def crear_tablas():
    conn = get_db()
    cur  = conn.cursor()

    # ── ROL ──────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS rol (
            id_rol     INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_rol TEXT    NOT NULL UNIQUE
        )
    """)

    # ── USUARIO ───────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS usuario (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            id_rol     INTEGER NOT NULL,
            nombre     TEXT    NOT NULL,
            correo     TEXT    NOT NULL UNIQUE,
            estado     TEXT    NOT NULL DEFAULT 'activo',
            FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
        )
    """)

    # ── LABORATORIO ───────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS laboratorio (
            id_lab    INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre    TEXT    NOT NULL UNIQUE,
            ubicacion TEXT,
            capacidad INTEGER
        )
    """)

    # ── HORARIOS ──────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS horarios (
            id_horario  INTEGER PRIMARY KEY AUTOINCREMENT,
            id_lab      INTEGER NOT NULL,
            nombre      TEXT    NOT NULL,
            tipo        TEXT    NOT NULL DEFAULT 'ev-curso',
            dia_semana  INTEGER NOT NULL,  -- 0=Lunes … 5=Sábado
            hora_inicio TEXT    NOT NULL,  -- formato HH:MM
            hora_fin    TEXT    NOT NULL,
            docente     TEXT,
            FOREIGN KEY (id_lab) REFERENCES laboratorio(id_lab)
        )
    """)

    # ── ACCESOS ───────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS accesos (
            id_accesos   INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario   INTEGER NOT NULL,
            id_lab       INTEGER NOT NULL,
            fecha_entrada TEXT   NOT NULL,
            fecha_salida  TEXT,
            estado        TEXT   NOT NULL DEFAULT 'activo',
            FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
            FOREIGN KEY (id_lab)     REFERENCES laboratorio(id_lab)
        )
    """)

    # ── DATOS INICIALES (seed) ────────────────────────
    # Solo inserta si las tablas están vacías
    cur.execute("SELECT COUNT(*) FROM rol")
    if cur.fetchone()[0] == 0:
        cur.executemany("INSERT INTO rol (nombre_rol) VALUES (?)", [
            ('Administrador',),
            ('Docente',),
            ('Estudiante',),
            ('Staff',),
        ])

    cur.execute("SELECT COUNT(*) FROM laboratorio")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
            INSERT INTO laboratorio (nombre, ubicacion, capacidad)
            VALUES (?, ?, ?)
        """, [
            ('Lab. Computación A', 'Edificio A - Piso 1', 30),
            ('Lab. Computación B', 'Edificio A - Piso 2', 30),
            ('Lab. Redes',         'Edificio B - Piso 1', 20),
            ('Lab. Electrónica',   'Edificio B - Piso 2', 25),
        ])

    conn.commit()
    conn.close()
    print("✅ Tablas creadas y datos iniciales cargados")