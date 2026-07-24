import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { GoogleGenAI } from "@google/genai";
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  setLogLevel,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
  writeBatch,
  getCountFromServer,
  terminate
} from "firebase/firestore";

// Set Firestore log level to avoid internal BloomFilter debug noise
setLogLevel("error");

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function generateCommunityComment(authorName: string, postContent: string): Promise<string> {
  const ai = getAIClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a social media network user named ${authorName} replying to this post on a platform: "${postContent}". Write a short, friendly, realistic comment (1-2 sentences maximum). Keep it natural, conversational, positive, and directly relevant.`
      });
      const text = response.text?.trim();
      if (text) return text;
    } catch (e) {
      console.warn("Gemini comment generation failed, using preset fallback", e);
    }
  }

  const fallbacks = [
    "Great post! Really loved reading this perspective. ✨",
    "Awesome share! Looking forward to more updates. 🙌",
    "Super cool idea! Thanks for putting this out there. 🔥",
    "Totally agree with this! Very well said.",
    "Interesting point! Thanks for sharing this with the community."
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Firebase Configuration from the user's request
const firebaseConfig = {
  apiKey: "AIzaSyAmk3pEaD7_teCLva9yVkSLELF_I63Z7n4",
  authDomain: "social-media-335af.firebaseapp.com",
  projectId: "social-media-335af",
  storageBucket: "social-media-335af.firebasestorage.app",
  messagingSenderId: "982187345074",
  appId: "1:982187345074:web:2c9375c775a17480b875ab",
  measurementId: "G-C807Q9XDPP"
};

// Types
interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  joinedAt: string;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface Like {
  userId: string;
  postId: string;
}

interface Follow {
  followerId: string;
  followingId: string;
}

interface DatabaseSchema {
  users: User[];
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  follows: Follow[];
}

// Initial seed data
const initialDB: DatabaseSchema = {
  users: [
    {
      id: "u1",
      username: "priyu",
      displayName: "Priyu Modi",
      bio: "Creative Frontend Engineer & UI Designer. Crafting elegant web applications with React, Tailwind & AI magic. ✨",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      joinedAt: "2026-01-15T08:30:00.000Z"
    },
    {
      id: "u2",
      username: "sarah_m",
      displayName: "Sarah Meyer",
      bio: "National Geographic contributor & travel photographer. Chasing golden hour lighting & wild landscapes. 📸✈️",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      joinedAt: "2026-02-10T12:00:00.000Z"
    },
    {
      id: "u3",
      username: "alex_rivera",
      displayName: "Alex Rivera",
      bio: "UI/UX Architect | Typography nerd. Obsessed with Swiss design, spatial rhythm & minimalist typography.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      joinedAt: "2026-03-01T15:45:00.000Z"
    },
    {
      id: "u4",
      username: "elena_ai",
      displayName: "Elena Rostova",
      bio: "AI Research Scientist & Neural Net Developer. Exploring generative models, multimodal agents & ethics. 🧠⚡",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
      joinedAt: "2026-03-12T09:15:00.000Z"
    },
    {
      id: "u5",
      username: "david_cloud",
      displayName: "David Chen",
      bio: "Cloud Systems Architect & Open Source contributor. Kubernetes, Serverless & Distributed Databases. ☁️🚀",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      joinedAt: "2026-04-05T11:20:00.000Z"
    },
    {
      id: "u6",
      username: "maya_design",
      displayName: "Maya Lin",
      bio: "Product Designer & Color Theorist. Design systems at scale, micro-interactions & accessible design.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      joinedAt: "2026-04-18T14:10:00.000Z"
    },
    {
      id: "u7",
      username: "marcus_wild",
      displayName: "Marcus Thorne",
      bio: "Outdoor Guide & Alpine Photographer. Expedition lead through Norway, Iceland & the Rockies. 🏔️🌲",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
      joinedAt: "2026-05-02T16:00:00.000Z"
    },
    {
      id: "u8",
      username: "chef_sophie",
      displayName: "Sophie Laurent",
      bio: "Artisanal Pastry Chef & Food Stylist. Turning sourdough, berries & dark chocolate into edible art. 🥐🍓",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
      joinedAt: "2026-05-20T10:30:00.000Z"
    }
  ],
  posts: [
    {
      id: "p1",
      userId: "u2",
      content: "Chasing sunsets is my favorite visual meditation. Just captured the magical golden hour over Mount Fuji in Japan this morning. #Travel #Photography #Japan",
      imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80",
      createdAt: "2026-07-05T18:30:00.000Z",
      likesCount: 24,
      commentsCount: 4
    },
    {
      id: "p2",
      userId: "u3",
      content: "A beautiful typography sample celebrating German modernist Bauhaus layout concepts. Less is definitely more when it comes to spatial rhythm. #Design #Typography",
      imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&auto=format&fit=crop&q=80",
      createdAt: "2026-07-06T02:15:00.000Z",
      likesCount: 18,
      commentsCount: 3
    },
    {
      id: "p3",
      userId: "u1",
      content: "Building responsive web interfaces with React & Tailwind CSS brings me so much joy! The instant visual feedback loop is unmatched. What tech stack are you building with today? #Tech #WebDev #React",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
      createdAt: "2026-07-06T05:00:00.000Z",
      likesCount: 31,
      commentsCount: 6
    },
    {
      id: "p4",
      userId: "u4",
      content: "Multimodal AI agent architectures are evolving at record pace. Combining vision, speech, and reasoning into single unified neural transformers is opening up incredible new possibilities for creative software! #AI #Tech #Innovation",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1000&auto=format&fit=crop&q=80",
      createdAt: "2026-07-06T09:20:00.000Z",
      likesCount: 29,
      commentsCount: 5
    },
    {
      id: "p5",
      userId: "u7",
      content: "Spent 4 days trekking through Lofoten Islands in northern Norway. The dramatic fjords meeting the icy Atlantic ocean is unmatched in raw beauty. #Travel #Outdoors #Norway",
      imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80",
      createdAt: "2026-07-06T11:40:00.000Z",
      likesCount: 38,
      commentsCount: 7
    },
    {
      id: "p6",
      userId: "u8",
      content: "Freshly baked sourdough croissants straight from the morning oven! Crispy golden layers with 84% European cultured butter. #Food #Culinary #Baking",
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1000&auto=format&fit=crop&q=80",
      createdAt: "2026-07-06T13:10:00.000Z",
      likesCount: 42,
      commentsCount: 8
    },
    {
      id: "p7",
      userId: "u5",
      content: "Deploying high-availability Firestore clusters with auto-scaling microservices. Zero downtime migrations are the holy grail of cloud architecture. #Tech #Cloud #DevOps",
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80",
      createdAt: "2026-07-06T14:45:00.000Z",
      likesCount: 22,
      commentsCount: 3
    },
    {
      id: "p8",
      userId: "u6",
      content: "Design tip: Don't rely solely on color contrast to convey state. Use typography weight, spatial padding, and iconography to ensure full accessibility for all users! #Design #Accessibility",
      imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80",
      createdAt: "2026-07-06T16:00:00.000Z",
      likesCount: 27,
      commentsCount: 4
    }
  ],
  comments: [
    {
      id: "c1",
      postId: "p1",
      userId: "u1",
      content: "This photograph is breathtaking, Sarah! The lighting is perfect.",
      createdAt: "2026-07-05T19:00:00.000Z"
    },
    {
      id: "c2",
      postId: "p1",
      userId: "u3",
      content: "Splendid composition. The framing of the mountain against the sunset is top tier.",
      createdAt: "2026-07-05T19:45:00.000Z"
    },
    {
      id: "c3",
      postId: "p2",
      userId: "u1",
      content: "Agreed. The use of negative space here is incredible.",
      createdAt: "2026-07-06T03:00:00.000Z"
    },
    {
      id: "c4",
      postId: "p3",
      userId: "u2",
      content: "The aesthetic is super sleek! Extremely clean and modern.",
      createdAt: "2026-07-06T05:15:00.000Z"
    },
    {
      id: "c5",
      postId: "p3",
      userId: "u4",
      content: "React & Tailwind paired with clean Firestore persistence is such a sweet stack!",
      createdAt: "2026-07-06T05:40:00.000Z"
    },
    {
      id: "c6",
      postId: "p4",
      userId: "u5",
      content: "Fascinating work Elena! Are you testing multimodal reasoning locally or via cloud endpoint?",
      createdAt: "2026-07-06T09:45:00.000Z"
    },
    {
      id: "c7",
      postId: "p6",
      userId: "u1",
      content: "Oh my goodness, those croissants look heavenly Sophie!",
      createdAt: "2026-07-06T13:30:00.000Z"
    }
  ],
  likes: [
    { userId: "u1", postId: "p1" },
    { userId: "u3", postId: "p1" },
    { userId: "u4", postId: "p1" },
    { userId: "u1", postId: "p2" },
    { userId: "u2", postId: "p2" },
    { userId: "u2", postId: "p3" },
    { userId: "u3", postId: "p3" },
    { userId: "u4", postId: "p3" },
    { userId: "u5", postId: "p3" },
    { userId: "u1", postId: "p4" },
    { userId: "u3", postId: "p4" },
    { userId: "u2", postId: "p5" },
    { userId: "u1", postId: "p6" },
    { userId: "u3", postId: "p6" },
    { userId: "u4", postId: "p6" }
  ],
  follows: [
    { followerId: "u1", followingId: "u2" },
    { followerId: "u1", followingId: "u3" },
    { followerId: "u1", followingId: "u4" },
    { followerId: "u1", followingId: "u6" },
    { followerId: "u1", followingId: "u7" },
    { followerId: "u1", followingId: "u8" },
    { followerId: "u2", followingId: "u1" },
    { followerId: "u2", followingId: "u7" },
    { followerId: "u3", followingId: "u1" },
    { followerId: "u3", followingId: "u6" },
    { followerId: "u4", followingId: "u1" },
    { followerId: "u4", followingId: "u5" },
    { followerId: "u5", followingId: "u1" },
    { followerId: "u5", followingId: "u4" },
    { followerId: "u7", followingId: "u1" },
    { followerId: "u8", followingId: "u1" }
  ]
};

// Initialize Local JSON fallback
function readDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading local database file, using initial state:", err);
  }
  writeDB(initialDB);
  return initialDB;
}

function writeDB(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Initialize Firebase
let firebaseApp: any = null;
let db: any = null;
let useFirebase = false;

try {
  firebaseApp = initializeApp(firebaseConfig);
  db = initializeFirestore(firebaseApp, {
    experimentalAutoDetectLongPolling: true,
    localCache: memoryLocalCache()
  }, "ai-studio-socialmediaplatf-836b234a-5ccb-4c46-8285-e09239017116");
  console.log("Firebase initialized successfully on server-side.");
} catch (err) {
  console.error("Failed to initialize Firebase SDK on the server:", err);
}

// Function to test connection to Firestore & seed if empty
async function testAndSeedFirebase(): Promise<boolean> {
  if (!db) return false;
  try {
    console.log("Testing Firestore connectivity...");
    
    // Create a short-circuit timeout of 2.5 seconds to avoid freezing the startup process if Firestore is blocked or unreachable
    const testPromise = getDocs(query(collection(db, "users"), where("id", "==", "test_dummy_id_nonexistent")));
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500));
    
    await Promise.race([testPromise, timeoutPromise]);
    
    console.log("Firestore is reachable!");
    
    // Now ensure seeded with complete user base
    const usersSnapshot = await getDocs(collection(db, "users"));
    if (usersSnapshot.size < initialDB.users.length) {
      console.log(`Firestore has ${usersSnapshot.size} users. Seeding/updating missing initial data into Firestore...`);
      const batch = writeBatch(db);

      initialDB.users.forEach(user => {
        batch.set(doc(db, "users", user.id), user, { merge: true });
      });

      initialDB.posts.forEach(post => {
        batch.set(doc(db, "posts", post.id), post, { merge: true });
      });

      initialDB.comments.forEach(comment => {
        batch.set(doc(db, "posts", comment.postId, "comments", comment.id), comment, { merge: true });
      });

      initialDB.likes.forEach(like => {
        batch.set(doc(db, "posts", like.postId, "likes", like.userId), {
          userId: like.userId,
          createdAt: new Date().toISOString()
        }, { merge: true });
      });

      initialDB.follows.forEach(follow => {
        batch.set(doc(db, "follows", `${follow.followerId}_${follow.followingId}`), follow, { merge: true });
      });

      await batch.commit();
      console.log("Firestore seeding/merging completed successfully!");
    }
    
    useFirebase = true;
    return true;
  } catch (err) {
    console.warn("Firestore is unreachable or database is not provisioned yet. Falling back to local db.json persistence. Error details:", err);
    useFirebase = false;
    if (db) {
      try {
        console.log("Terminating active Firestore background connections to suppress errors...");
        await terminate(db);
        console.log("Firestore terminated successfully.");
      } catch (termErr) {
        console.error("Error terminating Firestore:", termErr);
      }
    }
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Test Firebase and fall back if needed in the background so it doesn't block server startup
  testAndSeedFirebase().then((connected) => {
    console.log(`Initial Firestore connectivity test completed. Connected to Firebase: ${connected}`);
  }).catch((err) => {
    console.error("Error during background Firebase test and seed:", err);
  });

  // Route: GET all users
  app.get("/api/users", async (req, res, next) => {
    try {
      if (useFirebase) {
        const snapshot = await getDocs(collection(db, "users"));
        const users = snapshot.docs.map(d => d.data());
        return res.json(users);
      } else {
        const local = readDB();
        return res.json(local.users);
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: GET search users by account name, handle or bio
  app.get("/api/users/search", async (req, res, next) => {
    try {
      const q = ((req.query.q as string) || "").trim().toLowerCase();
      
      let allUsers: any[] = [];
      if (useFirebase) {
        const snapshot = await getDocs(collection(db, "users"));
        allUsers = snapshot.docs.map(d => d.data());
      } else {
        const local = readDB();
        allUsers = local.users;
      }

      if (!q) {
        return res.json(allUsers);
      }

      const filtered = allUsers.filter(u => 
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.bio && u.bio.toLowerCase().includes(q))
      );

      return res.json(filtered);
    } catch (err) {
      next(err);
    }
  });

  // Route: GET specific user with follower/following details & post count
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const userId = req.params.id;

      if (useFirebase) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) {
          return res.status(404).json({ error: "User not found" });
        }
        const user = userDoc.data();

        const followersQuery = query(collection(db, "follows"), where("followingId", "==", userId));
        const followersSnapshot = await getDocs(followersQuery);
        const followers = followersSnapshot.docs.map(d => d.data().followerId);

        const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId));
        const followingSnapshot = await getDocs(followingQuery);
        const following = followingSnapshot.docs.map(d => d.data().followingId);

        const postsQuery = query(collection(db, "posts"), where("userId", "==", userId));
        const postsCountSnapshot = await getCountFromServer(postsQuery);
        const postsCount = postsCountSnapshot.data().count;

        return res.json({
          ...user,
          followersCount: followers.length,
          followingCount: following.length,
          postsCount,
          followers,
          following
        });
      } else {
        const local = readDB();
        const user = local.users.find(u => u.id === userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const followers = local.follows.filter(f => f.followingId === user.id).map(f => f.followerId);
        const following = local.follows.filter(f => f.followerId === user.id).map(f => f.followingId);
        const postsCount = local.posts.filter(p => p.userId === user.id).length;

        return res.json({
          ...user,
          followersCount: followers.length,
          followingCount: following.length,
          postsCount,
          followers,
          following
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: POST create / register user profile
  app.post("/api/users", async (req, res, next) => {
    try {
      const { username, displayName, bio, avatar } = req.body;
      if (!username || !displayName) {
        return res.status(400).json({ error: "Username and display name are required" });
      }

      const normalizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");

      if (useFirebase) {
        const q = query(collection(db, "users"), where("username", "==", normalizedUsername));
        const qSnapshot = await getDocs(q);
        if (!qSnapshot.empty) {
          return res.status(400).json({ error: "Username already taken" });
        }

        const newUser = {
          id: "u_" + Date.now(),
          username: normalizedUsername,
          displayName: displayName.trim(),
          bio: (bio || "").trim(),
          avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop`,
          joinedAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", newUser.id), newUser);
        return res.status(201).json(newUser);
      } else {
        const local = readDB();
        if (local.users.some(u => u.username === normalizedUsername)) {
          return res.status(400).json({ error: "Username already taken" });
        }

        const newUser: User = {
          id: "u_" + Date.now(),
          username: normalizedUsername,
          displayName: displayName.trim(),
          bio: (bio || "").trim(),
          avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop`,
          joinedAt: new Date().toISOString()
        };

        local.users.push(newUser);
        writeDB(local);
        return res.status(201).json(newUser);
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: PUT update user profile
  app.put("/api/users/:id", async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { displayName, bio, avatar } = req.body;

      if (useFirebase) {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          return res.status(404).json({ error: "User not found" });
        }

        const updateData: any = {};
        if (displayName) updateData.displayName = displayName.trim();
        if (bio !== undefined) updateData.bio = bio.trim();
        if (avatar) updateData.avatar = avatar;

        await updateDoc(userRef, updateData);
        const updatedDoc = await getDoc(userRef);
        return res.json(updatedDoc.data());
      } else {
        const local = readDB();
        const index = local.users.findIndex(u => u.id === userId);
        if (index === -1) {
          return res.status(404).json({ error: "User not found" });
        }

        if (displayName) {
          local.users[index].displayName = displayName.trim();
        }
        if (bio !== undefined) {
          local.users[index].bio = bio.trim();
        }
        if (avatar) {
          local.users[index].avatar = avatar;
        }

        writeDB(local);
        return res.json(local.users[index]);
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: GET all posts
  app.get("/api/posts", async (req, res, next) => {
    try {
      const currentUserId = req.query.userId as string;

      if (useFirebase) {
        const postsSnapshot = await getDocs(collection(db, "posts"));
        const postsList = postsSnapshot.docs.map(d => d.data());

        postsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map(d => d.data());
        const userMap = new Map(usersList.map(u => [u.id, u]));

        const enrichedPosts = await Promise.all(postsList.map(async post => {
          const author = userMap.get(post.userId) || {
            id: post.userId,
            username: "unknown",
            displayName: "Deleted User",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
          };

          let hasLiked = false;
          if (currentUserId) {
            const likeDoc = await getDoc(doc(db, "posts", post.id, "likes", currentUserId));
            hasLiked = likeDoc.exists();
          }

          return {
            ...post,
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            author,
            hasLiked
          };
        }));

        return res.json(enrichedPosts);
      } else {
        const local = readDB();
        const enrichedPosts = local.posts.map(post => {
          const author = local.users.find(u => u.id === post.userId) || {
            id: post.userId,
            username: "unknown",
            displayName: "Deleted User",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
          };

          const hasLiked = currentUserId ? local.likes.some(l => l.userId === currentUserId && l.postId === post.id) : false;

          return {
            ...post,
            author,
            hasLiked
          };
        });

        enrichedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res.json(enrichedPosts);
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: POST create new post
  app.post("/api/posts", async (req, res, next) => {
    try {
      const { userId, content, imageUrl } = req.body;
      if (!userId || !content) {
        return res.status(400).json({ error: "userId and content are required" });
      }

      if (useFirebase) {
        const authorDoc = await getDoc(doc(db, "users", userId));
        if (!authorDoc.exists()) {
          return res.status(404).json({ error: "User not found" });
        }
        const author = authorDoc.data();

        const newPost = {
          id: "p_" + Date.now(),
          userId,
          content: content.trim(),
          imageUrl: imageUrl || null,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          commentsCount: 0
        };

        await setDoc(doc(db, "posts", newPost.id), newPost);

        return res.status(201).json({
          ...newPost,
          imageUrl: newPost.imageUrl || undefined,
          author,
          hasLiked: false
        });
      } else {
        const local = readDB();
        const author = local.users.find(u => u.id === userId);
        if (!author) {
          return res.status(404).json({ error: "User not found" });
        }

        const newPost: Post = {
          id: "p_" + Date.now(),
          userId,
          content: content.trim(),
          imageUrl: imageUrl || undefined,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          commentsCount: 0
        };

        local.posts.unshift(newPost);
        writeDB(local);

        return res.status(201).json({
          ...newPost,
          author,
          hasLiked: false
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: DELETE post
  app.delete("/api/posts/:id", async (req, res, next) => {
    try {
      const postId = req.params.id;
      const { userId } = req.body;

      if (useFirebase) {
        const postRef = doc(db, "posts", postId);
        const postDoc = await getDoc(postRef);
        if (!postDoc.exists()) {
          return res.status(404).json({ error: "Post not found" });
        }

        if (postDoc.data().userId !== userId) {
          return res.status(403).json({ error: "Unauthorized to delete this post" });
        }

        await deleteDoc(postRef);

        const likesSnapshot = await getDocs(collection(db, "posts", postId, "likes"));
        const commentsSnapshot = await getDocs(collection(db, "posts", postId, "comments"));
        
        const batch = writeBatch(db);
        likesSnapshot.docs.forEach(d => batch.delete(d.ref));
        commentsSnapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();

        return res.json({ success: true });
      } else {
        const local = readDB();
        const postIndex = local.posts.findIndex(p => p.id === postId);
        if (postIndex === -1) {
          return res.status(404).json({ error: "Post not found" });
        }

        if (local.posts[postIndex].userId !== userId) {
          return res.status(403).json({ error: "Unauthorized to delete this post" });
        }

        local.posts.splice(postIndex, 1);
        local.likes = local.likes.filter(l => l.postId !== postId);
        local.comments = local.comments.filter(c => c.postId !== postId);

        writeDB(local);
        return res.json({ success: true });
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: POST Toggle Like/Unlike on a post
  app.post("/api/posts/:id/like", async (req, res, next) => {
    try {
      const postId = req.params.id;
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      if (useFirebase) {
        const postRef = doc(db, "posts", postId);
        const postDoc = await getDoc(postRef);
        if (!postDoc.exists()) {
          return res.status(404).json({ error: "Post not found" });
        }

        const likeDocRef = doc(db, "posts", postId, "likes", userId);
        const likeDoc = await getDoc(likeDocRef);
        const liked = !likeDoc.exists();

        if (liked) {
          await setDoc(likeDocRef, { userId, createdAt: new Date().toISOString() });
          await updateDoc(postRef, { likesCount: increment(1) });
        } else {
          await deleteDoc(likeDocRef);
          await updateDoc(postRef, { likesCount: increment(-1) });
        }

        const updatedPostDoc = await getDoc(postRef);
        return res.json({
          liked,
          likesCount: updatedPostDoc.data()?.likesCount || 0
        });
      } else {
        const local = readDB();
        const postIndex = local.posts.findIndex(p => p.id === postId);
        if (postIndex === -1) {
          return res.status(404).json({ error: "Post not found" });
        }

        const existingLikeIndex = local.likes.findIndex(l => l.userId === userId && l.postId === postId);
        let liked = false;

        if (existingLikeIndex > -1) {
          local.likes.splice(existingLikeIndex, 1);
          local.posts[postIndex].likesCount = Math.max(0, local.posts[postIndex].likesCount - 1);
        } else {
          local.likes.push({ userId, postId });
          local.posts[postIndex].likesCount += 1;
          liked = true;
        }

        writeDB(local);
        return res.json({
          liked,
          likesCount: local.posts[postIndex].likesCount
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: GET comments for a specific post
  app.get("/api/posts/:id/comments", async (req, res, next) => {
    try {
      const postId = req.params.id;

      if (useFirebase) {
        const commentsSnapshot = await getDocs(collection(db, "posts", postId, "comments"));
        const commentsList = commentsSnapshot.docs.map(d => d.data());

        commentsList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map(d => d.data());
        const userMap = new Map(usersList.map(u => [u.id, u]));

        const comments = commentsList.map(comment => {
          const commenter = userMap.get(comment.userId) || {
            id: comment.userId,
            username: "unknown",
            displayName: "Deleted User",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
          };
          return {
            ...comment,
            commenter
          };
        });

        return res.json(comments);
      } else {
        const local = readDB();
        const comments = local.comments
          .filter(c => c.postId === postId)
          .map(comment => {
            const commenter = local.users.find(u => u.id === comment.userId) || {
              id: comment.userId,
              username: "unknown",
              displayName: "Deleted User",
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            };
            return {
              ...comment,
              commenter
            };
          });

        comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return res.json(comments);
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: POST comment on a post
  app.post("/api/posts/:id/comments", async (req, res, next) => {
    try {
      const postId = req.params.id;
      const { userId, content } = req.body;

      if (!userId || !content) {
        return res.status(400).json({ error: "userId and content are required" });
      }

      if (useFirebase) {
        const postRef = doc(db, "posts", postId);
        const postDoc = await getDoc(postRef);
        if (!postDoc.exists()) {
          return res.status(404).json({ error: "Post not found" });
        }

        const commenterDoc = await getDoc(doc(db, "users", userId));
        if (!commenterDoc.exists()) {
          return res.status(404).json({ error: "User not found" });
        }
        const commenter = commenterDoc.data();

        const newComment = {
          id: "c_" + Date.now(),
          postId,
          userId,
          content: content.trim(),
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "posts", postId, "comments", newComment.id), newComment);
        await updateDoc(postRef, { commentsCount: increment(1) });

        return res.status(201).json({
          ...newComment,
          commenter
        });
      } else {
        const local = readDB();
        const postIndex = local.posts.findIndex(p => p.id === postId);
        if (postIndex === -1) {
          return res.status(404).json({ error: "Post not found" });
        }

        const commenter = local.users.find(u => u.id === userId);
        if (!commenter) {
          return res.status(404).json({ error: "User not found" });
        }

        const newComment: Comment = {
          id: "c_" + Date.now(),
          postId,
          userId,
          content: content.trim(),
          createdAt: new Date().toISOString()
        };

        local.comments.push(newComment);
        local.posts[postIndex].commentsCount += 1;
        writeDB(local);

        return res.status(201).json({
          ...newComment,
          commenter
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: POST follow/unfollow toggle
  app.post("/api/users/:id/follow", async (req, res, next) => {
    try {
      const targetUserId = req.params.id;
      const { followerId } = req.body;

      if (!followerId) {
        return res.status(400).json({ error: "followerId is required" });
      }

      if (followerId === targetUserId) {
        return res.status(400).json({ error: "You cannot follow yourself" });
      }

      if (useFirebase) {
        const targetDoc = await getDoc(doc(db, "users", targetUserId));
        const followerDoc = await getDoc(doc(db, "users", followerId));
        if (!targetDoc.exists() || !followerDoc.exists()) {
          return res.status(404).json({ error: "User not found" });
        }

        const followDocRef = doc(db, "follows", `${followerId}_${targetUserId}`);
        const followDoc = await getDoc(followDocRef);
        const following = !followDoc.exists();

        if (following) {
          await setDoc(followDocRef, { followerId, followingId: targetUserId });
        } else {
          await deleteDoc(followDocRef);
        }

        const followersQuery = query(collection(db, "follows"), where("followingId", "==", targetUserId));
        const followersCountSnapshot = await getCountFromServer(followersQuery);
        const followersCount = followersCountSnapshot.data().count;

        return res.json({
          following,
          followersCount
        });
      } else {
        const local = readDB();
        const targetExists = local.users.some(u => u.id === targetUserId);
        const followerExists = local.users.some(u => u.id === followerId);

        if (!targetExists || !followerExists) {
          return res.status(404).json({ error: "User not found" });
        }

        const existingFollowIndex = local.follows.findIndex(f => f.followerId === followerId && f.followingId === targetUserId);
        let following = false;

        if (existingFollowIndex > -1) {
          local.follows.splice(existingFollowIndex, 1);
        } else {
          local.follows.push({ followerId, followingId: targetUserId });
          following = true;
        }

        writeDB(local);

        const followersCount = local.follows.filter(f => f.followingId === targetUserId).length;
        return res.json({
          following,
          followersCount
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: POST community engagement (external network accounts follow, like, and comment)
  app.post("/api/community/engage", async (req, res, next) => {
    try {
      const { targetUserId, postId, sourceUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId is required" });
      }

      // Fetch all network users
      let allUsers: User[] = [];
      if (useFirebase) {
        const snap = await getDocs(collection(db, "users"));
        allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      } else {
        allUsers = readDB().users;
      }

      // Pick candidate users that are NOT the target user
      let candidates = allUsers.filter(u => u.id !== targetUserId);
      if (sourceUserId) {
        const specific = candidates.filter(u => u.id === sourceUserId);
        if (specific.length > 0) candidates = specific;
      }

      if (candidates.length === 0) {
        return res.status(400).json({ error: "No other community members available to interact" });
      }

      // Pick up to 2-3 actors randomly
      candidates.sort(() => Math.random() - 0.5);
      const chosenUsers = candidates.slice(0, Math.min(candidates.length, sourceUserId ? 1 : 2));

      // Determine target post ID and content
      let targetPostId = postId;
      let targetPostContent = "";
      if (!targetPostId) {
        if (useFirebase) {
          const q = query(collection(db, "posts"), where("userId", "==", targetUserId));
          const postsSnap = await getDocs(q);
          const userPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
          userPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          if (userPosts.length > 0) {
            targetPostId = userPosts[0].id;
            targetPostContent = userPosts[0].content;
          }
        } else {
          const local = readDB();
          const userPosts = local.posts.filter(p => p.userId === targetUserId);
          userPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          if (userPosts.length > 0) {
            targetPostId = userPosts[0].id;
            targetPostContent = userPosts[0].content;
          }
        }
      } else if (targetPostId) {
        if (useFirebase) {
          const pDoc = await getDoc(doc(db, "posts", targetPostId));
          if (pDoc.exists()) targetPostContent = pDoc.data().content;
        } else {
          const local = readDB();
          const p = local.posts.find(x => x.id === targetPostId);
          if (p) targetPostContent = p.content;
        }
      }

      let followsAdded = 0;
      let likesAdded = 0;
      const commentsAdded: Comment[] = [];

      for (const actor of chosenUsers) {
        // 1. Follow action
        if (useFirebase) {
          const followRef = doc(db, "follows", `${actor.id}_${targetUserId}`);
          const followDoc = await getDoc(followRef);
          if (!followDoc.exists()) {
            await setDoc(followRef, { followerId: actor.id, followingId: targetUserId });
            followsAdded++;
          }
        } else {
          const local = readDB();
          if (!local.follows.some(f => f.followerId === actor.id && f.followingId === targetUserId)) {
            local.follows.push({ followerId: actor.id, followingId: targetUserId });
            followsAdded++;
            writeDB(local);
          }
        }

        // 2. Like action (if target post exists)
        if (targetPostId) {
          if (useFirebase) {
            const likeRef = doc(db, "likes", `${actor.id}_${targetPostId}`);
            const likeDoc = await getDoc(likeRef);
            if (!likeDoc.exists()) {
              await setDoc(likeRef, { userId: actor.id, postId: targetPostId });
              await updateDoc(doc(db, "posts", targetPostId), { likesCount: increment(1) });
              likesAdded++;
            }
          } else {
            const local = readDB();
            if (!local.likes.some(l => l.userId === actor.id && l.postId === targetPostId)) {
              local.likes.push({ userId: actor.id, postId: targetPostId });
              const postIdx = local.posts.findIndex(p => p.id === targetPostId);
              if (postIdx > -1) local.posts[postIdx].likesCount += 1;
              likesAdded++;
              writeDB(local);
            }
          }

          // 3. Comment action
          const commentText = await generateCommunityComment(actor.displayName, targetPostContent || "sharing an update on Verve");
          const commentId = `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          const newComment: Comment = {
            id: commentId,
            postId: targetPostId,
            userId: actor.id,
            content: commentText,
            createdAt: new Date().toISOString()
          };

          if (useFirebase) {
            await setDoc(doc(db, "comments", commentId), newComment);
            await updateDoc(doc(db, "posts", targetPostId), { commentsCount: increment(1) });
          } else {
            const local = readDB();
            local.comments.push(newComment);
            const postIdx = local.posts.findIndex(p => p.id === targetPostId);
            if (postIdx > -1) local.posts[postIdx].commentsCount += 1;
            writeDB(local);
          }
          commentsAdded.push(newComment);
        }
      }

      return res.json({
        success: true,
        actors: chosenUsers.map(u => ({ id: u.id, username: u.username, displayName: u.displayName, avatar: u.avatar })),
        followsAdded,
        likesAdded,
        commentsAddedCount: commentsAdded.length,
        comments: commentsAdded
      });

    } catch (err) {
      next(err);
    }
  });

  // Route: GET stats
  app.get("/api/stats", async (req, res, next) => {
    try {
      if (useFirebase) {
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getCountFromServer(usersQuery);
        const usersCount = usersSnapshot.data().count;

        const postsQuery = query(collection(db, "posts"));
        const postsSnapshot = await getCountFromServer(postsQuery);
        const postsCount = postsSnapshot.data().count;

        const followsQuery = query(collection(db, "follows"));
        const followsSnapshot = await getCountFromServer(followsQuery);
        const followsCount = followsSnapshot.data().count;

        const postsDocs = await getDocs(collection(db, "posts"));
        let commentsCount = 0;
        let likesCount = 0;
        postsDocs.docs.forEach(doc => {
          const d = doc.data();
          commentsCount += (d.commentsCount || 0);
          likesCount += (d.likesCount || 0);
        });

        return res.json({
          usersCount,
          postsCount,
          commentsCount,
          likesCount,
          followsCount
        });
      } else {
        const local = readDB();
        return res.json({
          usersCount: local.users.length,
          postsCount: local.posts.length,
          commentsCount: local.comments.length,
          likesCount: local.likes.length,
          followsCount: local.follows.length
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Route: GET status of Firebase connection vs local database fallback
  app.get("/api/status", (req, res) => {
    res.json({
      useFirebase,
      projectId: firebaseConfig.projectId,
      fallbackMode: !useFirebase
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error Handler received:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
