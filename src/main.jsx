import React from "react";
import { createRoot } from "react-dom/client";

// Opslag-adapter: buiten Claude bestaat window.storage niet, dus hier
// vervangen we die door localStorage (data blijft per apparaat/browser).
if (!window.storage) {
  window.storage = {
    async get(key) {
      const v = localStorage.getItem("tdb:" + key);
      return v === null ? null : { key, value: v };
    },
    async set(key, value) {
      localStorage.setItem("tdb:" + key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem("tdb:" + key);
      return { key, deleted: true };
    },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("tdb:" + prefix)) keys.push(k.slice(4));
      }
      return { keys };
    },
  };
}

import("./trainingsdraaiboek.jsx").then(({ default: App }) => {
  createRoot(document.getElementById("root")).render(<App />);
});
