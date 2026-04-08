from flask import Flask, render_template
from flask_cors import CORS
from models import crear_tablas
from routes.horarios import horarios_bp
from database import get_db


app = Flask(__name__)
CORS(app)  # permite peticiones desde el frontend

# ── Crear tablas al iniciar ────────────────────────
with app.app_context():
    crear_tablas()

# ── Rutas(Modulos) principales ─────────────────────────────────
@app.route('/')
def index():
    #Ruta/Modulo Horarios Academicos
    return render_template('index.html', segmento_activo='horario')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', segmento_activo='dashboard')

@app.route('/usuarios')
def usuarios():
    return render_template('usuarios.html', segmento_activo='usuarios')

@app.route('/registros')
def registros():
    return render_template('registros.html', segmento_activo='registros')

@app.route('/reportes')
def reportes():
    return render_template('reportes.html', segmento_activo='reportes')

@app.route('/reservas')
def reservas():
    return render_template('reservas.html', segmento_activo='reservas')

@app.route('/laboratorios')
def laboratorios():
    return render_template('laboratorios.html', segmento_activo='laboratorios')

@app.route('/configuracion')
def configuracion():
    return render_template('configuracion.html', segmento_activo='configuracion')


# ── Registrar rutas de la API ──────────────────────
# (las iremos agregando en los siguientes pasos)
# from routes.horarios     import horarios_bp
# from routes.laboratorios import laboratorios_bp
# from routes.usuarios     import usuarios_bp
# app.register_blueprint(horarios_bp)
# app.register_blueprint(laboratorios_bp)
app.register_blueprint(horarios_bp)
# app.register_blueprint(usuarios_bp)

# Este decorador cierra la base de datos cada vez que Flask termina de responder
@app.teardown_appcontext
def close_connection(exception):
    # Si tienes una conexión abierta en el contexto actual, la cierra
    # Esto evita el error de "database is locked"
    pass

# ── Arrancar servidor ──────────────────────────────
if __name__ == '__main__':
    app.run(debug=True)