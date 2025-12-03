/**
 * Hook personalizado para llamadas a la API
 */
import { useState, useEffect } from 'react'
import axios from 'axios'
import { GraphMeta, EdgeCoords } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useGraphMeta() {
  const [meta, setMeta] = useState<GraphMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get<GraphMeta>(`${API_URL}/api/graph-meta`)
      .then((response) => {
        setMeta(response.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
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
    axios
      .get<{ edges: EdgeCoords }>(`${API_URL}/api/edges-sample?decimate=${decimate}`)
      .then((response) => {
        setEdges(response.data.edges)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [decimate])

  return { edges, loading, error }
}

export function findNearestNode(lat: number, lon: number) {
  return axios.get<{ node_id: number; lat: number; lon: number }>(
    `${API_URL}/api/find-nearest?lat=${lat}&lon=${lon}`
  )
}

