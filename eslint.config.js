import antfu from '@antfu/eslint-config'

export default antfu({
  json: true,
  astro: false,
}, {
  ignores: [
    '.vscode',
    'node_modules',
    'dist',
  ],
})
