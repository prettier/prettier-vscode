export default {
  languages: [
    {
      name: "babel",
      parsers: ["babel"],
      extensions: [`.js`],
    },
  ],
  parsers: {
    babel: {
      parse: (text) => ({ value: text }),
      astFromat: 'estree',
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
