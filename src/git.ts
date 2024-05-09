import type { ChangelogConfig } from './config'
import { execCommand } from './exec'

export interface GitCommitAuthor {
  name: string
  email: string
}

export interface RawGitCommit {
  message: string
  body: string
  shortHash: string
  author: GitCommitAuthor
}

export interface Reference {
  type: 'hash' | 'issue' | 'pull-request'
  value: string
}

export interface GitCommit extends RawGitCommit {
  description: string
  type: string
  scope: string
  references: Reference[]
  authors: GitCommitAuthor[]
  isBreaking: boolean
}

export async function getLastGitTag() {
  const r = await execCommand('git', ['describe', '--tags', '--abbrev=0'])
    .then((r) => {
      if (typeof r === 'string')
        return r.split('\n').filter(tag => tag !== '')
    })
    .catch(() => [])
  return r.at(-1)
}

export async function getPenultimateGitTag() {
  try {
    const r = await execCommand('git', ['tag', '--sort=-committerdate'])
      .then((r) => {
        if (typeof r === 'string')
          return r.split('\n').filter(tag => tag !== '')
      })
      .catch(() => [])
    // 返回倒数第二个标签。如果标签数量不足两个，则返回null。
    return r.length > 1 ? r.at(-2) : null
  }
  catch (error) {
    return null
  }
}

export async function getFirstCommitId() {
  try {
    // 使用 `git rev-list` 命令，结合 `HEAD` 和 `--max-parents=0` 选项获取第一个commit
    // `--max-parents=0` 选项意味着列出所有没有父提交的提交，即仓库的初始提交
    const r = await execCommand('git', ['rev-list', '--max-parents=0', 'HEAD'])
      .then((r) => {
        if (typeof r === 'string')
          return r.split('\n').filter(tag => tag !== '')
      })
      .catch(() => [])
    // 返回第一个commit的ID。如果没有找到（理论上不可能，除非仓库为空），则返回null。
    return r.length > 0 ? r[0] : null
  }
  catch (error) {
    return null
  }
}

export async function getCurrentGitBranch() {
  return await execCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
}

export async function getCurrentGitTag() {
  return await execCommand('git', ['tag', '--points-at', 'HEAD'])
}

export async function getPreGitRef() {
  return (await getPenultimateGitTag()) || (await getFirstCommitId())
}

export async function getCurrentGitRef() {
  return (await getCurrentGitTag()) || (await getCurrentGitBranch())
}

export async function getGitRemoteURL(cwd: string, remote = 'origin') {
  return await execCommand('git', [
    `--work-tree=${cwd}`,
    'remote',
    'get-url',
    remote,
  ])
}

export async function getCurrentGitStatus() {
  return await execCommand('git', ['status', '--porcelain'])
}

export async function getGitDiff(
  from: string | undefined,
  to = 'HEAD',
): Promise<RawGitCommit[]> {
  // https://git-scm.com/docs/pretty-formats
  const r = await execCommand('git', [
    '--no-pager',
    'log',
    `${from ? `${from}...` : ''}${to}`,
    '--pretty="----%n%s|%h|%an|%ae%n%b"',
    '--name-status',
  ])
  return (r as string)
    .split('----\n')
    .splice(1)
    .map((line) => {
      const [firstLine, ..._body] = line.split('\n')
      const [message, shortHash, authorName, authorEmail]
        = firstLine.split('|')
      const r: RawGitCommit = {
        message,
        shortHash,
        author: { name: authorName, email: authorEmail },
        body: _body.join('\n'),
      }
      return r
    })
}

export function parseCommits(
  commits: RawGitCommit[],
  config: ChangelogConfig,
): GitCommit[] {
  return commits
    .map(commit => parseGitCommit(commit, config))
    .filter(Boolean)
}

// https://www.conventionalcommits.org/en/v1.0.0/
// https://regex101.com/r/FSfNvA/1
const ConventionalCommitRegex
  = /(?<type>[a-z]+)(\((?<scope>.+)\))?(?<breaking>!)?: (?<description>.+)/i
const CoAuthoredByRegex = /co-authored-by:\s*(?<name>.+)(<(?<email>.+)>)/gim
const PullRequestRE = /\([ a-z]*(#\d+)\s*\)/gm
const IssueRE = /(#\d+)/gm

export function parseGitCommit(
  commit: RawGitCommit,
  config: ChangelogConfig,
): GitCommit | null {
  const match = commit.message.match(ConventionalCommitRegex)
  if (!match)
    return null

  const type = match.groups.type

  let scope = match.groups.scope || ''
  scope = config.scopeMap[scope] || scope

  const isBreaking = Boolean(match.groups.breaking)
  let description = match.groups.description

  // 从消息中提取引用
  const references: Reference[] = []
  for (const m of description.matchAll(PullRequestRE))
    references.push({ type: 'pull-request', value: m[1] })

  for (const m of description.matchAll(IssueRE)) {
    if (!references.some(i => i.value === m[1]))
      references.push({ type: 'issue', value: m[1] })
  }
  references.push({ value: commit.shortHash, type: 'hash' })

  // 删除引用并标准化
  description = description.replace(PullRequestRE, '').trim()

  // 查找所有作者
  const authors: GitCommitAuthor[] = [commit.author]
  for (const match of commit.body.matchAll(CoAuthoredByRegex)) {
    authors.push({
      name: (match.groups.name || '').trim(),
      email: (match.groups.email || '').trim(),
    })
  }

  return {
    ...commit,
    authors,
    description,
    type,
    scope,
    references,
    isBreaking,
  }
}
