const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'gemma3:4b';
  }

  async generateResponse(prompt) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false
      });
      return response.data.response;
    } catch (error) {
      console.error('Ollama API Error:', error.message);
      throw new Error(`Failed to generate response from Ollama: ${error.message}`);
    }
  }

  async generateSummary(content, style = 'detailed') {
    let styleInstruction = '';
    if (style === 'bullets') {
      styleInstruction = 'Fournis un résumé sous forme de points clés (bullet points).';
    } else if (style === 'cheatSheet') {
      styleInstruction = 'Crée une fiche mémo concise avec les formules et concepts essentiels.';
    } else {
      styleInstruction = 'Fournis un résumé détaillé et structuré.';
    }

    const prompt = `
      Tu es un assistant pédagogique expert.
      ${styleInstruction}
      Rédige le résumé en français, de manière claire et engageante.
      Utilise du Markdown pour la mise en forme (titres, gras, listes).
      Ajoute quelques emojis pour rendre le contenu plus vivant.

      Contenu du cours :
      ${content}
    `;

    return await this.generateResponse(prompt);
  }

  async generateFlashcards(content) {
    const prompt = `
      Basé sur le contenu suivant, génère 5 flashcards pour aider à la mémorisation.
      Chaque flashcard doit avoir une question (recto) et une réponse (verso).
      Renvoie UNIQUEMENT un tableau JSON valide.
      Format : [{"front": "Question...", "back": "Réponse...", "difficulty": "medium"}]

      Contenu :
      ${content}

      Réponds uniquement avec le JSON, pas de texte avant ou après.
    `;

    const response = await this.generateResponse(prompt);
    try {
      // Clean up potential markdown formatting from Ollama
      const jsonStr = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse flashcards JSON:', response);
      // Fallback if JSON parsing fails
      return [
        { front: "Erreur de génération", back: "Le format de réponse de l'IA était invalide.", difficulty: "medium" }
      ];
    }
  }

  async generateQuiz(content, count = 5) {
    const prompt = `
      Génère un quiz de ${count} questions à choix multiples (QCM) basé sur le texte suivant.
      Chaque question doit avoir 4 options et une seule bonne réponse.
      Renvoie UNIQUEMENT un tableau JSON valide.
      Format : [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0}]

      Contenu :
      ${content}

      Réponds uniquement avec le JSON, pas de texte avant ou après.
    `;

    const response = await this.generateResponse(prompt);
    try {
      const jsonStr = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse quiz JSON:', response);
      throw new Error('Failed to generate valid quiz format');
    }
  }
}

module.exports = new OllamaService();
