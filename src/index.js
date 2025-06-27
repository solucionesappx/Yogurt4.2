// === ESTE ARCHIVO ES EL PUNTO DE ENTRADA DE TU APLICACIÓN REACT ===
// Debe llamarse 'index.js' (o 'main.jsx' si usas JSX) y estar en la carpeta 'src/'.
// Su función principal es importar el componente <App /> y renderizarlo en el DOM,
// dentro del elemento con id="root" definido en tu 'index.html'.

import React from 'react';
import { createRoot } from 'react-dom/client';
// Importamos el componente principal de tu aplicación, 'App.js'.
// Asegúrate de que 'App.js' (el archivo que contiene todo tu código de interfaz de usuario)
// esté en la MISMA CARPETA ('src/') que este archivo 'index.js'.
import App from './App'; 

// Obtén el elemento 'root' de tu index.html.
const container = document.getElementById('root');
// Crea una raíz de React para tu aplicación (requerido para React 18+).
const root = createRoot(container);

// Renderiza tu componente App dentro de la raíz de React.
// React.StrictMode es útil para detectar problemas potenciales en desarrollo.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Después de crear este archivo y el 'index.html',
// asegúrate de que tu 'App.js' y 'dataSender.js' también estén en 'src/'.
// Una vez que tengas estos archivos en sus lugares correctos,
// tu entorno de desarrollo debería ser capaz de compilar y ejecutar la aplicación.
