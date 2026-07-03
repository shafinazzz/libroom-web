/* ============================================
   Cart Manager
   Padanan terus dengan CartManager.instance (Flutter singleton)

   NOTA: guna localStorage untuk simpan cart — perlu di web sebab setiap
   HTML page ni "reload" berasingan (bukan macam Flutter app yang kekal
   dalam satu memory sepanjang navigasi). Flutter punya ValueNotifier
   padan dengan pattern onChange() (pub-sub) di sini.
   ============================================ */

const CartManager = (() => {
  const STORAGE_KEY = 'libroom_cart_items';
  let items = _load();
  const listeners = new Set();

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    listeners.forEach((cb) => cb(items));
  }

  // ---- Padanan CartManager.instance.items (ValueNotifier) ----
  function getItems() {
    return items;
  }

  /**
   * Padanan CartManager.instance.add(CartItem(...)).
   * @param {object} item - { spaceId, spaceName, date (ISO 'YYYY-MM-DD'), session, category, price }
   *                         id akan di-generate automatik (padanan CartItem punya id auto-generate dalaman)
   */
  function add(item) {
    const newItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...item,
    };
    items = [...items, newItem];
    _save();
  }

  // ---- Padanan updateItem(id, {date, session, price}) ----
  function updateItem(id, updates) {
    items = items.map((it) => (it.id === id ? { ...it, ...updates } : it));
    _save();
  }

  // ---- Padanan removeById(id) ----
  function removeById(id) {
    items = items.filter((it) => it.id !== id);
    _save();
  }

  function clear() {
    items = [];
    _save();
  }

  // ---- Padanan CartManager.instance.total (getter) ----
  function getTotal() {
    return items.reduce((sum, it) => sum + Number(it.price ?? 0), 0);
  }

  // ---- Padanan ValueListenableBuilder — daftar listener bila cart berubah ----
  function onChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  return { getItems, add, updateItem, removeById, clear, getTotal, onChange };
})();