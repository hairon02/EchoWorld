/**
 * Script de verificación para NarrativeOrchestrator con Gemini 3.5 Flash.
 * Puede ejecutarse con una API KEY real o simular una respuesta.
 */
require('dotenv').config();
const orchestrator = require('./src/orchestrator/NarrativeOrchestrator');

async function testGeminiIntegration() {
  console.log("--- INICIANDO TEST DE VERIFICACIÓN ---");
  console.log("Modelo configurado:", orchestrator.modelName);
  console.log("Listo para usar:", orchestrator.ready);

  if (!orchestrator.ready) {
    console.warn("ADVERTENCIA: No se detectó GEMINI_API_KEY en el .env.");
    console.log("El test usará la escena de fallback.");
  }

  const testInput = {
    currentScene: "Te encuentras frente a un portal de energía azul que vibra suavemente.",
    playerDecision: "Tocar el portal con la punta de los dedos.",
    sessionHistory: []
  };

  console.log("\nEnviando prompt de prueba...");
  
  try {
    const start = Date.now();
    const result = await orchestrator.generateScene(testInput);
    const end = Date.now();

    console.log(`\nRespuesta recibida en ${end - start}ms:`);
    console.log("-----------------------------------------");
    console.log("NARRATIVA:", result.narrativeText);
    console.log("OPCIONES:");
    result.choices.forEach(c => console.log(` - [${c.id}] ${c.text}`));
    console.log("-----------------------------------------");

    if (result.narrativeText.includes("path ahead grows quiet")) {
      console.log("\nRESULTADO: Se devolvió la escena de FALLBACK (esperado si no hay API Key o hubo un error).");
    } else {
      console.log("\nRESULTADO: ¡ÉXITO! Gemini generó contenido dinámico.");
    }

  } catch (error) {
    console.error("Error durante el test:", error);
  }
}

testGeminiIntegration();
