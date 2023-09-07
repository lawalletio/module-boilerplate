import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type RouteMethod = "get" | "post" | "put" | "patch" | "delete";

export const generateRoutes = (relativePath: string): Router => {
  const router = Router();
  //   router.get("/", require("../rest/folder/:param/get").default);

  const dirPath = getRestDirectory(relativePath);

  console.info("YEAHHH");
  const files = getAllFiles(dirPath, []);

  // Iterate through each file in the directory
  files.forEach(async (file) => {
    const filePath = path.join(dirPath, file);
    const routeMethod = path.basename(file, path.extname(file)).toLowerCase();

    // Create a new Express route based on the filename

    console.info("filePath:");
    console.info(filePath);
    console.info("routeMethod:");
    console.info(routeMethod);

    router[routeMethod as RouteMethod](
      filePath,
      (await import(filePath)).default,
    );

    console.log(
      `Created ${routeMethod.toUpperCase()} route for /directory/:param1/:param2`,
    );
  });

  return router;
};

export const getRestDirectory = (relativePath: string): string => {
  // const __filename = fileURLToPath(relativePath);
  const __dirname = path.dirname(relativePath);

  return path.join(__dirname, relativePath);
};

export const getAllFiles = (
  dirPath: string,
  arrayOfFiles: string[],
): string[] => {
  let files = fs.readdirSync(dirPath);
  files = files.filter((path) => !/\.map$/.test(path));

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      if (!/([get|post|put|patch|delete]\.js)$/.test(file)) {
        console.warn(
          `Skipping ${file} as it doesn't correspond to a valid HTTP method.`,
        );
      } else {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
};
