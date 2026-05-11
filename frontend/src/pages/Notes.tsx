import { useState } from 'react'
import { NotebookPen, Send, Loader2, CheckCircle2, Clock, AlertCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { useNotes, useNote, useSubmitNote, useReprocessNote } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 text-yellow-500" />,
  processing: <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
  done: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  failed: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing...',
  done: 'Done',
  failed: 'Failed',
}

function NoteDetail({ noteId }: { noteId: number }) {
  const { data, isLoading } = useNote(noteId)
  const reprocess = useReprocessNote()
  const note = data?.note

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!note) return null

  const isProcessing = note.processing_status === 'pending' || note.processing_status === 'processing'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{note.title || 'Untitled Note'}</h3>
          <div className="flex items-center gap-2 mt-1">
            {STATUS_ICONS[note.processing_status]}
            <span className="text-xs text-gray-500">{STATUS_LABELS[note.processing_status]}</span>
            {note.meeting_date && (
              <span className="text-xs text-gray-400">· {new Date(note.meeting_date).toLocaleDateString()}</span>
            )}
            {note.processed_at && (
              <span className="text-xs text-gray-400">· processed {new Date(note.processed_at).toLocaleString()}</span>
            )}
          </div>
        </div>
        {note.processing_status === 'failed' && (
          <button
            onClick={() => reprocess.mutate(noteId, { onSuccess: () => toast.success('Reprocessing started') })}
            disabled={reprocess.isPending}
            className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2 text-sm text-blue-700">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          AI is processing your notes. This page will update automatically.
        </div>
      )}

      {/* Extracted data panels */}
      {note.processing_status === 'done' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Companies */}
          {(note.entity_ids?.length > 0 || data?.entities?.length > 0) && (
            <ExtractedPanel title="Companies Identified" count={data?.entities?.length ?? note.entity_ids?.length ?? 0}>
              <div className="space-y-1">
                {(data?.entities ?? []).map((e: any) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                    <span className="font-medium text-gray-800">{e.name}</span>
                    <span className="text-xs text-gray-400 capitalize">{e.entity_type}</span>
                  </div>
                ))}
              </div>
            </ExtractedPanel>
          )}

          {/* Contacts */}
          {note.extracted_contacts?.length > 0 && (
            <ExtractedPanel title="Contacts Extracted" count={note.extracted_contacts.length}>
              <div className="space-y-2">
                {note.extracted_contacts.map((c: any, i: number) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-gray-800">{c.name}</span>
                    {c.title && <span className="text-gray-500"> · {c.title}</span>}
                    {c.company && <span className="text-gray-400 text-xs"> @ {c.company}</span>}
                    {c.email && <div className="text-xs text-blue-600 mt-0.5">{c.email}</div>}
                  </div>
                ))}
              </div>
            </ExtractedPanel>
          )}

          {/* Action Items */}
          {note.extracted_action_items?.length > 0 && (
            <ExtractedPanel title="Action Items" count={note.extracted_action_items.length}>
              <div className="space-y-1.5">
                {note.extracted_action_items.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1 w-4 h-4 shrink-0 rounded-full border-2 border-gray-300" />
                    {item}
                  </div>
                ))}
              </div>
            </ExtractedPanel>
          )}

          {/* Deal Data */}
          {note.extracted_deal_data?.length > 0 && (
            <ExtractedPanel title="Deal Intelligence" count={note.extracted_deal_data.length}>
              <div className="space-y-3">
                {note.extracted_deal_data.map((d: any, i: number) => (
                  <div key={i} className="text-sm border border-gray-100 rounded-lg p-2.5 space-y-1">
                    <div className="font-medium text-gray-800">{d.account_name}</div>
                    {d.deal_name && <div className="text-gray-500 text-xs">{d.deal_name}</div>}
                    <div className="flex gap-2 flex-wrap">
                      {d.stage && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded capitalize">{d.stage}</span>
                      )}
                      {d.value_usd && (
                        <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                          ${d.value_usd.toLocaleString()}
                        </span>
                      )}
                      {d.competitors?.map((c: string, ci: number) => (
                        <span key={ci} className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">vs {c}</span>
                      ))}
                    </div>
                    {d.next_steps && (
                      <div className="text-xs text-gray-500 mt-1">Next: {d.next_steps}</div>
                    )}
                  </div>
                ))}
              </div>
            </ExtractedPanel>
          )}

          {/* Signals */}
          {note.extracted_signals?.length > 0 && (
            <ExtractedPanel title="Competitive Signals" count={note.extracted_signals.length} className="lg:col-span-2">
              <div className="space-y-2">
                {note.extracted_signals.map((s: any, i: number) => (
                  <div key={i} className="text-sm border-l-2 border-primary-200 pl-3">
                    <div className="font-medium text-gray-800">{s.title}</div>
                    {s.entity_name && <div className="text-xs text-primary-600">{s.entity_name}</div>}
                    {s.summary && <div className="text-gray-500 text-xs mt-0.5">{s.summary}</div>}
                  </div>
                ))}
              </div>
            </ExtractedPanel>
          )}
        </div>
      )}

      {/* Raw text */}
      <details className="group">
        <summary className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-gray-600 list-none">
          <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
          Show raw notes
        </summary>
        <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-3 font-mono max-h-48 overflow-y-auto">
          {note.raw_text}
        </pre>
      </details>
    </div>
  )
}

function ExtractedPanel({ title, count, children, className }: {
  title: string
  count: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{count}</span>
      </div>
      {children}
    </div>
  )
}

export default function Notes() {
  const [rawText, setRawText] = useState('')
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  const submitNote = useSubmitNote()
  const { data: notesData, isLoading } = useNotes()
  const notes = notesData?.notes ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rawText.trim()) return

    try {
      const result = await submitNote.mutateAsync({
        raw_text: rawText,
        title: title || undefined,
        meeting_date: meetingDate || undefined,
      })
      toast.success('Notes submitted — AI is processing...')
      setSelectedNoteId(result.note.id)
      setRawText('')
      setTitle('')
      setMeetingDate('')
      setShowSubmitForm(false)
    } catch {
      toast.error('Failed to submit notes')
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <NotebookPen className="w-5 h-5 text-primary-600" />
          Meeting Notes
          <span className="text-sm font-normal text-gray-400">({notes.length})</span>
        </h1>
        <button
          onClick={() => setShowSubmitForm(v => !v)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <NotebookPen className="w-3.5 h-3.5" />
          {showSubmitForm ? 'Cancel' : 'Add Notes'}
        </button>
      </div>

      {/* Submit form */}
      {showSubmitForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Paste Meeting Notes</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Title (optional)</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Discovery call with Acme"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Meeting Date (optional)</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Notes / Transcript / Email *
              </label>
              <textarea
                required
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={10}
                placeholder="Paste your meeting notes, call transcript, email thread, or any unstructured text here. The AI will extract: companies, contacts, deal info, action items, and competitive signals."
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono resize-y"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitNote.isPending || !rawText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {submitNote.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Process with AI
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main content: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notes list */}
        <div className="lg:col-span-1 space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}
          {!isLoading && notes.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <NotebookPen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs mt-1">Paste meeting notes to get started</p>
            </div>
          )}
          {notes.map((note: any) => (
            <button
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={cn(
                'w-full text-left bg-white rounded-xl border p-3 hover:border-primary-300 transition-all',
                selectedNoteId === note.id ? 'border-primary-400 shadow-sm' : 'border-gray-200'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {note.title || 'Untitled Note'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{note.preview}</p>
                </div>
                <div className="shrink-0">
                  {STATUS_ICONS[note.processing_status]}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium',
                  note.processing_status === 'done' ? 'bg-green-50 text-green-600' :
                  note.processing_status === 'failed' ? 'bg-red-50 text-red-600' :
                  'bg-yellow-50 text-yellow-600'
                )}>
                  {STATUS_LABELS[note.processing_status]}
                </span>
                {note.action_items_count > 0 && (
                  <span className="text-[10px] text-gray-500">{note.action_items_count} actions</span>
                )}
                {note.contacts_count > 0 && (
                  <span className="text-[10px] text-gray-500">{note.contacts_count} contacts</span>
                )}
                {note.signals_count > 0 && (
                  <span className="text-[10px] text-primary-600">{note.signals_count} signals</span>
                )}
                <span className="text-[10px] text-gray-300 ml-auto">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Note detail */}
        <div className="lg:col-span-2">
          {selectedNoteId ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <NoteDetail noteId={selectedNoteId} />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <NotebookPen className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Select a note to view extracted data</p>
              <p className="text-xs text-gray-300 mt-1">Companies, contacts, action items, deals, and signals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
