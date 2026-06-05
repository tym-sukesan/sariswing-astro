import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function contentType(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function safeResolveFile(rootDir: string, requestPath: string): string | null {
  const decoded = decodeURIComponent(requestPath.split("?")[0] ?? "/");
  const normalized = decoded.startsWith("/") ? decoded.slice(1) : decoded;
  const candidate = path.resolve(rootDir, normalized || "index.html");
  const root = path.resolve(rootDir);

  if (!candidate.startsWith(root + path.sep) && candidate !== root) {
    return null;
  }

  return candidate;
}

export function startPrototypeStaticServer(
  rootDir: string,
  host: string,
  port: number,
): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          res.writeHead(400);
          res.end();
          return;
        }

        let filePath = safeResolveFile(rootDir, req.url);
        if (!filePath) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }

        let stat = await fs.stat(filePath).catch(() => null);
        if (stat?.isDirectory()) {
          filePath = path.join(filePath, "index.html");
          stat = await fs.stat(filePath).catch(() => null);
        }

        if (!stat?.isFile()) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        const body = await fs.readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType(filePath) });
        res.end(body);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(500);
        res.end(message);
      }
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} is already in use. Stop the other process or set PROTOTYPE_PORT.`,
          ),
        );
        return;
      }
      reject(error);
    });

    server.listen(port, host, () => {
      console.log(
        `[prototype-capture] Static server: http://${host}:${port}/ (root: ${rootDir})`,
      );
      resolve(server);
    });
  });
}

export function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
