import { useEffect, useState } from 'react'
import { api } from '../lib/api'

// Lê /api/me e expõe as permissões do usuário logado.
// Dono/admin: tudo true. Convidado: conforme as chavinhas que o dono marcou.
// Enquanto carrega, tudo fica false (esconde por segurança até saber).
export function usePermissions() {
  const [perms, setPerms] = useState(null)   // null = carregando
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const me = await api.get('/api/me')
        if (!active) return
        setIsGuest(!!me?.owner_id)
        setPerms(me?.permissions || null)
      } catch {
        if (active) setPerms(null)
      }
    })()
    return () => { active = false }
  }, [])

  // helper: pode(acao) — retorna true se pode. Enquanto carrega (perms null):
  // dono não é afetado (nunca é guest), então liberamos p/ não piscar botão sumindo.
  function can(key) {
    if (perms === null) return !isGuest ? true : false
    return !!perms[key]
  }

  return {
    loading: perms === null,
    isGuest,
    canAddCameras: can('can_add_cameras'),
    canEditCameras: can('can_edit_cameras'),
    canChangePlan: can('can_change_plan'),
    canCreateGroups: can('can_create_groups'),
    canEditNotif: can('can_edit_notif'),
  }
}
