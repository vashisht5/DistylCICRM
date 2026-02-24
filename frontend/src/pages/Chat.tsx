import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, Bot, User } from 'lucide-react'
import { useChat } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const EXAMPLES = [
  'Brief me on Cohere vs Distyl for claims',
  'Who are the key IBM Healthcare AI execs?',
  'What changed with GCP Healthcare AI this week?',
  'Which of our open deals have the highest competitive risk?',
  'What is Palantir\'s healthcare go-to-market?',
]

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatMutation = useChat()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text?: string) {
    const message = text ?? input.trim()
    if (!message) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: message }]
    setMessages(newMessages)

    try {
      const result = await chatMutation.mutateAsync({
        message,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          Intel Chat
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Ask anything about competitors, deals, or market intel</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto pt-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Bot className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Ask about competitive intel</h2>
              <p className="text-sm text-gray-500 mt-1">I have access to all dossiers, signals, deals, and news.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => handleSend(ex)}
                  className="text-left p-3 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3 max-w-3xl', msg.role === 'user' && 'ml-auto flex-row-reverse')}>
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
              msg.role === 'assistant' ? 'bg-primary-100' : 'bg-gray-100'
            )}>
              {msg.role === 'assistant'
                ? <Bot className="w-4 h-4 text-primary-600" />
                : <User className="w-4 h-4 text-gray-500" />
              }
            </div>
            <div className={cn(
              'rounded-2xl px-4 py-3 text-sm max-w-[80%]',
              msg.role === 'assistant'
                ? 'bg-white border border-gray-200 text-gray-800'
                : 'bg-primary-600 text-white'
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex gap-3 max-w-3xl">
            <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about a competitor, deal, or signal..."
            disabled={chatMutation.isPending}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || chatMutation.isPending}
            className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
