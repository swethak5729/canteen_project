const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { initDb } = require("./db");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global DB instance
let db;

// Start server and initialize DB
async function startServer() {
  try {
    db = await initDb();
    console.log("✅ Database initialized successfully");

    // ---------------- MENU / ITEMS ----------------
    // Get menu
    app.get("/api/menu", async (req, res) => {
      try {
        const categories = await db.all(
          "SELECT id, name FROM categories ORDER BY name"
        );
        const result = [];
        for (const cat of categories) {
          const items = await db.all(
            "SELECT id, name, price, image FROM items WHERE category_id = ? ORDER BY id",
            [cat.id]
          );
          result.push({ id: cat.id, name: cat.name, items });
        }
        res.json({ success: true, categories: result });
      } catch (err) {
        console.error("Get menu error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch menu" });
      }
    });

    // Create item
    app.post("/api/items", async (req, res) => {
      try {
        const { name, price, image = null, category } = req.body;
        if (!name || price == null || !category)
          return res.status(400).json({
            success: false,
            message: "name, price and category are required",
          });

        let cat = await db.get(
          "SELECT * FROM categories WHERE name = ?",
          [category]
        );
        if (!cat) {
          const r = await db.run(
            "INSERT INTO categories (name) VALUES (?)",
            [category]
          );
          cat = { id: r.lastID, name: category };
        }

        const insert = await db.run(
          "INSERT INTO items (name, price, image, category_id) VALUES (?, ?, ?, ?)",
          [name, price, image, cat.id]
        );

        const item = await db.get(
          "SELECT id, name, price, image FROM items WHERE id = ?",
          [insert.lastID]
        );
        res.status(201).json({ success: true, item, category: cat });
      } catch (err) {
        console.error("Create item error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to create item" });
      }
    });

    // Delete item
    app.delete("/api/items/:id", async (req, res) => {
      try {
        const { id } = req.params;
        await db.run("DELETE FROM items WHERE id = ?", [id]);
        res.json({ success: true, message: "Item deleted" });
      } catch (err) {
        console.error("Delete item error:", err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // ⭐ UPDATE item (for admin edit menu)
    app.put("/api/items/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { name, price, image = null, category } = req.body;

        if (!name || price == null || !category) {
          return res.status(400).json({
            success: false,
            message: "Name, price, and category are required",
          });
        }

        // Ensure category exists (or create)
        let cat = await db.get(
          "SELECT * FROM categories WHERE name = ?",
          [category]
        );
        if (!cat) {
          const r = await db.run(
            "INSERT INTO categories (name) VALUES (?)",
            [category]
          );
          cat = { id: r.lastID, name: category };
        }

        // Update item
        const result = await db.run(
          "UPDATE items SET name = ?, price = ?, image = ?, category_id = ? WHERE id = ?",
          [name, price, image, cat.id, id]
        );

        if (result.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Item not found" });
        }

        // Return updated item
        const updatedItem = await db.get(
          "SELECT id, name, price, image FROM items WHERE id = ?",
          [id]
        );

        res.json({ success: true, item: updatedItem });
      } catch (err) {
        console.error("Update item error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to update item" });
      }
    });

    // ---------------- GET ALL USERS ----------------
    app.get("/api/admin/users", async (req, res) => {
      try {
        const users = await db.all(
          "SELECT id, name, user_id FROM users ORDER BY name ASC"
        );
        res.json({ success: true, users });
      } catch (err) {
        console.error("Get users error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch users" });
      }
    });

    // ---------------- REGISTER ----------------
    app.post("/register", async (req, res) => {
      try {
        const { name, email, role, userId, password, confirmPassword } =
          req.body;
        if (!name || !email || !role || !userId || !password)
          return res
            .status(400)
            .json({ error: "All fields are required" });

        if (password !== confirmPassword)
          return res
            .status(400)
            .json({ error: "Passwords do not match" });

        if (password.length < 6)
          return res.status(400).json({
            error: "Password must be at least 6 characters",
          });

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
          "INSERT INTO users (name, email, role, user_id, password) VALUES (?, ?, ?, ?, ?)",
          [name, email, role, userId, hashedPassword]
        );

        res
          .status(201)
          .json({ success: true, message: "✅ Registration successful" });
      } catch (err) {
        console.error("Registration error:", err);
        if (err.message.includes("UNIQUE constraint failed: users.email"))
          return res
            .status(400)
            .json({ error: "Email already registered" });
        else if (
          err.message.includes("UNIQUE constraint failed: users.user_id")
        )
          return res
            .status(400)
            .json({ error: "User ID already registered" });

        res
          .status(500)
          .json({ error: "Server error. Try again later." });
      }
    });

    // ---------------- LOGIN ----------------
    app.post("/login", async (req, res) => {
      try {
        const { emailOrId, password, role } = req.body;
        if (!emailOrId || !password || !role)
          return res.status(400).json({
            success: false,
            message: "All fields are required",
          });

        const user = await db.get(
          "SELECT * FROM users WHERE (email = ? OR user_id = ?) AND role = ?",
          [emailOrId, emailOrId, role]
        );

        if (!user)
          return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        );
        if (!isPasswordValid)
          return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });

        const { password: _, ...userWithoutPassword } = user;
        res.json({
          success: true,
          message: "Login successful",
          user: userWithoutPassword,
        });
      } catch (err) {
        console.error("Login error:", err);
        res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
    });

    // ---------------- ORDERS ----------------
    app.post("/api/orders", async (req, res) => {
      try {
        let {
          user_id,
          user_name,
          role,
          items,
          amount,
          payment_type,
        } = req.body;

        if (
          !user_id ||
          !user_name ||
          !items ||
          !amount ||
          !payment_type ||
          !role
        )
          return res.status(400).json({
            success: false,
            message: "All order fields are required",
          });

        if (!Array.isArray(items) || items.length === 0)
          return res.status(400).json({
            success: false,
            message: "Order items are required",
          });

        payment_type = ("" + payment_type).toLowerCase();
        if (!["instant", "monthly"].includes(payment_type)) {
          if (
            payment_type === "instantpayment" ||
            payment_type === "instant payment"
          )
            payment_type = "instant";
          if (
            payment_type === "monthlypayment" ||
            payment_type === "monthly payment"
          )
            payment_type = "monthly";
        }
        if (!["instant", "monthly"].includes(payment_type))
          return res.status(400).json({
            success: false,
            message: "Invalid payment_type",
          });

        const todayDate = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

        // ---------- TOKEN generation with slot system + vacant fill ----------
        const maxSlot = 5; // maximum tokens per role slot

        // helper: which role does token number i belong to in the slot pattern?
        const slotRoleFor = (i) => {
          const slotIndex = Math.floor((i - 1) / maxSlot);
          return slotIndex % 2 === 0 ? "student" : "admin";
        };

        // fetch today's orders (token as integer)
        const ordersToday = await db.all(
          `SELECT token, role FROM orders WHERE date(order_date) = ? ORDER BY CAST(token AS INTEGER) ASC`,
          [todayDate]
        );

        // create set of used token numbers and find current max token used
        const usedTokensSet = new Set();
        let maxUsed = 0;
        for (const o of ordersToday) {
          const n = Number(o.token);
          if (!Number.isNaN(n)) {
            usedTokensSet.add(n);
            if (n > maxUsed) maxUsed = n;
          }
        }

        // 1) Try to fill earliest vacant token (gap) starting from 1..maxUsed
        //    Admin can fill any vacant token; Student can only fill vacant tokens that belong to student slots.
        let nextTokenNum = null;
        for (let i = 1; i <= maxUsed; i++) {
          if (!usedTokensSet.has(i)) {
            const slotRole = slotRoleFor(i);
            if (role === "admin" || slotRole === role) {
              nextTokenNum = i;
              break;
            }
          }
        }

        // 2) If no suitable vacant token found, allocate next token after maxUsed that belongs to requester's slot
        if (nextTokenNum === null) {
          let i = maxUsed + 1 || 1;
          while (true) {
            const slotRole = slotRoleFor(i);
            if (slotRole === role) {
              if (!usedTokensSet.has(i)) {
                nextTokenNum = i;
                break;
              }
            }
            i++;
          }
        }

        // format token (3 digits)
        const token = ("000" + nextTokenNum).slice(-3);

        // ---------- SERVER SIDE AMOUNT ----------
        const serverAmount = items.reduce((s, it) => {
          const q = Number(it.quantity || 0);
          const p = Number(it.price || 0);
          return s + q * p;
        }, 0);
        const finalAmount = Number(serverAmount.toFixed(2));

        // Insert into orders table.
        const insertOrder = await db.run(
          `INSERT INTO orders 
            (token, user_id, user_name, role, items, amount, payment_type, payment_status, order_status, order_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            token,
            user_id,
            user_name,
            role,
            JSON.stringify(items),
            finalAmount,
            payment_type,
            payment_type === "monthly" ? "pending" : "completed",
            "preparing",
          ]
        );

        const orderId = insertOrder.lastID;

        // Insert each item into order_items table
        const insertItemStmt = await db.prepare(
          `INSERT INTO order_items (order_id, item_id, quantity, created_at) VALUES (?, ?, ?, datetime('now'))`
        );
        for (const it of items) {
          const itemId = Number(it.item_id || it.id || 0);
          const qty = Number(it.quantity || 1);
          await insertItemStmt.run(orderId, itemId, qty);
        }
        await insertItemStmt.finalize();

        // Build items detailed array to return
        const dbItems = [];
        for (const it of items) {
          const itemId = Number(it.item_id || it.id || 0);
          if (itemId > 0) {
            const itemRow = await db.get(
              "SELECT id, name, price FROM items WHERE id = ?",
              [itemId]
            );
            if (itemRow) {
              dbItems.push({
                item_id: itemRow.id,
                name: itemRow.name,
                price: Number(itemRow.price),
                quantity: Number(it.quantity || 1),
              });
              continue;
            }
          }
          dbItems.push({
            item_id: it.item_id || it.id || 0,
            name: it.name || "Unknown",
            price: Number(it.price || 0),
            quantity: Number(it.quantity || 1),
          });
        }

        const orderObj = {
          id: orderId,
          token,
          user_id,
          user_name,
          items: dbItems,
          amount: finalAmount,
          payment_type,
          payment_status: "completed",
          order_status: "preparing",
          order_date: new Date().toISOString(),
        };

        res.json({
          success: true,
          token,
          message: "Order placed successfully",
          order: orderObj,
        });
      } catch (err) {
        console.error("Order creation error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to place order" });
      }
    });

    // Get all orders (admin)
    app.get("/api/admin/orders", async (req, res) => {
      try {
        const orders = await db.all(
          "SELECT * FROM orders ORDER BY id ASC"
        );
        const parsedOrders = orders.map((order) => ({
          ...order,
          items: JSON.parse(order.items),
        }));
        res.json({ success: true, orders: parsedOrders });
      } catch (err) {
        console.error("Get orders error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch orders" });
      }
    });

    // Admin payment history
    app.get("/api/admin/payments", async (req, res) => {
      try {
        const orders = await db.all(
          "SELECT * FROM orders ORDER BY order_date DESC"
        );
        const payments = orders.map((order) => ({
          id: order.id,
          token: order.token,
          user_id: order.user_id,
          user_name: order.user_name,
          items: JSON.parse(order.items),
          amount: order.amount,
          payment_type: order.payment_type,
          payment_status: order.payment_status,
          order_status: order.order_status,
          order_date: order.order_date,
        }));
        res.json({ success: true, payments });
      } catch (err) {
        console.error("Get payments error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch payment history" });
      }
    });

    // Admin accept/reject monthly payment
    app.put("/api/orders/:id/payment-action", async (req, res) => {
      try {
        const { id } = req.params;
        const { action } = req.body; // "accept" or "reject"

        if (!["accept", "reject"].includes(action)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid action" });
        }

        const updates =
          action === "accept"
            ? { payment_type: "monthly", payment_status: "completed" }
            : { payment_type: "instant", payment_status: "completed" };

        const result = await db.run(
          `UPDATE orders SET payment_type = ?, payment_status = ? WHERE id = ?`,
          [updates.payment_type, updates.payment_status, id]
        );

        if (result.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Order not found" });
        }

        const updated = await db.get("SELECT * FROM orders WHERE id = ?", [
          id,
        ]);
        res.json({
          success: true,
          message: "Payment action applied",
          order: updated,
        });
      } catch (err) {
        console.error("Payment action error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to apply payment action" });
      }
    });

    // Get user orders
    app.get("/api/user/orders/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const orders = await db.all(
          "SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC",
          [userId]
        );

        const parsedOrders = [];
        for (const order of orders) {
          const rows = await db.all(
            `SELECT oi.quantity, oi.item_id, i.name as item_name, i.price as item_price, oi.created_at
             FROM order_items oi
             LEFT JOIN items i ON i.id = oi.item_id
             WHERE oi.order_id = ?`,
            [order.id]
          );

          const items = rows.map((r) => ({
            item_id: r.item_id,
            name: r.item_name || "Unknown",
            price:
              r.item_price != null ? Number(r.item_price) : null,
            quantity: Number(r.quantity),
            created_at: r.created_at,
          }));

          if (items.length === 0 && order.items) {
            try {
              const parsed = JSON.parse(order.items);
              parsed.forEach((p) => {
                items.push({
                  item_id: p.item_id || p.id || 0,
                  name: p.name || "Unknown",
                  price: Number(p.price || 0),
                  quantity: Number(p.quantity || 1),
                });
              });
            } catch (e) {
              // ignore
            }
          }

          parsedOrders.push({
            ...order,
            items,
            amount: Number(order.amount),
          });
        }

        res.json({ success: true, orders: parsedOrders });
      } catch (err) {
        console.error("Get user orders error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch user orders" });
      }
    });

    // Update order status
    app.put("/api/orders/:id/status", async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = [
          "preparing",
          "partially_completed",
          "ready_to_serve",
          "completed",
        ];
        if (!validStatuses.includes(status))
          return res.status(400).json({
            success: false,
            message: "Invalid status",
          });

        const result = await db.run(
          "UPDATE orders SET order_status = ? WHERE id = ?",
          [status, id]
        );
        if (result.changes === 0)
          return res.status(404).json({
            success: false,
            message: "Order not found",
          });

        res.json({
          success: true,
          message: "Order status updated successfully",
        });
      } catch (err) {
        console.error("Update status error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to update status" });
      }
    });

    // Update payment status
    app.put("/api/orders/:id/payment", async (req, res) => {
      try {
        const { id } = req.params;
        const { payment_status } = req.body;
        const validStatuses = [
          "pending",
          "completed",
          "failed",
          "refunded",
        ];
        if (!validStatuses.includes(payment_status))
          return res.status(400).json({
            success: false,
            message: "Invalid payment status",
          });

        const result = await db.run(
          "UPDATE orders SET payment_status = ? WHERE id = ?",
          [payment_status, id]
        );
        if (result.changes === 0)
          return res.status(404).json({
            success: false,
            message: "Order not found",
          });

        res.json({
          success: true,
          message: "Payment status updated successfully",
        });
      } catch (err) {
        console.error("Update payment error:", err);
        res.status(500).json({
          success: false,
          message: "Failed to update payment status",
        });
      }
    });

    // Settle monthly payments
    app.post("/api/admin/payments/settle", async (req, res) => {
      try {
        const { user_id, start_date, end_date, ids } = req.body;
        if (!user_id || !start_date || !end_date) {
          return res.status(400).json({
            success: false,
            message: "user_id, start_date and end_date are required",
          });
        }

        const startDateTime = `${start_date} 00:00:00`;
        const endDateTime = `${end_date} 23:59:59`;

        if (Array.isArray(ids) && ids.length > 0) {
          const cleanIds = Array.from(
            new Set(
              ids
                .map((i) => Number(i))
                .filter((n) => Number.isInteger(n) && n > 0)
            )
          );
          if (cleanIds.length === 0) {
            return res.status(400).json({
              success: false,
              message: "Invalid ids array",
            });
          }

          const placeholders = cleanIds.map(() => "?").join(",");
          const checkSql = `SELECT id FROM orders WHERE id IN (${placeholders}) AND user_id = ? AND payment_type = 'monthly'`;
          const checkParams = [...cleanIds, user_id];
          const matching = await db.all(checkSql, checkParams);

          if (!matching || matching.length === 0) {
            return res.json({
              success: true,
              message:
                "No matching monthly orders found for given ids/user",
              updatedRows: 0,
              updatedIds: [],
            });
          }

          const matchingIds = matching.map((r) => r.id);
          const matchPlaceholders = matchingIds.map(() => "?").join(",");

          try {
            await db.run("BEGIN TRANSACTION;");
            const updateSql = `UPDATE orders SET payment_type = 'instant' WHERE id IN (${matchPlaceholders})`;
            const result = await db.run(updateSql, matchingIds);

            const updatedRows =
              result && typeof result.changes === "number"
                ? result.changes
                : matchingIds.length;

            await db.run("COMMIT;");
            return res.json({
              success: true,
              message: "Settled selected monthly orders",
              updatedRows,
              updatedIds: matchingIds,
            });
          } catch (updateErr) {
            try {
              await db.run("ROLLBACK;");
            } catch (rErr) {
              console.error("Rollback error:", rErr);
            }
            console.error(
              "Error updating selected orders:",
              updateErr
            );
            return res.status(500).json({
              success: false,
              message: "DB update failed",
            });
          }
        }

        const candidates = await db.all(
          `SELECT id FROM orders
           WHERE user_id = ?
             AND payment_type = 'monthly'
             AND order_date BETWEEN ? AND ?
           ORDER BY order_date ASC`,
          [user_id, startDateTime, endDateTime]
        );

        if (!candidates || candidates.length === 0) {
          return res.json({
            success: true,
            message: "No monthly orders found in range",
            updatedRows: 0,
            updatedIds: [],
          });
        }

        const rangeIds = candidates.map((r) => r.id);

        try {
          await db.run("BEGIN TRANSACTION;");
          const updateSql = `
            UPDATE orders
            SET payment_type = 'instant'
            WHERE user_id = ?
              AND payment_type = 'monthly'
              AND order_date BETWEEN ? AND ?;
          `;
          const result = await db.run(updateSql, [
            user_id,
            startDateTime,
            endDateTime,
          ]);
          const updatedRows =
            result && typeof result.changes === "number"
              ? result.changes
              : rangeIds.length;
          await db.run("COMMIT;");
          return res.json({
            success: true,
            message: "Settled monthly payments",
            updatedRows,
            updatedIds: rangeIds,
          });
        } catch (updateErr) {
          try {
            await db.run("ROLLBACK;");
          } catch (rErr) {
            console.error("Rollback error:", rErr);
          }
          console.error(
            "Error updating orders in settle endpoint:",
            updateErr
          );
          return res.status(500).json({
            success: false,
            message: "DB update failed",
          });
        }
      } catch (err) {
        console.error("Settle payments error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    });

    // Admin statistics
    app.get("/api/admin/statistics", async (req, res) => {
      try {
        const totalOrders = await db.get(
          "SELECT COUNT(*) as count FROM orders"
        );
        const totalRevenue = await db.get(
          "SELECT SUM(amount) as total FROM orders WHERE payment_status = 'completed'"
        );
        const pendingOrders = await db.get(
          "SELECT COUNT(*) as count FROM orders WHERE order_status != 'completed'"
        );
        const completedOrders = await db.get(
          "SELECT COUNT(*) as count FROM orders WHERE order_status = 'completed'"
        );

        res.json({
          success: true,
          statistics: {
            totalOrders: totalOrders.count,
            totalRevenue: totalRevenue.total || 0,
            pendingOrders: pendingOrders.count,
            completedOrders: completedOrders.count,
          },
        });
      } catch (err) {
        console.error("Get statistics error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch statistics" });
      }
    });

    // Default route
    app.get("/", (req, res) => {
      res.json({
        message: "SNGCE Canteen Server running ✅",
        timestamp: new Date().toISOString(),
      });
    });

    app.use("*", (req, res) => {
      res
        .status(404)
        .json({ success: false, message: "Endpoint not found" });
    });

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (db) await db.close();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  if (db) await db.close();
  process.exit(0);
});
process.on("uncaughtException", (err) => {
  console.error(err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error(reason);
  process.exit(1);
});

startServer();

module.exports = app;
