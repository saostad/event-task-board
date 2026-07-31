import { MapPin, Phone, Calendar } from 'lucide-react'
import type { EventWritableFields } from '../types'

interface Props {
  values: EventWritableFields
  onChange: (values: EventWritableFields) => void
  idPrefix?: string
}

export function EventFieldsForm({ values, onChange, idPrefix = 'ev' }: Props) {
  const set = <K extends keyof EventWritableFields>(key: K, value: EventWritableFields[K]) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-slate-400 mb-1.5" htmlFor={`${idPrefix}-title`}>
          Event name *
        </label>
        <input
          id={`${idPrefix}-title`}
          required
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Marjan wedding"
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1.5" htmlFor={`${idPrefix}-desc`}>
          Description
        </label>
        <textarea
          id={`${idPrefix}-desc`}
          value={values.description || ''}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Details for helpers: dress code, parking, timing..."
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div>
        <label
          className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5"
          htmlFor={`${idPrefix}-date`}
        >
          <Calendar className="w-3.5 h-3.5" /> Event date & time
        </label>
        <input
          id={`${idPrefix}-date`}
          type="datetime-local"
          value={values.eventDate || ''}
          onChange={(e) => set('eventDate', e.target.value || null)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        />
      </div>

      <div>
        <label
          className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5"
          htmlFor={`${idPrefix}-loc`}
        >
          <MapPin className="w-3.5 h-3.5" /> Location / address
        </label>
        <input
          id={`${idPrefix}-loc`}
          type="text"
          value={values.location || ''}
          onChange={(e) => set('location', e.target.value)}
          placeholder="e.g. 123 Main St, Atlanta"
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5"
          htmlFor={`${idPrefix}-phone`}
        >
          <Phone className="w-3.5 h-3.5" /> Contact phone
        </label>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          value={values.phone || ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="e.g. (678) 555-1234"
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-slate-500">Helpers can tap this number to call.</p>
      </div>
    </div>
  )
}
