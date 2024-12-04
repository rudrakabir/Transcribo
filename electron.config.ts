import { build } from 'electron-builder';

build({
  config: {
    appId: 'com.transcribo.app',
    productName: 'Transcribo',
    directories: {
      output: 'dist',
      app: '.'
    },
    files: [
      'dist/**/*',
      'package.json'
    ],
    mac: {
      category: 'public.app-category.productivity'
    }
  }
});