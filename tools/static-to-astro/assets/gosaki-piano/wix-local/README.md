# Gosaki localized Wix media

Committed copies of public-referenced Wix CDN images (largest fill used in public HTML). Bytes saved as-is (JPEG/PNG/ICO, no recompress).

`favicon.ico` is the piano-key mark (16/32/48/180), not the Wix default icon. `favicon-source.png` is the master and is not copied to the public site. `skipDownload` on that manifest entry keeps a re-download from replacing it. `rel="icon"` keeps this file.

`apple-touch-icon.png` is a 180×180 PNG made from the same master. Gosaki convert copies it and points `apple-touch-icon` at it. It is not in the Wix CDN manifest.

Mapped in `config/sites/gosaki-piano-wix-local-assets.json`. Convert copies these into generated `public/images/wix-local/` and rewrites HTML/Astro.

Intentional `gosakirikakotrio.wixsite.com` links are not assets and are not stored here.
