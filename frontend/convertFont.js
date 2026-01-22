import fs from "fs";
import path from "path";

const fontsDir = "./src/assets/fonts/Inter/static";
const files = fs.readdirSync(fontsDir).filter((f) => f.endsWith(".ttf"));

if (files.length === 0) {
  console.log("❌ No TTF fonts found in:", fontsDir);
  process.exit(1);
}

files.forEach((file) => {
  const fontPath = path.join(fontsDir, file);
  const baseName = path.basename(file, ".ttf");
  const outputFile = path.join(fontsDir, `${baseName}.js`);

  try {
    const fontData = fs.readFileSync(fontPath);
    const base64Font = Buffer.from(fontData).toString("base64");

    const jsContent = `
(function (jsPDFAPI) {
  var callAddFont = function () {
    this.addFileToVFS('${baseName}.ttf', '${base64Font}');
    this.addFont('${baseName}.ttf', '${baseName}', 'normal');
  };
  jsPDFAPI.events.push(['addFonts', callAddFont]);
})(jsPDF.API);
`;

    fs.writeFileSync(outputFile, jsContent);
    console.log(`✅ Converted: ${file}`);
  } catch (err) {
    console.error(`❌ Error converting ${file}: ${err.message}`);
  }
});
