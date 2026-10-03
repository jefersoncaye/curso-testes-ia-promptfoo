// In-memory conversation history per sessionId.
// Restarting the app clears every session.
// v1 stores the history but ignores it when answering (bug B6).
const crypto = require('node:crypto');

const sessions = new Map();

function getSession(sessionId) {
  const id = sessionId || crypto.randomUUID();
  if (!sessions.has(id)) sessions.set(id, { id, history: [], lastOrderId: null });
  return sessions.get(id);
}

function addTurn(session, userMessage, reply) {
  session.history.push({ role: 'user', content: userMessage });
  session.history.push({ role: 'assistant', content: reply });
  if (session.history.length > 20) session.history.splice(0, session.history.length - 20);
}

module.exports = { getSession, addTurn };
