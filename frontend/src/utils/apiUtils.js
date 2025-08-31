const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Single-turn query
export const queryRAG = async (question) => {
  try {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Returns { text, emotion }
    return await response.json();
  } catch (error) {
    console.error('Error querying RAG API:', error);
    throw error;
  }
};

// Multi-turn chat with session support
export const chatRAG = async (message, sessionId) => {
  try {
    // Include session_id if available
    const payload = { message };
    if (sessionId) payload.session_id = sessionId;

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Returns { session_id, text, emotion, chat_history }
    return await response.json();
  } catch (error) {
    console.error('Error chatting with RAG API:', error);
    throw error;
  }
};