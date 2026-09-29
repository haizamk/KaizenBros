import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";

createInertiaApp({
  title: (title) => title ? `${title} - KaizenBros Dialysis` : "Pusat Dialisis KaizenBros",
  resolve: (name) => {
    const pages = import.meta.glob("./Pages/**/*.tsx", { eager: true });
    return pages[`./Pages/${name}.tsx`].default;
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
