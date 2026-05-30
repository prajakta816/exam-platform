async function run() {
  try {
    const pdf = await import("pdf-parse");
    console.log("pdf properties:", Object.keys(pdf));
    console.log("pdf type:", typeof pdf);
    console.log("pdf default type:", typeof pdf.default);
  } catch (err) {
    console.error("FAILED!", err);
  }
}
run();
