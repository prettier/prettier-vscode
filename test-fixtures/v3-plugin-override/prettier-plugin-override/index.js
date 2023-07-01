export default {
  languages: [
    {
      name: "babel",
      parsers: ["babel"],
      extensions: [".js"],
    },
  ],
  parsers: {
    babel: {
      astFormat: 'babel',
      parse: (text) => ({ value: text }),
    },
  },
  printers: {
    babel: {
      print() {
        return `fake format\n`;
      }
    }
  }
};
