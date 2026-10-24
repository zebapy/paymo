# Paymo

Split a food order on Venmo from a receipt screenshot.

1. Open the site and drop in a receipt screenshot. The text is read in your browser, so nothing is uploaded.
2. Check the items and fees, set your Venmo username, and create a link.
3. Send the link to the group. Each person taps what they ordered and gets a prefilled Venmo payment to you. Tax, fees and tip are split in proportion to food.

The order is stored in the link itself (`#o=…`), so there's no backend or database.

Deployed to GitHub Pages from `main` by `.github/workflows/pages.yml`.
