import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Wax } from '../lib/types'

/** The signed-in user's sealed and opened wax. Row-level security scopes the
 *  query server-side, the same way the app relies on it. */
export function useWax() {
  const [wax, setWax] = useState<Wax[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('wax')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else {
      setError(null)
      setWax((data ?? []) as Wax[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { wax, loading, error, reload: load }
}
