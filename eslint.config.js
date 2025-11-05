import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        // Browser globals essentiels (le reste vient du tsconfig lib: dom)
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        
        // Timer functions (essentielles pour React)
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        
        // Animation functions (pour les animations smooth)
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        
        // Storage & fetch (APIs modernes essentielles)
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',

         // DOM types
         Window: 'readonly',
         HTMLDivElement: 'readonly',
         HTMLButtonElement: 'readonly',
         HTMLInputElement: 'readonly',
         HTMLTextAreaElement: 'readonly',
         HTMLSelectElement: 'readonly',
         HTMLSpanElement: 'readonly',
         HTMLCanvasElement: 'readonly',
         HTMLImageElement: 'readonly',
         HTMLVideoElement: 'readonly',
         SVGSVGElement: 'readonly',
         HTMLElement: 'readonly',
         Element: 'readonly',
         Node: 'readonly',
         Event: 'readonly',
         MouseEvent: 'readonly',
         KeyboardEvent: 'readonly',
         CustomEvent: 'readonly',
         EventListener: 'readonly',
         GlobalCompositeOperation: 'readonly',
         
         // React types
         React: 'readonly',
         
         // Other browser APIs
         Image: 'readonly',
         CSS: 'readonly',
         FileReader: 'readonly',
         getComputedStyle: 'readonly',
         crypto: 'readonly',
        
        // Tauri specific (pas dans les libs standard)
        __TAURI__: 'readonly',
        
        // Node.js types (pour les types de timeout/interval)
        NodeJS: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'prettier': prettier
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warning au lieu d'error pour commencer
      '@typescript-eslint/no-unused-vars': ['error', { // Error au lieu de warn
        vars: 'all', 
        args: 'after-used', 
        ignoreRestSiblings: false,
        argsIgnorePattern: '^_', // Ignore les args commençant par _
        varsIgnorePattern: '^_' // Ignore les vars commençant par _
      }],
      '@typescript-eslint/no-var-requires': 'error', // Plus strict
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // Warning pour commencer
      '@typescript-eslint/prefer-optional-chain': 'warn', // Warning pour commencer
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // Warning pour commencer
      '@typescript-eslint/no-floating-promises': 'warn', // Warning pour commencer
      '@typescript-eslint/await-thenable': 'warn', // Warning pour commencer
      '@typescript-eslint/no-misused-promises': 'warn', // Warning pour commencer
      '@typescript-eslint/require-await': 'warn', // Warning pour commencer
      '@typescript-eslint/no-unsafe-assignment': 'warn', // Warning pour commencer
      '@typescript-eslint/no-unsafe-call': 'warn', // Warning pour commencer
      '@typescript-eslint/no-unsafe-member-access': 'warn', // Warning pour commencer
      '@typescript-eslint/no-unsafe-return': 'warn', // Warning pour commencer
      '@typescript-eslint/restrict-template-expressions': 'warn', // Warning pour commencer
      '@typescript-eslint/restrict-plus-operands': 'warn', // Warning pour commencer
      '@typescript-eslint/unbound-method': 'warn', // Warning pour commencer
      
      // React strict rules
      'react/no-unknown-property': ['error', { 
        ignore: [
          'position', 'rotation', 'args', 'object', 'geometry', 'material', 'intensity', 'attach',
          'transparent', 'side', 'count', 'array', 'itemSize', 'linewidth', 'color', 'castShadow',
          'receiveShadow', 'fog', 'near', 'far', 'fov', 'aspect', 'left', 'right', 'top', 'bottom',
          'opacity', 'center', 'scale', 'visible', 'userData', 'name', 'uuid', 'type', 'matrix',
          'matrixWorld', 'matrixAutoUpdate', 'matrixWorldNeedsUpdate', 'layers', 'up', 'quaternion',
          'eulerOrder', 'useQuaternion', 'receiveShadow', 'castShadow', 'frustumCulled', 'renderOrder',
          'animations', 'userData', 'isObject3D', 'isMesh', 'isLight', 'isCamera', 'isGroup',
          'isScene', 'isLine', 'isPoints', 'isSprite', 'isBone', 'isSkinnedMesh', 'isInstancedMesh',
          'isLOD', 'isLineLoop', 'isLineSegments', 'isPoints', 'isSprite', 'isBone', 'isSkinnedMesh',
          'isInstancedMesh', 'isLOD', 'isLineLoop', 'isLineSegments', 'isPoints', 'isSprite',
          'isBone', 'isSkinnedMesh', 'isInstancedMesh', 'isLOD', 'isLineLoop', 'isLineSegments'
        ]
      }],
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',

      'react/require-render-return': 'error',
      
      // General JavaScript strict rules
      'no-console': ['error', { 'allow': ['error', 'warn'] }], // Permettre console.error et console.warn, interdire console.log
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-return': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': ['error', {
        array: true,
        object: true
      }, {
        enforceForRenamedProperties: false
      }],
      
      // 🔥 Nouvelles règles anti-bugs logiques
      'eqeqeq': ['error', 'always'], // Force === et !== (évite les bugs de coercition)
      'curly': ['error', 'all'], // Force les accolades (évite les bugs de portée)
      'array-callback-return': 'error', // Force le return dans .map(), .filter(), etc.
      'no-fallthrough': 'error' // Évite les switch sans break
    }
  },
  {
    files: ['src-tauri/node/src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks
    },
    rules: {
      'react/react-in-jsx-scope': 'off'
    }
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.tauri/**',
      '**/target/**',
      '**/release/**',
      '**/resources/**',
      '**/coverage/**',
      '*.config.js',
      '*.config.ts',
      'postcss.config.js',
      'tailwind.config.js',
      'vite.config.ts',
      '**/tauri-codegen-assets/**',
      '**/sidecar.js'
    ]
  }
];
