import sqlite3
import os

# Ruta donde se guardará la base de datos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, 'laboratorios.db')

def get_db():
    """
    Abre una conexión a SQLite optimizada para Flask.
    """
    # 1. Agregamos timeout=20 para que espere si la DB está ocupada
    # y check_same_thread=False para evitar errores de hilos en Flask
    conn = sqlite3.connect(DB_PATH, timeout=20, check_same_thread=False)
    
    # 2. Activamos el modo WAL (Write-Ahead Logging)
    # Esto permite que las lecturas no bloqueen las escrituras y viceversa
    conn.execute('PRAGMA journal_mode=WAL;')
    
    conn.row_factory = sqlite3.Row
    return conn