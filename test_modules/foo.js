module.exports = {
  name: 'foo',
  desc: 'A package for fooing all over the place',
  install: function(opts) {
    return {
      message: `I should install here: ${opts.installPath}` 
    }
  },

  uninstall: function(opts) {

  }
};
