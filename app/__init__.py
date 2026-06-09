from flask import Flask
from app.config import Config
from app.extensions import jwt, cors
from app.routes.usuarios import usuarios_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensões
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})

    # Blueprints
    from app.routes.auth import auth_bp
    from app.routes.documentos import documentos_bp
    from app.routes.categorias import categorias_bp
    from app.routes.cargos import cargos_bp
    from app.routes.setores import setores_bp
    from app.routes.agente import agente_bp

    app.register_blueprint(auth_bp,       url_prefix="/api/auth")
    app.register_blueprint(usuarios_bp, url_prefix="/api/usuarios")
    app.register_blueprint(documentos_bp, url_prefix="/api/documentos")
    app.register_blueprint(categorias_bp, url_prefix="/api/categorias")
    app.register_blueprint(cargos_bp, url_prefix="/api/cargos")
    app.register_blueprint(setores_bp, url_prefix="/api/setores")
    app.register_blueprint(agente_bp,     url_prefix="/api/agente")

    return app
