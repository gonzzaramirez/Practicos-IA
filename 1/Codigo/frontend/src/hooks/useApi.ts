/**
 * Hook personalizado para llamadas a la API
 */
import { useState, useEffect } from 'react'
import { GraphMeta, EdgeCoords } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useGraphMeta() {
  const [meta, setMeta] = useState<GraphMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/graph-meta`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: GraphMeta = await response.json()
        setMeta(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setLoading(false)
      })
  }, [])

  return { meta, loading, error }
}

export function useEdgesSample(decimate: number = 10) {
  const [edges, setEdges] = useState<EdgeCoords | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_URL}/api/edges-sample?decimate=${decimate}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: { edges: EdgeCoords } = await response.json()
        setEdges(data.edges)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setLoading(false)
      })
  }, [decimate])

  return { edges, loading, error }
}

export async function findNearestNode(lat: number, lon: number) {
  const response = await fetch(
    `${API_URL}/api/find-nearest?lat=${lat}&lon=${lon}`
  )
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data: { node_id: number; lat: number; lon: number } = await response.json()
  // Mantener la misma interfaz que axios para compatibilidad
  return { data }
}

