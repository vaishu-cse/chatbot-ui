import React, { useState, useRef, useEffect } from 'react'

export default function App() {
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        // Show both interim and final results in real-time
        setQuery(finalTranscript || interimTranscript)
      }
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error)
      }
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function send() {
    if (!query.trim()) return

    const userMessage = query.trim()
    setQuery('')
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      })
      const data = await res.json()
      const answer = data.error ? `Error: ${data.error}` : (data.response?.answer || 'No response')
      setMessages(prev => [...prev, { type: 'assistant', text: answer }])
    } catch (e) {
      setMessages(prev => [...prev, { type: 'assistant', text: `Error: ${String(e)}` }])
    } finally {
      setLoading(false)
    }
  }

  function toggleVoice() {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop()
      } else {
        recognitionRef.current.start()
        setIsListening(true)
      }
    }
  }

  function refresh() {
    setMessages([])
    setQuery('')
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="logo">🤖</div>
          <span className="header-title">AI ASSISTANT</span>
        </div>
        <div className="header-right">
          <span>Welcome User</span>
          <button className="refresh-btn" onClick={refresh} title="Refresh">↻</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {messages.length === 0 ? (
          <div className="welcome-section">
            <div className="welcome-icon">🤖</div>
            <h2>Welcome to the AI Employee Policy Assistant</h2>
            <p>
                Your intelligent workplace support companion. Quickly access company policies,
                find relevant policy documents, get step-by-step guidance for common processes,
                receive assistance with ServiceNow tickets, view your PTO balances, and check
                your shift schedules - all in one place.
            </p>
        </div>
        ) : (
          <div className="messages-container">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.type === 'assistant' && <div className="message-icon">🤖</div>}
                <div className={`message-bubble ${msg.type}`}>
                  {msg.text}
                </div>
                {msg.type === 'user' && <div className="message-icon-user">👤</div>}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about exceptions..."
            disabled={loading}
            className={isListening ? 'listening' : ''}
          />
          <button className="voice-btn" onClick={toggleVoice} title="Voice input" style={{background: isListening ? '#ff4444' : '#f0f0f0', color: isListening ? 'white' : '#666'}}>
            🎙️
          </button>
          <button className="send-btn" onClick={send} disabled={!query.trim() || loading}>
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
