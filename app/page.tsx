'use client'

import { useState, useRef, useEffect } from 'react'
import { marked } from 'marked'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [contextLoaded, setContextLoaded] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setContextLoaded(true)
      setMessages([{
        role: 'assistant',
        content: `✅ Successfully loaded ${files.length} file(s)! I've analyzed your course materials and I'm ready to help you understand any concepts, answer questions, and explain topics in depth. What would you like to learn about?`
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const askQuestion = async () => {
    if (!question.trim() || loading) return

    const userMessage: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askQuestion()
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🎓 Amity Professor Agent</h1>
        <p>Your Personal AI Study Assistant - Upload materials and get deep explanations</p>
      </header>

      <div className="main-content">
        <div className="card">
          <h2>📚 Upload Course Materials</h2>

          <div
            className={`upload-section ${dragOver ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon">📄</div>
            <p>Click or drag files here</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '10px' }}>
              PDF, TXT, DOCX supported
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="file-input"
            />
          </div>

          {files.length > 0 && (
            <div className="file-list">
              <h3 style={{ marginBottom: '10px', color: '#667eea' }}>
                Selected Files ({files.length})
              </h3>
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <span>📄 {file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className="btn"
                style={{ marginTop: '15px', width: '100%' }}
              >
                {uploading ? 'Uploading...' : 'Upload & Process Files'}
              </button>
            </div>
          )}

          {contextLoaded && (
            <div className="context-info">
              <strong>✓ Context Loaded</strong>
              <p style={{ marginTop: '5px', fontSize: '0.9rem' }}>
                Your materials are ready. Ask any questions!
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>💬 Ask Questions</h2>

          <div className="qa-section">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                  <p>Upload your course materials and start asking questions!</p>
                  <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                    I can explain concepts, solve problems, and help you understand your subjects deeply.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.role}`}>
                    <div className="message-label">
                      {msg.role === 'user' ? '👤 You' : '🤖 Professor'}
                    </div>
                    <div
                      className="message-content"
                      dangerouslySetInnerHTML={{
                        __html: marked(msg.content) as string
                      }}
                    />
                  </div>
                ))
              )}
              {loading && (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Thinking...</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && <div className="error">{error}</div>}

            <div className="input-section">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your course materials..."
                className="question-input"
                disabled={loading}
              />
              <button
                onClick={askQuestion}
                disabled={loading || !question.trim()}
                className="btn"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
