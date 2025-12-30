import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotAuthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-center p-4">
      <h1 className="text-5xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="text-lg text-gray-700 mb-8">
        Tu sesión ha expirado o no tienes permisos para ver este recurso.
      </p>
      <button
        onClick={() => navigate('/login')}
        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Ir a Login
      </button>
    </div>
  );
};

export default NotAuthorizedPage;