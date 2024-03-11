import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '.vscode',
    'node_modules',
    'dist',
  ],
})
