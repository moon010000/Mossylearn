import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAsYNj19J6sQY2p1xz397aleQCW_iKCwk2Q",
  authDomain: "://firebaseapp.com",
  projectId: "mossylearn",
  storageBucket: "mossylearn.firebasestorage.app",
  messagingSenderId: "301420127294",
  appId: "1:301420127294:web:dd2293e1c5922008a19d6f"
};

const app = initializeApp(firebaseConfig);

export default app;