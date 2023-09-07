import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type RouteMethod = "get" | "post" | "put" | "patch" | "delete";

export const generateRoutes = (relativePath: string): Router => {
  const router = Router();
  const files = getAllFiles(relativePath);

  // Iterate through each file in the directory
  files.forEach(async (filePath) => {
    const routeMethod = path
      .basename(filePath, path.extname(filePath))
      .toLowerCase();

    if (!/([get|post|put|patch|delete]\.js)$/.test(filePath)) {
      console.warn(
        `Skipping ${filePath} as it doesn't correspond to a valid HTTP method.`,
      );
    } else {
      // Create a new Express route based on the filename
      console.info("-----------");

      console.info("filePath:");
      console.info(filePath);
      console.info("routeMethod:");
      console.info(routeMethod);
      console.info("-----------");

      router[routeMethod as RouteMethod](
        filePath,
        (await import(filePath)).default,
      );

      console.info(
        `Created ${routeMethod.toUpperCase()} route for ${filePath}`,
      );
    }
  });

  return router;
};

export const getRestDirectory = (relativePath: string = "rest"): string => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  return path.join(__dirname, relativePath);
};

export const getAllFiles = (
  dirPath: string,
  arrayOfFiles: string[] = [],
): string[] => {
  let files = fs.readdirSync(dirPath);
  files = files.filter((path) => !/\.map$/.test(path));

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
};
