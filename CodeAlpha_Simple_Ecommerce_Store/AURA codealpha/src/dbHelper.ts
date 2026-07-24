import { auth } from "./firebase";
import { Product, UserProfile, Order } from "./types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('API Interaction Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Seed initial products if needed (handled automatically on server, but keeping signature)
 */
export async function seedProductsIfNeeded(): Promise<void> {
  // Server-side seeding is handled on GET /api/products, so we can just trigger that
  try {
    await fetch("/api/products");
  } catch (error) {
    console.error("Failed to trigger products seeding:", error);
  }
}

/**
 * Fetch all products from Node.js Express server
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "products");
  }
}

/**
 * Fetch single product by ID from Node.js Express server
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `products/${id}`);
  }
}

/**
 * Create or update user profile via Node.js Express server
 */
export async function saveUserProfile(uid: string, profile: Omit<UserProfile, "id">): Promise<void> {
  try {
    const res = await fetch(`/api/users/${uid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

/**
 * Fetch user profile from Node.js Express server
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users/${uid}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

/**
 * Place a new order and decrement stocks securely in Node.js
 */
export async function placeOrder(orderData: Omit<Order, "id">): Promise<string> {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Server returned status: ${res.status}`);
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "orders");
  }
}

/**
 * Fetch all orders for a specific user from Node.js Express server
 */
export async function fetchOrdersByUser(uid: string): Promise<Order[]> {
  try {
    const res = await fetch(`/api/orders/user/${uid}`);
    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `orders/user/${uid}`);
  }
}

/**
 * Fetch all guest orders by email from Node.js Express server
 */
export async function fetchOrdersByEmail(email: string): Promise<Order[]> {
  try {
    const res = await fetch(`/api/orders/email/${encodeURIComponent(email)}`);
    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `orders/email/${email}`);
  }
}
