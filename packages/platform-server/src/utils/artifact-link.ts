export function artifactLink(key: string | null) {
  if (!key) {
    return null
  }

  if (!key.startsWith('artifacts/')) {
    throw new Error(`The artifact key must start with "artifacts/", given ${key}`)
  }

  return `${perfsee.baseUrl}/${key}`
}

export function artifactKey(projectId: number | string, key: string) {
  return `artifacts/${projectId}/${key}`
}
