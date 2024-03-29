# changelog

[![npm version][npm-version-src]][npm-version-href]
[![Node.js Version][node-version-src]][node-version-href]
[![pnpm version][pnpm-version-src]][pnpm-version-href]
[![TypeScript version][typescript-version-src]][typescript-version-href]
[![License: MIT][license-src]][license-href]

## Quick Start

生成 Markdown 格式的变更日志并显示在控制台中：

```sh
npx @pubinfo/changelog --view
```

生成变更日志，修改 `package.json` 中的版本并更新 `CHANGELOG.md` ：

```sh
npx @pubinfo/changelog
```

第一次更新,会自动抓取第一次commitId作为`from`起始位,默认会抓取最后一次提交的tag作为`to`结束位

```sh
npx @pubinfo/changelog
```
## CLI Usage

```sh
npx @pubinfo/changelog [...args] [--dir <dir>]
```

**Arguments:**

- `--from`: 开始提交参考。如果未提供，则默认使用**倒数第二次提交的tag信息**.
- `--to`: 结束提交参考。如果未提供，**HEAD 中的最新提交的tag**将用作默认值.
- `--dir`: git 存储库的路径。如果未提供，则默认使用**当前工作目录**.
- `--clean`: 判断工作目录是否干净，如果不干净则退出，默认使用**true**.
- `--output`: 要创建或更新的更改日志文件名。默认为“CHANGELOG.md”并相对于目录解析。使用`--view`仅写入控制台。.

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@pubinfo/changelog.svg
[npm-version-href]: https://npmjs.com/package/@pubinfo/changelog
[node-version-src]: https://img.shields.io/badge/node-%5E18.12%20%7C%7C%20%3E%3D20.9-brightgreen.svg
[node-version-href]: https://nodejs.org/en/about/releases/
[pnpm-version-src]: https://img.shields.io/badge/pnpm-8.15.4-blue.svg
[pnpm-version-href]: https://pnpm.io/installation
[typescript-version-src]: https://img.shields.io/badge/TypeScript-%3C%3D5.3.3-blue.svg
[typescript-version-href]: https://www.typescriptlang.org/
[license-src]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-href]: https://opensource.org/licenses/MIT
