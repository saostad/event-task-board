import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react'

interface Props {
  /** Existing remote voice note URL (already uploaded) */
  existingUrl?: string | null
  existingDurationMs?: number
  /** Local blob ready to upload (not yet saved) */
  localBlob?: Blob | null
  onRecorded: (blob: Blob, durationMs: number) => void
  onCleared: () => void
  disabled?: boolean
}

function formatMs(ms: number) {
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function VoiceNoteControl({
  existingUrl,
  existingDurationMs = 0,
  localBlob,
  onRecorded,
  onCleared,
  disabled
}: Props) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [localUrl, setLocalUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Local blob → object URL for playback before upload
  useEffect(() => {
    if (!localBlob) {
      setLocalUrl(null)
      return
    }
    const url = URL.createObjectURL(localBlob)
    setLocalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [localBlob])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const playbackSrc = localUrl || existingUrl || null
  const durationLabel =
    localBlob || existingUrl
      ? formatMs(localBlob ? elapsed || existingDurationMs : existingDurationMs)
      : null

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mime =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
              ? 'audio/mp4'
              : ''

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const type = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const durationMs = Date.now() - startedAtRef.current
        onRecorded(blob, durationMs)
        setElapsed(durationMs)
      }

      startedAtRef.current = Date.now()
      setElapsed(0)
      recorder.start(200)
      setRecording(true)

      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startedAtRef.current)
      }, 200)
    } catch (err: any) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Allow mic access and try again.'
          : 'Could not start recording. Use Chrome or Safari.'
      )
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }

  const togglePlay = async () => {
    if (!playbackSrc) return
    if (!audioRef.current) {
      audioRef.current = new Audio(playbackSrc)
      audioRef.current.onended = () => setPlaying(false)
    } else if (audioRef.current.src !== playbackSrc) {
      audioRef.current.src = playbackSrc
    }

    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      try {
        await audioRef.current.play()
        setPlaying(true)
      } catch {
        setError('Could not play audio')
      }
    }
  }

  const clear = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlaying(false)
    setElapsed(0)
    onCleared()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-slate-400 flex items-center gap-1.5">
        <Mic className="w-3.5 h-3.5" /> Voice instruction
      </label>

      {!playbackSrc && !recording && (
        <button
          type="button"
          disabled={disabled}
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-600 text-slate-300 hover:border-brand-500 hover:text-brand-300 transition text-sm disabled:opacity-50"
        >
          <Mic className="w-4 h-4" />
          Record voice note
        </button>
      )}

      {recording && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-red-200 flex-1">Recording… {formatMs(elapsed)}</span>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium"
          >
            <Square className="w-3.5 h-3.5" /> Stop
          </button>
        </div>
      )}

      {playbackSrc && !recording && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-600">
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 transition"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-200">Voice instruction</div>
            <div className="text-xs text-slate-500">
              {durationLabel || 'Audio'}
              {localBlob ? ' · not saved yet' : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            title="Remove voice note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

/** Compact player for task cards */
export function VoiceNotePlayer({ url, durationMs }: { url: string; durationMs?: number }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggle = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      await audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-300 text-sm hover:bg-violet-500/25 transition"
    >
      {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      <Mic className="w-3.5 h-3.5 opacity-70" />
      Voice note
      {durationMs ? ` · ${formatMs(durationMs)}` : ''}
    </button>
  )
}
