// dataSender.js
// === INSTRUCCIÓN CRÍTICA DE UBICACIÓN Y CONFIGURACIÓN ===
// Este archivo DEBE llamarse 'dataSender.js'.
// Asegúrate de que esté FÍSICAMENTE en la MISMA CARPETA que 'App.js'.
// REEMPLAZA 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' con la URL de despliegue
// de tu Google Apps Script.

export const sendDataToGoogleScript = async (data) => {
    // URL de tu Google Apps Script desplegado como aplicación web.
    // ES CRÍTICO QUE REEMPLACES ESTE VALOR CON TU URL REAL.
const SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyXBzusivCfRDQp8OTKIpW5bxwH0XOxCEQ4QEu_rB9hikN37xeIpAblvC6VkToC9td-3w/exec'; // ¡ACTUALIZA ESTO CON TU URL REAL!

    try {
        const response = await fetch(SCRIPT_WEB_APP_URL, {
            method: 'POST',
            // Es importante que el Content-Type sea 'application/x-www-form-urlencoded'
            // para que Google Apps Script pueda procesar los datos de forma estándar
            // usando e.parameter o e.postData.contents.
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            // Convertimos el objeto de datos a una cadena URL-encoded
            body: new URLSearchParams({ data: JSON.stringify(data) }).toString(),
            // No incluir credenciales (cookies, tokens de autenticación) en peticiones cross-origin
            // a menos que sea estrictamente necesario y se maneje de forma segura.
            // Para Apps Script, generalmente no es necesario.
            mode: 'cors', 
        });

        if (!response.ok) {
            // Si la respuesta no es OK (ej. 404, 500), lanza un error
            const errorText = await response.text();
            throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return result; // El Apps Script debe devolver un objeto { success: true, message: "...", fileUrl: "..." }

    } catch (error) {
        console.error('Error al enviar datos al Google Apps Script:', error);
        return { success: false, error: error.message };
    }
};

  }
};
