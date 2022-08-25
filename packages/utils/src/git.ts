const sshRemoteRegex = /^.+@(.+):([^/]+)\/([^/]+)$/
export const parseGitRemoteUrl = (remote: string) => {
  if (!remote) {
    return null
  }

  remote = remote.replace(/.git$/, '')

  const match = remote.match(sshRemoteRegex)
  if (match) {
    return {
      host: match[1],
      namespace: match[2],
      name: match[3],
    }
  } else {
    try {
      const url = new URL(remote)
      const [, namespace, name] = url.pathname.split('/')
      if (!namespace || !name) {
        return null
      }

      return {
        host: url.hostname,
        namespace,
        name,
      }
    } catch {
      return null
    }
  }
}
