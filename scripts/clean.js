const fs = require("fs");
const path = require("path");

const folders = ["../dist", "../out"];

folders.forEach((folder) => {
  const dir = path.join(__dirname, folder);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
