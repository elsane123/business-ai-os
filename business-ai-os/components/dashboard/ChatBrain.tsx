interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function ChatBrain({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      className={[
        'flex items-end gap-2 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row',
      ].join(' ')}
    >
      {/* Avatar */}
      <div
        className={[
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm',
          isUser
            ? 'bg-[#4f46e5] text-white'
            : 'bg-[#1e1e30] border border-[#2a2a42] text-base',
        ].join(' ')}
        aria-hidden="true"
      >
        {isUser ? '👤' : '🧠'}
      </div>

      {/* Bubble + timestamp */}
      <div
        className={[
          'flex flex-col gap-1',
          isUser ? 'items-end' : 'items-start',
        ].join(' ')}
      >
        <div
          className={[
            'max-w-[80%] px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-[#4f46e5] text-white rounded-2xl rounded-tr-sm'
              : 'bg-[#1e1e30] text-gray-200 rounded-2xl rounded-tl-sm border border-[#2a2a42]',
          ].join(' ')}
        >
          {content}
        </div>
        {createdAt && (
          <time
            dateTime={createdAt}
            className="text-xs text-gray-500 px-1"
          >
            {formatTime(createdAt)}
          </time>
        )}
      </div>
    </div>
  )
}

// Convenience typing indicator component
export function ChatTypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1e1e30] border border-[#2a2a42] flex items-center justify-center text-sm">
        🧠
      </div>
      <div className="bg-[#1e1e30] border border-[#2a2a42] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
