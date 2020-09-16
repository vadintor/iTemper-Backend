const shell = require("shelljs");

// shell.cp("-R", "src/public/js/lib", "dist/public/js/");
// shell.cp("-R", "src/public/fonts", "dist/public/");
// shell.cp("-R", "src/public/images", "dist/public/");
shell.cp("-fR", "src/public", "dist/public/");
// shell.rm("-r", "dist/uploads");
// shell.cp("-fR", "src/uploads/", "dist/uploads/");
shell.cp("-R", ".env", "dist/.env");
