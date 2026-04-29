const axios = require('axios');
require('dotenv').config();

class AiService {
  constructor() {
    this.ollamaUrl =
      process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
    this.model = 'gemma3:1b';
  }

  async _callOllama(prompt, options = {}) {
    try {
      const response = await axios.post(this.ollamaUrl, {
        model: this.model,
        prompt: prompt,
        stream: false,
        format: options.json ? 'json' : undefined,
        ...options,
      });
      return response.data.response;
    } catch (error) {
      console.error('Ollama API Error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          'Ollama is not running. Please start it on ' + this.ollamaUrl,
        );
      }
      throw new Error('Failed to communicate with AI model');
    }
  }

  async generateQuiz(text, count = 3) {
    const prompt = `
      Basé sur le texte suivant, génère un quiz de ${count} questions en français.
      Renvoie UNIQUEMENT un tableau JSON d'objets.
      Chaque objet DOIT avoir cette structure EXACTE :
      {
        "question": "la question ici",
        "options": ["option 1", "option 2", "option 3", "option 4"],
        "correctAnswerIndex": 0
      }

      Texte:
      ${text.substring(0, 5000)}
      
      Réponds UNIQUEMENT avec le JSON, pas de texte explicatif.
    `;

    try {
      const response = await this._callOllama(prompt, { json: true });
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating quiz:', error);
      // Fallback: try to find JSON in the string if not strictly JSON
      try {
        const jsonMatch = error.message.match(/\[.*\]/s);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) {}
      throw new Error('Failed to generate quiz');
    }
  }

  async generateFlashcards(text, count = 5) {
    const prompt = `
      Basé sur le texte suivant, génère ${count} flashcards pédagogiques en français.
      Chaque flashcard doit avoir un recto (question/concept) et un verso (réponse/explication).
      Renvoie UNIQUEMENT un tableau JSON d'objets.
      Structure :
      {
        "front": "question",
        "back": "réponse"
      }

      Texte:
      ${text.substring(0, 5000)}
      
      Réponds UNIQUEMENT avec le JSON.
    `;

    try {
      const response = await this._callOllama(prompt, { json: true });
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      throw new Error('Failed to generate flashcards');
    }
  }

  async generateSummary(content) {
    const prompt = `
      Crée un résumé CAPTIVANT et AMUSANT du contenu suivant en français.
      
      Objectif: Rendre l'apprentissage EXCITANT! 🚀
      
      Style:
      - Ton conversationnel et amical (tutoie l'étudiant)
      - Utilise beaucoup d'EMOJIS 🎯 🚀 💡
      - Analogies simples et fun
      - Phrases courtes et percutantes
      
      Format Markdown:
      - Titres avec emojis (## 🎯 Titre)
      - Listes à puces
      - **Gras** pour les concepts clés
      
      Contenu:
      ${content.substring(0, 8000)}
    `;

    try {
      return await this._callOllama(prompt);
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async generateEnhancedSummary(content, style = 'cheatSheet') {
    let prompt;

    if (style === 'shrink') {
      prompt = `
        Réécris le contenu suivant pour qu'il soit 70% PLUS COURT en français.
        Garde UNIQUEMENT l'essentiel. Utilise des phrases ultra-courtes et des puces.
        Format Markdown.
        
        Contenu:
        ${content.substring(0, 8000)}
      `;
    } else {
      prompt = `
        Transforme ce contenu en une "Fiche de Révision ULTRA-FUN" en français! 🎉
        
        Structure OBLIGATOIRE:
        - ## 🎯 L'Essentiel (3-4 points max)
        - ## 💡 À Retenir Absolument
        - ## ⚡ Astuces Pro
        - ## 🎓 Pour Briller
        
        Utilise PLEIN d'emojis et un ton super motivant! 🚀
        
        Contenu:
        ${content.substring(0, 8000)}
      `;
    }

    try {
      return await this._callOllama(prompt);
    } catch (error) {
      console.error('Error generating enhanced summary:', error);
      throw new Error('Failed to generate enhanced summary');
    }
  }

  async explainMistakes(questions, userAnswers, courseContent) {
    const mistakes = questions
      .map((q, index) => ({
        question: q.question,
        options: q.options,
        userAnswer: userAnswers[index],
        correctAnswer: q.correctAnswerIndex,
        isWrong: userAnswers[index] !== q.correctAnswerIndex,
      }))
      .filter((m) => m.isWrong);

    if (mistakes.length === 0) {
      return "Félicitations ! Vous n'avez fait aucune erreur. 🎉";
    }

    const mistakesText = mistakes
      .map(
        (m, i) => `
Question ${i + 1}: ${m.question}
Votre réponse: ${m.options[m.userAnswer]}
Bonne réponse: ${m.options[m.correctAnswer]}
    `,
      )
      .join('\n');

    const prompt = `
      Tu es un professeur bienveillant. Explique les erreurs suivantes commises dans un quiz.
      Utilise le contexte du cours pour clarifier les concepts.
      
      Erreurs:
      ${mistakesText}
      
      Contexte:
      ${courseContent.substring(0, 3000)}
      
      Instructions:
      - Explique pourquoi la bonne réponse est correcte.
      - Ton encourageant et pédagogique en français.
      - Utilise du Markdown et des emojis.
    `;

    try {
      return await this._callOllama(prompt);
    } catch (error) {
      console.error('Error explaining mistakes:', error);
      throw new Error('Failed to explain mistakes');
    }
  }
}

module.exports = new AiService();
