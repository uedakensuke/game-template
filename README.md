# game-template

- 下記の構成を持つテンプレート
  - React + TypeScript + Vite
  - pixiJS
  - tailwind CSS
  - zustand
  - 

- このテンプレートは下記のセットアップを行うことで再現できる
  - 1. インストール
    ```
    npx create-vite@latest . --template react-ts
    npm install
    npm install -D prettier
    npm install pixi.js @pixi/react
    npm install zustand
    npm install tailwindcss @tailwindcss/vite
    ```
  - 2. tailwindcss向け設定の書き換え
    - vite.config.tsを下記に書き換え
      ```
      import react from '@vitejs/plugin-react'
      import { defineConfig } from 'vite'
      import tailwindcss from '@tailwindcss/vite'
      import path from 'path'

      // https://vite.dev/config/
      export default defineConfig({
        plugins: [
          react(),
          tailwindcss(),
        ],
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        },
      })      
      ```
    - tsconfig.app.jsonとtsconfig.jsonのcompilerOptionsに下記を追加
      ```
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
      ```
    - index.cssを下記に書き換え
      ```
      @import "tailwindcss";
      ```
  - 3. shadcnの初期化
    ```
    npx shadcn@latest init
    npx shadcn@latest add button
    ```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
