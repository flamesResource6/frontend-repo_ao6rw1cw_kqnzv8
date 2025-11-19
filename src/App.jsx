import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function EventPopup({ event, onClose }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    audio.addEventListener('timeupdate', onTime)
    return () => audio.removeEventListener('timeupdate', onTime)
  }, [])

  const activeCue = useMemo(() => {
    if (!event.subtitles) return null
    return event.subtitles.find(c => currentTime >= c.start && currentTime <= c.end)
  }, [currentTime, event.subtitles])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play(); setIsPlaying(true) }
  }

  return (
    <div className="w-[320px]">
      <h3 className="text-lg font-semibold mb-1">{event.title}</h3>
      <p className="text-xs text-gray-600 mb-2">{event.year > 0 ? event.year : `${Math.abs(event.year)} av. J.-C.`}</p>
      <p className="text-sm text-gray-800 mb-3">{event.description}</p>
      {event.images?.[0] && (
        <img src={event.images[0]} alt={event.title} className="w-full h-32 object-cover rounded mb-3" />
      )}
      {event.audio_url && (
        <div className="mb-2">
          <audio ref={audioRef} src={event.audio_url} preload="metadata" />
          <button onClick={togglePlay} className="px-3 py-1 text-sm rounded bg-blue-600 text-white">
            {isPlaying ? 'Pause' : 'Play'} narration
          </button>
        </div>
      )}
      {activeCue && (
        <div className="text-sm bg-black/80 text-white p-2 rounded">
          {activeCue.text}
        </div>
      )}
      <div className="mt-3">
        <button onClick={onClose} className="text-xs text-blue-600 underline">Fermer</button>
      </div>
    </div>
  )}

function MapView() {
  const [events, setEvents] = useState([])
  const [yearRange, setYearRange] = useState({ from: -300, to: new Date().getFullYear() })

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    const load = async () => {
      try {
        const url = new URL('/api/events', backend)
        url.searchParams.set('limit', '500')
        url.searchParams.set('year_from', String(yearRange.from))
        url.searchParams.set('year_to', String(yearRange.to))
        const res = await fetch(url.toString())
        const data = await res.json()
        setEvents(data)
      } catch (e) {
        console.error('Failed to load events', e)
      }
    }
    load()
  }, [yearRange.from, yearRange.to])

  const center = [48.8566, 2.3522]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <h1 className="font-bold text-lg">Paris • 23 siècles d'histoires</h1>
        <div className="flex items-center gap-2 text-sm">
          <span>{yearRange.from <= 0 ? `${Math.abs(yearRange.from)} av. J.-C.` : yearRange.from}</span>
          <input
            type="range"
            min="-300"
            max={new Date().getFullYear()}
            value={yearRange.from}
            onChange={e => setYearRange(r => ({ ...r, from: parseInt(e.target.value) }))}
          />
          <span>{yearRange.to}</span>
          <input
            type="range"
            min="-300"
            max={new Date().getFullYear()}
            value={yearRange.to}
            onChange={e => setYearRange(r => ({ ...r, to: parseInt(e.target.value) }))}
          />
        </div>
      </header>
      <div className="flex-1">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {events.map((ev, idx) => (
            <Marker key={idx} position={[ev.latitude, ev.longitude]}>
              <Popup>
                <EventPopup event={ev} onClose={() => {}} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

function App() {
  return <MapView />
}

export default App
