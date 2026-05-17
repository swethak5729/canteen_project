import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "../CartContext";

function Menu() {
  const { addToCart } = useContext(CartContext);
  const [quantities, setQuantities] = useState({});
  const [activeCategory, setActiveCategory] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    category: "",
    newCategory: "",
  });

  // ⭐ NEW: track if we are editing an existing item
  const [editingItem, setEditingItem] = useState(null);

  const user = JSON.parse(localStorage.getItem("user")) || {};

useEffect(() => {
  fetchMenu();
}, []);

  const fetchMenu = async () => {
    setLoadingMenu(true);
    try {
      const res = await fetch("http://localhost:5000/api/menu");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        if (!activeCategory && data.categories?.length) {
          setActiveCategory(data.categories[0].name);
        }
      }
    } catch (err) {
      console.error("Fetch menu error", err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleQuantityChange = (id, value) => {
    const quantity = Math.max(1, parseInt(value) || 1);
    setQuantities((prev) => ({ ...prev, [id]: quantity }));
  };

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    addToCart({ ...item, quantity });
    setPopupMessage(`${quantity} x ${item.name} added to cart!`);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  // Delete Menu Item (admin only in UI)
  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/items/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPopupMessage(`Item "${name}" deleted successfully`);
        setTimeout(() => setPopupMessage(""), 2000);
        fetchMenu();
      } else {
        alert(data.message || "Failed to delete item");
      }
    } catch (err) {
      console.error("Delete error", err);
      alert("Server error while deleting item");
    }
  };

  const activeCatObj = categories.find((c) => c.name === activeCategory) || {};
  const filteredItems = (activeCatObj.items || []).filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ⭐ Open modal in "ADD" mode
  const openAddModal = () => {
    setEditingItem(null); // not editing
    setForm({
      name: "",
      price: "",
      image: "",
      category: categories[0]?.name || "",
      newCategory: "",
    });
    setShowModal(true);
  };

  // ⭐ Open modal in "EDIT" mode
  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      price: item.price,
      image: item.image || "",
      // use item's category if you have it in response; otherwise current active category
      category: item.category || activeCategory || categories[0]?.name || "",
      newCategory: "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleFormChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ⭐ Single submit handler for both ADD and UPDATE
  const submitItem = async (e) => {
    e.preventDefault();
    try {
      const categoryToUse = form.newCategory.trim()
        ? form.newCategory.trim()
        : form.category;
      if (!form.name || !form.price || !categoryToUse) {
        alert("Please provide name, price and category (or a new one)");
        return;
      }

      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        image: form.image || null,
        category: categoryToUse,
      };

      const isEditing = !!editingItem;

      const url = isEditing
        ? `http://localhost:5000/api/items/${editingItem.id}`
        : "http://localhost:5000/api/items";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (isEditing) {
          setPopupMessage(`Item "${data.item.name}" updated successfully`);
        } else {
          setPopupMessage(
            `Item "${data.item.name}" added to ${categoryToUse}`
          );
        }
        setTimeout(() => setPopupMessage(""), 2000);
        closeModal();
        await fetchMenu();
        setActiveCategory(categoryToUse);
      } else {
        alert(data.message || "Failed to save item");
      }
    } catch (err) {
      console.error("Save item error", err);
      alert("Server error while saving item");
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#185a9d",
          marginBottom: "20px",
        }}
      >
        Menu
      </h2>

      {/* Search + Add */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          display: "flex",
          marginLeft: "136px",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search for items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "60%",
            padding: "12px 15px",
            fontSize: "16px",
            borderRadius: "25px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
        {isAdmin && (
          <div>
            <button
              onClick={openAddModal}
              style={{
                width: "100px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "blue",
                marginLeft: "30px",
                color: "white",
              }}
            >
              Add Item
            </button>
          </div>
        )}
      </div>

      {/* Popup Message */}
      {popupMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "green",
            color: "white",
            padding: "15px 25px",
            borderRadius: "5px",
            boxShadow: "2px 2px 10px #aaa",
            zIndex: 1000,
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          ✅ {popupMessage}
        </div>
      )}

      {/* Category Buttons */}
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        {loadingMenu ? (
          <div>Loading categories...</div>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              style={{
                margin: "0 10px",
                padding: "12px 20px",
                background:
                  activeCategory === cat.name ? "#185a9d" : "#f0f0f0",
                color: activeCategory === cat.name ? "white" : "#333",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                transition: "all 0.3s",
              }}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>

      {/* Item Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "25px",
          justifyContent: "center",
        }}
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "15px",
                padding: "20px",
                textAlign: "center",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                background: "white",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-5px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  background: "#f5f5f5",
                  borderRadius: "10px",
                  margin: "0 auto 15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "10px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                ) : null}
                <span style={{ display: "none" }}>🍽️</span>
              </div>

              <h4 style={{ margin: "10px 0", color: "#185a9d" }}>
                {item.name}
              </h4>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#43cea2",
                  margin: "10px 0",
                }}
              >
                ₹{item.price}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <input
                  type="number"
                  min="1"
                  value={quantities[item.id] || 1}
                  onChange={(e) =>
                    handleQuantityChange(item.id, e.target.value)
                  }
                  style={{
                    width: "60px",
                    textAlign: "center",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                />
                <button
                  onClick={() => handleAddToCart(item)}
                  style={{
                    padding: "10px 15px",
                    background: "#185a9d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "background 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "#43cea2")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "#185a9d")
                  }
                >
                  Add to Cart
                </button>

                {/* ✏️ Edit Button – admin only */}
                {isAdmin && (
                  <button
                    onClick={() => openEditModal(item)}
                    style={{
                      padding: "10px 12px",
                      background: "orange",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}

                {/* 🗑️ Delete Button – admin only */}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    style={{
                      padding: "10px 12px",
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "#999",
              fontSize: "18px",
            }}
          >
            ❌ No items found
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: 520,
              maxWidth: "90%",
              background: "white",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {editingItem ? "Edit Item" : "Add New Item"}
            </h3>
            <form onSubmit={submitItem}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontWeight: 600 }}>
                  Item name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontWeight: 600 }}>
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => handleFormChange("price", e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontWeight: 600 }}>
                  Image URL (optional)
                </label>
                <input
                  value={form.image}
                  onChange={(e) => handleFormChange("image", e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontWeight: 600 }}>
                  Choose Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    handleFormChange("category", e.target.value)
                  }
                  style={{ width: "100%", padding: 8 }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: 6 }}>
                  <small>Or create a new category:</small>
                  <input
                    placeholder="New category name"
                    value={form.newCategory}
                    onChange={(e) =>
                      handleFormChange("newCategory", e.target.value)
                    }
                    style={{ width: "100%", padding: 8, marginTop: 6 }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: "8px 12px", borderRadius: 6 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 12px",
                    background: "#185a9d",
                    color: "white",
                    borderRadius: 6,
                  }}
                >
                  {editingItem ? "Update Item" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
