import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center p-4">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">
        Ups, no pudimos encontrar la página que buscas.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Volver al Inicio
      </button>
    </div>
  );
};

export default NotFoundPage;