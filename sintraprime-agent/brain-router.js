/**
 * SintraPrime Brain Router: Extremely Smart
 * 
 * Intelligent routing between multiple AI models:
 * - GPT-4/4o for complex reasoning
 * - GPT-4o-mini/3.5 for simple tasks
 * - Local Ollama for privacy/offline
 * 
 * Smart routing cuts costs by 60-80% while maintaining quality
 */

const axios = require('axios');
const { exec } = require('child_process');

class BrainRouter {
  constructor(logger) {
    this.logger = logger;
    
    // API Configuration
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    // Local Ollama configuration
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    
    // Model tiers
    this.models = {
      PRIMARY: 'gpt-4o',              // Complex reasoning
      SECONDARY: 'gpt-4o-mini',       // Cheap worker
      LOCAL: this.ollamaModel,        // Privacy/offline
      FALLBACK: 'gpt-3.5-turbo'       // Emergency
    };
    
    // Cost tracking (per 1M tokens)
    this.costs = {
      'gpt-4o': { input: 2.50, output: 10.00 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
    };
    
    // Usage tracking
    this.usage = {
      primary: { tokens: 0, requests: 0, cost: 0 },
      secondary: { tokens: 0, requests: 0, cost: 0 },
      local: { tokens: 0, requests: 0, cost: 0 }
    };
    
    // Task complexity categories
    this.complexity = {
      SIMPLE: 'simple',       // Classification, routing, simple yes/no
      MODERATE: 'moderate',   // Summaries, explanations, drafting
      COMPLEX: 'complex'      // Reasoning, planning, legal analysis
    };
  }

  /**
   * Main think method - intelligently routes to appropriate brain
   */
  async think(prompt, options = {}) {
    const {
      complexity = this.complexity.MODERATE,
      category = 'general',
      preferLocal = false,
      requireOnline = false,
      maxTokens = 500,
      temperature = 0.7,
      systemPrompt = null
    } = options;

    // Select the right brain
    const brain = this.selectBrain(complexity, category, preferLocal, requireOnline);
    
    this.logger.info('Brain routing', { brain, complexity, category });

    try {
      let response;
      
      if (brain === 'local') {
        response = await this.thinkLocal(prompt, { systemPrompt, maxTokens, temperature });
        this.trackUsage('local', response.tokens || 0);
      } else {
        response = await this.thinkOpenAI(brain, prompt, { systemPrompt, maxTokens, temperature });
        const tier = brain === this.models.PRIMARY ? 'primary' : 'secondary';
        this.trackUsage(tier, response.usage, brain);
      }

      return {
        success: true,
        response: response.content,
        model: brain,
        tokens: response.tokens || response.usage?.total_tokens || 0
      };

    } catch (error) {
      this.logger.error('Brain failed, trying fallback', { error: error.message, brain });
      
      // Fallback to cheaper model or local
      if (brain !== this.models.FALLBACK && brain !== 'local') {
        return await this.think(prompt, { ...options, complexity: this.complexity.SIMPLE });
      }
      
      throw error;
    }
  }

  /**
   * Primary/Secondary OpenAI reasoning
   */
  async thinkOpenAI(model, prompt, options = {}) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const {
      systemPrompt = 'You are SintraPrime, an AI agent assisting with trust automation and legal workflows.',
      maxTokens = 500,
      temperature = 0.7
    } = options;

    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };

    } catch (error) {
      this.logger.error('OpenAI API error', { 
        error: error.message,
        model,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Local Ollama reasoning (privacy, offline, free)
   */
  async thinkLocal(prompt, options = {}) {
    const {
      systemPrompt = 'You are SintraPrime, an AI agent assisting with trust automation.',
      maxTokens = 500,
      temperature = 0.7
    } = options;

    try {
      // Check if Ollama is running
      await axios.get(`${this.ollamaBaseUrl}/api/tags`, { timeout: 2000 });

      const response = await axios.post(
        `${this.ollamaBaseUrl}/api/generate`,
        {
          model: this.ollamaModel,
          prompt: `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens
          }
        },
        { timeout: 120000 }
      );

      return {
        content: response.data.response,
        tokens: response.data.eval_count || 0
      };

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama not running. Start with: ollama serve');
      }
      throw error;
    }
  }

  /**
   * Intelligent brain selection based on task
   */
  selectBrain(complexity, category, preferLocal, requireOnline) {
    // Force local if preferred and not requiring online
    if (preferLocal && !requireOnline) {
      return 'local';
    }

    // Require online - use OpenAI
    if (requireOnline) {
      return complexity === this.complexity.COMPLEX 
        ? this.models.PRIMARY 
        : this.models.SECONDARY;
    }

    // Category-based routing
    const complexCategories = ['legal', 'reasoning', 'planning', 'analysis', 'decision'];
    const simpleCategories = ['classification', 'routing', 'simple', 'status', 'check'];

    if (complexCategories.includes(category.toLowerCase())) {
      return this.models.PRIMARY;
    }

    if (simpleCategories.includes(category.toLowerCase())) {
      return this.models.SECONDARY;
    }

    // Complexity-based routing
    switch (complexity) {
      case this.complexity.SIMPLE:
        return this.models.SECONDARY;
      
      case this.complexity.COMPLEX:
        return this.models.PRIMARY;
      
      case this.complexity.MODERATE:
      default:
        // Try local first for moderate tasks if available
        return preferLocal ? 'local' : this.models.SECONDARY;
    }
  }

  /**
   * Pre-defined reasoning tasks
   */
  async classify(text, categories) {
    const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}

Text: "${text}"

Respond with ONLY the category name, nothing else.`;

    const result = await this.think(prompt, {
      complexity: this.complexity.SIMPLE,
      category: 'classification',
      maxTokens: 50,
      temperature: 0.3
    });

    return result.response.trim();
  }

  async shouldEscalate(event) {
    const prompt = `Given this event, should it be escalated to a human?

Event: ${JSON.stringify(event)}

Consider:
- Is it time-sensitive?
- Does it require legal judgment?
- Is it an error that could cascade?
- Does it involve money or commitments?

Respond with ONLY "YES" or "NO".`;

    const result = await this.think(prompt, {
      complexity: this.complexity.SIMPLE,
      category: 'decision',
      maxTokens: 10,
      temperature: 0.1
    });

    return result.response.trim().toUpperCase() === 'YES';
  }

  async summarize(text, maxLength = 100) {
    const prompt = `Summarize the following in ${maxLength} words or less:

${text}`;

    const result = await this.think(prompt, {
      complexity: this.complexity.MODERATE,
      category: 'summary',
      maxTokens: maxLength * 2,
      temperature: 0.5
    });

    return result.response;
  }

  async analyzeLegal(document, question) {
    const prompt = `Legal Document Analysis

Document: ${document}

Question: ${question}

Provide a clear, structured analysis with:
1. Direct answer
2. Key relevant sections
3. Potential issues
4. Recommended actions`;

    const result = await this.think(prompt, {
      complexity: this.complexity.COMPLEX,
      category: 'legal',
      maxTokens: 1000,
      temperature: 0.3,
      requireOnline: true
    });

    return result.response;
  }

  async generateNotice(type, data) {
    const prompt = `Generate a formal ${type} notice with the following information:

${JSON.stringify(data, null, 2)}

Requirements:
- Formal legal language
- Clear date references
- Proper formatting
- Include all necessary disclaimers`;

    const result = await this.think(prompt, {
      complexity: this.complexity.COMPLEX,
      category: 'legal',
      maxTokens: 1500,
      temperature: 0.4,
      requireOnline: true
    });

    return result.response;
  }

  async explainDecision(decision, context) {
    const prompt = `Explain this decision in simple terms:

Decision: ${decision}
Context: ${context}

Provide:
1. What was decided
2. Why it was decided
3. What happens next
4. Any risks or considerations`;

    const result = await this.think(prompt, {
      complexity: this.complexity.MODERATE,
      category: 'explanation',
      maxTokens: 500,
      temperature: 0.6,
      preferLocal: true
    });

    return result.response;
  }

  /**
   * Track usage and costs
   */
  trackUsage(tier, usage, model = null) {
    if (tier === 'local') {
      this.usage.local.tokens += usage;
      this.usage.local.requests += 1;
      return;
    }

    const tierKey = tier === 'primary' ? 'primary' : 'secondary';
    this.usage[tierKey].requests += 1;

    if (usage && usage.total_tokens) {
      this.usage[tierKey].tokens += usage.total_tokens;

      // Calculate cost
      if (model && this.costs[model]) {
        const inputCost = (usage.prompt_tokens / 1000000) * this.costs[model].input;
        const outputCost = (usage.completion_tokens / 1000000) * this.costs[model].output;
        this.usage[tierKey].cost += inputCost + outputCost;
      }
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      primary: {
        ...this.usage.primary,
        costUSD: this.usage.primary.cost.toFixed(4)
      },
      secondary: {
        ...this.usage.secondary,
        costUSD: this.usage.secondary.cost.toFixed(4)
      },
      local: {
        ...this.usage.local,
        costUSD: '0.00'
      },
      total: {
        requests: this.usage.primary.requests + this.usage.secondary.requests + this.usage.local.requests,
        tokens: this.usage.primary.tokens + this.usage.secondary.tokens + this.usage.local.tokens,
        costUSD: (this.usage.primary.cost + this.usage.secondary.cost).toFixed(4)
      },
      estimatedMonthlyCost: ((this.usage.primary.cost + this.usage.secondary.cost) * 30).toFixed(2)
    };
  }

  /**
   * Reset usage tracking (call monthly)
   */
  resetUsageTracking() {
    this.usage = {
      primary: { tokens: 0, requests: 0, cost: 0 },
      secondary: { tokens: 0, requests: 0, cost: 0 },
      local: { tokens: 0, requests: 0, cost: 0 }
    };
    this.logger.info('Brain usage tracking reset');
  }

  /**
   * Check if local brain is available
   */
  async isLocalBrainAvailable() {
    try {
      await axios.get(`${this.ollamaBaseUrl}/api/tags`, { timeout: 2000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Health check for all brains
   */
  async healthCheck() {
    const health = {
      primary: false,
      secondary: false,
      local: false
    };

    // Check OpenAI
    if (this.openaiApiKey) {
      try {
        await axios.get(`${this.openaiBaseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${this.openaiApiKey}` },
          timeout: 5000
        });
        health.primary = true;
        health.secondary = true;
      } catch (error) {
        this.logger.warn('OpenAI health check failed', { error: error.message });
      }
    }

    // Check Ollama
    health.local = await this.isLocalBrainAvailable();

    return health;
  }
}

module.exports = { BrainRouter };
