exports.config = {
  buildEs5: true,
  namespace: 'sti',
  globalStyle: [
    'src/styles/global.css'
  ],
  copy: {
    statics: {
      src: 'statics/**/**',
      dest: '.'
    },
    images: {
      src: 'images/**/**'
    },
  },
  plugins: [
    require('@stencil/postcss')({
      plugins: [
        require('postcss-url')(),
        require('postcss-cssnext')(),
        require('postcss-reporter')()
      ]
    })
  ],
  outputTargets: [
    {
      type: 'www',
      emptyDir: true,
      serviceWorker: false
    }
  ]
};
