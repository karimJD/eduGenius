const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class AiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async generateQuiz(text, count = 3) {
    const prompt = `
      Based on the following text, generate a quiz with ${count} questions in French.
      Return the result strictly as a JSON array of objects.
      Each object must have:
      - "question": string (in French)
      - "options": array of 4 strings (in French)
      - "correctAnswerIndex": number (0-3)

      Text:
      ${text}
      
      Output JSON only, no markdown formatting.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      // Clean up markdown code blocks if present
      const textResponse = response.text();
      const jsonString = textResponse.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error generating quiz:", error);
      throw new Error("Failed to generate quiz");
    }
  }

  async generateSummary(content) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        Crée un résumé CAPTIVANT et AMUSANT du contenu de cours suivant en français.
        
        Ton objectif: Rendre l'apprentissage EXCITANT! 🚀
        
        Style à adopter:
        - Ton conversationnel et amical (tutoie l'étudiant)
        - Utilise des EMOJIS pertinents pour illustrer les concepts 🎯
        - Ajoute des analogies simples et relatable
        - Utilise des phrases courtes et percutantes
        - Rends les concepts complexes accessibles et fun
        - Structure avec des titres accrocheurs
        
        Format STRICTEMENT en Markdown:
        - Titres clairs avec emojis (## 🎯 Titre)
        - Listes à puces pour la clarté
        - **Gras** pour les concepts clés
        - *Italique* pour les nuances importantes
        
        DO NOT wrap the output in markdown code blocks (no \`\`\`markdown).
        Return ONLY the markdown content directly.

        Contenu du cours:
        ${content}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up markdown code fences if present
      text = text.replace(/```markdown\n?/g, '').replace(/```\n?$/g, '').trim();
      
      return text;
    } catch (error) {
      console.error("Error generating summary:", error);
      throw new Error("Failed to generate summary");
    }
  }

  async generateEnhancedSummary(content, style = 'cheatSheet') {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      let prompt;

      if (style === 'shrink') {
        prompt = `
          Réécris le contenu suivant pour qu'il soit 70% PLUS COURT tout en conservant les informations essentielles.
          Le résultat DOIT être en français.
          
          Règles STRICTES:
          1. Réduis drastiquement le texte - vise 30% de la longueur originale
          2. Garde UNIQUEMENT les points clés et concepts essentiels
          3. Utilise des phrases très courtes et directes
          4. Supprime tous les exemples détaillés et explications longues
          5. Utilise des listes à puces pour la concision
          6. Format STRICTEMENT en Markdown
          7. Utilise des titres courts (## Titre)
          
          Contenu à réduire:
          ${content}
        `;
      } else { // Default to 'cheatSheet' style
        prompt = `
          Transforme le contenu suivant en une "Fiche de Révision ULTRA-FUN" en français! 🎉
          
          Ton mission: Créer une fiche que les étudiants vont ADORER lire! 
          
          Style OBLIGATOIRE:
          1. Ton super friendly et motivant (tutoie l'étudiant)
          2. PLEIN d'emojis pertinents et fun 🚀 💡 ⚡ 🎯 ✨
          3. Analogies simples et relatable (comparaisons du quotidien)
          4. Phrases courtes et percutantes
          5. Astuces mémorisation avec des mnémoniques fun
          6. Titres accrocheurs avec emojis
          
          Structure OBLIGATOIRE:
          - ## 🎯 L'Essentiel (concepts clés en 3-4 points max)
          - ## 💡 À Retenir Absolument (points critiques)
          - ## ⚡ Astuces Pro (tips pratiques)
          - ## 🎓 Pour Briller (points bonus/avancés)
          
          Format STRICTEMENT en Markdown avec emojis partout!
          Rends ça VIVANT et ENGAGEANT! 🔥

          Contenu:
          ${content}
        `;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up markdown code fences if present
      text = text.replace(/```markdown\n?/g, '').replace(/```\n?$/g, '').trim();
      
      return text;
    } catch (error) {
      console.error("Error generating enhanced summary:", error);
      throw new Error("Failed to generate enhanced summary");
    }
  }

  async explainMistakes(questions, userAnswers, courseContent) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // Filter wrong answers
      const mistakes = questions
        .map((q, index) => ({
          question: q.question,
          options: q.options,
          userAnswer: userAnswers[index],
          correctAnswer: q.correctAnswerIndex,
          isWrong: userAnswers[index] !== q.correctAnswerIndex
        }))
        .filter(m => m.isWrong);

      if (mistakes.length === 0) {
        return "Félicitations ! Vous n'avez fait aucune erreur. 🎉";
      }

      const mistakesText = mistakes.map((m, i) => `
Question ${i + 1}: ${m.question}
Votre réponse: ${m.options[m.userAnswer]}
Bonne réponse: ${m.options[m.correctAnswer]}
      `).join('\n');

      const prompt = `
Tu es un professeur bienveillant qui aide les étudiants à comprendre leurs erreurs.

Voici les erreurs commises par l'étudiant dans un quiz:

${mistakesText}

Contexte du cours:
${courseContent.substring(0, 2000)}

Instructions:
1. Pour chaque erreur, explique POURQUOI la bonne réponse est correcte
2. Explique POURQUOI la réponse de l'étudiant était incorrecte
3. Donne des conseils pour mieux comprendre le concept
4. Utilise un ton encourageant et pédagogique
5. Réponds en français
6. Utilise du Markdown pour la mise en forme
7. Utilise des emojis pour rendre l'explication plus engageante

Format ta réponse avec:
- Des titres clairs pour chaque erreur
- Des explications détaillées mais concises
- Des conseils pratiques
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error explaining mistakes:", error);
      throw new Error("Failed to explain mistakes");
    }
  }
}

module.exports = new AiService();
