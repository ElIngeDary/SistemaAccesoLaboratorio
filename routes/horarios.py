from flask import Blueprint, request, jsonify
from database import get_db

horarios_bp = Blueprint('horarios', __name__, url_prefix='/api')

# ── GET /api/horarios?lab=Lab. Computación A ──────────────
@horarios_bp.route('/horarios', methods=['GET'])
def get_horarios():
    lab = request.args.get('lab', '')
    conn = get_db()
    cur  = conn.cursor()

    cur.execute("""
        SELECT h.id_horario, h.nombre, h.tipo, h.dia_semana,
               h.hora_inicio, h.hora_fin, h.docente, l.nombre AS lab
        FROM horarios h
        JOIN laboratorio l ON h.id_lab = l.id_lab
        WHERE l.nombre = ?
    """, (lab,))

    filas = cur.fetchall()
    conn.close()

    resultado = []
    for f in filas:
        resultado.append({
            'id'     : f['id_horario'],
            'nombre' : f['nombre'],
            'tipo'   : f['tipo'],
            'dia'    : f['dia_semana'],
            'inicio' : f['hora_inicio'],
            'fin'    : f['hora_fin'],
            'docente': f['docente'] or '',
            'lab'    : f['lab']
        })

    return jsonify(resultado)


# ── POST /api/horarios ────────────────────────────────────
@horarios_bp.route('/horarios', methods=['POST'])
def crear_horario():
    data = request.get_json()
    conn = get_db()
    cur  = conn.cursor()

    # Buscar id del laboratorio por nombre
    cur.execute("SELECT id_lab FROM laboratorio WHERE nombre = ?", (data['lab'],))
    lab = cur.fetchone()
    if not lab:
        conn.close()
        return jsonify({'error': 'Laboratorio no encontrado'}), 404

    cur.execute("""
        INSERT INTO horarios (id_lab, nombre, tipo, dia_semana, hora_inicio, hora_fin, docente)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        lab['id_lab'],
        data['nombre'],
        data['tipo'],
        data['dia'],
        data['inicio'],
        data['fin'],
        data.get('docente', '')
    ))

    conn.commit()
    nuevo_id = cur.lastrowid
    conn.close()

    return jsonify({'id': nuevo_id, 'mensaje': 'Horario creado'}), 201


# ── PUT /api/horarios/<id> ────────────────────────────────
@horarios_bp.route('/horarios/<int:id>', methods=['PUT'])
def actualizar_horario(id):
    data = request.get_json()
    conn = get_db()
    cur  = conn.cursor()

    cur.execute("SELECT id_lab FROM laboratorio WHERE nombre = ?", (data['lab'],))
    lab = cur.fetchone()
    if not lab:
        conn.close()
        return jsonify({'error': 'Laboratorio no encontrado'}), 404

    cur.execute("""
        UPDATE horarios
        SET nombre = ?, tipo = ?, dia_semana = ?,
            hora_inicio = ?, hora_fin = ?, docente = ?, id_lab = ?
        WHERE id_horario = ?
    """, (
        data['nombre'],
        data['tipo'],
        data['dia'],
        data['inicio'],
        data['fin'],
        data.get('docente', ''),
        lab['id_lab'],
        id
    ))

    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Horario actualizado'})


# ── DELETE /api/horarios/<id> ─────────────────────────────
@horarios_bp.route('/horarios/<int:id>', methods=['DELETE'])
def eliminar_horario(id):
    conn = get_db()
    cur  = conn.cursor()
    cur.execute("DELETE FROM horarios WHERE id_horario = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Horario eliminado'})