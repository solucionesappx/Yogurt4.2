// dataSender.js
// ESTE ARCHIVO DEBE ESTAR EN LA MISMA CARPETA QUE TU ARCHIVO App.js

export const sendDataToGoogleScript = async (data) => {
  // ¡IMPORTANTE! Reemplaza esta URL con la URL de despliegue de tu Google Apps Script.
  // Una vez que despliegues tu script como una aplicación web, obtendrás esta URL.
  // Es crucial que esta URL sea correcta para que la comunicación funcione.
  const SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyXBzusivCfRDQp8OTKIpW5bxwH0XOxCEQ4QEu_rB9hikN37xeIpAblvC6VkToC9td-3w/exec'; // ¡ACTUALIZA ESTO CON TU URL REAL!

  try {
    const response = await fetch(SCRIPT_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors', // Crucial para peticiones entre dominios (CORS)
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Si la respuesta no es OK (ej. 404, 500), lanzar un error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error de servidor desconocido' }));
      throw new Error(`Error de red o de servidor: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error al enviar datos al Google Apps Script:', error);
    // Devuelve un objeto de error para que el frontend pueda manejarlo.
    return { success: false, error: error.message };
  }
};
