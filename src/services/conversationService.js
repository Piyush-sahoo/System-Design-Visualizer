/**
 * Conversation Service for AI Chat Builder
 * Handles the intelligent questionnaire flow for building system designs
 */

const SYSTEM_PROMPT = `You are a friendly system design architect helping users build microservice architectures.

YOUR ROLE:
- Guide users through understanding their project needs via conversation
- Ask ONE question at a time, keep responses concise (2-3 sentences max)
- Be conversational and encouraging, not robotic
- Adapt your questions based on their answers

TOPICS TO COVER (in flexible order):
1. Project type (e-commerce, SaaS, social app, etc.)
2. Expected scale (users, requests per day)
3. Core features and functionality
4. Data storage needs
5. Third-party integrations
6. Technical preferences or constraints

RULES:
- After 5-7 exchanges, summarize what you've learned and offer to generate the design
- If user says "generate" or "done" early, proceed with what you have
- Always be helpful and explain WHY you're asking something if relevant`;

const GENERATION_PROMPT = `Based on this conversation, create a clean microservice architecture.

REQUIREMENTS:
- Include 7-15 components depending on complexity
- ALWAYS include: Client/Frontend, API Gateway, at least one backend service, at least one database
- Add as needed: Load Balancer, Cache (Redis), Message Queue, CDN, Auth Service, specific microservices
- Keep it SIMPLE but COMPREHENSIVE - show the key components, not every detail
- Use clear, descriptive names

OUTPUT FORMAT - Return a JSON object with EXACTLY this structure:
{
  "summary": "Brief 1-2 sentence description of the architecture",
  "mermaidCode": "graph TD\\n    ...(valid mermaid code)...",
  "flowData": {
    "nodes": [
      { "id": "...", "type": "clientNode|serverNode|databaseNode|loadBalancerNode|cacheNode", "position": {"x": number, "y": number}, "data": {"label": "...", "description": "...", "tech": "..."} }
    ],
    "edges": [
      { "id": "...", "source": "...", "target": "...", "animated": true, "label": "optional" }
    ]
  }
}

NODE TYPES:
- clientNode: Frontend, Mobile, Browser
- serverNode: Backend services, microservices, API Gateway
- loadBalancerNode: Load balancers, reverse proxies
- databaseNode: Databases (SQL, NoSQL)
- cacheNode: Redis, Memcached, CDN

POSITION NODES in a readable layout:
- Frontend/Client at top (y: 0-50)
- Gateway/Load Balancer next (y: 100-150)
- Services in middle (y: 250-350)
- Databases/Cache at bottom (y: 450-550)
- Spread horizontally (x: varies based on count)`;

/**
 * Get initial greeting message from AI
 */
export const getInitialMessage = () => {
  return {
    role: 'assistant',
    content: `Hey! 👋 I'm here to help you design a system architecture from scratch.

I'll ask you a few questions about what you're building, and then generate a clean microservice diagram for you.

**So, what are you building?** Tell me about your project - is it an e-commerce platform, a SaaS app, a social network, or something else?`
  };
};

/**
 * Send a message in the conversation and get AI response
 * @param {Array} conversationHistory - Array of {role, content} messages
 * @param {string} userMessage - The user's new message
 * @param {string} apiKey - User's API Key
 * @param {string} provider - 'openai' or 'gemini'
 * @returns {Promise<{message: string, isReadyToGenerate: boolean}>}
 */
export const sendChatMessage = async (conversationHistory, userMessage, apiKey, provider = 'openai') => {
  if (apiKey) {
    if (provider === 'gemini') {
      return sendMessageWithGemini(conversationHistory, userMessage, apiKey);
    } else {
      return sendMessageWithOpenAI(conversationHistory, userMessage, apiKey);
    }
  } else {
    // Fallback if no key provided (though UI restricts this if validation was stricter, but useful for dev)
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey) {
      return sendMessageWithOpenAI(conversationHistory, userMessage, envKey);
    }
    return getMockChatResponse(conversationHistory, userMessage);
  }
};

/**
 * Generate the system design from conversation
 * @param {Array} conversationHistory - The full conversation
 * @param {string} apiKey - User's API Key
 * @param {string} provider - 'openai' or 'gemini'
 * @returns {Promise<{summary: string, mermaidCode: string, flowData: object}>}
 */
export const generateDesignFromChat = async (conversationHistory, apiKey, provider = 'openai') => {
  if (apiKey) {
    if (provider === 'gemini') {
      return generateWithGemini(conversationHistory, apiKey);
    } else {
      return generateWithOpenAI(conversationHistory, apiKey);
    }
  } else {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey) {
      return generateWithOpenAI(conversationHistory, envKey);
    }
    return getMockDesign();
  }
};

// ============ OpenAI Implementation ============

const sendMessageWithOpenAI = async (conversationHistory, userMessage, apiKey) => {
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiMessage = data.choices[0].message.content;
    const isReadyToGenerate = checkIfReadyToGenerate(aiMessage, conversationHistory.length);

    return { message: aiMessage, isReadyToGenerate };
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
};

const generateWithOpenAI = async (conversationHistory, apiKey) => {
  try {
    const conversationSummary = conversationHistory
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: GENERATION_PROMPT },
          { role: 'user', content: `Here's the conversation about what to build:\n\n${conversationSummary}\n\nGenerate the system design.` }
        ],
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const result = JSON.parse(data.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Generation API Error:', error);
    throw error;
  }
};

// ============ Gemini Implementation ============

const sendMessageWithGemini = async (conversationHistory, userMessage, apiKey) => {
  try {
    // Map roles: 'user' -> 'user', 'assistant' -> 'model'
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = {
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTION: ${SYSTEM_PROMPT}` }]
    };

    // Note: Gemini API structure is slightly different for multi-turn chat via REST
    // But we can use the generateContent endpoint with full history
    const contents = [
      systemInstruction, // Inject system prompt as first user message or use system_instruction in beta
      ...history
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiMessage = data.candidates[0].content.parts[0].text;
    const isReadyToGenerate = checkIfReadyToGenerate(aiMessage, conversationHistory.length);

    return { message: aiMessage, isReadyToGenerate };

  } catch (error) {
    console.error('Gemini Chat API Error:', error);
    throw error;
  }
};

const generateWithGemini = async (conversationHistory, apiKey) => {
  try {
    const conversationSummary = conversationHistory
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${GENERATION_PROMPT}\n\nHere's the conversation about what to build:\n\n${conversationSummary}\n\nGenerate the system design. Return ONLY raw JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.candidates[0].content.parts[0].text;

    // More robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    return JSON.parse(jsonStr);

  } catch (error) {
    console.error('Gemini Generation API Error:', error);
    throw error;
  }
};


const checkIfReadyToGenerate = (message, historyLength) => {
  const lowerMessage = message.toLowerCase();
  const readyKeywords = ['generate', 'create the design', 'ready to build', 'shall i generate', 'want me to generate', 'create your architecture'];

  return historyLength >= 8 || readyKeywords.some(keyword => lowerMessage.includes(keyword));
};

// ============ Mock Implementation ============

const mockResponses = [
  { trigger: 0, response: "Great choice! That's an exciting project. **What's your expected scale?** Are we talking hundreds, thousands, or millions of users?" },
  { trigger: 1, response: "Got it! That helps me understand the infrastructure needs. **What are the core features** you need? For example: user auth, payments, real-time notifications, file uploads, etc." },
  { trigger: 2, response: "Nice feature set! **What kind of data** will you be storing? Think about user profiles, transactions, media files, etc." },
  { trigger: 3, response: "Makes sense. **Do you need any third-party integrations?** Like payment gateways (Stripe), email services, analytics, or external APIs?" },
  { trigger: 4, response: "Perfect! Last question: **Any technical preferences or constraints?** Like specific databases, cloud providers, or programming languages?" },
  { trigger: 5, response: "Awesome! I think I have a good picture now. 🎨\n\n**Here's what I understood:**\n- You're building a scalable application\n- With auth, data storage, and integrations\n- Needs to be reliable and performant\n\n**Ready to generate your system design?** Just click the button below!" }
];

const getMockChatResponse = async (conversationHistory, userMessage) => {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

  const exchangeCount = Math.floor(conversationHistory.length / 2);
  const mockResponse = mockResponses[Math.min(exchangeCount, mockResponses.length - 1)];

  return {
    message: mockResponse.response,
    isReadyToGenerate: exchangeCount >= 5
  };
};

const getMockDesign = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    summary: "A scalable microservice architecture with load balancing, API gateway, multiple backend services, caching, and database layers.",
    mermaidCode: `graph TD
    Client[Web/Mobile Client] -->|HTTPS| CDN[CDN]
    CDN --> LB[Load Balancer]
    LB --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Users[User Service]
    Gateway --> Core[Core Service]
    Gateway --> Notifications[Notification Service]
    Auth --> Redis[(Redis Cache)]
    Users --> UserDB[(User Database)]
    Core --> MainDB[(Primary Database)]
    Core --> Redis
    Notifications --> Queue[Message Queue]
    Queue --> EmailWorker[Email Worker]`,
    flowData: {
      nodes: [
        { id: 'client', type: 'clientNode', position: { x: 400, y: 0 }, data: { label: 'Web/Mobile Client', description: 'Frontend application for users', tech: 'React, React Native' } },
        { id: 'cdn', type: 'cacheNode', position: { x: 400, y: 80 }, data: { label: 'CDN', description: 'Content delivery for static assets', tech: 'CloudFront, Cloudflare' } },
        { id: 'lb', type: 'loadBalancerNode', position: { x: 400, y: 160 }, data: { label: 'Load Balancer', description: 'Distributes traffic across services', tech: 'NGINX, AWS ALB' } },
        { id: 'gateway', type: 'serverNode', position: { x: 400, y: 250 }, data: { label: 'API Gateway', description: 'Central entry point, routing, rate limiting', tech: 'Kong, Express Gateway' } },
        { id: 'auth', type: 'serverNode', position: { x: 150, y: 350 }, data: { label: 'Auth Service', description: 'Handles authentication and authorization', tech: 'Node.js, JWT' } },
        { id: 'users', type: 'serverNode', position: { x: 350, y: 350 }, data: { label: 'User Service', description: 'Manages user profiles and data', tech: 'Node.js, Express' } },
        { id: 'core', type: 'serverNode', position: { x: 550, y: 350 }, data: { label: 'Core Service', description: 'Main business logic', tech: 'Node.js, Python' } },
        { id: 'notifications', type: 'serverNode', position: { x: 750, y: 350 }, data: { label: 'Notification Service', description: 'Handles push and email notifications', tech: 'Node.js' } },
        { id: 'redis', type: 'cacheNode', position: { x: 150, y: 470 }, data: { label: 'Redis Cache', description: 'Session storage and caching', tech: 'Redis' } },
        { id: 'userdb', type: 'databaseNode', position: { x: 350, y: 470 }, data: { label: 'User Database', description: 'Stores user data', tech: 'PostgreSQL' } },
        { id: 'maindb', type: 'databaseNode', position: { x: 550, y: 470 }, data: { label: 'Primary Database', description: 'Main application data', tech: 'PostgreSQL, MongoDB' } },
        { id: 'queue', type: 'serverNode', position: { x: 750, y: 470 }, data: { label: 'Message Queue', description: 'Async job processing', tech: 'RabbitMQ, SQS' } },
        { id: 'emailworker', type: 'serverNode', position: { x: 750, y: 560 }, data: { label: 'Email Worker', description: 'Processes email jobs', tech: 'Node.js, SendGrid' } }
      ],
      edges: [
        { id: 'e1', source: 'client', target: 'cdn', animated: true },
        { id: 'e2', source: 'cdn', target: 'lb', animated: true },
        { id: 'e3', source: 'lb', target: 'gateway', animated: true },
        { id: 'e4', source: 'gateway', target: 'auth', animated: true },
        { id: 'e5', source: 'gateway', target: 'users', animated: true },
        { id: 'e6', source: 'gateway', target: 'core', animated: true },
        { id: 'e7', source: 'gateway', target: 'notifications', animated: true },
        { id: 'e8', source: 'auth', target: 'redis', animated: true },
        { id: 'e9', source: 'users', target: 'userdb', animated: true },
        { id: 'e10', source: 'core', target: 'maindb', animated: true },
        { id: 'e11', source: 'core', target: 'redis', animated: true, style: { strokeDasharray: '5,5' } },
        { id: 'e12', source: 'notifications', target: 'queue', animated: true },
        { id: 'e13', source: 'queue', target: 'emailworker', animated: true }
      ]
    }
  };
};
