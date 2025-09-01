# Frontend (HTML/CSS/JS)

- Mobile-first layout, burger menu slides right→left and covers screen.
- Header injected once (`partials/header.html`) into `#app-header` of each page.
- Language switch (EN/AZ/ES/DE) and Currency switch (USD/AZN/EUR/TRY).
- Category modal shows full tree from `assets/js/data/categories.json`.
- Prices convert current and old (crossed) price when currency changes.
- Home has Amazon-like sections: Sale, Best Sellers, Recommended, FBT, Our Stores.
- Our Stores page shows store slides with store's products.
- Cart supports qty ±, delete, shows shipping (to be provided by backend).
- i18n keys live in `assets/js/i18n/*.json`. Avoid hardcoded strings.
