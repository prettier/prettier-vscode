const fs = require("fs");
const path = require("path");

const folders = ["../dist", "../out"];

folders.forEach(folder => {
  const dir = path.join(__dirname, folder);
  if (fs.existsSync(dir)) {
    fs.rmdirSync(dir, { recursive: true });
  }
});
