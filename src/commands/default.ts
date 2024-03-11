import { existsSync, promises as fsp } from 'node:fs'
import process from 'node:process'
import type { Argv } from 'mri'
import { resolve } from 'pathe'
import consola from 'consola'
import { execa } from 'execa'
import boxen from 'boxen'
import chalk from 'chalk'
import {
  generateMarkDown,
  getCurrentGitStatus,
  getGitDiff,
  loadChangelogConfig,
  parseCommits,
} from '..'

export default async function defaultMain(args: Argv) {
  const cwd = resolve(args._[0] || args.dir || '')
  process.chdir(cwd)
  consola.wrapConsole()

  const config = await loadChangelogConfig(cwd, {
    from: args.from,
    to: args.to,
    output: args.output,
    newVersion: typeof args.r === 'string' ? args.r : undefined,
  })

  if (config.clean) {
    const dirty = await getCurrentGitStatus()
    if (dirty) {
      consola.error(chalk.bold.red('changelog构建失败 → 工作目录不干净, 请先提交或清理变更'))
      process.exit(1)
    }
  }
  // eslint-disable-next-line no-console
  console.log(
    boxen(`\
${chalk.bold.green('🍣 生成变更日志:')} ${chalk.bold.bgYellow(` ${config.from} `) || ''} ${chalk.bold.green('→')} ${chalk.bold.bgYellow(` ${config.to} `)}`, {
      padding: 1,
      margin: 1,
      align: 'center',
      borderColor: 'yellowBright',
      borderStyle: 'round',
    }),
  )
  const rawCommits = await getGitDiff(config.from, config.to)
  // 将提交解析为常规提交
  const commits = parseCommits(rawCommits, config)
    .filter(c => !c.description.startsWith('release '))
    .filter(
      c =>
        config.types[c.type]
        && !(c.type === 'chore' && !c.description.startsWith('release ') && c.scope === 'deps' && !c.isBreaking),
    )

  // 生成 markdown
  const markdown = await generateMarkDown(commits, config)

  const displayOnly = args.view
  if (displayOnly)
    consola.log(`\n\n${markdown}\n\n`)

  // 更新变更日志文件（仅当碰撞或释放或 --output 指定为文件时）
  if (typeof config.output === 'string' && !displayOnly) {
    let changelogMD: string
    if (existsSync(config.output)) {
      consola.info(`更新 ${config.output}`)
      changelogMD = await fsp.readFile(config.output, 'utf8')
    }
    else {
      consola.info(`创建  ${config.output}`)
      changelogMD = '# Changelog\n\n'
    }

    const lastEntry = changelogMD.match(/^###?\s+.*$/m)

    if (lastEntry) {
      changelogMD
        = `${changelogMD.slice(0, lastEntry.index)
        + markdown
         }\n\n${
         changelogMD.slice(lastEntry.index)}`
    }
    else {
      changelogMD += `\n${markdown}\n\n`
    }

    await fsp.writeFile(config.output, changelogMD)
  }
  if (!displayOnly) {
    await execa('git', ['add', 'CHANGELOG.md'], { cwd })
    await execa('git', ['commit', '-m', 'chore(other): 更新日志'], { cwd })
    await execa('git', ['push'], { cwd })
  }
}
