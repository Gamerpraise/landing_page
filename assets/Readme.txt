=== ASSETS FOLDER - READ ME ===

Upload your images in THIS folder (assets/).

You MUST name them exactly like this (all lower case):

1. logo.png         - Your main logo (like your profile picture / brand logo) - PNG with transparent background recommended
2. favicon.png      - Small icon for browser tab - PNG format (512x512 recommended)
3. hero.png         - Main banner / hero image for the top of the page - PNG or JPG
4. certificate.png  - Certificate or achievement preview image - PNG or JPG

IMPORTANT RULES:

- All file names must be lower case and have no spaces.
  Correct: logo.png , hero.png
  Wrong: Logo.PNG , hero (1).png , my hero.png

- Max size 1MB per image. If your image is bigger than 1MB, compress it first at https://tinypng.com

- All files should be PNG. If you use JPG instead (example: hero.jpg), you MUST also rename it in the code.

  Open index.html and change:
  from: <img src="assets/hero.png">
  to:   <img src="assets/hero.jpg">

  Do the same for any other image you use as JPG.

Required folder structure:
landing_page/
  index.html
  style.css
  script.js
  assets/
    logo.png
    favicon.png
    hero.png
    certificate.png
    readme.txt(this file)
