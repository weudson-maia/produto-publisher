import React, { useState, useEffect } from 'react'

const API_BASE = 'https://de-tudo-um-pouco.onrender.com'

export default function App() {
  const [url, setUrl] = useState('')
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [published, setPublished] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => { loadPublished(); }, [])

  async function loadPublished(){
    try{
      const r = await fetch(API_BASE + '/api/published')
      const j = await r.json()
      if (j.ok) setPublished(j.items)
    }catch(e){console.error(e)}
  }

  async function handleFetch(){
    setError(null)
    if (!url) return setError('Cole uma URL')
    setLoading(true)
    try{
      const r = await fetch(API_BASE + '/api/fetch', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ url })
      })
      const j = await r.json()
      if (!j.ok) throw new Error(j.error || 'Erro ao buscar')
      setMeta(j.meta)
    }catch(e){ setError(e.message) }
    setLoading(false)
  }

  async function handlePublish(){
    if (!meta) return setError('Nenhum produto para publicar')
    const payload = { ...meta, addedAt: new Date().toISOString() }
    const r = await fetch(API_BASE + '/api/publish', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    const j = await r.json()
    if (j.ok){
      setPublished(p => [j.product, ...p])
      setMeta(null)
      setUrl('')
    } else setError(j.error || 'Erro ao publicar')
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Publicar produto pela URL</h1>

        <div className="bg-white p-4 rounded shadow mb-4">
          <label className="block text-sm font-medium mb-2">URL do produto</label>
          <div className="flex gap-2">
            <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Cole a URL do produto aqui" className="flex-1 border p-2 rounded" />
            <button onClick={handleFetch} className="px-4 rounded bg-blue-600 text-white">{loading? 'Buscando...' : 'Buscar'}</button>
          </div>
          {error && <div className="text-red-600 mt-2">{error}</div>}

          {meta && (
            <div className="mt-4 p-3 border rounded grid grid-cols-4 gap-4">
              <div className="col-span-1">
                {meta.image ? <img src={meta.image} alt="thumb" className="w-full h-32 object-cover rounded" /> : <div className="w-full h-32 bg-gray-200 flex items-center justify-center">Sem imagem</div>}
              </div>
              <div className="col-span-3">
                <h2 className="font-semibold">{meta.title}</h2>
                <p className="text-sm text-gray-700 mt-1">{meta.description}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={handlePublish} className="px-3 py-1 rounded bg-green-600 text-white">Publicar</button>
                  <a href={meta.url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded border">Abrir</a>
                </div>
              </div>
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-3">Produtos publicados</h2>
        <div className="space-y-3">
          {published.length === 0 && <div className="text-gray-600">Nenhum produto publicado ainda.</div>}
          {published.map(item => (
            <div key={item.id} className="bg-white p-3 rounded shadow flex gap-3 items-center">
              <img src={item.image || 'https://via.placeholder.com/120'} alt="thumb" className="w-24 h-24 object-cover rounded" />
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-600">{item.description}</div>
                <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Abrir produto</a>
              </div>
              <div className="text-xs text-gray-500">{new Date(item.addedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
