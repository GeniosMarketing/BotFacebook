// Importar los módulos necesarios
const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");

// Importar el módulo chatgpt de forma dinámica
let ChatGPT;
import("chatgpt").then((module) => {
  ChatGPT = module.ChatGPT;
});
// Crear la aplicación
const app = express();

// Configurar el puerto
const port = process.env.PORT || 3000;

// Configurar el token de acceso a la API de Facebook
const access_token = "EAATHwsWVYbgBALrdxU0ZCNKIh5t29OvmAQko6EjGhYQTMZAxE6YYDjPxsZCF68WQ68o4MOjDBYRyZBOsm10jjsw9UuXVTZASLGbwk9d0WmDTx49Uw8K76DsyGsvTNTLk9yfgFT8r8pndmBKqdPZAJtdAqscLdjx3Tih0SaQTYAR9GNEoek3Inz3m3gEv3hVbxefaRkZCoPsUQZDZD";

// Configurar las respuestas predeterminadas y las palabras claves
const default_responses = {
  hola: "Hola, ¿en qué puedo ayudarte?",
  gracias: "De nada, ¡que tengas un buen día!",
  precio:
    "El precio de nuestros productos varía según el modelo y las características. Puedes consultarlos en nuestra página web o preguntarme por alguno en específico.",
  envío:
    "El envío es gratuito para pedidos superiores a 50 euros. El plazo de entrega es de 3 a 5 días hábiles.",
};

const keywords = Object.keys(default_responses);

// Configurar el chatgpt
const chatgpt_options = {
  api_key: "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",
  model: "text-davinci-003",
  prompt: "Actua como un venderor de Pasteles frios y normales",
  temperature: 0.7,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// Configurar el body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Crear una ruta para verificar el webhook de Facebook
app.get("/webhook", (req, res) => {
  // Verificar el token de verificación
  const verify_token = req.query["hub.verify_token"];
  if (verify_token === "1620198800238") {
    // Devolver el challenge
    const challenge = req.query["hub.challenge"];
    res.send(challenge);
    console.log("Webhook verificado"); // Añadir esta línea
  } else {
    // Devolver un error
    res.send("Error al verificar el webhook");
    console.log("Error al verificar el webhook"); // Añadir esta línea
  }
});

// Crear una ruta para recibir los eventos de Facebook
app.post("/webhook", (req, res) => {
  // Obtener el cuerpo de la solicitud
  const data = req.body;

  // Comprobar si hay algún evento
  if (data.object === "page") {
    // Recorrer todos los eventos
    data.entry.forEach((entry) => {
      // Obtener el mensaje o comentario
      const event = entry.messaging[0] || entry.changes[0].value;

      // Obtener el id del emisor y del receptor
      const sender_id = event.sender.id || event.from.id;
      const recipient_id = event.recipient.id || event.post_id.split("_")[0];

      // Comprobar si hay texto en el mensaje o comentario
      if (event.message && event.message.text) {
        // Procesar el texto del mensaje
        processText(event.message.text, sender_id, recipient_id);
      } else if (event.comment_id && event.message) {
        // Procesar el texto del comentario
        processText(event.message, sender_id, recipient_id);
      }
    });
    // Devolver una respuesta vacía
    res.sendStatus(200);
  }
});

// Función para procesar el texto del mensaje o comentario
async function processText(text, sender_id, recipient_id) {
  // Convertir el texto a minúsculas
  text = text.toLowerCase();
  // Buscar si hay alguna palabra clave en el texto
  let keyword_found = false;
  for (let keyword of keywords) {
    if (text.includes(keyword)) {
      // Enviar la respuesta predeterminada correspondiente
      sendResponse(default_responses[keyword], sender_id, recipient_id);
      keyword_found = true;
      break;
    }
  }
  // Si no se encontró ninguna palabra clave, usar chatgpt para generar una respuesta personalizada
  if (!keyword_found) {
    try {
      const res = await ChatGPT.query(text, chatgpt_options);
      // Enviar la respuesta generada por chatgpt
sendResponse(res, sender_id, recipient_id);
} catch (err) {
  // Enviar un mensaje de error
  sendResponse('Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo más tarde.', sender_id, recipient_id);
}
}
}

// Función para enviar la respuesta al mensaje o comentario
async function sendResponse(response, sender_id, recipient_id) {
// Crear el cuerpo de la solicitud
const body = {
messaging_type: 'RESPONSE',
recipient: {
  id: sender_id
},
message: {
  text: response
}
};
// Crear las opciones de la solicitud
const options = {
url: 'https://graph.facebook.com/v12.0/me/messages',
qs: { access_token: access_token },
method: 'POST',
json: body
};
// Enviar la solicitud a la API de Facebook
await request(options, (err, res, body) => {
if (err) {
  // Mostrar el error en la consola
  console.error('Error al enviar la respuesta:', err);
} else if (body.error) {
  // Mostrar el error en la consola
  console.error('Error al enviar la respuesta:', body.error);
}
});
}

// Crear una ruta para el método GET y la ruta /
app.get("/", (req, res) => {
  // Enviar un mensaje de bienvenida
  res.send("Bienvenidos 🍰\n\n Mi nombre es **CakeBot** y estoy aquí para ayudarte con tus pedidos de pasteles fríos y normales 🎂\n\nEscribe tu consulta y CakeBot te responderá lo antes posible 😊");
});

// Iniciar el servidor
app.listen(port, () => {
console.log('El servidor está escuchando en el puerto', port);
});