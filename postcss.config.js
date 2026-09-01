export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace',
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'Chrome >= 53',
        'ChromeAndroid >= 53',
        'Firefox >= 52',
        'Safari >= 9',
        'Edge >= 79',
        'iOS >= 9',
        'Android >= 4.4'
      ],
      add: true,
      remove: false,
      supports: true,
      flexbox: true,
      grid: true,
    },
  },
};
