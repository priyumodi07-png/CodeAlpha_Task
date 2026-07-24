import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch, 
  runTransaction 
} from "firebase/firestore";

// Type declarations
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
  featured: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  address?: string;
  phone?: string;
  createdAt?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  createdAt: string;
}

// Derive __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Web SDK configuration (fully compatible with Node.js)
const firebaseConfig = {
  apiKey: "AIzaSyDVzhtkPGsbUFNCiPz4P1qSihS9ph5v-PE",
  authDomain: "aura-e-commerce-9fc90.firebaseapp.com",
  projectId: "aura-e-commerce-9fc90",
  storageBucket: "aura-e-commerce-9fc90.firebasestorage.app",
  messagingSenderId: "68199919535",
  appId: "1:68199919535:web:d08a04c8077fc94c7f895a",
  measurementId: "G-SPJ7EMRFWH"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {});

const PRODUCTS_COLLECTION = "products";
const USERS_COLLECTION = "users";
const ORDERS_COLLECTION = "orders";

// Initial Products for automatic seeding
const INITIAL_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "Spectre Pro OLED Creator Laptop",
    description: "Supercharged with a state-of-the-art processor, 16-inch breathtaking 4K OLED display, and liquid-metal cooling system. Perfect for designers, creators, and developers.",
    price: 124999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    category: "Electronics",
    stock: 5,
    rating: 4.9,
    featured: true
  },
  {
    name: "The Art of Minimalist Living (Limited Edition)",
    description: "An exquisite linen-bound hardcover volume containing curated essays, archival photography, and timeless design philosophy on living with intentionality.",
    price: 1499,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
    category: "Books",
    stock: 25,
    rating: 4.8,
    featured: false
  },
  {
    name: "Aero-Knit Merino Wool Trainers",
    description: "Sustainably-made, high-performance running sneakers crafted with breathable Australian merino wool. Extremely lightweight, odor-resistant, and machine-washable.",
    price: 7999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    category: "Shoes",
    stock: 15,
    rating: 4.7,
    featured: true
  },
  {
    name: "Nordic Organic Wool Throw Blanket",
    description: "Woven from 100% organic Scandinavian lambswool. Thick, highly breathable, and styled in an elegant botanical green herringbone pattern.",
    price: 5499,
    image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=600&auto=format&fit=crop&q=80",
    category: "Home & Living",
    stock: 12,
    rating: 4.9,
    featured: true
  },
  {
    name: "Aura Linen Comfort Loungewear Set",
    description: "Tailored from 100% premium organic flax linen. Breathable, relaxed-fit trousers and matching button-down shirt designed for effortless style and deep relaxation.",
    price: 3999,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    category: "Clothes",
    stock: 20,
    rating: 4.6,
    featured: false
  },
  {
    name: "Infinity Flowing Sand Pendulum Clock",
    description: "An artistic kinetic gravity pendulum clock that draws sweeping, hypnotic geometric paths in ultra-fine white sand over an elegant brass base.",
    price: 4499,
    image: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&auto=format&fit=crop&q=80",
    category: "Home & Living",
    stock: 8,
    rating: 4.7,
    featured: true
  },
  {
    name: "Zen Minimalist Desk Lamp",
    description: "Sleek wooden base with an adjustable warm LED ring. Perfect for late-night focus, deep work, and elegant workstation styling.",
    price: 2999,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    category: "Home & Living",
    stock: 15,
    rating: 4.8,
    featured: false
  },
  {
    name: "Leather Journal & Brass Pen",
    description: "Handcrafted full-grain leather notebook paired with a heavy brass rollerball pen. Includes 200 pages of acid-free cream paper.",
    price: 1999,
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
    category: "Stationery",
    stock: 30,
    rating: 4.7,
    featured: false
  },
  {
    name: "Matte Black Vacuum Flask",
    description: "Double-wall vacuum insulated stainless steel water bottle. Keeps liquids ice cold for 24 hours or steaming hot for 12 hours.",
    price: 1299,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
    category: "Fitness & Outdoors",
    stock: 50,
    rating: 4.6,
    featured: false
  },
  {
    name: "Acoustic Noise-Cancelling Headphones",
    description: "Premium over-ear wireless headphones featuring industry-leading active noise cancellation, custom audio profiles, and 40-hour battery life.",
    price: 15999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    category: "Electronics",
    stock: 8,
    rating: 4.9,
    featured: true
  },
  {
    name: "Ergonomic Cork Yoga Block",
    description: "Sustainably harvested Mediterranean oak cork blocks. Provides firm, high-density support, natural traction, and resilient grip.",
    price: 999,
    image: "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=600&auto=format&fit=crop&q=80",
    category: "Fitness & Outdoors",
    stock: 25,
    rating: 4.5,
    featured: false
  },
  {
    name: "Ceramic Pour-Over Coffee Dripper",
    description: "Artisanal ceramic dripper designed with optimal spiral ribs for a balanced, rich, full-bodied coffee extraction experience.",
    price: 1699,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    category: "Kitchen & Dining",
    stock: 20,
    rating: 4.8,
    featured: false
  },
  {
    name: "Solid Brass Mechanical Pencil",
    description: "A precision-engineered drafting mechanical pencil crafted from solid leaded brass. Develops a gorgeous natural patina over time.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80",
    category: "Stationery",
    stock: 18,
    rating: 4.7,
    featured: false
  },
  {
    name: "Titanium Minimalist Key Organizer",
    description: "Aircraft-grade sandblasted titanium key carrier. Eliminates key jingle, protects mobile screens, and holds up to 8 keys sleekly.",
    price: 1899,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
    category: "Accessories",
    stock: 40,
    rating: 4.6,
    featured: false
  },
  {
    name: "Bamboo Fiber Bento Lunch Box",
    description: "Eco-friendly, leak-proof Japanese style lunch box made from natural bamboo fibers with a secure silicone strap and premium wood lid.",
    price: 1299,
    image: "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=600&auto=format&fit=crop&q=80",
    category: "Kitchen & Dining",
    stock: 22,
    rating: 4.5,
    featured: false
  },
  {
    name: "Hand-Poured Soy Amber Candle",
    description: "Infused with therapeutic-grade sandalwood and amber essential oils. Features a clean-burning crackling wood wick inside an apothecary jar.",
    price: 899,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
    category: "Home & Living",
    stock: 35,
    rating: 4.8,
    featured: false
  },
  {
    name: "Full-Grain Leather Bi-Fold Wallet",
    description: "Hand-stitched vegetable-tanned premium leather wallet. Offers 6 card slots, a spacious cash pocket, and advanced integrated RFID blocking technology.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80",
    category: "Accessories",
    stock: 14,
    rating: 4.7,
    featured: false
  },
  {
    name: "Premium Teakwood Mortar & Pestle",
    description: "Individually hand-carved from a single piece of dense Indonesian teakwood. Beautiful grain accents, heavy non-slip feel, and perfect grinding surface.",
    price: 1799,
    image: "https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600&auto=format&fit=crop&q=80",
    category: "Kitchen & Dining",
    stock: 10,
    rating: 4.9,
    featured: false
  },
  {
    name: "Organic Cotton Waffle Robe",
    description: "Incredibly plush, absorbent, and breathable waffle-weave spa bathrobe woven from 100% certified long-staple organic cotton.",
    price: 3499,
    image: "https://images.unsplash.com/photo-1563170351-be82bc888bb4?w=600&auto=format&fit=crop&q=80",
    category: "Clothes",
    stock: 12,
    rating: 4.6,
    featured: false
  },
  {
    name: "Minimalist Architecture Hardcover",
    description: "A beautifully curated visual catalog featuring stunning photography of high-end modern minimalist retreats and structural masterworks worldwide.",
    price: 2199,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    category: "Books",
    stock: 15,
    rating: 4.9,
    featured: true
  },
  {
    name: "Natural Rubber Pro Yoga Mat",
    description: "High-density natural rubber base providing unbeatable dry and wet grip. Fully biodegradable, non-toxic, and extra-cushioned for joint comfort.",
    price: 4999,
    image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=600&auto=format&fit=crop&q=80",
    category: "Fitness & Outdoors",
    stock: 11,
    rating: 4.8,
    featured: true
  },
  {
    name: "Ceramic Incense Holder Set",
    description: "A sculptural, hand-thrown modern incense burner. Accompanied by 15 sticks of premium organic Hinoki Cypress hand-rolled incense.",
    price: 1199,
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80",
    category: "Home & Living",
    stock: 45,
    rating: 4.7,
    featured: false
  },
  {
    name: "Smart RGB Ambient Lightbar System",
    description: "Vibrant custom-mappable smart lightbars that sync with your monitor or sound system. Controlled effortlessly via mobile app or home hub.",
    price: 4499,
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    category: "Electronics",
    stock: 9,
    rating: 4.7,
    featured: false
  },
  {
    name: "Flax Linen Tablecloth & Napkins",
    description: "Exquisite Belgian flax linen tablecloth paired with four matching linen napkins. Pre-washed for a luxuriously soft feel and relaxed elegance.",
    price: 2799,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
    category: "Home & Living",
    stock: 16,
    rating: 4.6,
    featured: false
  },
  {
    name: "Canvas & Leather Weekend Duffle",
    description: "Heavy-duty waxed water-resistant cotton canvas bag reinforced with top-grain saddle leather straps, robust solid brass hardware, and YKK zippers.",
    price: 6499,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    category: "Accessories",
    stock: 6,
    rating: 4.9,
    featured: true
  },
  {
    name: "Premium Ceramic Coffee Mug Set",
    description: "A pair of hand-glazed earthy ceramic cups with ergonomic handles. Keeps your morning pour-over warm with thick organic clay walls.",
    price: 1399,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&auto=format&fit=crop&q=80",
    category: "Kitchen & Dining",
    stock: 25,
    rating: 4.8,
    featured: false
  },
  {
    name: "Memory Foam Ergonomic Cushion",
    description: "Orthopedic contoured memory foam seat pillow wrapped in a breathable cooling gel layer. Dramatically reduces tailbone fatigue.",
    price: 2299,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80",
    category: "Home & Living",
    stock: 30,
    rating: 4.5,
    featured: false
  },
  {
    name: "Handcrafted Saddle Leather Desk Mat",
    description: "Large desk blotter cut from a single premium hide of natural full-grain saddle leather. Sized perfectly to host your keyboard and mouse.",
    price: 3299,
    image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80",
    category: "Stationery",
    stock: 14,
    rating: 4.8,
    featured: true
  },
  {
    name: "Portable Bluetooth Wireless Speaker",
    description: "Rugged, IPX7 waterproof wireless speaker delivering deep 360-degree high-fidelity room-filling audio and an impressive 18-hour play battery.",
    price: 4999,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80",
    category: "Electronics",
    stock: 15,
    rating: 4.7,
    featured: true
  },
  {
    name: "The Culinary Masterclass Hardcover",
    description: "A gorgeous luxury cookbook housing 150 award-winning recipes, step-by-step masterclasses, and vibrant organic lifestyle photography.",
    price: 1799,
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80",
    category: "Books",
    stock: 19,
    rating: 4.8,
    featured: false
  }
];

/**
 * Seed database and perform robust deduplication/synchronization
 */
async function seedProductsIfNeeded() {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    
    // Read current products in DB
    const dbProducts: { id: string; name: string }[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      dbProducts.push({ id: docSnap.id, name: data.name });
    });

    const batch = writeBatch(db);
    let needsCommit = false;

    // Track names of products that we want to keep
    const targetNames = INITIAL_PRODUCTS.map(p => p.name);
    
    // Track which names have been seen in the DB to avoid duplicates
    const seenNames = new Set<string>();
    
    // Delete items that are not in our target list, or that are duplicates
    for (const dbProd of dbProducts) {
      if (!targetNames.includes(dbProd.name) || seenNames.has(dbProd.name)) {
        console.log(`[Node Server] Deleting redundant or duplicate product: ${dbProd.name} (${dbProd.id})`);
        const docToDelete = doc(db, PRODUCTS_COLLECTION, dbProd.id);
        batch.delete(docToDelete);
        needsCommit = true;
      } else {
        seenNames.add(dbProd.name);
      }
    }

    // Now, see if any of our INITIAL_PRODUCTS are missing from the DB
    for (const initialProduct of INITIAL_PRODUCTS) {
      if (!seenNames.has(initialProduct.name)) {
        console.log(`[Node Server] Seeding missing product: ${initialProduct.name}`);
        const newDocRef = doc(productsRef);
        batch.set(newDocRef, initialProduct);
        needsCommit = true;
      }
    }

    if (needsCommit) {
      await batch.commit();
      console.log("[Node Server] Product synchronization and deduplication completed successfully.");
    } else {
      console.log("[Node Server] Products are already perfectly synced and distinct.");
    }
  } catch (err) {
    console.error("[Node Server] Error synchronizing products:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // API ROUTES

  // 1. Get All Products
  app.get("/api/products", async (req, res) => {
    try {
      await seedProductsIfNeeded();
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const snapshot = await getDocs(productsRef);
      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        products.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      res.json(products);
    } catch (err: any) {
      console.error("[Node Server] Get products error:", err);
      res.status(500).json({ error: "Failed to retrieve products.", details: err.message });
    }
  });

  // 2. Get Single Product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        res.json({ id: docSnap.id, ...docSnap.data() });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (err: any) {
      console.error("[Node Server] Get product detail error:", err);
      res.status(500).json({ error: "Failed to retrieve product.", details: err.message });
    }
  });

  // 3. Save User Profile
  app.post("/api/users/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const profile = req.body;
      const docRef = doc(db, USERS_COLLECTION, uid);
      await setDoc(docRef, {
        ...profile,
        createdAt: profile.createdAt || new Date().toISOString()
      }, { merge: true });
      res.json({ success: true, message: "Profile saved successfully." });
    } catch (err: any) {
      console.error("[Node Server] Save user profile error:", err);
      res.status(500).json({ error: "Failed to save user profile.", details: err.message });
    }
  });

  // 4. Get User Profile
  app.get("/api/users/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const docRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        res.json({ id: docSnap.id, ...docSnap.data() });
      } else {
        res.status(404).json({ error: "User profile not found." });
      }
    } catch (err: any) {
      console.error("[Node Server] Get user profile error:", err);
      res.status(500).json({ error: "Failed to retrieve user profile.", details: err.message });
    }
  });

  // 5. Place New Order (with Transaction to securely decrement stock)
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;
      const ordersRef = collection(db, ORDERS_COLLECTION);
      
      // Save order document
      const newOrderDoc = await addDoc(ordersRef, {
        ...orderData,
        createdAt: new Date().toISOString()
      });

      // runTransaction for stock management
      await runTransaction(db, async (transaction) => {
        for (const item of orderData.items) {
          const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
          const productSnap = await transaction.get(productRef);
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stock || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            transaction.update(productRef, { stock: newStock });
          }
        }
      });

      res.status(201).json({ id: newOrderDoc.id, success: true });
    } catch (err: any) {
      console.error("[Node Server] Place order error:", err);
      res.status(500).json({ error: "Failed to place order securely on server.", details: err.message });
    }
  });

  // 6. Get Orders by User UID
  app.get("/api/orders/user/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const q = query(
        ordersRef, 
        where("userId", "==", uid)
      );
      
      const snapshot = await getDocs(q);
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      
      // Sort in-memory to prevent missing composite index errors in Firestore
      orders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(orders);
    } catch (err: any) {
      console.error("[Node Server] Get user orders error:", err);
      res.status(500).json({ error: "Failed to retrieve user orders.", details: err.message });
    }
  });

  // 7. Get Orders by Email (for Guests)
  app.get("/api/orders/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const q = query(
        ordersRef,
        where("customerEmail", "==", email)
      );
      
      const snapshot = await getDocs(q);
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      
      // Sort in-memory to prevent missing composite index errors in Firestore
      orders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(orders);
    } catch (err: any) {
      console.error("[Node Server] Get email orders error:", err);
      res.status(500).json({ error: "Failed to retrieve orders by email.", details: err.message });
    }
  });

  // VITE DEV SERVER / STATIC SERVING MIDDLEWARE Setup
  if (process.env.NODE_ENV !== "production") {
    console.log("[Node Server] Setting up Vite Dev Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Node Server] Setting up Static Production Asset Serving...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Node Server] Server running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
